---
id: RT-UI-005
title: Add an optional Elizabeth-guided navigation tutorial across the first run
status: in-review
branch: feat-elizabeth-guide
area: frontend/guide
owner: Edupa
created: 2026-08-31
updated: 2026-09-14
depends_on: []
supersedes: []
---

# RT-UI-005: Add an optional Elizabeth-guided navigation tutorial across the first run

> **Done means:** a first-time visitor is asked whether they want a tour, and if
> they accept, Elizabeth (Persona 3 Reload) walks them all the way from the home
> menu to a running song — Home → SELECT MUSIC → the music list → the mode
> selector (explaining Karaoke vs Sing together) → a paused briefing on how the
> singing and the scoring work — highlighting the one control to press at each
> step and never blocking it.

## Why

Nothing on the site explains where to start, and nothing explains what the two
modes on the mode selector actually do or that the run is scored at the end. New
visitors land on the Persona home menu with four tilted entries and no hint that
"SELECT MUSIC" is the way in, then hit a two-option mode screen with no
explanation, then a song starts singing at them.

A short, skippable guided tour — fronted by a Velvet Room attendant — carries the
player through that whole first run and gets out of the way for returning users.

**Scope of this task is behaviour only.** It delivers the state machine, the
step script, the targeting, the persistence and the music pause. It ships **no
styling and no animation**, with exactly one carve-out: the spotlight *mechanics*
CSS that replaces the dropped `driver.js` (D-1, revised). See "Not this task".

## Inputs

Everything this task needs and does not produce itself. **A missing input is a
blocker, not a footnote** — if any row is `no`, the task status is `blocked`.

| # | What | Where | Have it? |
|---|---|---|---|
| I-1 | Elizabeth portrait frames, transparent PNG | `frontend/public/imgs/Elizabeth/Guide/Elizabeth0.png`, `Elizabeth1.png`, `ElizabethEyesClosed0.png`, `ElizabethEyesClosed1.png` | yes — landed 2026-09-01 |
| I-2 | Decision: spotlight mechanism (D-1) | see D-1 — `driver.js`, highlight only, popover disabled | yes |
| I-3 | Decision: prompt persistence (D-2) | see D-2 — `localStorage`, expires after 1 day | yes |
| I-4 | Decision: which side Elizabeth stands on (D-3) | see D-3 — right. **Positioning is the owner's CSS job**; this task only marks the side with a `data-` attribute | yes |
| I-5 | Hover / select sound cues | `audios/UI/P4Hover.wav`, `audios/UI/P4Select.wav` — already in repo | yes |
| I-6 | Spotlight mechanics | none — hand-rolled per D-1 (revised). No new dependency | yes |
| I-7 | Elizabeth's script lines | written below in "The script" — final copy, use verbatim | yes |

Nothing blocks.

## The script

Elizabeth's lines, in order. **Use these strings verbatim** — they are the copy,
not a paraphrase target. Her voice: formal, delighted, faintly alien, treats
human behaviour as fascinating field research.

Two fields shape a step, and the last two columns are them:

