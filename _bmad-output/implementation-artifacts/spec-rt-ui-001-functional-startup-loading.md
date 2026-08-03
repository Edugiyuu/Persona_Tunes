---
title: 'RT-UI-001 Functional Startup Loading'
type: 'feature'
created: '2026-08-02'
baseline_commit: '31981ca9b5b0e0c86a341c9770acb316be8fdb1e'
status: 'done'
review_loop_iteration: 0
context:
  - '{project-root}/docs/tasks/rt-ui-001-functional-startup-loading.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Persona Tunes currently hides a Chie-themed startup overlay after two unrelated one-second timers, without observing fonts or shell assets. The remote loader GIF, incorrect font URL metadata, and absent failure handling allow layout shifts, 404s, indefinite failures, and inaccessible feedback.

**Approach:** Replace both timers with one abortable bootstrap contract over a finite local-resource manifest. Render routes only after verified readiness or explicit supported degradation, and expose settled-resource progress, retry, timeout, failure diagnostics, accessibility, and responsive/reduced-motion behavior.

## Boundaries & Constraints

**Always:** Await Rodin DB, Rodin EB, Faktos, and the home logo as critical resources; treat local loader art and the shared star as non-critical; derive progress only from settled manifest entries; abort/ignore stale runs on retry or unmount; build public URLs from `import.meta.env.BASE_URL`; preserve the existing Chie/Persona visual direction; keep all startup state deterministic and injectable for tests.

**Ask First:** Changing which resources are critical, introducing a runtime dependency, altering unrelated route behavior, or broadening work to resolve pre-existing repository-wide lint/type errors.

**Never:** Use elapsed time as readiness, call a third-party loader asset, preload audio/video/API media/character galleries/3D assets, silently convert timeout/failure to success, expose degraded continuation for critical failures, or add unscoped element selectors.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Success | All six entries settle successfully | Progress reaches 6/6 and routes render | None |
| Delayed resource | One entry remains pending | Overlay remains and progress reflects only settled entries | No invented percentage |
| Optional rejection | Loader art or star rejects | Named failure state offers retry and explicit Continue | Continue transitions to degraded routes |
| Critical rejection | Font or logo rejects | Routes remain blocked and Retry receives focus | No Continue action |
| Timeout | One or more entries outlive configured deadline | Pending IDs settle as timed out; state is not ready | Retry; Continue only if all timed-out entries are optional |
| Retry | Failed attempt followed by successful loaders | Fresh attempt resets progress and reaches ready | Previous attempt is aborted/ignored |
| Unmount | App unmounts while pending | Active run aborts without post-unmount state update | Cleanup is test-observable |

</frozen-after-approval>

## Code Map

