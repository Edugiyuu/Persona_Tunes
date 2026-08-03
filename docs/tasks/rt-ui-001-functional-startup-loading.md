---
id: RT-UI-001
title: Replace the artificial startup screen with real application loading
status: Done
completion: 100
last_assessed: 2026-08-02
owner: TBD
---

# RT-UI-001: Replace the artificial startup screen with real application loading

## Outcome

Turn the existing Chie-themed startup screen into a real application bootstrap experience. It must remain visible while explicitly declared critical resources are loading, report meaningful state, and release the application only after success or a controlled degraded fallback.

## User story

As a player, I want the startup screen to prepare the fonts and essential interface assets so that the first usable screen appears with the intended visual identity and without layout shifts, missing artwork, or an arbitrary wait.

## Current state

**Implementation completion: 100%.**

- One abortable six-resource bootstrap controls route release; no elapsed-time readiness remains.
- Rodin DB, Rodin EB, Faktos, the Home logo, local Chie art, and the shared star use base-safe local URLs with verified readiness and truthful settled-resource progress.
- Critical failures block routes and expose Retry; optional failures expose Retry plus explicit degraded continuation, and known-failed optional visuals are omitted from Home.
- The scoped loader provides live status, native progress, named diagnostics, focus management, responsive layout, reduced-motion behavior, and a local CSS art fallback.
- Lazy routes have an accessible reload boundary for chunk failures, while route-heavy media remains outside the startup manifest.
- Automated and browser acceptance evidence is recorded below; all gates pass.

## Scope

- Introduce one bootstrap contract that tracks a finite manifest of critical startup resources.
- Load and verify the locally shipped UI fonts required by the first screen.
- Preload only essential above-the-fold application-shell assets, including a local loader illustration/fallback; keep music, videos, and route-specific 3D assets lazy.
- Bind loader visibility to the real bootstrap state instead of elapsed time.
- Provide honest progress, timeout, failure, retry, and degraded-continuation behavior.
- Scope loader styles and support keyboard, screen-reader, reduced-motion, mobile, and desktop use.
- Add automated coverage and verify both development and production-base builds.

## Out of scope

- Preloading the complete music catalog, background videos, karaoke audio, or every route image.
- Reworking the visual design of the Chie loading screen beyond changes required for reliability and accessibility.
- Using the startup loader to hide slow API requests that belong to route-level loading states.
- Adding the Yukiko model described in RT-UI-002 to the global startup manifest.

## Weighted completion rubric

Rubric rows are binary. Award the full weight only when the row is implemented and its evidence is recorded.

| ID | Deliverable | Weight | Earned | Evidence required to close |
|---|---|---:|---:|---|
| FLS-1 | Existing loading presentation is mounted before application routes. | 10% | 10% | `App.tsx` gates all routes behind `LoadingScreen`; `App.test.tsx` verifies routes remain absent while pending. |
| FLS-2 | A single bootstrap state/orchestrator replaces both fixed timers and cleans up safely on unmount. | 20% | 20% | `runBootstrap.ts` plus `useAppBootstrap.ts`; tests verify success, retry, stale-attempt abort, and unmount cleanup. |
| FLS-3 | All startup fonts are declared with correct formats and base-safe URLs, and font readiness is awaited. | 15% | 15% | Vite-managed canonical faces plus the original Rodin-to-EB compatibility mapping, browser `FontFace` verification/retry tests, and `/` plus `/Persona_Tunes/` traces returning 200. |
| FLS-4 | A documented critical-asset manifest preloads the local loader art and essential shell imagery without pulling route-heavy media. | 10% | 10% | Six-entry `startupManifest.ts`; cold production trace contains only startup assets and lazy Home shell chunks before Home, with no audio/video/API/gallery/GLB requests. |
| FLS-5 | The UI exposes real progress and controlled timeout/error/retry/degraded states without hanging forever. | 15% | 15% | Native settled-count progress, named failures, 10 s timeout, Retry, optional Continue, truthful unexpected-error progress, and deterministic/browser fault tests. |
| FLS-6 | Styles are component-scoped and the loader meets accessibility, responsive, and reduced-motion requirements. | 10% | 10% | Scoped CSS and component tests; 320 px run had no overflow, Retry focus, 44 px actions, and no panel/art animation or button transition under reduced motion. |
| FLS-7 | Automated tests cover success, delayed resources, rejection, timeout, retry, and unmount cleanup. | 10% | 10% | `npm.cmd run test -- --run --maxWorkers=4`: 12 files and 36/36 tests passed. |
| FLS-8 | Production build, changed-file linting, and throttled/offline manual acceptance checks pass. | 10% | 10% | Changed-file ESLint, `tsc --noEmit`, and Vite build pass; cached, slow, blocked, startup-assets-offline, retry, degraded, route-chunk, responsive, and reduced-motion checks pass. |
|  | **Total** | **100%** | **100%** | All weighted deliverables and acceptance criteria are verified. |

