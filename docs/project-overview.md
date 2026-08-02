# Rhythm Tunes - Project Overview

**Date:** 2026-08-02  
**Type:** Multi-part web application  
**Architecture:** React SPA + Express API + asynchronous Python speech worker

## Executive summary

Rhythm Tunes (presented as Persona Tunes in the UI/README) is a karaoke experience focused on game music, especially the Persona franchise. Users browse a MongoDB-backed catalog, preview a song, choose vocal or instrumental mode, follow synchronized lyrics, record their microphone, and receive a speech-similarity score. The product has a distinctive animated interface and a working end-to-end prototype, but security, scoring reliability, tests, deployment, accessibility, and content licensing need attention before production use.

## Project classification

- **Repository type:** Multi-part
- **Executable parts:** `frontend` (BMad type `web`) and `backend` (BMad type `backend`)
- **Shared content:** `MusicsBackUp/`
- **Primary language:** TypeScript
- **Secondary language:** Python
- **Pattern:** Route-driven component SPA calling a controller-centric REST service with an out-of-process scoring worker

## Parts

### Frontend

- **Location:** `frontend/`
- **Purpose:** interactive catalog, karaoke playback, synchronized lyrics, microphone capture, score display, and visual/audio experience
- **Stack:** React 19, Vite 6, TypeScript 5.7, React Router 7, Axios, GSAP, React H5 Audio Player, React Media Recorder, Three.js packages

### Backend

- **Location:** `backend/`
- **Purpose:** catalog access, media upload, MongoDB persistence, Cloudinary integration, and asynchronous voice scoring
- **Stack:** Express 4, TypeScript 5.8, Mongoose 8/MongoDB, Cloudinary, Multer, Python SpeechRecognition/pydub

## Technology summary

| Layer | Main technologies | Status |
|---|---|---|
| Browser UI | React, React Router, GSAP, CSS | Functional prototype; lint/accessibility/state concerns. |
| Build/static host | Vite, gh-pages | Production build passes with path and bundle warnings. |
| HTTP service | Express, TypeScript | Type-check passes; validation/security/test gaps. |
| Persistence | MongoDB Atlas, Mongoose | One Music model; no migrations/index strategy. |
| Media storage | Cloudinary | Upload integration exists; cleanup IDs incomplete. |
| Scoring | Python, pydub, Google recognition, SequenceMatcher | Works as an experimental process; not durable/calibrated. |
| Quality automation | ESLint only | Lint fails; no tests or CI. |

## Key features

- Animated Persona-inspired landing screen and navigation.
- Backend-driven music catalog with cover art and audio previews.
- Original-vocal and instrumental karaoke modes.
- Timed lyric display with character/cut-in events.
- Browser microphone recording.
- Asynchronous transcription/similarity scoring and A–F ranking.
- Responsive CSS rules and patch-note/placeholder screens.
- Cloudinary-backed music upload API.

## Architecture highlights

- The part boundary is clear and configuration uses `VITE_API_URL`.
- The frontend is media-heavy: 37 public assets (22.56 MiB) plus two unreferenced source MP3s (11.04 MiB).
- The backend has only 395 source lines and is easy to understand, but infrastructure and business logic are tightly combined.
- Scoring crosses browser → Express → filesystem → Python → Google Speech and returns through polling.
- `MusicsBackUp/` holds 18 content files (64.90 MiB) and should be governed as product content, not application code.

## Development overview

### Frontend

- Install: `cd frontend; npm install`
- Develop: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

### Backend

- Install: `cd backend; npm install`
- Develop: `npm start`
- Type-check: `.\node_modules\.bin\tsc.cmd --noEmit`
- Additional runtime: Python, SpeechRecognition, pydub, FFmpeg, MongoDB, Cloudinary, outbound Google speech access

See the part-specific development guides for environment details and current check results.

## Documentation map

- [Project Analysis Report](./project-analysis-report.md) — health assessment, priorities, and roadmap
- [Frontend Architecture](./architecture-frontend.md)
- [Backend Architecture](./architecture-backend.md)
- [Integration Architecture](./integration-architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Master Index](./index.md)

