---
id: RT-UI-005
title: Add an optional Elizabeth-guided navigation tutorial on first load
status: done
branch: feat-elizabeth-guide
area: frontend/guide
owner: Edupa
created: 2026-08-31
updated: 2026-09-02
depends_on: []
supersedes: []
---

# RT-UI-005: Add an optional Elizabeth-guided navigation tutorial on first load

> **Done means:** a first-time visitor is asked whether they want a tour, and if
> they accept, Elizabeth (Persona 3 Reload) appears over a darkened screen in a
> Persona-style dialogue box and walks them to the "SELECT MUSIC" button, which
> is spotlit and stays clickable.

## Why

Nothing on the site explains where to start. New visitors land on the Persona
home menu with four tilted entries and no hint that "SELECT MUSIC" is the way in.
A short, skippable guided tour — fronted by a Velvet Room attendant, matching the
Persona styling the rest of the UI now uses (RT-UI-003, RT-UI-004) — gives that
hint without getting in the way of returning users.

This task delivers the **visual + interaction shell** of the guide: the opt-in
prompt, the darkening, Elizabeth's portrait, the dialogue box, and the button
spotlight. Her recorded voice lines and the open/closed-mouth lip-sync frames are
a separate follow-up (see "Not this task"); the component is built with the seam
for them already in place.

## Inputs

Everything this task needs and does not produce itself. **A missing input is a
blocker, not a footnote** — if any row is `no`, the task status is `blocked`.

| # | What | Where | Have it? |
|---|---|---|---|
| I-1 | Elizabeth portrait, transparent PNG, framed like the other character art | `frontend/public/imgs/Elizabeth/Guide/` — Edupa delivered four frames on 2026-09-02: `Elizabeth0/1.png` (mouth closed / open) and `ElizabethEyesClosed0/1.png` (the same pair with her eyes shut) | yes |
| I-2 | Persona dialogue-box styling to match | The shipped home menu (`Home.css`) and mode selector (`ModeSelector.css`) — italic all-caps, angular plates, black/red label pairing — are the in-repo reference | yes |
| I-3 | Decision: spotlight mechanism (D-1) | see D-1 — `driver.js`, highlight only, popover disabled | yes |
| I-4 | Decision: prompt persistence (D-2) | see D-2 — `localStorage`, expires after 1 day | yes |
| I-5 | Decision: which side Elizabeth stands on (D-3) | see D-3 — left | yes |
| I-6 | `gsap` | `^3.12.7`, already installed | yes |
| I-7 | Hover / select sound cues | `audios/UI/P4Hover.wav`, `audios/UI/P4Select.wav` — already in repo | yes |
| I-8 | `driver.js` | `^1.8.0`, installed during the task per D-1 | yes |

Every input is in hand. The eyes-closed pair was not asked for and turned out to
matter: it gives the blink the same two-frame treatment Aigis already has.

## Definition of done

Every row is binary — it passes or it does not. Completion is
`checked ÷ total`, nothing weighted.

| # | The check | Proven by | ✓ |
|---|---|---|:-:|
| AC-1 | On a load of `/` with no stored choice, a Persona-styled prompt asks whether to start the guide and offers an accept and a decline control; the rest of Home is inert behind it until a choice is made | `GuideTour.test.tsx`; screenshot at 1440px | ☑ |
| AC-2 | Declining, or pressing `Esc`, closes the prompt and leaves Home fully interactive with no scrim and no guide | `GuideTour.test.tsx`; browser: decline, then activate a menu item | ☑ |
| AC-3 | Accepting covers the whole viewport with a dark scrim over Home | `GuideTour.test.tsx` asserts the scrim node; screenshot | ☑ |
| AC-4 | While the guide is active the "SELECT MUSIC" entry is cut out of / raised above the scrim so it reads as spotlit, and it remains clickable; no `driver.js` popover, arrow, or default chrome is rendered | browser: with the guide open, click the entry and land on `/musics`; screenshot of the spotlight | ☑ |
| AC-5 | Elizabeth's portrait is visible above the scrim for the whole guide, on the side chosen in D-3, with no layout shift when it appears | `GuideTour.test.tsx` asserts the image is mounted; screenshots at 1440 / 768 / 360px | ☑ |
| AC-6 | A Persona-style dialogue box shows her name and a line telling the player to click "SELECT MUSIC" | `GuideTour.test.tsx` asserts the name and the instruction text; screenshot | ☑ |
| AC-7 | Clicking the spotlit "SELECT MUSIC" ends the guide and navigates to `/musics`; returning to `/` afterwards does not reopen the prompt or the guide | `GuideTour.test.tsx`; browser round trip | ☑ |
| AC-8 | After one accept or decline, a reload of `/` does not show the prompt again for 24h; once the stored choice is older than 24h the prompt asks again (per D-2) | `GuideTour.test.tsx` with storage and clock stubbed | ☑ |
| AC-9 | With `prefers-reduced-motion: reduce`, the scrim, portrait, and text appear instantly — no slide-in, no typewriter, no spotlight pulse — and every control still works | `animation.test.tsx` with `matchMedia` stubbed to `reduce`: `gsap.set` used, `gsap.to` never called | ☑ |
| AC-10 | With the guide open there is no horizontal scroll and no overlap at 1440, 768, 360px, and no guide-related console errors on a clean load | browser: `scrollWidth - clientWidth == 0` at all three widths; console clean | ☑ |
| AC-11 | `npm run test`, changed-file lint, and `npm run build` are all green | test count up from the current 61; `eslint` clean on changed paths; build succeeds | ☑ |

