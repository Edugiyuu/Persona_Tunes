---
id: RT-UI-004
title: Rebuild the mode selector page in the Persona 3 Reload style
status: done
branch: refac-mode-selector-rework
area: frontend/mode-selector
owner: Edupa
created: 2026-08-30
updated: 2026-08-31
depends_on: []
supersedes: []
---

# RT-UI-004: Rebuild the mode selector page in the Persona 3 Reload style

> **Done means:** a player choosing between "Sing together" and "Karaoke" sees
> the same Persona-styled plates, selection cursor, and key navigation as the
> home menu, with no 3D model on screen.

## Why

`ModeSelector` is the last screen still on the original styling — two flat white
rectangles with a hardcoded `padding` change on `:hover` and no selection model
at all. It also mounts a `<Yukiko />` R3F canvas that drags the whole Three.js
stack onto this route. RT-UI-002 wanted to *add* an animated Yukiko to this same
screen; it is paused rather than superseded, so its component is left in place.
RT-UI-003 already solved this problem for the home menu
(plates, cursor hooks, roving `tabIndex`, SFX, reduced-motion fallback); this
task ports that solution rather than inventing a second one.

## Inputs

| # | What | Where | Have it? |
|---|---|---|---|
| I-1 | Working reference implementation to port from | `frontend/src/components/Home/` (`Home.css`, `animations.ts`) | yes |
| I-2 | Hover and select sound cues | `P4Hover.wav`, `P4Select.wav` — already wired on the home menu | yes |
| I-3 | GSAP | `^3.12.7`, already installed | yes |
| I-4 | The look to match | The shipped home menu at `/` is the reference — D-3 keeps the current right-anchored layout, so no separate P3R screenshot is needed | yes |
| I-5 | Artwork for the space the 3D model leaves | `frontend/public/imgs/Aigis/ModeSelector/Aigis1.png` | yes |
| I-6 | Blink frames | `frontend/public/imgs/Aigis/Blink/Aegis0.png` (eyes open) and `Aegis1.png` (eyes closed), same framing | yes |

All inputs are present. I-4 resolved by decision rather than by asset: AC-4 is
measured against the home menu, which is already built and already matches the
P3R style.

## Definition of done

| # | The check | Proven by | ✓ |
|---|---|---|:-:|
| AC-1 | No 3D canvas renders on this screen, and no Three.js module is reachable from this route's graph | `npm run build` emits no `three`/`drei`/`fiber` chunk; no such request on the route; `ModeSelector.test.tsx` asserts no `<canvas>` | ☑ |
| AC-2 | "Sing together" selects singer-voice mode; "Karaoke" selects the other | `ModeSelector.test.tsx` — `handleModeSelect` called with `true` / `false` | ☑ |
| AC-3 | Exactly one entry is active at a time; hover and arrow keys move the cursor with wrap-around; `Home`/`End` jump to first and last | `ModeSelector.test.tsx` — 6 cursor cases; confirmed in-browser via dispatched `mouseover` / `ArrowUp` | ☑ |
| AC-4 | The active entry shows the angular plates with magenta reading past the white edge; it is indistinguishable in style from the home menu at the same width | Screenshots at 1440px: mode selector vs. `/` — same plate shapes, magenta accent, black italic label, cyan resting | ☑ |
| AC-5 | The selected entry's plates keep drifting while selected, and stop when the cursor leaves | Sampled `clip-path` 4x over 1.6s: selected plates gave 4 distinct polygons each, the resting plate 1 | ☑ |
| AC-6 | Moving the cursor plays `P4Hover.wav`; activating plays `P4Select.wav` | `ModeSelector.test.tsx` — asserts both URLs, and that a no-op move stays silent | ☑ |
| AC-7 | With `prefers-reduced-motion: reduce`, state changes are instant, no drift starts, and both entries stay reachable | `animation.test.tsx` with `matchMedia` stubbed to `reduce`: `gsap.set` used, `gsap.to` never called, no drift timeline, no intro tween | ☑ |
| AC-8 | Leaving and re-entering the screen does not accumulate tweens | `animation.test.tsx`: over three mount/unmount round trips, 6 drift timelines started and 6 killed, `killTweensOf` and the context revert once per mount | ☑ |
| AC-9 | No overlap and no horizontal scroll at 1440, 1260, 1060, 768, 568, 360, 320 px | `scrollWidth - clientWidth == 0` at all seven widths; both entries inside the viewport; screenshots at 1440, 768, 360 | ☑ |
| AC-10 | Tests, changed-file lint, and build are green | 61 tests pass (15 files); `eslint src/components/ModeSelector/` clean; `npm run build` succeeds | ☑ |
| AC-11 | The artwork blinks: the closed-eye frame shows in brief flashes and the open-eye frame the rest of the time, with no layout shift and no flash of a missing image on the first blink | Stepped the animation through 201 points of its 7s cycle: three closed windows at 41.8-42.5%, 44-45.5% and 89.5-90.5% (~50/105/70ms), eyes open for 98% of the cycle. Both frames share an identical bounding box; `ModeSelector.test.tsx` asserts both are mounted up front. Screenshots held open and closed | ☑ |
| AC-12 | The blink stops under `prefers-reduced-motion: reduce`, leaving the eyes open | `ModeSelector.css.test.ts` parses the reduced-motion media block and asserts `animation: none` plus `opacity: 0` on the closed-eye frame | ☑ |

