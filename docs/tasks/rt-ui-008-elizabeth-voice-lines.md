---
id: RT-UI-008
title: Give Elizabeth a voice — play a recording of every guided line and time her mouth to it
status: in-review
branch: feat-elizabeth-guide
area: frontend/guide
owner: Edupa
created: 2026-09-21
updated: 2026-09-21
depends_on: [RT-UI-005]
supersedes: []
---

# RT-UI-008: Give Elizabeth a voice — play a recording of every guided line and time her mouth to it

> **Done means:** every line Elizabeth says during the guided first run is heard,
> not only read, and her mouth moves for exactly as long as the recording lasts.

## Why

RT-UI-005 built the whole tour and deliberately left her mute: "Elizabeth's
voice lines (audio playback, timing, subtitle sync)" and "the lip-sync frame
animation" are both listed under its "Not this task", and its 2026-08-31 Log
says they were "split out as a follow-up". This is that follow-up, written after
the fact — the recordings arrived and were wired up before anyone opened a task
for them.

Until now the portrait stack carried a `speaking` boolean timed off the *length
of the line's text*: a guess, capped at twelve seconds, with nothing to sync to.
With ten recordings in the repo there is something real to time her against, and
the guess becomes the fallback rather than the mechanism.

## Inputs

Everything this task needs and does not produce itself. **A missing input is a
blocker, not a footnote** — if any row is `no`, the task status is `blocked`.

| # | What | Where | Have it? |
|---|---|---|---|
| I-1 | One recording per guided step, ten of them, named in step order | `frontend/public/audios/Elizabeth/Guide1.mp3` … `Guide10.mp3` | yes — landed 2026-09-21 |
| I-2 | The step script to read against | `frontend/src/components/GuideTour/steps.ts` (RT-UI-005) | yes |
| I-3 | The portrait frame stack and its `speaking` seam | `GuideTour.tsx` + `guide.css`, built by RT-UI-005 | yes |
| I-4 | Decision: does her voice duck the lounge bed? (D-2) | see D-2 — no | yes |

Nothing blocks.

## The recordings

One file per step, numbered in the order the tour reaches them. The mapping is
positional and nothing else: `steps.ts` names the file, so a reordered or
reworded step is a change to that file alone.

| # | Step | File |
|---|---|---|
| 1 | `home` | `Guide1.mp3` |
| 2 | `music-list` | `Guide2.mp3` |
| 3 | `music-detail` | `Guide3.mp3` |
| 4 | `music-start` | `Guide4.mp3` |
| 5 | `mode-intro` | `Guide5.mp3` |
| 6 | `mode-sing-together` | `Guide6.mp3` |
| 7 | `mode-karaoke` | `Guide7.mp3` |
| 8 | `mode` | `Guide8.mp3` |
| 9 | `briefing` | `Guide9.mp3` |
| 10 | `briefing-score` | `Guide10.mp3` |

The recording is the copy now, not the other way round: where a take said
something other than the line RT-UI-005 fixed, the line was rewritten to match
what she actually says. Seven of the ten were reworded this way — see that
task's script table and its 2026-09-21 Log entry.

## Definition of done

Every row is binary — it passes or it does not. Completion is
`checked ÷ total`, nothing weighted.

| # | The check | Proven by | ✓ |
|---|---|---|:-:|
| AC-1 | Opening a step plays that step's recording, and only that one: the ten files are requested in step order across a full guided run | `GuideTour.test.tsx`; browser: ten `206` responses, `Guide1`…`Guide10`, one per step | ☑ |
| AC-2 | Leaving a step stops the line it was playing, so no two of her are ever audible at once — including when the player moves on faster than she speaks | `GuideTour.test.tsx` asserts the stop on the way out; one shared element makes two impossible | ☑ |
| AC-3 | Her mouth moves while the recording plays and stops on its last word, with her line left on screen | `GuideTour.test.tsx` drives the element's `ended` and asserts `data-guide-speaking` flips with the line still rendered | ☑ |
| AC-4 | A recording that will not play — a refused autoplay, a missing file — costs nothing but the sound: the line still shows, her mouth still moves for the read-aloud window, and the step advances normally | `GuideTour.test.tsx` rejects `play()` and asserts she is still speaking | ☑ |
| AC-5 | Every step in the script has a recording, and a step added without one is read silently rather than stalling the tour | `GuideTour.test.tsx` fails on any step missing a `voice` | ☑ |
| AC-6 | The guided run is unchanged in every other respect: same steps, same advances, same highlights, and no console errors on a full walk | RT-UI-005's tests still green; browser: full walk, console clean | ☑ |
| AC-7 | `npm run test`, changed-file lint, and `npm run build` are all green | 110 tests pass (104 before), `eslint` clean on the changed paths, `npm run build` succeeds | ☑ |

