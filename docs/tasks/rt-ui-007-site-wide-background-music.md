---
id: RT-UI-007
title: Play a quiet lounge track under the whole site that yields to every song
status: done
branch: feat-elizabeth-guide
area: frontend/background-music
owner: Edupa
created: 2026-09-16
updated: 2026-09-16
depends_on: [RT-UI-001]
supersedes: []
---

# RT-UI-007: Play a quiet lounge track under the whole site that yields to every song

> **Done means:** the player hears *Blues in Velvet Room* quietly under every
> screen, and it fades out of the way the moment a song or its preview starts,
> coming back when that stops.

## Why

The site was silent between screens. A quiet ambience bed is the cheapest way to
make it feel like a Persona menu rather than a web form. What makes it
non-trivial is that this is a *music* app: the bed must never be heard over a
song, a preview, or the scoring run, and there are two independent
`react-h5-audio-player` instances that can start playback.

`frontend/public/audios/UI/MenuMusic.mp3` had been sitting in the repo since
2025-11 — 6.5 MB, committed, referenced by nothing. This task either used it or
removed it; it removed it (see D-2).

## Inputs

| # | What | Where | Have it? |
|---|---|---|---|
| I-1 | The ambience track | `Blues in Velvet Room - Persona 3 OST.mp3` (4:58, 7.17 MB) | yes |
| I-2 | Cloudinary credentials to upload it | `backend/.env` | yes |
| I-3 | Decision: hosting — Cloudinary or `public/` | see D-1 | yes — Cloudinary |
| I-4 | Decision: which track(s) play where | see D-2 | yes — one track, site-wide |

## Definition of done

| # | The check | Proven by | ✓ |
|---|---|---|:-:|
| AC-1 | The track streams from Cloudinary, not from the repo | `BGM_TRACK` in `bgmContext.ts`; the `br_64k` transform serves 2,389,725 B against 7,169,808 B original | ☑ |
| AC-2 | The ambience starts as soon as the site loads, with no gesture | test `starts as soon as the site loads, without waiting for a gesture`; browser, no click on the page: `paused false`, `t: 29.1` | ☑ |
| AC-3 | The track loops quietly at 0.12 | test `loops the lounge theme quietly`; browser: `vol 0.12`, `paused false` | ☑ |
| AC-4 | The same track plays on every route | test `keeps the same track across the whole site` | ☑ |
| AC-5 | A playing preview fades the ambience out and stops it | test `fades out and stops while a song or preview holds it silent`; browser: preview `vol 0.3` with BGM `vol 0`, `paused true` | ☑ |
| AC-6 | Pausing or ending the preview brings the ambience back | test `comes back once the song releases it`; browser: preview paused, BGM `vol 0.12`, `paused false` | ☑ |
| AC-7 | Two simultaneous claims must both release before it returns | test `keeps quiet until every claim is released` | ☑ |
| AC-8 | The site does not render until the track can play through | `background-music` is `critical: true` in the manifest; browser: menu appears only after the track settles | ☑ |
| AC-9 | A track that fails to load blocks the site and names the failure | browser with a broken URL: loader shows "Required startup resources could not load. / Background music: Background music failed to load: ..."; test `rejects when the track never arrives, so startup can report it` | ☑ |
| AC-10 | Playback opens at 0:20, never at 0:00 | test `opens past the intro instead of at zero`; browser: `t: 23.9` after about 4 s of play | ☑ |
| AC-11 | Each loop restarts at 0:20, never replaying the intro | test `loops back past the intro rather than replaying it` | ☑ |
| AC-12 | The track is downloaded once, not once per consumer | browser: `performance.getEntriesByType('resource')` returns 1 entry for `blues-in-velvet-room` | ☑ |
| AC-13 | A browser that refuses autoplay starts it on the first gesture instead | test `falls back to the first gesture when the browser refuses to autoplay` | ☑ |

**Completion: 13/13 (100%)**

## Touches

| File | Change |
|---|---|
| `frontend/src/components/BackgroundMusic/bgmContext.ts` | new — track URL, volume, fade length, start offset, context and hook |
| `frontend/src/components/BackgroundMusic/bgmAudio.ts` | new — owns the shared audio element and its load promise |
| `frontend/src/components/BackgroundMusic/BackgroundMusicProvider.tsx` | new — autoplay unlock, fading, silence claims |
| `frontend/src/components/BackgroundMusic/useSilenceBackgroundMusic.ts` | new — the hook a player uses to claim silence |
| `frontend/src/components/BackgroundMusic/BackgroundMusic.test.tsx` | new — covers AC-2 to AC-7, AC-9 to AC-11, and AC-13 |
| `frontend/src/App.tsx` | provider wraps the routed tree |
| `frontend/src/bootstrap/startupManifest.ts` | adds the `audio` kind and the critical `background-music` resource |
| `frontend/src/bootstrap/startupManifest.test.ts` | expects the seventh resource; media exclusion scoped to local URLs |
| `frontend/src/bootstrap/startupManifest.browserVerification.test.ts` | stubs the audio loader |
| `frontend/src/components/ViewMusic/ViewMusic.tsx` | preview claims silence while playing |
| `frontend/src/components/SingMusic/SingMusic.tsx` | song claims silence while playing |
| `frontend/public/audios/UI/MenuMusic.mp3` | removed — 6.5 MB, unreferenced |

