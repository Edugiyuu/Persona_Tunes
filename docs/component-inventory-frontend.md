# Frontend Component Inventory

## Architecture summary

The frontend is a single React application with route-level screens, feature components, global CSS files, and local `useState`/`useEffect` state. It has no global store or server-state library; Axios calls and polling live directly inside components.

## Route-level screens

| Component | Route | Responsibility | Main dependencies |
|---|---|---|---|
| `Home` | `/` | Landing menu, animated stars, primary navigation. Persona 3 Reload-style menu: a persistent cursor (pointer hover + arrow keys, wrap-around, `Home`/`End`, `Enter`) drives two angular plates (magenta behind, white in front) that wipe in under the active entry and keep shearing through GSAP-tweened `clip-path` keyframes; the selected label is black with an offset red copy. Hover/select SFX and a reduced-motion fallback. | `CustomLink`, GSAP, `PlayAudio` |
| `SelectMusic` | `/musics` | Fetches the catalog, selects a song, opens its preview. | Axios, GSAP ScrollTrigger, `ViewMusic` |
| `SingMusic` | `/sing-music/:id` | Loads a song, selects original/instrumental mode, syncs lyrics, records microphone audio, submits scoring, and shows results. | Axios, React H5 Audio Player, `ModeSelector`, `AutoVoiceRecorder`, `MusicEnded` |
| `PatchNotes` | `/patch-notes` | Displays static release notes and a random character illustration. | `PatchNoteItem`, `CustomLink` |
| `WorkInProgress` | `/work-in-progress` | Placeholder screen for unfinished menu destinations. | `CustomLink` |

## Feature components

| Component | Category | Responsibility | Reuse status |
|---|---|---|---|
| `ViewMusic` | media preview | Album art, song preview, difficulty label, and start link. | Feature-specific but separable. |
| `ModeSelector` | workflow control | Chooses vocal track or instrumental track before playback. Persona 3 Reload-style entries sharing the home menu's language: a persistent cursor (pointer hover + arrow keys with wrap-around, `Home`/`End`) drives two angular plates (magenta behind, white in front) that wipe in under the active entry and keep shearing through GSAP-tweened `clip-path` keyframes; the selected label is black with an offset red copy. Hover/select SFX and a reduced-motion fallback. Character artwork (`Aigis1.png`) stands where the Yukiko 3D model used to be. | Feature-specific. Its plate styling and cursor hook duplicate `Home`'s — worth extracting once a third screen needs them. |
| `GuideTour` | onboarding overlay | One-step, opt-in tour of the home menu, fronted by Elizabeth (RT-UI-005). A first visit asks whether to run it; accepting hands the spotlight to `driver.js` — its scrim cutout only, popover suppressed and its CSS overridden to the Persona look — so "SELECT MUSIC" reads as lit and stays clickable. Elizabeth stands on the left as a four-frame stack (mouth closed/open, each with an eyes-closed twin) with a CSS blink and an unused `speaking` seam for the voice-line follow-up; her Persona dialogue box types its line out. Either answer is remembered in `localStorage` for 24h. Reduced motion snaps every state into place. | Feature-specific to `Home` — it needs the real menu DOM. Its dialogue box is the second Persona plate in the codebase and is worth extracting once a third screen wants one. |
| `AutoVoiceRecorder` | media input | Wraps `react-media-recorder` and exposes controlled start/stop. | Reusable with a clearer status/error contract. |
| `MusicEnded` | result display | Polls score status, derives rank, animates score, and returns to catalog. | Feature-specific; polling should move to a hook/service. |
| `PatchNoteItem` | content display | Renders one release-note entry. | Reusable; optional `image` is currently unused. |
| `LoadingScreen` | application shell | Shows a fixed one-second loading state with remote GIF. | Global, but its CSS selectors leak into other screens. |
| `TV` / `Modelo3D` | experimental 3D | Loads and displays a GLB model. | Currently commented out and uses a likely invalid public path. |
| `Yukiko` (`3dModel`) | experimental 3D | R3F canvas that loads and idle-animates `idle_yukiko.glb`. | **Unused since RT-UI-004** — dropped from `ModeSelector`, so no route pulls Three.js any more. Kept for the paused RT-UI-002. |

## Shared utilities

| Module | Responsibility | Notes |
|---|---|---|
| `CustomLink` | GSAP page-cover transition plus router navigation and click SFX. | Props use `any`; transition DOM node is appended globally and never removed. |
| `PlayAudio` | Caches HTMLAudioElement instances and restarts SFX. | Fire-and-forget `play()` can reject under browser autoplay policies. |
| `*/animations.ts` | GSAP timelines for individual features. | Several select global class/ID names and do not consistently clean up timelines. |

## State and data flow

- `App` owns only the artificial loading flag and route shell.
- `SelectMusic` owns the catalog and current selection.
- `SingMusic` owns the full karaoke state machine: song data, current lyric, mode, recording flags, result visibility, media choice, character/cut-in state, and scoring request ID.
- `MusicEnded` owns polling, score, and rank.
- There is no cache, retry policy, request cancellation, error UI, or shared API client.

## Styling and design-system status

- Styling is plain global CSS imported per component; class naming is feature-oriented but not scoped.
- Fonts, colors, animation timings, breakpoints, shadows, and asset paths are repeated rather than tokenized.
- The visual identity is strong and Persona-inspired, with GSAP motion, character art, audio feedback, responsive rules, and karaoke-specific screens.
- There is no formal component library, accessibility layer, Storybook, or visual test suite.

## High-priority component concerns

1. `MusicEnded` treats score `0` as falsy, so polling never completes for a legitimate zero score.
2. `SingMusic.handleTimeUpdate` compares subtitles using the previous React `currentTime`, producing a one-event lag.
3. The loading screen stylesheet targets global `img` and `p` elements, affecting the entire application after import.
4. Hook-containing helper `animations()` is not named as a Hook and fails ESLint.
5. `ViewMusic` recreates its animation callback on every render, causing its effect to rerun.
6. Several image/audio URLs add an extra slash after `BASE_URL`; hard-coded `/Persona_Tunes/` paths reduce portability.
7. Images and buttons frequently lack accessible labels/alt text and no focus-state strategy is evident.

