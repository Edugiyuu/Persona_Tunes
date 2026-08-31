---
id: RT-UI-002
title: Add an animated Yukiko 3D model to the mode selector
status: paused
completion: 10
last_assessed: 2026-08-30
owner: Edupa
---

# RT-UI-002: Add an animated Yukiko 3D model to the mode selector

> **Paused** on 2026-08-30 by Edupa. RT-UI-004 rebuilt this same screen in the
> Persona 3 Reload style *without* a 3D model, putting character artwork
> (`Aigis1.png`) where the model would have gone. Nothing here is blocked — the
> work was parked, not abandoned.
>
> Kept in place for it: `frontend/src/components/3dModel/`, the `.glb` assets
> under `frontend/public/3dModels/`, and the `three` / `@react-three/*`
> dependencies. Note that no route imports them any more, so they cost bundle
> size only if this task restarts.
>
> **To restart:** decide which screen the model belongs to. The mode selector is
> taken; this task's scope below still assumes it, and would need rewriting to
> the current task template first.

## Outcome

Make the `CHOOSE YOUR MODE` experience more expressive by presenting an optimized, animated Yukiko 3D model alongside the existing vocal and karaoke choices, without compromising selection reliability, accessibility, or performance.

## User story

As a player choosing how to sing, I want Yukiko to animate within the mode-selection scene so that the choice feels lively and characterful while the two mode buttons remain immediate and easy to use.

## Current state

**Implementation completion: 10%.**

- `three`, `@react-three/fiber`, and `@react-three/drei` are already dependencies.
- `ModeSelector` currently displays a static Aigis image and GSAP-animated title/buttons; it does not render 3D content.
- The repository contains only `frontend/public/3dModels/cartoon_tv.glb`. No Yukiko model, rig, textures, animation clips, or provenance/license record is present.
- The experimental `3dModel.tsx` loads the TV through `../public/...`, uses `OrbitControls`, and is not integrated into the mode selector. It is a proof of dependency setup, not reusable production completion for this task.
- No WebGL fallback, model loading state, reduced-motion behavior, performance budget, or 3D test exists.

## Dependencies and decisions

- A redistribution-approved Yukiko asset must be supplied or created in an animated web format, preferably GLB. Record its source, author, license, modifications, and redistribution terms in `docs/asset-inventory.md`.
- The asset must contain at least one usable idle animation clip. A selection reaction is optional unless the chosen asset provides a suitable clip.
- Confirm the final visual placement and whether the current Aigis illustration remains as background art or becomes the non-WebGL fallback.
- RT-UI-001 is not a hard dependency. This model must remain route-scoped and must not make the global startup wait for a mode-specific asset.

## Scope

- Import, validate, optimize, and document the approved animated Yukiko model.
- Build a mode-selector-specific React Three Fiber scene with explicit load, animation, error, and cleanup behavior.
- Integrate the scene into the current title and button composition without blocking mode selection.
- Play an idle loop and provide subtle, deterministic reactions supported by the available clips.
- Add responsive quality tiers, reduced-motion behavior, visibility pausing, and a static fallback.
- Measure model size, scene complexity, render performance, and interaction behavior.
- Add automated coverage and production-build/manual verification.

## Out of scope

- Creating or distributing an unlicensed ripped game asset.
- Replacing the karaoke gameplay, music playback, recording, or score flow.
- Making the canvas an avatar editor or exposing camera orbit controls to players.
- Blocking application startup on the Yukiko model.
- Requiring new animation clips beyond those supplied with the approved asset.

## Weighted completion rubric

Rubric rows are binary. Award the full weight only when the row is implemented and its evidence is recorded.

| ID | Deliverable | Weight | Earned | Evidence required to close |
|---|---|---:|---:|---|
| Y3D-1 | Required Three.js, React Three Fiber, and Drei runtime dependencies are installed. | 10% | 10% | `frontend/package.json`. |
| Y3D-2 | An approved, rigged Yukiko model with at least one idle clip is added, optimized, and documented with provenance. | 20% | 0% | Versioned asset, inspection report, and asset-inventory entry. |
| Y3D-3 | A dedicated scene loads the model through a base-safe URL and controls clips with correct mount/unmount cleanup. | 20% | 0% | Component review and loader/animation tests. |
| Y3D-4 | The responsive scene is integrated into `ModeSelector` without obscuring or delaying the two mode actions. | 15% | 0% | UI review across target viewports and interaction test. |
| Y3D-5 | Idle and supported selection reactions transition predictably and do not conflict with GSAP motion. | 10% | 0% | Animation-state test and visual review. |
| Y3D-6 | Performance budgets, lazy loading, visibility pausing, WebGL/error fallback, and mobile quality behavior are implemented. | 10% | 0% | Asset metrics, performance capture, and fallback tests. |
| Y3D-7 | Accessibility and reduced-motion behavior preserve the complete mode-selection experience. | 5% | 0% | Keyboard, screen-reader, and media-query verification. |
| Y3D-8 | Automated tests, changed-file linting, production build, and manual browser matrix pass. | 10% | 0% | Passing command output and verification notes. |
|  | **Total** | **100%** | **10%** |  |