**Completion: 12/12 (100%)**

## Touches

| File | Change |
|---|---|
| `frontend/src/components/ModeSelector/ModeSelector.tsx` | Drop the `Yukiko` import and the `.Mode3DModel` wrapper; add the artwork in its place (D-1) as two stacked blink frames; the two buttons become a keyboard-navigable nav with a selection cursor |
| `frontend/src/components/ModeSelector/ModeSelector.css` | Plate elements, italic all-caps labels, active/reduced-motion states; artwork placement and blink keyframes; retune the five existing media blocks |
| `frontend/src/components/ModeSelector/animation.ts` | Keep the title slide-in and heartbeat; replace the one-shot button stagger with a scoped, cleaned-up cursor hook |
| `frontend/src/components/ModeSelector/ModeSelector.test.tsx` | new — covers AC-1, AC-2, AC-3, AC-6 |
| `frontend/src/components/ModeSelector/animation.test.tsx` | new — covers AC-7, AC-8 against the real hook with `gsap` mocked |
| `frontend/src/components/ModeSelector/ModeSelector.css.test.ts` | new — CSS contract for the blink and its reduced-motion opt-out (AC-12) |
| `docs/tasks/index.md` | Dashboard row and portfolio percentage |
| `docs/component-inventory-frontend.md` | Mode selector entry |

## Not this task

- Deleting `frontend/src/components/3dModel/`, the `.glb` assets, or the
  `three` / `@react-three/*` dependencies. This removes the *usage* on this
  screen only — the component is kept for the paused RT-UI-002.
- Any change to `SingMusic.tsx`, the recording flow, or what the two modes mean.
- The header artwork (`Aigis0.png`) and the tilted title band, beyond the
  responsive retuning above.
- Extracting the shared Persona plate styling into a common component. Worth
  doing once two screens exist to generalise from — separate task.

## Approach

The plate elements must be real DOM nodes, not pseudo-elements: GSAP cannot
tween `::before`. Keep the entry's tilt on the standalone `rotate:` property so
GSAP owns `transform` on the children — this is the constraint that shaped the
home-menu markup and it applies identically here.

## Verification

```bash
cd frontend && npm run test
```

```bash
cd frontend && npx eslint src/components/ModeSelector/
```

```bash
cd frontend && npm run build
```

Manual, at `http://localhost:5173/Persona_Tunes/`: reach the mode selector
through `SingMusic`, then check hover and keyboard cursor movement, both sound
cues, both mode outcomes, the reduced-motion path, and each width in AC-9. Watch
the network panel on first load of the screen for AC-1.

## Open decisions

| # | Question | Blocks | Owner | Answer |
|---|---|---|---|---|
| D-1 | The 3D model leaves the left side of the screen empty. Character artwork, a wider title band, or re-anchor the buttons? | AC-9, I-5 | Edupa | **Answered:** character artwork — `Aigis1.png` |
| D-3 | Two entries in a vertical stack: keep them right-anchored as today, or move to the left-anchored list the P3R reference uses? | AC-4 | Edupa | **Answered:** keep right-anchored, as today |

## Log

| Date | What happened |
|---|---|
| 2026-08-30 | Task written on `refac-mode-selector-rework`. Rewritten to the new template; status corrected from `planned` to `blocked` on I-4/I-5. |
| 2026-08-30 | D-1, D-2, D-3 answered. `Aigis1.png` added, closing I-5; I-4 closed by D-3. Unblocked, implementation started. |
| 2026-08-30 | Implemented. 8/10 criteria checked with evidence. AC-7 and AC-8 left unchecked — both are verification gaps, not known defects. |
| 2026-08-30 | Artwork no longer fades on small screens (reviewer call — the opacity drop at 768/568 was unwanted). `animation.test.tsx` closes AC-7 and AC-8. 56 tests pass. 10/10, done. |
| 2026-08-30 | D-2 resolved and removed: RT-UI-002 is paused rather than closed. Component inventory updated. |
| 2026-08-30 | Reopened: blink added to scope (I-6, AC-11, AC-12). Back to in-progress at 10/12. |
| 2026-08-30 | Blink implemented in CSS keyframes over two stacked frames. Caught and fixed a zero-width artwork box: swapping the `<img>` for a wrapper left no in-flow child to size it. 12/12, done. |
| 2026-08-31 | Edupa retimed the blink keyframes and added a white drop-shadow to the artwork frames. Re-measured; AC-11 evidence updated. |