**Completion: 7/7 (100%)**

## Touches

One line per file. *What* changes, never *how*.

| File | Change |
|---|---|
| `frontend/src/components/GuideTour/voice.ts` | new — owns the single audio element her lines play through, starts one and hands back the way to cut it off, and reports an end or a failure to whoever asked |
| `frontend/src/components/GuideTour/steps.ts` | each step names its recording; the field is optional, so a step can still be added mute |
| `frontend/src/components/GuideTour/GuideTour.tsx` | the `speaking` window is timed by the recording instead of by the line's length, with the old guess kept as the fallback |
| `frontend/src/components/GuideTour/GuideTour.test.tsx` | six new tests covering AC-1 through AC-5 |
| `frontend/src/test/setup.ts` | stub `play`/`pause` once for the whole suite — jsdom has no media pipeline and raised hundreds of "Not implemented" traces per run |
| `frontend/public/audios/Elizabeth/Guide1.mp3` … `Guide10.mp3` | new — the recordings |
| `docs/tasks/index.md` | dashboard row and portfolio percentage |
| `docs/asset-inventory.md` | the new voice directory and the recounted public totals |
| `docs/component-inventory-frontend.md` | GuideTour entry |

## Not this task

- **Subtitle sync.** The original carve-out named it, but there is nothing to
  sync: the box shows the whole line at once and RT-UI-005 shipped no
  typewriter reveal. A per-word reveal is a new feature, not the completion of
  this one.
- **Preloading her voice.** Every line is fetched when its step opens. See D-1.
- **Ducking the lounge bed** while she speaks. See D-2.
- **Re-recording or rewriting her lines.** The copy follows the takes; changing
  either is a change to RT-UI-005's script.
- The **microphone** side of the run, still unexercised since RT-UI-005.

## Approach

- One module owns one `HTMLAudioElement` for all ten lines. Two elements would
  let the step just left keep talking over the step now on screen; one makes
  that impossible rather than merely unlikely.
- Starting a line hands back the function that stops it, and every caller calls
  it on the way out of a step. Stopping never reports an end, so leaving early
  is not mistaken for her finishing.
- A refused autoplay rejects `play()` rather than raising `error`, so both are
  routed to the same failure path — it is the one failure that would otherwise
  run a whole tour mute with nothing to show for it.
- Paths are rooted at the site and resolved through `publicAssetUrl`, the helper
  the portraits already use, so the deployed `/Persona_Tunes/` base works.

## Verification

Copy-pasteable, in order. No prose.

```bash
cd frontend && npm run test
```

```bash
cd frontend && npx eslint src/components/GuideTour/ src/test/setup.ts
```

```bash
cd frontend && npm run build
```

Manual, at `http://localhost:5173/Persona_Tunes/` with `localStorage` cleared:
accept the tour and walk it end to end, confirming each box is spoken as it
appears, that her mouth stops when she does, and that moving on mid-sentence
cuts her off instead of letting two lines overlap. With the network panel open,
confirm ten requests, `Guide1` through `Guide10`, one per step and none
repeated.

## Open decisions

| # | Question | Blocks | Owner | Answer |
|---|---|---|---|---|
| D-1 | Preload her voice, or fetch each line when its step opens? | nothing — the tour works either way | Edupa | **Open.** Lazy today. All ten are 1,027 KiB and the first is 152 KiB; on a slow connection she can open the tour with her mouth moving before the sound arrives. RT-UI-001's startup manifest is where a preload would go, as RT-UI-007 did for the ambience. |
| D-2 | Should her voice duck the lounge bed the way a song does? | nothing | Edupa | **Answered 2026-09-21:** no. The bed sits at 0.10 and her lines play at 0.9; walked end to end and she carries cleanly over it. `useSilenceBackgroundMusic` is there if that judgement changes. |

## Log

Newest last. One line per real change of state.

| Date | What happened |
|---|---|
| 2026-09-21 | Eight recordings landed and were wired to the first eight steps; the two briefing boxes stayed silent, and the code was built to carry a step with no recording rather than wait for one. |
| 2026-09-21 | The last two recordings landed and the script is fully voiced. Her mouth is now timed by the audio rather than by the length of her text, with the old guess kept as the fallback for a line that will not play. Task written after the work, to close the gap RT-UI-005 left when it split the voice out and no follow-up was opened. Seven lines were reworded to match what the takes actually say. 110 tests pass (was 104), lint clean, build green, full walk in the browser with ten requests in step order. |