## Not this task

- A volume control or a mute button for the player.
- Per-route or per-screen tracks. One track, everywhere (D-2).
- Ducking the ambience for the UI sound effects (`P4Hover`, `P4Select`, and the
  rest). Those are short and sit fine over a 0.12 bed.
- Moving the other repo audio (`frontend/src/Sounds/`,
  `frontend/public/audios/Chie/`) to Cloudinary.

## Approach

Three calls that are not obvious from the files above:

1. **The element lives outside the DOM** (`new Audio()`, never rendered).
   `SingMusic.tsx` syncs its lyrics off `document.querySelector("audio")`; a
   rendered ambience element could be picked up by that query and drive the
   subtitles from the wrong track.
2. **Silence is a claim count, not a boolean.** The preview and the song can
   both want quiet; the ambience returns only when the last claim releases, and
   the release runs in effect cleanup, so a component unmounting mid-song cannot
   leave the site permanently silent.
3. **The fade runs on `setInterval`, not `requestAnimationFrame`.** A
   backgrounded tab stops painting but keeps playing audio; an rAF fade freezes
   half way and the ambience would be left audible over the song. This was
   observed in the browser before it was changed.

Looping is manual (`loop = false` plus an `ended` handler) because the native
loop rewinds to 0:00, replaying the intro that AC-10 exists to skip.

AC-2 is best-effort by nature and AC-13 is why. No code can force a browser to
autoplay audio: Chrome allows it only once the origin has earned enough media
engagement, and Safari and mobile browsers are stricter still. The opening
`play()` is attempted unconditionally; if the promise rejects, the provider arms
a one-shot gesture listener and starts on the first click, key or touch. A
first-time visitor on a cold profile will most likely hear it from their first
click, not from load, and that is the platform's call rather than ours.

## Verification

```bash
cd frontend && npx vitest run
```

```bash
cd frontend && npx eslint src/components/BackgroundMusic src/bootstrap src/App.tsx
```

```bash
cd frontend && npm run build
```

Manual, with the backend running (`cd backend && npm start`):

1. Open `http://localhost:5173/Persona_Tunes/`. The loader must finish before
   the menu appears.
2. The ambience should already be playing, quietly, from around 0:20 — no click
   needed. On a browser that refuses autoplay it starts on the first click
   instead (AC-13).
3. Go to SELECT MUSIC, then VIEW MUSIC on any card. The preview autoplays and
   the ambience goes quiet.
4. Pause the preview. The ambience fades back in.

Failure path: point `BGM_TRACK` at a non-existent Cloudinary public id and
reload. The site must not render; the loader must name the failed resource and
offer Retry startup.

## Open decisions

| # | Question | Blocks | Owner | Answer |
|---|---|---|---|---|
| D-1 | Host the ambience on Cloudinary or in `frontend/public/`? | AC-1 | Edupa | Cloudinary. `br_64k` cuts 7.17 MB to 2.39 MB with no audible loss at 0.12, and keeps the file out of the repo and out of every deploy. |
| D-2 | One track site-wide, or the menu theme on `/` and the lounge elsewhere? | AC-4 | Edupa | One track. The route-swap version was built first and dropped; `bgm/menu-music` was deleted from Cloudinary on 2026-09-16. |
| D-3 | Should each loop restart at 0:20 or at 0:00? | AC-11 | Edupa | 0:20. Replaying the intro every pass contradicts the point of AC-10. One line to flip if it ever grates. |

## Log

| Date | What happened |
|---|---|
| 2026-09-16 | Track uploaded to Cloudinary as `bgm/blues-in-velvet-room`. Provider, silence hook and ducking in both players landed; 98 tests green. |
| 2026-09-16 | Route-based two-track version dropped per D-2; `MenuMusic.mp3` removed from the repo. |
| 2026-09-16 | rAF fade replaced with `setInterval` after observing a frozen fade in a non-painting tab. |
| 2026-09-16 | Startup gate (AC-8, AC-9) and the 0:20 start (AC-10, AC-11) added; 103 tests green. Failure path walked in the browser. |
| 2026-09-16 | `bgm/menu-music` deleted from Cloudinary. |
| 2026-09-16 | Autoplay moved from gesture-gated to on-load, with the gesture kept as the fallback (AC-2, AC-13). Task done, 13/13, 104 tests green. |
