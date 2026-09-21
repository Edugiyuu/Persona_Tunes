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
| `AutoVoiceRecorder` | media input | Wraps `react-media-recorder` and exposes controlled start/stop. | Reusable with a clearer status/error contract. |
| `MusicEnded` | result display | Polls score status, derives rank, animates score, and returns to catalog. | Feature-specific; polling should move to a hook/service. |
| `PatchNoteItem` | content display | Renders one release-note entry. | Reusable; optional `image` is currently unused. |
| `GuideTour` | onboarding | Elizabeth's optional first-run tour. One state machine in a provider above the router walks the player from the home menu to a running song across ten steps; each page only contributes a `data-guide-target` hook, and the provider watches clicks on it in the capture phase, so no page's own logic changes. A hand-rolled scrim cuts a hole around every control a step lights, tracked per frame so it follows GSAP transforms; a control she is only describing is raised into the light but held out of the click. Every step is voiced, and her portrait's mouth is timed by the recording. The answer is remembered for 24h through a storage that may throw. | Feature-specific by design, but the only onboarding surface — a second tour would reuse `steps.ts`, `useGuideTarget` and the scrim as they are. |
| `LoadingScreen` | application shell | Shows a fixed one-second loading state with remote GIF. | Global, but its CSS selectors leak into other screens. |
| `TV` / `Modelo3D` | experimental 3D | Loads and displays a GLB model. | Currently commented out and uses a likely invalid public path. |
| `Yukiko` (`3dModel`) | experimental 3D | R3F canvas that loads and idle-animates `idle_yukiko.glb`. | **Unused since RT-UI-004** — dropped from `ModeSelector`, so no route pulls Three.js any more. Kept for the paused RT-UI-002. |

## Shared utilities

| Module | Responsibility | Notes |
|---|---|---|
| `CustomLink` | GSAP page-cover transition plus router navigation and click SFX. | Props use `any`; transition DOM node is appended globally and never removed. |
| `PlayAudio` | Caches HTMLAudioElement instances and restarts SFX. | Fire-and-forget `play()` can reject under browser autoplay policies. |
| `GuideTour/voice` | Plays one of Elizabeth's guided lines and hands back the way to cut it off. | One shared element for all ten, so the step just left cannot talk over the step now on screen. Unlike `PlayAudio` it reports the end and the failure, which is what the mouth animation is timed by. |
| `BackgroundMusic/*` | The site-wide lounge bed: one shared element, a manual loop past the track's intro, and a claim-counted silence so any screen can ask the ambience to step aside. | Added by RT-UI-007. Startup blocks on the track loading. |
| `*/animations.ts` | GSAP timelines for individual features. | Several select global class/ID names and do not consistently clean up timelines. |

## State and data flow

- `App` owns only the artificial loading flag and route shell.
- `GuideTourProvider` owns the tour: its phase, the current step and the 24h answer. It sits above the router so the tour survives every navigation in the script.
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

