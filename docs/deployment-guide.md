# Deployment Guide

## Current deployment posture

Only the frontend has a declared deployment path: `npm run deploy` builds Vite and publishes `dist/` with `gh-pages`. The package homepage and Vite base both target `/Persona_Tunes/`. No backend host, container, infrastructure definition, CI/CD workflow, or production process command is present.

## Frontend deployment

```powershell
cd frontend
npm install
npm run lint
npm run build
npm run deploy
```

Before deploying:

- set the production `VITE_API_URL` to an HTTPS backend;
- set all background video URLs or make their absence explicit in the UI;
- fix the unresolved Rodin font path and validate every public asset under `/Persona_Tunes/`;
- decide how GitHub Pages handles direct refreshes of `BrowserRouter` routes;
- address the bundle-size warning with lazy route/component loading where useful.

## Backend deployment requirements

A production backend environment needs:

- a pinned Node.js runtime and compiled TypeScript output;
- Python plus pinned speech dependencies;
- FFmpeg;
- writable, isolated temporary storage;
- MongoDB and Cloudinary secrets;
- outbound access to Cloudinary, MongoDB Atlas, and Google Speech Recognition;
- HTTPS, restricted CORS, authentication, upload/rate limits, structured logs, and monitoring;
- a durable job/result store if more than one process or restart resilience is required.

The repository should add `build` and production `start` scripts before deployment. Do not run the current development `nodemon` command as the production process.

## Environment contract

| Part | Variable | Purpose |
|---|---|---|
| Frontend | `VITE_API_URL` | Public backend origin/base. |
| Frontend | `VITE_VIDEO1_URL..3_URL` | Hosted karaoke background videos. |
| Backend | `DB_USER`, `DB_PASS` | MongoDB credentials. |
| Backend | `CLOUDINARY_CLOUD_NAME` | Cloudinary account. |
| Backend | `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary credentials. |

Prefer a complete MongoDB URI and explicit database name in one validated variable rather than constructing the host in source code.

## Recommended pipeline

1. Install with lockfiles (`npm ci`) for each part.
2. Run frontend lint/build and backend type-check/tests.
3. Run dependency/security scanning and secret scanning.
4. Publish the frontend artifact.
5. Build an immutable backend image containing Node, compiled JS, Python dependencies, and FFmpeg.
6. Deploy backend with health/readiness checks and migrate/seed steps when those exist.
7. Run smoke tests for catalog fetch, song detail, microphone score submission, and score completion.

## Rollback and recovery gaps

- There is no documented rollback for GitHub Pages or the backend.
- Cloudinary uploads and MongoDB writes are not transactional.
- Score jobs cannot survive backend replacement/restart.
- No backup/restore process for MongoDB is included.

