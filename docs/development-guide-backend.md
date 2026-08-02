# Backend Development Guide

## Prerequisites

- Node.js and npm; no version is currently pinned.
- MongoDB access. The current code builds a MongoDB Atlas URI from `DB_USER` and `DB_PASS` and hard-codes the cluster host.
- Cloudinary account for catalog uploads.
- Python available as the `python` command.
- Python packages `SpeechRecognition` and `pydub`.
- FFmpeg available to pydub.
- Outbound network access for Google Speech Recognition.

## Environment

Create `backend/.env`; it is ignored by Git.

```dotenv
DB_USER=<redacted>
DB_PASS=<redacted>
CLOUDINARY_CLOUD_NAME=<redacted>
CLOUDINARY_API_KEY=<redacted>
CLOUDINARY_API_SECRET=<redacted>
```

`OPENAI_API_KEY` exists in the local environment file but is not referenced by source code and is not required by the current implementation. Remove unused secrets from runtime environments.

## Install and run

```powershell
cd backend
npm install
npm start
```

`npm start` runs `nodemon src/app.ts`. The server listens on port 3000 only after MongoDB connects.

Until a Python lockfile is added, the inferred package setup is:

```powershell
python -m pip install SpeechRecognition pydub
ffmpeg -version
```

Package versions should be pinned in `requirements.txt` or `pyproject.toml` before relying on this setup in CI or production.

## Type-check and compile

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\tsc.cmd
```

The no-emit type-check passed on 2026-08-02. There is no package-level build script or production start script for `dist/app.js`.

## Testing

`npm test` is a placeholder that exits with failure, and no tests were found. Establish:

- controller/route tests with a disposable MongoDB instance;
- request validation tests for malformed IDs, JSON fields, and file inputs;
- Cloudinary adapter tests with failure/rollback cases;
- Python unit tests for chunking and score calculation;
- concurrency tests ensuring per-job temporary files;
- integration tests for job success, subprocess failure, timeout, expiry, and restart behavior.

## Operational behavior

- Music upload files are held in memory before Cloudinary upload.
- Score recordings are written under `uploads/` and removed after Python exits.
- Python writes chunk WAV files in its current working directory.
- Completed results live in memory for five minutes.
- Logs currently include database credentials; remove those statements before running in any shared environment.

## Safe change sequence

1. Add environment validation and remove secret logging.
2. Add request/file validation, authentication, rate limits, and centralized errors.
3. Extract Music and scoring services behind adapters.
4. Introduce durable job persistence/queueing and unique temporary directories.
5. Add tests and CI.
6. Add pinned runtime versions, a backend build/start contract, health checks, and deployment configuration.