## Acceptance criteria

- **AC-1:** The startup overlay remains visible for as long as at least one declared critical resource is pending; there is no timer that independently declares the application loaded.
- **AC-2:** The app renders its routes only after the bootstrap reports `ready` or after the user explicitly accepts a supported degraded state.
- **AC-3:** Rodin EB, Rodin DB, and Faktos have correct `@font-face` metadata and base-safe asset URLs. Required font faces are verified through the browser font-loading API before readiness.
- **AC-4:** Loader artwork has a local, versioned source or local fallback. Failure of a third-party URL cannot leave the application blank or permanently loading.
- **AC-5:** Progress is derived from settled manifest entries. If exact byte progress is unavailable, the UI reports completed resources out of the known total and does not display invented precision.
- **AC-6:** Every rejected or timed-out resource is identified in development diagnostics. The player receives a clear retry action and, for non-critical failures, a deliberate continue action.
- **AC-7:** A configurable safety timeout prevents an infinite loading screen, but it does not silently report success.
- **AC-8:** Loader CSS does not target unscoped `img` or `p` elements. The status uses an appropriate live region, the illustration has meaningful alternative text or is correctly decorative, and focus is visible on actions.
- **AC-9:** Reduced-motion mode removes non-essential motion. Layout works at 320 px width and common desktop sizes without covering actions or overflowing.
- **AC-10:** The application works under the Vite development base and the configured GitHub Pages production base, with no font or loader-asset 404s.
- **AC-11:** Automated tests and the production build pass, and manual tests under slow network, failed asset, cached repeat visit, and offline/degraded conditions are recorded.

## Acceptance evidence

| Criterion | Result | Evidence |
|---|---|---|
| AC-1 | Pass | Delayed optional-resource run stayed on the overlay at 4/6 with zero Home links, then released only after 6/6. |
| AC-2 | Pass | App and hook tests verify ready release, explicit optional continuation, and critical-failure blocking. |
| AC-3 | Pass | Rodin DB 400/OpenType, Rodin EB 800/OpenType, and Faktos 400/TrueType are Vite-managed and browser-verified; retry after a transient font 503 recovers. |
| AC-4 | Pass | Loader art is local under `public/imgs/Chie/WorkInProgress.png`; decode failure renders an accessible CSS-backed fallback and Retry re-attempts the same URL. |
| AC-5 | Pass | Native progress reports only settled entries; unexpected runner rejection preserves the last observed count instead of inventing 6/6. |
| AC-6 | Pass | Optional and critical 503 runs list resource names/reasons; Retry receives focus; Continue appears only for optional failures. |
| AC-7 | Pass | Timeout tests classify every pending entry as timed out and never report false readiness. |
| AC-8 | Pass | Loader selectors are component-scoped; status/alert/progress semantics, illustration alternative, and focus-visible actions are tested. |
| AC-9 | Pass | At 320 px, body and document scroll widths equal the viewport; tablet/desktop screenshots pass; reduced motion disables animations and transitions. |
| AC-10 | Pass | Vite development with `--base /` and production preview under `/Persona_Tunes/` both return 200 for all six startup resources and render base-correct Home links. |
| AC-11 | Pass | 12 files / 36 tests, changed-file lint, TypeScript, and production build pass. Slow, cached, blocked optional/critical, startup-assets-offline, degraded, retry, and chunk-recovery checks are recorded. |

