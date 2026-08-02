# Rhythm Tunes - Source Tree Analysis

**Date:** 2026-08-02  
**Repository shape:** Multi-part application with shared media assets

## Overview

Executable code is divided into a browser client under `frontend/` and an HTTP/service process under `backend/`. `MusicsBackUp/` is a tracked content archive, not a separately deployable application. BMad tooling lives under `.agents/` and `_bmad/`; generated project knowledge lives under `docs/`.

## Annotated structure

```text
Rhythm_Tunes/
├── README.md                         # Existing product summary (Portuguese)
├── frontend/                         # Part: frontend (React/Vite web app)
│   ├── package.json                  # Scripts and JS dependencies
│   ├── package-lock.json             # npm lockfile
│   ├── vite.config.ts                # React plugin; /Persona_Tunes/ base
│   ├── tsconfig*.json                # Strict browser and build typing
│   ├── eslint.config.js              # TypeScript and React Hook lint rules
│   ├── index.html                    # Vite HTML entry
│   ├── .env*                         # API and video URL configuration (ignored)
│   ├── public/
│   │   ├── 3dModels/                 # Experimental GLB scene asset
│   │   ├── audios/                   # UI and character audio
│   │   ├── fonts/                    # Rodin and Faktos font files
│   │   ├── imgs/                     # Character, cut-in, logo, and screen art
│   │   └── star.svg, purpleStar.svg  # Repeated visual motifs
│   └── src/
│       ├── main.tsx                  # Browser bootstrap
│       ├── App.tsx                   # Router and loading shell
│       ├── App.css                   # Global reset/background/font
│       ├── components/
│       │   ├── Home/                 # Landing screen
│       │   ├── SelectMusic/          # Catalog API and selection screen
│       │   ├── ViewMusic/            # Selected-song preview
│       │   ├── SingMusic/            # Karaoke state and playback flow
│       │   ├── AudioRecorder/        # Microphone wrapper
│       │   ├── ModeSelector/         # Vocal/instrumental choice
│       │   ├── MusicEnded/           # Score polling/result display
│       │   ├── PatchNotes/            # Static release-note page
│       │   ├── PatchNoteItem/         # Release-note item
│       │   ├── WorkInProgress/        # Placeholder page
│       │   ├── loadingScreen/         # Initial loading overlay
│       │   └── 3dModel/               # Inactive Three.js experiment
│       ├── utils/
│       │   ├── CustomLink.tsx         # Animated route transition
│       │   └── PlayAudio.ts           # Cached SFX playback
│       └── Sounds/                     # Two unused test MP3 files
├── backend/                          # Part: backend (Express API)
│   ├── package.json                  # Runtime dependencies; start script
│   ├── package-lock.json             # npm lockfile
│   ├── tsconfig.json                 # CommonJS output to dist/
│   ├── .env                          # DB/Cloudinary/unused OpenAI keys (ignored)
│   └── src/
│       ├── app.ts                    # Env, Express, MongoDB, listener bootstrap
│       ├── routes/
│       │   ├── index.ts              # Router composition
│       │   ├── musicRoutes.ts        # Catalog and upload endpoints
│       │   └── scoreRoute.ts         # Score submission and polling
│       ├── controllers/
│       │   ├── musicController.ts    # Cloudinary and Music persistence
│       │   └── voiceScoreController.ts # Async subprocess/result map
│       ├── middleware/upload.ts      # In-memory multipart music uploads
│       ├── models/music.ts           # Mongoose Music schema
│       ├── config/cloudinary.ts      # Cloudinary client setup
│       └── python/transcribe.py      # Audio conversion, speech-to-text, score
├── MusicsBackUp/                     # Shared content archive (64.90 MiB)
│   ├── AlbumImg/                     # Four cover images
│   ├── Instrumental/                 # Five instrumental tracks
│   ├── Letras/                       # LRC/TXT lyric sources
│   └── Music/                        # Four original tracks
├── docs/                             # Generated BMad project knowledge
├── _bmad/                            # Installed BMad configuration/scripts
├── _bmad-output/                     # Empty planning/implementation artifacts
└── .agents/                          # Installed local skills
```

## Critical directories

### `frontend/src/components/`

Holds both route-level pages and lower-level feature components. Each feature generally co-locates TSX, CSS, and GSAP animation code. Because CSS is global, selectors can affect components outside their own folder.

### `backend/src/routes/` → `backend/src/controllers/`

Routes define the public REST surface and delegate directly to controllers. There is no service/repository layer, validation layer, authentication middleware, or centralized error middleware.

### `backend/src/python/`

An out-of-process worker invoked with `spawn("python", ...)`. It depends on Python packages, FFmpeg support through pydub, network access to Google Speech Recognition, and writable temporary storage.

### Media directories

`frontend/public/` is shipped as static site content. `MusicsBackUp/` is source/backup content and is not referenced directly by application code. `frontend/src/Sounds/` contains two large unreferenced MP3 files.

## Entry points

- **Frontend bootstrap:** `frontend/src/main.tsx`
- **Frontend route shell:** `frontend/src/App.tsx`
- **Backend bootstrap:** `backend/src/app.ts`
- **Backend route composition:** `backend/src/routes/index.ts`
- **Speech worker:** `backend/src/python/transcribe.py`

## Integration paths

- `SelectMusic` → `GET {VITE_API_URL}/musics`
- `SingMusic` → `GET {VITE_API_URL}/music/:id`
- `SingMusic` → `POST {VITE_API_URL}/score/:id`
- `MusicEnded` → `GET {VITE_API_URL}/score/result/:requestId`
- Backend → MongoDB Atlas through Mongoose
- Backend → Cloudinary for music uploads
- Backend → local Python process → Google Speech Recognition

## File organization observations

- The frontend uses feature folders but keeps server calls inside components.
- The backend is small and controller-centric; business logic and infrastructure concerns are combined.
- There is no root workspace manifest, shared package, automated test tree, CI workflow, or container/IaC definition.
- Frontend and backend each have independent npm lockfiles.

See [Asset Inventory](./asset-inventory.md) for exact media counts and sizes.

