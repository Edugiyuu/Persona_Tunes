# Backend API Contracts

**Part:** `backend`  
**Base URL:** supplied to the frontend through `VITE_API_URL`  
**Transport:** HTTP/JSON plus multipart file uploads  
**Authentication:** none

## Conventions

- Express mounts all routers at the application root; there is no `/api` prefix or API version.
- CORS is enabled without an origin allowlist.
- JSON errors generally use `{ "error": string }`, but the API has no shared error schema or error middleware.
- Uploaded music assets are stored in Cloudinary; music metadata is stored in MongoDB.
- Voice-score work is asynchronous and its result exists only in one backend process's memory for five minutes.

## Music representation

```ts
type LyricLine = {
  time: number;
  text: string;
};

type Music = {
  _id: string;
  name: string;
  description?: string;
  musicUrl: string;
  instrumentalUrl: string;
  albumImageUrl: string;
  cloudinaryId: string;
  lyrics: LyricLine[];
  difficulty: string;
};
```

## Endpoint catalog

### `GET /`

Health-like root endpoint.

- **Success:** `200 text/plain` with `Hello, World!`
- **Limitation:** it does not verify MongoDB, Cloudinary, Python, FFmpeg, or speech-provider readiness.

### `GET /musics`

Returns every stored music document.

- **Success:** `200 application/json` with `Music[]`
- **Failure:** `500 { "error": "Erro interno." }`
- **Consumer:** `frontend/src/components/SelectMusic/SelectMusic.tsx`
- **Operational note:** no pagination, filtering, sorting, or response projection is applied.

### `GET /music/:id`

Returns a single MongoDB music document.

- **Path parameter:** `id` — MongoDB document identifier
- **Success:** `200 application/json` with `Music`
- **Not found:** intended `404 { "error": "Música não encontrada." }`
- **Failure:** `500 { "error": "Erro interno." }`
- **Consumer:** `frontend/src/components/SingMusic/SingMusic.tsx`
- **Known defect:** after sending the 404 response, the controller does not return and then attempts to send a 200 response.

### `POST /upload-music`

Uploads a song, its instrumental track, and album artwork, then creates a MongoDB record.

**Content type:** `multipart/form-data`

| Field | Kind | Required by implementation | Notes |
|---|---|---:|---|
| `music` | file | yes | One file; uploaded to Cloudinary. |
| `instrumental` | file | yes | One file; uploaded to Cloudinary. |
| `albumImage` | file | yes | One file; uploaded to Cloudinary. |
| `name` | text | yes | Must contain a JSON-encoded string. |
| `lyrics` | text | yes | Must contain a JSON-encoded `LyricLine[]`. |
| `difficulty` | text | yes | Must contain a JSON-encoded string. |

- **Success:** `201 { "message": string, "music": Music }`
- **Failure:** `500 { "error": "Erro interno." }`
- **Security/robustness gaps:** no authentication, MIME allowlist, file-size limit, schema validation, rate limit, or rollback of already-uploaded Cloudinary assets on a later failure.

### `POST /score/:id`

Accepts the user's recorded performance and starts an asynchronous Python scoring job.

**Content type:** `multipart/form-data`

| Input | Kind | Required | Notes |
|---|---|---:|---|
| `id` | path | yes | Music document identifier. |
| `audio` | file | yes | Stored temporarily under `uploads/`. |

- **Accepted:** `202 { "status": "processing", "requestId": string }`
- **Validation errors:** `400` when audio or music ID is absent; `404` when music is not found.
- **Failure:** `500 { "error": "Erro ao processar o áudio" }`
- **Consumer:** `frontend/src/components/SingMusic/SingMusic.tsx`
- **Processing:** spawns `python src/python/transcribe.py <audioPath> <expectedLyrics>`; Google Speech Recognition transcribes five-second chunks and `SequenceMatcher` calculates a capped score.
- **Reliability gaps:** no subprocess timeout/error handler, no durable queue, fixed temporary chunk names, and no terminal error state exposed to the client.

### `GET /score/result/:requestId`

Polls for an in-memory score result.

- **Pending or unknown:** `202 { "status": "processing" }`
- **Complete:** `200 { "status": "done", "score": number, "transcription": string }`
- **Consumer:** `frontend/src/components/MusicEnded/MusicEnded.tsx`, every ten seconds
- **Retention:** five minutes after completion
- **Known ambiguity:** expired, invalid, failed, and genuinely pending request IDs all return the same 202 response.

## Contract-level recommendations

1. Add request schemas and centralized error responses.
2. Protect upload and scoring routes with authentication, limits, and content validation.
3. Introduce `/api/v1` and explicit health/readiness endpoints.
4. Replace the in-memory scoring map with a durable job store and expose `pending`, `completed`, `failed`, and `expired` states.
5. Publish an OpenAPI document once the response/error contracts are stabilized.