## Acceptance criteria

- **AC-1:** A redistribution-approved Yukiko model is stored under a stable `frontend/public/3dModels/` path, and `docs/asset-inventory.md` records source, license, modifications, file size, triangle count, textures, and animation clip names.
- **AC-2:** The optimized production asset is no larger than 8 MiB, uses textures no larger than 2048 px per dimension unless an exception is documented, and stays at or below 150,000 rendered triangles unless profiling justifies an exception.
- **AC-3:** `ModeSelector` renders Yukiko in a dedicated React Three Fiber canvas using a Vite-base-safe URL. The production implementation does not use player-facing `OrbitControls`.
- **AC-4:** At least one idle clip loops without visible snapping. If a suitable reaction clip exists, selecting or focusing a mode transitions to it and then returns or exits cleanly; missing optional clips never crash the scene.
- **AC-5:** Loading the model is route-scoped, lazy, and wrapped in a local pending/error boundary. A static mode-selector illustration remains available while loading and whenever WebGL/model loading fails.
- **AC-6:** The canvas cannot intercept the mode buttons. `Sing together` and `Karaoke` retain keyboard focus, pointer activation, and exactly one `handleModeSelect` call per confirmed selection.
- **AC-7:** Camera, lighting, model scale, and cropping are intentional at 320 px, tablet, common desktop, and ultrawide sizes. Yukiko does not cover button labels or the main title.
- **AC-8:** The scene pauses animation/render work when the document is hidden and releases animation actions/resources on unmount without console warnings or duplicated mixers after remount.
- **AC-9:** With `prefers-reduced-motion: reduce`, the experience uses a static pose or substantially reduced animation while preserving all content and actions. A non-WebGL browser receives the same functional choice UI.
- **AC-10:** On the agreed representative hardware, the mode selector maintains at least 55 FPS on desktop and 30 FPS on supported mobile devices after warm-up; any lower-tier static fallback threshold is documented.
- **AC-11:** Automated tests cover pending, successful, missing-clip, load-error/fallback, reduced-motion, and selection behavior. Changed-file linting and `npm run build` pass.

## Implementation guidance

- Use a dedicated component such as `YukikoModeScene`; do not generalize the inactive TV component until a concrete second use case exists.
- Use Drei animation helpers or a clearly owned `AnimationMixer`, selecting clips by validated names and stopping/fading actions during cleanup.
- Keep the canvas decorative unless it gains an explicit interaction. If decorative, remove it from the accessibility tree and keep semantic mode controls in HTML.
- Prefer compressed GLB delivery with audited geometry and texture sizes. Record the optimization command/tool and before/after measurements.
- Preserve the current static illustration as the initial fallback until the 3D scene has successfully mounted.
- Scope GSAP selectors/timelines to the mode-selector root and clean them up so React and Three.js animations cannot accumulate across visits.

## Verification plan

1. Inspect the GLB for animation names, triangle count, texture dimensions, missing textures, and scale/orientation; add the measurements to the asset inventory.
2. Add component tests with the 3D scene mocked for pending, loaded, failed, and reduced-motion states.
3. Add tests proving both mode buttons remain operable and dispatch exactly once while the model is pending, loaded, or failed.
4. Run changed-file linting and `npm run build` from `frontend`, then confirm the model URL works under the configured production base.
5. Profile the mode selector after warm-up on representative desktop and mobile hardware; record FPS, transfer size, and memory observations.
6. Test Chromium, Firefox, and one mobile browser, including WebGL disabled, a throttled connection, document visibility changes, and repeated mount/unmount cycles.
7. Review 320 px, tablet, desktop, and ultrawide layouts plus keyboard-only and `prefers-reduced-motion` behavior.

## Definition of done

This task is done only when every acceptance criterion passes, every rubric row contains evidence, the rubric totals **100/100**, the status is changed to `Done`, and the dashboard percentage is updated in the same change.
