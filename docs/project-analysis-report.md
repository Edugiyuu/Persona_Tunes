# Rhythm Tunes - Project Analysis Report

**Assessment date:** 2026-08-02  
**Method:** BMad initial deep scan of all critical frontend/backend source paths  
**Overall assessment:** Promising functional prototype; not production-ready

## Executive verdict

Rhythm Tunes already proves its core product loop: discover a song, sing with synchronized media, submit microphone audio, and receive a score. The strongest part of the project is its distinctive product experience—the visual identity, motion, audio feedback, and karaoke flow are unusually concrete for a prototype.

The next engineering milestone should not add more surface area yet. It should make the existing loop safe, deterministic, testable, and deployable. The immediate blockers are secret logging, unprotected resource-intensive endpoints, unreliable in-memory scoring jobs, concurrency hazards in temporary audio processing, and the absence of tests/CI. Content licensing is also a release blocker that code alone cannot solve.

## Health scorecard

| Area | Assessment | Evidence |
|---|---|---|
| Product concept | Strong prototype | End-to-end karaoke selection, playback, recording, scoring, and result UI exist. |
| Frontend architecture | Serviceable, becoming coupled | Clear feature folders, but `SingMusic` owns many responsibilities and API calls live in components. |
| Backend architecture | Understandable but fragile | Small route/controller/model structure; infrastructure and job lifecycle are not isolated. |
| Data/API contracts | Early | One clear Music model and five endpoints; no runtime schemas, versioning, or consistent job/error states. |
| Security | High risk | Credentials logged; open CORS; uploads/scoring lack auth, rate, type, and size limits. |
| Reliability | High risk | Process-local result map, fixed chunk filenames, no subprocess timeout/error state, polling may never terminate. |
| Testing/CI | Missing | No test files, no working test script, no CI workflow; frontend lint fails. |
| Build health | Mixed | Frontend build and backend type-check pass; frontend lint has 6 errors and 1 warning. |
| Deployment | Incomplete | Frontend gh-pages script exists; backend production packaging/hosting is undefined. |
| Accessibility | Early | Missing alt/label/focus/reduced-motion coverage; visual/animation focus dominates. |
| Asset governance | High release risk | About 98.5 MiB of local media/content; rights and license metadata are absent. |
| Documentation | Established by this scan | Architecture, contracts, guides, inventories, and index now exist under `docs/`. |

## What is working well

- The repository boundary between client and server is obvious.
- The main user journey is implemented rather than mocked.
- TypeScript strict mode is enabled in both parts.
- Mongoose schema requirements capture the essential song record.
- Environment files are ignored by each part.
- The frontend production build succeeds and backend TypeScript type-checks.
- Visual composition, motion, responsive rules, character art, SFX, and lyric timing create a coherent product identity.
- The small backend can be refactored incrementally without a rewrite.

## Prioritized findings

### P0 — address before any public/production deployment

1. **Remove credential logging.** `backend/src/app.ts` prints `DB_USER` and `DB_PASS`.
2. **Protect expensive and mutating endpoints.** `/upload-music` and `/score/:id` are unauthenticated, unrestricted, and accept files without MIME/size limits.
3. **Make scoring jobs durable and terminal.** Replace the process-local map with persisted job state and distinguish pending/completed/failed/expired; add timeout and subprocess error handling.
4. **Isolate temporary work per request.** Fixed `chunk_0.wav` names can collide under concurrent scoring.
5. **Resolve content rights.** Persona art/audio, commercial font files, songs, and lyrics need explicit authorization/license records. The repository has no actual license file.

### P1 — stabilize the current product loop

1. Fix `GET /music/:id` returning after a 404.
2. Fix score `0` handling so frontend polling completes.
3. Fix lyric timing to compare against the current audio time, not stale React state.
4. Add runtime validation and shared schemas for Music/upload/score contracts.
5. Add backend job failure responses and frontend error/timeout/retry states.
6. Create a real Python dependency lock and document/pin FFmpeg and Node versions.
7. Add tests for scoring math, concurrency, API contracts, karaoke state/timing, and the browser critical path.
8. Add CI that runs frontend lint/build/tests and backend type-check/tests.