**Completion: 11/11 (100%)**

## Touches

One line per file. *What* changes, never *how*.

| File | Change |
|---|---|
| `frontend/src/components/GuideTour/GuideTour.tsx` | new — opt-in prompt, scrim, Elizabeth portrait (frame stack, ready for lip-sync), Persona dialogue box, spotlight on the target; owns the "seen" flag |
| `frontend/src/components/GuideTour/GuideTour.css` | new — scrim, portrait placement per D-3, dialogue box in the Persona plate/label style, reduced-motion block |
| `frontend/src/components/GuideTour/animation.ts` | new — scrim fade, portrait slide-in, typewriter reveal, spotlight pulse; scoped and cleaned up on unmount; reduced-motion snap path |
| `frontend/src/components/GuideTour/GuideTour.test.tsx` | new — covers AC-1, AC-2, AC-3, AC-5, AC-6, AC-7, AC-8 |
| `frontend/src/components/GuideTour/animation.test.tsx` | new — covers AC-9 and unmount teardown against the real hook with `gsap` mocked |
| `frontend/src/components/GuideTour/GuideTour.css.test.ts` | new — CSS contract for the reduced-motion opt-out |
| `frontend/src/components/Home/Home.tsx` | mount `<GuideTour>`; give the "SELECT MUSIC" `MenuItem` a stable hook (id or `data-` attr) for the spotlight to target |
| `frontend/src/components/Home/Home.css` | allow the targeted entry to sit above the scrim while the guide is active |
| `frontend/public/imgs/Elizabeth/Guide/` | new art (I-1) — four frames |
| `docs/tasks/index.md` | dashboard row and portfolio percentage |
| `docs/component-inventory-frontend.md` | GuideTour entry |
| `frontend/package.json` | add `driver.js` (D-1) |

## Not this task

- Elizabeth's **voice lines** (audio playback, timing, subtitles sync).
- The **lip-sync** open/closed-mouth frame animation. The portrait is built as a
  stacked frame pair — `Elizabeth0` closed, `Elizabeth1` open — with a `speaking`
  state that currently does nothing, so the frames drop in later. There is no
  blink: the `ElizabethEyesClosed*` art stays unused for now, at Edupa's call.
- A **multi-step** tour. This guide has one step: click "SELECT MUSIC". Extra
  steps (what the music list does, the mode selector, recording) are a later
  task.
- The guide on any route other than `/`.
- Any change to what the menu entries do or where they link.
- Extracting a shared "Persona dialogue box" component — worth doing once a
  second screen needs one.

## Approach

*Optional, max 10 lines.*

- Mount the guide inside `Home` rather than `App` so it can reference the real
  menu DOM; render it in a portal / fixed layer so the scrim covers the logo and
  stars too.
- Spotlight: drive `driver.js` at the target element with its popover disabled,
  so only the scrim cutout shows and its CSS is overridden to the Persona look
  (D-1). The target entry
  gets a raised `z-index` and keeps its normal click handler, so "click SELECT
  MUSIC" is the same navigation the menu already does.
