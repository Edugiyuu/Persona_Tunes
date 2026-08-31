---
id: RT-UI-006
title: Rebuild the patch notes page in the Persona 3 Reload style
status: planned
branch: -
area: frontend/patch-notes
owner: Edupa
created: 2026-08-31
updated: 2026-08-31
depends_on: []
supersedes: []
---

# RT-UI-006: Rebuild the patch notes page in the Persona 3 Reload style

> **Done means:** a visitor opening `/patch-notes` sees each release as a
> Persona-styled card — angular plates, italic all-caps version header, black
> label with an offset red copy — matching the home menu and mode selector,
> with the newest release marked `LATEST`.

## Why

`PatchNotes` is the last screen still on the original styling: a plain white
rounded box in the `Rodin` font with `blueviolet` list items. Worse,
`PatchNoteItem` calls `triggerH2Animation()` in its render body — an unscoped,
un-cleaned, reduced-motion-blind infinite colour yoyo on global selectors that
restacks a tween on every render. RT-UI-003 (home menu) and RT-UI-004 (mode
selector) already established the Persona 3 Reload look and the scoped-GSAP +
`prefers-reduced-motion` snap pattern; this task ports that look and fixes the
render-body animation. Per decisions with Edupa the entries stay **static cards**
— no selection cursor or keyboard navigation, unlike the other two screens.

## Inputs

Everything this task needs and does not produce itself. **A missing input is a
blocker, not a footnote** — if any row is `no`, the task status is `blocked`.

| # | What | Where | Have it? |
|---|---|---|---|
| I-1 | Working reference for the P3R look and scoped-GSAP pattern | `frontend/src/components/Home/` and `frontend/src/components/ModeSelector/` (`*.css`, `animation.ts`, `ModeSelector.css.test.ts`) | yes |
| I-2 | Persona font stack / plate + black-red label styling | `Home.css`, `ModeSelector.css` in-repo | yes |
| I-3 | `gsap` | `^3.12.7`, already installed | yes |
| I-4 | Patch-note content | The four entries hardcoded in `PatchNotes.tsx` today | yes |
| I-5 | Random character art | `frontend/public/imgs/<Character>/PatchNotes/<Character>0.png`, already used | yes |

All inputs are present.

## Definition of done

Every row is binary — it passes or it does not. Completion is
`checked ÷ total`, nothing weighted.

| # | The check | Proven by | ✓ |
|---|---|---|:-:|
| AC-1 | Patch-note content lives in a typed data module (newest first); `PatchNotes` maps over it and every entry renders its title, version, date, and change list | `PatchNotes.test.tsx` asserts each entry from the module is on screen | ☐ |
| AC-2 | The newest entry carries a `LATEST` marker; no other entry does | `PatchNotes.test.tsx` | ☐ |
| AC-3 | Each entry shows the angular plates with magenta reading past the white edge; the style is indistinguishable from the home menu at 1440px | screenshots at 1440px: `/patch-notes` vs `/` — same plate shapes, magenta accent, black italic label | ☐ |
| AC-4 | No original-era styling remains: Persona font stack, no `blueviolet` text, the "Go back" control is a Persona plate (black label + offset red copy) | `PatchNoteItem.css.test.ts` / grep for `blueviolet` and `Rodin` on changed CSS; screenshot | ☐ |
| AC-5 | `PatchNoteItem` runs no animation in its render body; all motion is in `useEffect`, scoped to the list container, and cleaned up on unmount | `animations.test.tsx` — teardown case: `gsap.context(...).revert` and any timeline `kill` called once per mount/unmount round trip | ☐ |
| AC-6 | With `prefers-reduced-motion: reduce`, cards and text appear instantly — no stagger, no colour yoyo, no drift — and all content is visible | `animations.test.tsx` with `matchMedia` stubbed to `reduce`: `gsap.set` used, `gsap.to` never called; `PatchNoteItem.css.test.ts` for the CSS opt-out | ☐ |
| AC-7 | The "Go back" control returns to `/` | `PatchNotes.test.tsx`; browser click | ☐ |
| AC-8 | No horizontal scroll and no overlap at 1440, 768, 360px, and no console errors on a clean load | browser: `scrollWidth - clientWidth == 0` at all three widths; console clean | ☐ |
| AC-9 | `npm run test`, changed-file lint, and `npm run build` are all green | test count up from the current 61; `eslint` clean on changed paths; build succeeds | ☐ |