- **Lit** — what the spotlight cuts out of the scrim. Any number of controls.
- **Advances on** — either *the spotlit control* (pressing it is the way on, and
  nothing else moves the tour), or *the player*: she is explaining rather than
  directing, the box carries its own prompt ("Click or press `Enter` to
  CONTINUE") and a blinking caret, and a click anywhere, `Enter` or `Space`
  moves on.

A control that is lit on a step the **player** advances is being *shown*, not
offered — she is describing that mode, so the press is taken away from it: it
moves her on to the next line instead of choosing the mode she has not finished
explaining. The choice itself is its own step, and there both entries are lit
and either one is a real answer.

A speech that will not fit one readable box is split across steps rather than
grown into a tall box — that is why S-3 is four boxes and S-4 is two. A line
that describes one thing and then asks for another is split for a second
reason: the light has to move with her. At S-2b she is reading the panel out,
so the panel is what is lit; only when she asks for the press (S-2c) does the
light move to `START!`.

| Step | Route | She says | Lit | Advances on |
|---|---|---|---|---|
| S-1 `home` | `/` | "Welcome. I am Elizabeth, attendant of the Velvet Room. Allow me to guide you — begin by choosing a song. Press SELECT MUSIC." | the "SELECT MUSIC" menu entry | the spotlit control |
| S-2a `music-list` | `/musics` | "Here is where you can SING songs, you people sing right?" | the **first** song card in the list (its `VIEW MUSIC..` control) | the spotlit control |
| S-2b `music-detail` | `/musics` (detail panel open) | "Here the song is set out for you: its name, and the difficulty it will ask of you." | the **whole detail panel**, shown not offered | the player (CONTINUE) |
| S-2c `music-start` | `/musics` (detail panel open) | "When you have decided, press START." | the `START!` control in the detail panel | the spotlit control |
| S-3a `mode-intro` | `/sing-music/:id` (mode selector open) | "There are two ways to perform, and you must choose one." | nothing | the player (CONTINUE) |
| S-3b `mode-sing-together` | `/sing-music/:id` | "Sing together keeps the original singer at your side — their voice carries the melody, and you need only follow." | "Sing together", shown not offered | the player (CONTINUE) |
| S-3c `mode-karaoke` | `/sing-music/:id` | "Karaoke takes them away entirely. Only the instruments remain, and the song is yours alone to carry." | "Karaoke", shown not offered | the player (CONTINUE) |
| S-3d `mode` | `/sing-music/:id` | "Now — choose whichever suits you. I shall listen either way." | **both** entries | the spotlit control (either one) |
| S-4a `briefing` | `/sing-music/:id` (mode chosen, music **paused**) | "A moment before we begin. The lyrics will appear as the song plays — sing them aloud, in time, and your microphone will keep everything you offer." | nothing | the player (CONTINUE) |
| S-4b `briefing-score` | `/sing-music/:id` (music still **paused**) | "When the final note fades, your performance is measured and given a score. Do not fear a poor result; I am told humans improve through repetition. Whenever you are ready, we shall start." | nothing | the player (BEGIN) |

The music is held for the whole of S-4, not only its last box: a step says so
itself with `holdsPlayback`, so splitting the briefing again cannot let the song
start underneath her.

S-4b ends the tour: dismissing it resumes the music and the guide never returns
(subject to AC-11).

## Definition of done

Every row is binary — it passes or it does not. Completion is
`checked ÷ total`, nothing weighted.

| # | The check | Proven by | ✓ |
|---|---|---|:-:|
| AC-1 | On a load of `/` with no stored choice, a prompt asks whether to start the guide and offers an accept and a decline control; the rest of Home is inert behind it until a choice is made | `GuideTour.test.tsx` | ☑ |
| AC-2 | Declining, or pressing `Esc`, closes the prompt, records the choice, and leaves the app fully interactive with no scrim and no guide on any route | `GuideTour.test.tsx` | ☑ |
| AC-3 | Accepting starts the tour at S-1: a scrim covers the viewport, Elizabeth's portrait is mounted, and her S-1 line and her name are rendered | `GuideTour.test.tsx` | ☑ |
| AC-4 | At every step the step's target element is raised above the scrim, still receives clicks, and no `driver.js` popover, arrow, progress text, or close button is rendered — the only text on screen is Elizabeth's box | `GuideTour.test.tsx`; browser | ☑ |
| AC-5 | The tour survives navigation: clicking the spotlit "SELECT MUSIC" navigates to `/musics` and the guide advances to S-2 without remounting Elizabeth or losing its state | `GuideTour.test.tsx` with a routed render | ☑ |
| AC-6 | On `/musics` the guide waits for the song list to finish loading, then highlights the **first** song card (S-2a); opening it advances to S-2b with the whole detail panel lit, and dismissing that box reaches S-2c with the `START!` control lit. If the list is empty or the request fails the tour ends silently, with no error and no stuck scrim | `GuideTour.test.tsx` (an arriving target, and one that never comes); browser: with the API down the tour ended itself | ☑ |
| AC-7 | Pressing the spotlit `START!` reaches `/sing-music/:id` and the guide advances through S-3a–S-3d: nothing lit, then each entry lit in turn as she describes it, then both lit at once. At S-3d either entry is a real choice and both advance to S-4 | `GuideTour.test.tsx` | ☑ |
| AC-8 | On choosing a mode during the tour the song does **not** start: the audio stays paused for as long as either S-4 box is on screen | `GuideTour.test.tsx` asserts the gate the page reads (`holdsPlayback`) keeps the player unmounted while the briefing is open — see "What is not proven end to end" | ☑ |
| AC-9 | Dismissing S-4b starts the song exactly once and removes the guide entirely (no scrim, no portrait, no highlight) | `GuideTour.test.tsx` | ☑ |
| AC-15 | A step the player advances says how to leave it — "Click or press `Enter` to CONTINUE", BEGIN at the end — and is advanced by a click anywhere, by `Enter` or by `Space`, exactly once per press. On a step that points at something those keys do nothing: the spotlit control stays the only way on, and it too counts once | `GuideTour.test.tsx`; browser | ☑ |
| AC-16 | A control lit on a step the player advances is shown, not offered: it is raised out of the scrim, it takes no press of its own, and pressing it advances her line instead of acting. Pressing "Sing together" while she is describing it does not choose that mode | `GuideTour.test.tsx` | ☑ |
| AC-10 | A skip control is available at every step and ends the tour immediately, leaving the current route interactive; if the tour is running and the player navigates anywhere off-script, the tour ends silently rather than highlighting a missing element | `GuideTour.test.tsx` | ☑ |
| AC-11 | After one accept, decline, skip, or completion, a reload does not show the prompt again for 24h; once the stored entry is older than 24h the prompt asks again. Every `localStorage` access survives a throwing storage (private windows) without breaking the app | `GuideTour.test.tsx` with storage and clock stubbed | ☑ |
| AC-12 | With the guide never accepted, `/`, `/musics` and `/sing-music/:id` behave exactly as they do today — no scrim, no extra DOM beyond the target hooks, no console errors | existing suites still green; browser | ☑ |
| AC-13 | This task adds exactly **one** `.css` file — `spotlight.css`, the scrim/cutout/layer mechanics only, with every colour, size and offset behind a `--guide-*` custom property the owner overrides. No other `.css`, no `style={{}}` prop, no `gsap` import anywhere in the diff. Geometry is fed to the CSS as custom properties set on a ref | `git diff --stat` shows one `.css`; `grep -rn "gsap\|style={{" src/components/GuideTour/` is empty | ☑ |
| AC-14 | `npm run test`, changed-file lint, and `npm run build` are all green | 81 tests pass (61 before), `eslint` clean on the changed paths, `npm run build` succeeds | ☑ |

**Completion: 16/16 (100%)**

## Touches

One line per file. *What* changes, never *how*.

| File | Change |
|---|---|
| `frontend/src/components/GuideTour/guideContext.ts` | new — the context, its value type and `useGuideTour`, kept apart from the provider so a page can read the tour without importing a component |
| `frontend/src/components/GuideTour/GuideTourProvider.tsx` | new — the state holding the tour state (`idle` / `asking` / step id / `done`), the accept / decline / advance / skip actions, and the 24h persistence; mounted in `App` so the tour survives route changes |
| `frontend/src/components/GuideTour/steps.ts` | new — the S-1…S-4 script (ten steps: S-2 is three, S-3 four, S-4 two) from "The script" as data: step id, route, which controls it lights, which of them advance it, the line, and whether it holds the song |
| `frontend/src/components/GuideTour/GuideTour.tsx` | new — renders the opt-in prompt, the scrim, Elizabeth's portrait (frame stack, `speaking` seam unused), the dialogue box and the skip control, as **plain semantic markup with class names only**; drives `driver.js` at the current step's target with the popover off |
| `frontend/src/components/GuideTour/useGuideTarget.ts` | new — resolves and re-resolves a step's target elements once they exist in the DOM, tracks the one rect around them all, and ends the tour when they never appear |
| `frontend/src/components/GuideTour/spotlight.css` | new — the **only** stylesheet: full-viewport scrim, the cutout around the tracked rect, and the raised layer for the target. Every value behind a `--guide-*` custom property; no Persona look, no portrait or dialogue-box styling |
| `frontend/src/components/GuideTour/guideStorage.ts` | new — the 24h answer, and the try/catch around a storage that throws |
| `frontend/src/components/GuideTour/GuideTour.test.tsx` | new — 31 tests covering AC-1 through AC-12, AC-15 and AC-16 |
| `frontend/src/App.tsx` | wrap the routes in `GuideTourProvider` and mount `<GuideTour>` once, outside the route switch |
| `frontend/src/components/Home/Home.tsx` | give the "SELECT MUSIC" entry a stable `data-guide-target` hook |
| `frontend/src/components/SelectMusic/SelectMusic.tsx` | give the first rendered song card a stable `data-guide-target` hook |
| `frontend/src/components/ViewMusic/ViewMusic.tsx` | give the `START!` control (S-2c) and the panel itself (S-2b) stable `data-guide-target` hooks; silence the preview player while the guide is running (D-4)
| `frontend/src/components/ModeSelector/ModeSelector.tsx` | give the "Karaoke" and "Sing together" entries stable `data-guide-target` hooks |
| `frontend/src/components/SingMusic/SingMusic.tsx` | hold the song paused while the guide's briefing step is open, and start it when the briefing is dismissed; unchanged when the guide is not running |

| `docs/tasks/index.md` | dashboard row and portfolio percentage |
| `docs/component-inventory-frontend.md` | GuideTour entry |


## What is not proven end to end

One check is proven at a lower level than the task first asked for:

- **AC-8's automated test** exercises the gate the page reads (`holdsPlayback`)
  rather than a full `SingMusic` render. That component pulls axios,
  `react-h5-audio-player`, `react-media-recorder`, GSAP and three env video
  URLs, and has no test today; standing all of it up would test the mocks more
  than the pause, and the page's own change is one condition on an existing
  line. The behaviour itself *was* confirmed in the running app: with the guide
  on the briefing there is no `<audio>` element at all, and dismissing it starts
  the song.

Everything else was walked end to end in the browser against the running API —
prompt, accept, the cutout tracking the animated menu entry, a hit test landing
inside each spotlit control, `/musics` with six songs and the first card lit,
the silenced preview (`paused`, `volume: 0`), `START!`, the mode screen with
Karaoke lit, the held song, `BEGIN`, and a reload of `/` that stays quiet.

The 2026-09-14 rework (S-3 into four boxes and S-4 into two, the click-or-key
prompt, and the shown-not-offered highlight) was proven in tests rather than
re-walked in the browser: the preview pane here throttles the GSAP route
transition `CustomLink` runs, so a guided walk stalls between pages before it
ever reaches the mode screen. The new box itself was rendered against the real
stylesheet, at desktop and at 375px. Two things are therefore still unseen:
the one hole the scrim cuts around **both** mode entries at S-3d, and the
showcase rule that takes the press away from a lit entry — the latter is held
by JavaScript as well as by `pointer-events`, which is what the test asserts.

The one thing still unwalked is the **microphone**: the browser pane blocks
capture, so the recorder's own behaviour during a guided run was not observed.
Nothing in this task touches it.

## Not this task

- **Any styling beyond `spotlight.css`.** No Persona plate/label look, no
  portrait placement, no dialogue-box styling, no CSS-in-JS, no inline styles.
  The owner does 100% of the visual pass afterwards. This task ships the markup
  with stable, descriptive class names and `data-` attributes and stops there.
  `spotlight.css` exists only because dropping `driver.js` (D-1) moved its scrim
  and cutout into this repo; it is mechanics, not look.
- **Any animation.** No `gsap`, no transitions, no typewriter reveal, no
  slide-in, no spotlight pulse — and therefore no `prefers-reduced-motion`
  handling, since there is nothing to reduce yet. Everything appears instantly.
- Elizabeth's **voice lines** (audio playback, timing, subtitle sync).
- The **lip-sync** frame animation. The portrait is built as a stacked frame set
  with a `speaking` boolean that currently does nothing, so the frames drop in
  later.
- Changing what any menu entry, song card, or mode entry *does*, or where it
  links.
- Extracting a shared "Persona dialogue box" component.
- A re-runnable tour (a "watch again" entry in a settings menu) — later task.

## Approach

*Optional, max 10 lines.*

- The tour is one state machine in a provider above the router, not per-page
  state; each page only contributes a `data-guide-target` hook and the provider
  observes clicks on it in the capture phase — so no page's own logic changes.
  That is what makes S-1 → S-4 survive the whole run.
- Steps are data (`steps.ts`), so the owner can reorder or reword without
  touching component code.
- Targets are resolved with a small poll/observer because `/musics` renders
  asynchronously; a target that never appears ends the tour instead of hanging.
- Spotlight: hand-rolled (D-1, revised) — a fixed scrim whose cutout follows the
  target's rect, fed as `--guide-*` custom properties, plus a raised layer on the
  target so it stays clickable. No dependency.
- The pause is a gate on the existing player's autoplay, not a new player.
- Persist under one key (e.g. `rt.guide.seen`) holding a timestamp; older than
  24h counts as absent. Wrap every `localStorage` access in try/catch.

## Verification

Copy-pasteable, in order. No prose.

```bash
cd frontend && npm run test
```

```bash
cd frontend && npx eslint src/components/GuideTour/ src/components/Home/ src/components/SelectMusic/ src/components/ViewMusic/ src/components/ModeSelector/ src/components/SingMusic/
```

```bash
cd frontend && npm run build
```

Manual, at `http://localhost:5173/Persona_Tunes/` with `localStorage` cleared:
reload and confirm the prompt appears; decline once and confirm the app is usable
and the prompt is gone on the next reload; clear storage, reload, accept, and
walk the whole script — SELECT MUSIC is spotlit and clicking it lands on
`/musics` with S-2 showing and the first song highlighted; select it, confirm S-3
explains both modes with Karaoke highlighted; confirm S-3a lights nothing, that S-3b and S-3c
light one entry each and that pressing the lit entry moves her on instead of
choosing that mode, and that S-3d lights both at once; confirm a click
anywhere — or `Enter`, or `Space` — moves on once, not twice; choose Karaoke
and confirm the song stays silent across both S-4 boxes, then starts when S-4b
is dismissed; return to `/` and confirm nothing reappears. Repeat once using
"Sing together" at S-3d.

## Open decisions

| # | Question | Blocks | Owner | Answer |
|---|---|---|---|---|
| D-1 | Spotlight mechanism: add a tour library (`driver.js`) or hand-roll a `box-shadow` cutout from the target rect? | AC-4, I-2 | Edupa | **Answered 2026-09-01:** `driver.js`, popover disabled. **Revised 2026-09-02:** dropped — its stock CSS would have to be overridden anyway, and it fights the `#transition` layer `CustomLink` creates. Hand-rolled instead, and since that moves the scrim into this repo, this task ships that mechanics CSS (AC-13). |
| D-4 | The detail panel autoplays a preview at 0.3 volume; Elizabeth would talk over it at S-2b. | AC-6 | Edupa | **Answered 2026-09-02:** silence the preview while the guide is running. **Follows from it:** no line of hers may mention hearing the song there — nothing is playing. |
| D-2 | Persistence: remember the accept/decline forever, per browser session only, or re-ask after some time? | AC-11, I-3 | Edupa | **Answered 2026-09-01:** `localStorage`, expiring after 1 day (24h). |
| D-3 | Which side does Elizabeth stand on — left or right? | I-4 | Edupa | **Answered 2026-09-01:** right — mirroring the mode selector's Aigis. Expressed here only as a `data-` attribute; the actual placement is CSS the owner writes. |

## Log

Newest last. One line per real change of state.

| Date | What happened |
|---|---|
| 2026-08-31 | Task written. Blocked on I-1 (Elizabeth art) and the three open decisions. Voice and lip-sync split out as a follow-up. |
| 2026-09-01 | D-1/D-2/D-3 answered: `driver.js` highlight with the popover off, 24h `localStorage`, Elizabeth on the right. Branch `feat-elizabeth-guide` opened off `master`. Still blocked on I-1 — Elizabeth art. |
| 2026-09-02 | D-4 answered (silence the preview) and D-1 revised: `driver.js` dropped, spotlight hand-rolled, and this task now ships `spotlight.css` — mechanics only — as the single styling carve-out. S-2 split into S-2a/S-2b: `/musics` needs two clicks, `VIEW MUSIC..` then `START!`. |
| 2026-09-02 | Walked end to end in the browser with the API running: all five steps, the silenced preview, the held song and the resume. Only the microphone stayed unexercised (the preview pane blocks capture). |
| 2026-09-02 | Built. 20 new tests (81 total, was 61), lint clean, build green. Two mechanics bugs found in the browser and fixed in `spotlight.css` / the rect hook: the unstyled portrait was swallowing clicks meant for the spotlit control, and the cutout did not follow the home menu's GSAP transforms (no observer fires on a transform — the rect is now tracked per frame while a step is lit). |
| 2026-09-02 | Elizabeth art landed — unblocked, status `ready`. Rescoped from a one-step Home tour to the four-step run (Home → music list → mode selector → paused briefing), with the script fixed as final copy. Styling and animation pulled out entirely: this task is behaviour only, the owner does 100% of the visual pass (AC-13). |
| 2026-09-14 | S-2b reworded, and the two longest speeches split so no box has to be read in one breath: S-3 became `mode-intro` + `mode`, S-4 became `briefing` + `briefing-score`. A step that points at nothing now tells the player how to leave it and takes a click anywhere or `Enter` / `Space` (AC-15); the auto-advance that yields to the next step's target is held off on those steps, or they would flick past unread. The song's pause moved from one step id to a `holdsPlayback` flag, so it covers both briefing boxes. 87 tests pass (was 81), lint clean, build green. |
| 2026-09-14 | S-2b reworded to the owner's pick: it now names what the panel actually shows — the song's name and its difficulty — because D-4 silences the preview for the whole tour, so no draft of hers may hear the melody. S-3 reshaped on the owner's call: she introduces the choice, then lights each mode in turn while she describes it — lit to be looked at, with the press taken away so it cannot choose a mode mid-sentence (AC-16) — and only the last box lights both and lets the player pick freely, rather than the tour pointing at Karaoke as though it were the answer. `highlight` became a list to carry that, and the cutout is now the one rect around every control a step lights. Two races fell out of it and are fixed: the click that turns a step over could advance the new one as well (the advance listener moved to the capture phase, the only phase already past when it is attached), and the auto-advance could read the PREVIOUS step's resolved targets as the next one's arrival. 92 tests pass (was 87), lint clean, build green. |
| 2026-09-14 | S-2b split in two on the owner's call, for the same reason S-3 was: she describes the panel — its name and its difficulty — with the whole panel lit and nothing to press, and only then asks for `START!`, which is when the light moves there. The panel is a target of its own on `ViewMusic` now. Ten steps. 92 tests pass, lint clean, build green. |
