# Backend Data Models

## Persistent model: Music

The backend defines one Mongoose model in `backend/src/models/music.ts`. MongoDB creates the document `_id`; Mongoose also adds its default metadata unless schema options are changed.

| Field | Type | Required | Notes |
|---|---|---:|---|
| `_id` | ObjectId | generated | Primary document identifier. |
| `name` | string | yes | Displayed in music selection and singing views. |
| `description` | string | no | Defined in the schema but not set by the upload controller or rendered by the client. |
| `musicUrl` | string | yes | Cloudinary URL for the original track. |
| `instrumentalUrl` | string | yes | Cloudinary URL for karaoke playback. |
| `albumImageUrl` | string | yes | Cloudinary URL for cover art. |
| `cloudinaryId` | string | yes | Only the original music upload's public ID is retained. |
| `lyrics` | embedded array | yes in practice | Each item has `time: number` and `text: string`; embedded `_id` is disabled. |
| `difficulty` | string | yes | Free-form; the client assumes values such as `easy`, `normal`, or `hard`. |

## Relationships and ownership

- There are no database-level relationships or foreign keys.
- Three Cloudinary assets logically belong to each Music document, but only one Cloudinary public ID is stored. Instrumental and artwork public IDs cannot currently be addressed for cleanup.
- Score results are not related to a user or persisted Music document.

## Transient model: score result

`backend/src/controllers/voiceScoreController.ts` keeps score results in a process-local map:

```ts
type ResultData = {
  score: number;
  transcription: string;
};

Map<requestId, ResultData>
```

Entries are deleted five minutes after completion. Pending jobs are not represented in the map, and restarts or horizontal scaling lose routing consistency.

## Data lifecycle

1. `POST /upload-music` uploads three files to Cloudinary.
2. The controller stores their secure URLs and the music public ID in MongoDB.
3. The frontend fetches all Music documents or one document by `_id`.
4. `POST /score/:id` loads lyrics, creates a temporary audio file, and starts Python transcription.
5. The final score/transcription is held in memory for five minutes; the temporary recording is deleted after the subprocess closes.

## Validation and migration status

- No schema migration framework, seed script, indexes, uniqueness constraints, enums, or timestamps are configured.
- Request data is parsed with `JSON.parse` and relies on Mongoose for most validation.
- URLs are required strings but are not format-validated.
- `difficulty` should be an enum if the UI continues to style a fixed set of values.
- The MongoDB connection URI does not name a database explicitly, making environment intent harder to audit.

## Recommended evolution

1. Add timestamps, explicit collection/database configuration, and indexes driven by query patterns.
2. Persist all Cloudinary public IDs so deletion and rollback are safe.
3. Introduce runtime request validation shared with the frontend.
4. Persist scoring jobs/results with status, timestamps, error details, and optional user/session ownership.
5. Add migration and seed tooling before changing the schema in production.