- Lip-sync seam: portrait is `<div class="ElizabethPortrait">` holding one
  `<img>` per mouth frame; a `speaking` boolean (unused now) will cross-fade
  them, mirroring `ModeArtworkBlink`.
- Persist the choice under one key (e.g. `rt.guide.seen`) holding a timestamp;
  an entry older than 24h counts as absent and the prompt asks again. Wrap every
  `localStorage` access in try/catch — private windows throw.

## Verification

Copy-pasteable, in order. No prose.

```bash
cd frontend && npm run test
```

```bash
cd frontend && npx eslint src/components/GuideTour/ src/components/Home/
```

```bash
cd frontend && npm run build
```

Manual, at `http://localhost:5173/Persona_Tunes/` with `localStorage` cleared:
reload and confirm the prompt appears; decline once and confirm Home is usable
and the prompt is gone on the next reload; clear storage, reload, accept, and
confirm the screen darkens, Elizabeth and her dialogue box appear, "SELECT MUSIC"
is spotlit and clickable, and clicking it ends the guide and reaches `/musics`;
return to `/` and confirm nothing reappears. Repeat with
`prefers-reduced-motion: reduce` and at 1440 / 768 / 360px.

## Open decisions

| # | Question | Blocks | Owner | Answer |
|---|---|---|---|---|
| D-1 | Spotlight mechanism: add a tour library (`driver.js` — tiny, framework-agnostic, does the scrim cutout + popover) or hand-roll a `box-shadow` cutout from the target rect? Hand-rolling keeps full Persona styling control and adds no dependency. | AC-4, I-3 | Edupa | **Answered 2026-09-01:** use `driver.js`, but only its highlight — popover disabled and its CSS overridden to the Persona styling. The only text on screen is Elizabeth's own dialogue box. |
| D-2 | Persistence: remember the accept/decline forever, per browser session only, or re-ask after some time? | AC-8, I-4 | Edupa | **Answered 2026-09-01:** `localStorage`, expiring after 1 day (24h). |
| D-3 | Which side does Elizabeth stand on — left (the emptier side of the menu) or right (mirroring the mode selector's Aigis)? | AC-5, I-5 | Edupa | **Answered 2026-09-01:** right. **Revised 2026-09-02:** left — the emptier side of the menu, with the dialogue box pushed to the right so it never lands on her face. |

## Log

Newest last. One line per real change of state.

| Date | What happened |
|---|---|
| 2026-08-31 | Task written. Blocked on I-1 (Elizabeth art) and the three open decisions. Voice and lip-sync split out as a follow-up. |
| 2026-09-01 | D-1/D-2/D-3 answered: `driver.js` highlight with the popover off, 24h `localStorage`, Elizabeth on the right. Branch `feat-elizabeth-guide` opened off `master`. Still blocked on I-1 — Elizabeth art. |
| 2026-09-02 | Sprites delivered, including an unrequested eyes-closed pair. D-3 revised to **left** mid-implementation. Built: opt-in prompt, `driver.js` highlight with the popover off, four-frame portrait with a CSS blink and an unused `speaking` seam, typed dialogue line, 24h `localStorage`. 37 new tests (61 → 98), lint clean, build green. Browser-verified at 1440 / 768 / 360: no horizontal scroll, the spotlit entry hit-tests clickable and navigates to `/musics`, and returning to `/` reopens nothing. Done, 11/11. |
| 2026-09-02 | Review pass with Edupa. Dropped the blink I had invented from the eyes-closed art — only the `Elizabeth0`/`Elizabeth1` mouth pair is wired, and the eyes-closed frames stay unused. Brought her back to the left edge (`left: 0`) after the `-12vw` crop pushed her off-screen. Restyled the dialogue box and the prompt to the Persona 3 Reload reference Edupa supplied: navy lozenge, cyan keyline and glow, small speaker tab, tail pointing at her, and a blue rim light on the portrait — no magenta left in the guide. The typed line now empties from the tween's `onStart`, so a hidden tab (where `requestAnimationFrame` never fires) shows the whole line instead of a blank box. 100 tests pass. |
| 2026-09-02 | Second look at the reference with Edupa: the game's box is not a bordered panel with a glow, it is two stacked plates — light blue behind, offset up and right, dark navy in front — the same construction as the home menu's blade pair. Rebuilt the dialogue box and the prompt that way, moved the speaker name onto the light plate, and dropped the keyline and glow. Elizabeth's blue rim light stays. |