- `frontend/src/bootstrap/startupManifest.ts` -- typed six-entry manifest, base-safe URLs, font verification, image decode loaders.
- `frontend/src/bootstrap/runBootstrap.ts` -- pure timeout/abort/progress orchestration and failure classification.
- `frontend/src/bootstrap/useAppBootstrap.ts` -- React lifecycle, retry, stale-run cleanup, and degraded continuation.
- `frontend/src/App.tsx` -- single bootstrap boundary before routes.
- `frontend/src/App.css` -- correct base-rewritten OpenType/TrueType face declarations.
- `frontend/src/components/loadingScreen/loadingScreen.tsx` -- controlled semantic status/progress/failure/actions UI.
- `frontend/src/components/loadingScreen/loadingScreen.css` -- component-scoped responsive, focus-visible, and reduced-motion presentation.
- `frontend/src/components/Home/Home.tsx` -- normalized base-safe shell asset URLs.
- `frontend/src/**/*.test.{ts,tsx}` -- deterministic service, hook/App, and component coverage.
- `frontend/package.json`, `frontend/vitest.config.ts`, `frontend/src/test/setup.ts` -- Vitest/Testing Library harness.
- `docs/tasks/rt-ui-001-functional-startup-loading.md`, `docs/tasks/index.md` -- evidence, 100% rubric, Done status, and dashboard totals.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/package.json`, `frontend/vitest.config.ts`, `frontend/src/test/setup.ts` -- add a jsdom Vitest/Testing Library harness and test scripts.
- [x] `frontend/src/bootstrap/*` -- test-first implementation of the typed manifest runner and React lifecycle for success, delay, rejection, timeout, retry, degradation, and cleanup.
- [x] `frontend/src/App.css`, `frontend/src/components/Home/Home.tsx` -- declare all local fonts with correct formats/weights and normalize Vite-base asset paths.
- [x] `frontend/src/App.tsx`, `frontend/src/components/loadingScreen/*` -- remove both timers/remote GIF and bind a scoped accessible UI to real bootstrap state.
- [x] `frontend/src/**/*.test.{ts,tsx}` -- cover route gating, truthful announcements/progress, action focus, loader-art fallback, and user-controlled continuation.
- [x] `docs/tasks/*.md` -- record command/browser evidence and update RT-UI-001/dashboard only after every gate passes.

**Acceptance Criteria:**
- Given any manifest entry is pending, when the app starts, then the overlay remains and routes are absent.
- Given all critical resources verify, when the manifest settles, then routes render with no independent readiness timer.
- Given a non-critical failure, when the player chooses Continue, then routes render in an explicit degraded state; critical failure exposes Retry only.
- Given a rejection or timeout, when diagnostics run in development, then every failed resource ID and reason are identifiable and the app never reports false success.
- Given development base `/` or production base `/Persona_Tunes/`, when startup requests run, then all six local URLs return 200 with no font/loader 404.
- Given keyboard, screen-reader, reduced-motion, or 320 px use, when loader states change, then announcements, focus, actions, motion, and layout remain usable.
- Given cached, throttled, blocked-resource, and offline/degraded scenarios, when acceptance is run, then behavior matches the matrix and no route-heavy media is requested before Home.

## Spec Change Log

## Design Notes

Keep the loader’s existing bottom-corner character motif, but place it in a bounded high-contrast panel with a CSS fallback. Use native `<progress>`, native buttons, a polite atomic status region, a separate alert, minimum 44 px actions, safe-area padding, and only transform/opacity motion disabled by `prefers-reduced-motion`.

## Verification

**Commands:**
- `npm.cmd run test -- --run` from `frontend` -- all deterministic startup tests pass.
- `npm.cmd run lint -- <changed TS/TSX files>` from `frontend` -- zero changed-file errors/warnings.
- `npm.cmd run build` from `frontend` -- success with no unresolved font/loader warning.

**Manual checks (if no CLI):**
- Preview `/Persona_Tunes/` and verify six intended startup requests return 200; no audio, video, API media, character gallery, or GLB starts before Home.
- Exercise slow network, blocked optional and critical assets, retry, cached repeat, offline/degraded flow, keyboard/live regions, reduced motion, and 320 px/tablet/desktop viewports; record results in the task.
## Suggested Review Order

**Bootstrap boundary**

- Start here: one gate owns readiness, degraded continuation, and route release.
  [`App.tsx:39`](../../frontend/src/App.tsx#L39)

- Six named resources define criticality, base-safe URLs, and browser verification.
  [`startupManifest.ts:68`](../../frontend/src/bootstrap/startupManifest.ts#L68)

- Pure orchestration settles resources truthfully across timeout, rejection, and abort.
  [`runBootstrap.ts:53`](../../frontend/src/bootstrap/runBootstrap.ts#L53)

- React lifecycle resets retries and prevents stale attempts from updating state.
  [`useAppBootstrap.ts:68`](../../frontend/src/bootstrap/useAppBootstrap.ts#L68)

**Recovery experience**

- Semantic status, progress, diagnostics, focus, Retry, and Continue bind to bootstrap state.
  [`loadingScreen.tsx:19`](../../frontend/src/components/loadingScreen/loadingScreen.tsx#L19)

- Lazy-route failures become an accessible reload path instead of a blank screen.
  [`RouteErrorBoundary.tsx:13`](../../frontend/src/components/RouteErrorBoundary/RouteErrorBoundary.tsx#L13)

- Degraded Home omits known-failed optional stars rather than requesting broken visuals.
  [`Home.tsx:16`](../../frontend/src/components/Home/Home.tsx#L16)

**Verification and evidence**

- App integration tests prove pending gates, explicit degradation, and critical Retry recovery.
  [`App.test.tsx:40`](../../frontend/src/App.test.tsx#L40)

- Orchestrator tests cover success, failures, timeout, abort, and settled progress.
  [`runBootstrap.test.ts:24`](../../frontend/src/bootstrap/runBootstrap.test.ts#L24)

- Browser-font regression protects retry after a cached failed face.
  [`startupManifest.retry.test.ts:11`](../../frontend/src/bootstrap/startupManifest.retry.test.ts#L11)

- Acceptance ledger maps every criterion and weighted row to recorded evidence.
  [`rt-ui-001-functional-startup-loading.md:78`](../../docs/tasks/rt-ui-001-functional-startup-loading.md#L78)
