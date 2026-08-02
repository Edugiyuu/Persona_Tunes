# Contribution Guide

This guide records the repository's current contribution baseline. The README invites issues and pull requests, but the project has no formal `CONTRIBUTING.md`, CI checks, branch policy, or commit standard.

## Before changing code

1. Read [Project Overview](./project-overview.md), the relevant part architecture, and [Integration Architecture](./integration-architecture.md).
2. Keep real `.env` files and secrets out of Git.
3. Confirm asset licensing before adding music, lyrics, fonts, game imagery, or character audio.
4. Preserve unrelated local changes; `.agents/` and `_bmad/` were already untracked during this documentation run.

## Local checks

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

Backend:

```powershell
cd backend
.\node_modules\.bin\tsc.cmd --noEmit
```

The current lint baseline fails; new work should not add errors, and ideally should fix the touched-area errors. There is no automated test command yet, so changes to behavior need focused manual evidence until test tooling is established.

## Code conventions inferred from the repository

- TypeScript is strict in both parts.
- React features are grouped under `frontend/src/components/<Feature>/` with adjacent CSS/animation modules.
- Backend routes delegate to controllers and Mongoose models.
- Prefer explicit types over `any`, named hooks for Hook logic, early returns after responses, and runtime validation at external boundaries.
- New external integrations should be isolated behind adapters/services rather than added directly to UI components or controllers.

## Pull request expectations

- Explain user-visible behavior and architecture impact.
- List commands/tests run and their results.
- Call out environment or deployment changes without exposing values.
- Include screenshots/video for visual changes and API examples for contract changes.
- Update the relevant files in `docs/` when endpoints, models, components, runtime requirements, or integration flows change.