**Completion: 0/9 (0%)**

## Touches

One line per file. *What* changes, never *how*.

| File | Change |
|---|---|
| `frontend/src/components/PatchNotes/patchNotes.ts` | new — typed `PatchNote[]` (newest first) seeded from the current hardcoded entries; `PatchNoteItemProps` moves here, `image?` dropped |
| `frontend/src/components/PatchNotes/PatchNotes.tsx` | map over the data module; pass a ref for the intro hook; keep the random character with P3R framing |
| `frontend/src/components/PatchNotes/PatchNotes.css` | Persona surface and font stack; "Go back" as a plate control; retune the six media blocks |
| `frontend/src/components/PatchNoteItem/PatchNoteItem.tsx` | plate DOM nodes, italic all-caps version header, black/red title label, date tag, `LATEST` on the newest; no animation call in render |
| `frontend/src/components/PatchNoteItem/PatchNoteItem.css` | plate shapes, label pairing, list palette, reduced-motion block |
| `frontend/src/components/PatchNoteItem/animations.ts` | replace the render-time yoyo with a scoped intro (and optional shared drift) hook plus a reduced-motion snap path |
| `frontend/src/components/PatchNotes/PatchNotes.test.tsx` | new — covers AC-1, AC-2, AC-7 |
| `frontend/src/components/PatchNoteItem/animations.test.tsx` | new — covers AC-5, AC-6 against the real hook with `gsap` mocked |
| `frontend/src/components/PatchNoteItem/PatchNoteItem.css.test.ts` | new — CSS contract for the reduced-motion opt-out |
| `docs/component-inventory-frontend.md` | update the `PatchNotes` / `PatchNoteItem` rows (drop the "unused `image`" note) |
| `docs/tasks/index.md` | dashboard row and portfolio percentage |

## Not this task

- Any selection cursor or keyboard navigation on the entries — static cards only.
- Blink-frame character art or any new art asset. The random character stays as
  it is, only reframed.
- Fetching patch notes from the backend — the data module is static.
- Extracting a shared "Persona plate" component. Worth doing once a third screen
  needs one — separate task.
- Route or navigation changes; `/patch-notes` stays.

## Approach

*Optional, max 10 lines.*

- Plate elements are real DOM nodes, not pseudo-elements — GSAP cannot tween
  `::before`. Keep any card tilt on the standalone `rotate:` property so GSAP
  owns `transform` on the children (the constraint that shaped the home-menu and
  mode-selector markup).
- Mirror `ModeSelector/animation.ts`: `prefersReducedMotion()` guard,
  `gsap.context(..., container)` reverted on unmount, one shared drift timeline
  killed on unmount, `gsap.set` on the reduced path.

## Verification

Copy-pasteable, in order. No prose.

```bash
cd frontend && npm run test
```

```bash
cd frontend && npx eslint src/components/PatchNotes/ src/components/PatchNoteItem/
```

```bash
cd frontend && npm run build
```

Manual, at `http://localhost:5173/Persona_Tunes/patch-notes`: confirm the cards
render in the Persona style matching `/` and the mode selector, `LATEST` on the
newest entry, the "Go back" control returns to `/`, no `blueviolet` text, no
horizontal scroll at 1440 / 768 / 360px, console clean. Repeat with
`prefers-reduced-motion: reduce` — cards and text appear instantly, no colour
yoyo, no drift.

## Open decisions

| # | Question | Blocks | Owner | Answer |
|---|---|---|---|---|
| D-1 | Ongoing motion: a subtle shared plate drift on the cards, or a pure one-shot intro with nothing running afterwards? | AC-5 | Edupa | — *(recommend: one shared drift timeline)* |
| D-2 | Keep the random character, or drop it for a full-width list like Home now that the layout is being reworked? | AC-3, AC-8 | Edupa | — *(recommend: keep the random character)* |

## Log

Newest last. One line per real change of state.

| Date | What happened |
|---|---|
| 2026-08-31 | Task written. All inputs present; `planned`. Two open decisions (D-1 motion, D-2 character) owned by Edupa, neither blocking. |
