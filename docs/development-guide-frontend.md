# Frontend Development Guide

## Prerequisites

- Node.js and npm. The repository does not pin a Node version; add `.nvmrc`, `.node-version`, or `engines` before standardizing environments.
- A running/deployed backend URL.
- Optional hosted background videos for the karaoke screen.
- Browser microphone access for the full singing flow; production use requires a secure context.

## Environment

Create `frontend/.env` for local development. The file is correctly ignored by Git.

```dotenv
VITE_API_URL=http://localhost:3000
VITE_VIDEO1_URL=https://example.invalid/video-1.mp4
VITE_VIDEO2_URL=https://example.invalid/video-2.mp4
VITE_VIDEO3_URL=https://example.invalid/video-3.mp4
```

Do not commit real values. `frontend/.env.production` is also ignored.

## Install and run

```powershell
cd frontend
npm install
npm run dev
```

Vite prints the local URL. The API must allow that origin; the current backend permits every origin.

## Available commands

| Command | Purpose | Current status |
|---|---|---|
| `npm run dev` | Start Vite development server. | Defined. |
| `npm run build` | Create production files in `dist/`. | Passes with warnings. |
| `npm run preview` | Serve the production bundle locally. | Defined. |
| `npm run lint` | Run ESLint over the frontend. | Fails: 6 errors, 1 warning on 2026-08-02. |
| `npm run deploy` | Build and publish `dist/` with `gh-pages`. | Defined; not executed during analysis. |

## Development workflow

1. Add or update routes in `src/App.tsx`.
2. Keep route-level features under `src/components/<Feature>/` while the current pattern remains.
3. Centralize new HTTP work rather than adding more direct Axios calls to components; a `src/api/` layer is the recommended next seam.
4. Resolve public assets through `import.meta.env.BASE_URL` consistently and avoid hard-coded `/Persona_Tunes/` paths.
5. Encapsulate GSAP work in properly named hooks with cleanup via GSAP context.
6. Run lint and build before submitting changes.

## Testing

There is currently no test runner or test script. A practical starting stack is Vitest + React Testing Library for units/components and Playwright for the browser karaoke flow. First cover:

- route rendering and API failure/empty states;
- score polling for pending, success, failure, timeout, and score `0`;
- lyric selection at timing boundaries;
- microphone permission denied and recording upload failure;
- asset paths under the GitHub Pages base;
- keyboard navigation and reduced-motion behavior.

## Known build and lint baseline

The production build succeeds but warns that the Rodin font URL is unresolved at build time and that the main JS chunk is 533.71 kB after minification. ESLint reports Hook naming/usage issues, an explicit `any`, an unused prop, `var` usage, and a missing effect dependency.

## Common tasks

- **Add a screen:** create a component folder, add route, add navigation through `CustomLink`, then test direct navigation and refresh under the deployment base.
- **Add an API call:** define typed request/response data, handle loading/error/empty states, and keep base URL configuration in one client module.
- **Add media:** record source/license metadata, compress appropriately, place deployable content under `public/`, and update `asset-inventory.md`.