## Verification evidence

- `npm.cmd run test -- --run --maxWorkers=4` — 12 test files, 36/36 tests passed.
- Changed-file `npm.cmd exec eslint -- ...` — exit 0 with no output.
- `npm.cmd exec tsc -- --noEmit --pretty false` — exit 0 with no output.
- `npm.cmd run build` — 1,211 modules transformed; hashed fonts and lazy route chunks emitted without unresolved asset warnings.
- Clean production trace — document, three fonts, Chie art, logo, star, and lazy Home shell requests returned 200; console had 0 errors and 0 warnings.
- Original typography check — Home computes to Rodin 400 backed by the EB compatibility face; canonical Rodin DB/EB and Faktos FontFace entries are loaded.
- Explicit development-root trace — `/`, all six startup resources, and Home shell returned 200; Home links used root-relative paths.
- Cached repeat — cached shell resources returned 304/200 and Home rendered normally.
- Slow optional resource — overlay remained at 4/6 with Home absent, then Home rendered after settlement.
- Optional failure at 320 px — named failure, focused Retry, explicit Continue, no horizontal overflow; Continue rendered Home.
- Critical font failure and retry — Home and Continue remained absent; Retry restored the font and rendered Home.
- Startup-assets-offline — all six unavailable resources were named, required failure blocked Home, and Retry recovered after routes were restored. A hard offline first navigation remains a platform boundary because this project has no service worker; offline application-shell caching was not added by this task.
- Known-failed star degradation — one startup star request, zero Home star images, and Home rendered after explicit Continue.
- Lazy Home chunk 503 — accessible alert and Reload action replaced the failed route; restoring the route and reloading rendered Home.
- Reduced motion at 320 px — art/panel animation `none`, button transition `0s`, and viewport/document/body widths remained 320 px.
- Evidence artifacts: `output/playwright/rt-ui-001/` includes the final scripts, logs, and 320 px/tablet/desktop screenshots.

## Implementation guidance

- Model bootstrap as explicit states such as `idle`, `loading`, `ready`, `degraded`, and `failed`; do not infer readiness from display text.
- Keep the manifest small and named. Each entry should expose a promise and whether failure is critical.
- Prefer `document.fonts.load(...)`/`document.fonts.ready` for font verification and decoded `Image` promises for critical images.
- A short minimum display duration may be used to avoid a flash, but only after real resources are ready; it must never be the source of truth.
- Use `Promise.allSettled` or equivalent aggregation so the UI can distinguish required from optional failures.
- Cache successful browser loads naturally and avoid re-downloading assets solely to animate the percentage.

## Verification plan

1. Add unit tests with controllable resource promises for success, delay, failure, timeout, retry, and cleanup.
2. Add a component test for status announcements, action focus, and accurate completed/total progress.
3. Run changed-file linting and `npm run build` from `frontend`.
4. Preview the production build and confirm font and loader requests return 200 under the configured base path.
5. Use browser throttling to verify that the overlay follows actual resource completion.
6. Simulate a missing font/image and offline mode; confirm retry/degraded behavior and absence of an infinite wait.
7. Check 320 px, tablet, and desktop layouts plus `prefers-reduced-motion`.

## Definition of done

This task is done only when every acceptance criterion passes, every rubric row contains evidence, the rubric totals **100/100**, the status is changed to `Done`, and the dashboard percentage is updated in the same change.
