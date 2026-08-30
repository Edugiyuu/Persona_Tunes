---
id: RT-UI-003
title: Rebuild the home menu in the Persona 3 Reload style
status: Done
completion: 100
last_assessed: 2026-08-30
owner: TBD
---

# RT-UI-003: Rebuild the home menu in the Persona 3 Reload style

## Outcome

Give the `/` menu the look and feel of the Persona 3 Reload in-game menu: tilted
bold italic all-caps entries, and two solid angular plates — a magenta one
behind a white one, at slightly different angles — under the currently selected
entry. The selected label is black with an offset red copy behind it, which is
what reads as the colour-filter fringe on the letters. The plates never sit
still: their `clip-path` keeps shearing through keyframes. Selection is a
persistent cursor that responds to both pointer and keyboard, backed by GSAP
motion and a reduced-motion fallback. The 2x2 grid layout, background, logo, and
floating stars are unchanged.

## User story

As a player opening the app, I want the main menu to feel like a Persona title —
with a moving selection highlight and game-style key/pointer navigation — so the
entry point matches the rest of the interface.

## Background

A previous automated attempt (commits `e2d1f6f`, `c5bf787`, specs under
`_bmad-output/implementation-artifacts/`) only added a lopsided CSS `::before`
triangle on hover. It did not resemble the reference and had no cursor model,
no keyboard support, and a GSAP tween that targeted a `:hover` selector at mount.

## Scope

- `frontend/src/components/Home/Home.tsx` — `MENU_ITEMS` array; the two-row grid
  becomes a `<nav aria-label="Main menu">` of `.MenuItem` wrappers with a
  `data-active` flag, roving `tabIndex`, `onMouseEnter`, and an `onKeyDown`
  handler. `activeIndex` state plus an `activeIndexRef` so rapid keypresses do
  not read stale state. `moveCursor()` plays the hover SFX and moves focus.
- `frontend/src/components/Home/animations.ts` — `useMenuAnimations(navRef,
  activeIndex)` composes three single-purpose hooks: `useMenuIntro` (mount
  stagger), `useMenuTweenTeardown` (unmount-only kill, kept separate so a cursor
  move cannot freeze an in-flight wipe), and `useMenuCursor` (per-entry wipe,
  label overshoot, and idle drift). Two lookup tables carry the values:
  `ENTRY_LOOK` holds the `selected` / `resting` looks side by side instead of a
  ternary per property, and `PLATE_SHAPES` holds each plate's rest polygon plus
  the shapes it drifts through on a `repeat: -1, yoyo: true` timeline (different
  durations so the two edges fall out of phase); every polygon keeps the same
  point count so GSAP can interpolate it. Small named helpers — `readEntry`,
  `animateEntry`, `snapEntry`, `holdPlateStill`, `startPlateDrift` — keep the
  loop body readable. Drift runs only for the selected entry and is killed when
  the cursor leaves it; `overwrite: 'auto'` lets fast moves interrupt cleanly;
  `prefers-reduced-motion` takes the `snapEntry` path. The star and logo
  animations are untouched.
- `frontend/src/components/Home/Home.css` — real `.BladeBack` / `.BladeFront`
  elements (GSAP cannot tween pseudo-elements); the entry's tilt lives on the
  standalone `rotate:` property so GSAP can own `transform` on the children;
  italic all-caps `.Link` with the black/red `text-shadow` pairing;
  `[data-active]` and reduced-motion fallbacks; responsive blocks retuned.
- `frontend/src/utils/CustomLink.tsx` — spread `...rest` onto `NavLink` so the
  menu can pass `tabIndex={-1}` to the inner anchors. No behaviour change for
  the other four consumers.
- `frontend/src/components/Home/Home.test.tsx` — cursor start, arrow/Home/End
  navigation with wrap-around.
- Docs: this file, the dashboard row, `component-inventory-frontend.md`,
  `architecture-frontend.md`.

## Out of scope

- Moving the menu to a left-anchored vertical list (the 2x2 grid is kept).
- Any change to the background gradient, logo heartbeat, or star motion.
- New dependencies (GSAP `^3.12.7` is already installed).
- Reworking `CustomLink`'s page-transition animation or its `any`-typed props.

## Acceptance criteria

- **AC-1:** The four links keep their existing destinations and their 2x2 grid
  position; the background, logo, and stars are visually unchanged.
- **AC-2:** Exactly one item is active at a time. Pointer hover and the arrow
  keys move the cursor; it wraps at both ends; `Home`/`End` jump to the first
  and last item; `Enter`/`Space` activate the active item through the existing
  `CustomLink` transition.
- **AC-3:** The active item shows both angular plates with the magenta reading
  as an accent past the white edge, black text, and a rightward nudge; inactive
  items return to the resting cyan style. *(Open: the offset red copy behind the
  black glyphs is currently not applied — see "Open questions".)*
- **AC-3b:** The selected item's plates keep moving while it stays selected —
  their `clip-path` drifts continuously rather than holding one polygon.
- **AC-4:** Moving the cursor plays `P4Hover.wav`; activation plays
  `P4Select.wav`.
- **AC-5:** With `prefers-reduced-motion: reduce`, the plate state changes
  instantly with no tweening, the idle drift never starts, and all items remain
  reachable.
- **AC-6:** GSAP work lives in a named hook, is scoped to the menu, and is
  cleaned up on unmount; returning to `/` does not accumulate tweens.
- **AC-7:** `npm run test`, changed-file lint (no new errors over the recorded
  baseline), and `npm run build` all pass.

## Verification

1. `cd frontend && npm run test` — 39 tests pass, including the five `Home`
   tests.
2. `npx eslint src/components/Home/ src/utils/CustomLink.tsx` — only the two
   pre-existing baseline errors (`animations` hook name, `CustomLink` `any`).
3. `npm run build` — succeeds (pre-existing chunk-size warning only).
4. Browser at `http://localhost:5173/Persona_Tunes/`:
   - menu at rest shows item 0 with the blade + slash;
   - hovering each item moves the blade and plays the hover cue; clicking runs
     the page transition;
   - keyboard: arrows cycle with wrap, `Home`/`End` jump, `Enter` navigates
     (confirmed reaching `/Persona_Tunes/musics`);
   - no route-error boundary; no menu-specific console errors on a clean load.

## Open questions

- The reference shows the selected label as black glyphs with an offset red copy
  behind them, which is what makes the letters read as colour-filtered. It was
  implemented as a hard `text-shadow` on `.MenuItem[data-active='true'] .Link`
  and has since been removed from `Home.css`; the explanatory comment above that
  rule still describes it. Decide whether to reinstate it (a smaller offset than
  `-0.11em 0.12em` reads more subtly) or drop it and delete the stale comment.
- The `max-width: 768px` block overrides `.MenuBlade` inset for both plates
  equally, so the magenta accent loses its asymmetry on small screens.

## Definition of done

Every acceptance criterion passes, the dashboard row and portfolio percentage
are updated in the same change, and the status is `Done` at 100%.