### P2 — improve maintainability and experience

1. Extract frontend API and score-polling hooks; model karaoke flow with a reducer/state machine.
2. Extract backend services/adapters for Music, Cloudinary, speech scoring, and job persistence.
3. Scope styles and GSAP timelines; fix global loading-screen selectors and animation cleanup.
4. Normalize asset URLs and fix the unresolved Rodin font path.
5. Lazy-load heavy routes/libraries to reduce the 533.71 kB main JS bundle.
6. Add semantic controls, alt text, keyboard focus, screen-reader status, and reduced-motion behavior.
7. Remove unused dependencies/assets/code after confirming intent (`motion`, experimental 3D component, source test MP3s, unused OpenAI key).

## Detailed correctness observations

- `MusicEnded` checks `if (newScore)`, so `0` is treated as no result.
- The result endpoint returns 202 for pending, failed, expired, and unknown IDs, preventing terminal error handling.
- `ViewMusic` recreates its animation callback on render, retriggering its effect.
- Hook logic inside `animations()` violates React Hook lint rules.
- Loading-screen CSS applies global `img` and `p` selectors.
- Static paths mix `BASE_URL`, hard-coded `/Persona_Tunes/`, `../public/`, and added slashes.
- `POST /upload-music` can orphan Cloudinary files if a later upload or MongoDB save fails.
- Only the primary music Cloudinary ID is stored; instrumental/artwork cleanup cannot be targeted.
- The score formula multiplies similarity by six and adds a bonus based on failed chunks; it lacks a documented product definition or calibration tests.
- Python uses a third-party speech service synchronously per chunk and creates no durable audit of input/version/result.

## Recommended delivery roadmap

### Milestone 1 — safety and deterministic scoring

Remove secret logging; validate environment; restrict CORS; add auth/rate/upload limits; create unique temporary directories; add subprocess timeout/error handling; define durable score-job states; fix 404/zero-score/timing defects.

### Milestone 2 — quality baseline

Add shared schemas, unit/API/browser tests, Python dependency pinning, frontend lint cleanup, CI, structured logs, and health/readiness endpoints.

### Milestone 3 — production architecture

Extract API/services/adapters, add durable queue/store, define backend image and production scripts, document backup/rollback, monitor external dependencies, and establish content licensing records.

### Milestone 4 — product polish and scale

Improve accessibility/error states, reduce bundle/assets, calibrate scoring with real sessions, add admin/catalog management, and introduce product analytics only after consent/privacy decisions.

## Verification performed

| Check | Result |
|---|---|
| Deep read of critical source paths | Completed: 36 frontend text files (2,883 lines) and 10 backend files (395 lines). |
| Frontend `npm run build` | Passed; 1,202 modules, 533.71 kB main JS warning, unresolved font-path warning. |
| Frontend `npm run lint` | Failed: 6 errors and 1 warning. |
| Backend TypeScript `tsc --noEmit` | Passed. |
| Automated tests | None available. |
| CI/CD | No workflows found. |
| Runtime smoke test | Not run; backend startup depends on live MongoDB and currently logs secrets. |

## Current BMad position and next actions

The project has completed the anytime documentation workflow but has no BMad planning or implementation artifacts. This is a brownfield project before formal product planning.

Optional first:

- [GPC] **Generate Project Context** — `bmad-generate-project-context`. Produce a lean `project-context.md` with code-generation rules derived from this repository. Run in a fresh context and use `docs/index.md` as grounding.
- [CB] **Create Brief** — `bmad-product-brief` with `-A`. Use this only if the product direction, audience, scoring promise, or content strategy still needs discovery. Run in a fresh context.

Next required planning step:

- [PRD] **Create, Edit and Review PRD** — `bmad-prd`. Define the next product milestone and acceptance criteria, using `docs/index.md` and this report as brownfield inputs. Run in a fresh context.

After the PRD, BMad's required sequence is Architecture → Epics and Stories → Implementation Readiness → Sprint Planning.

