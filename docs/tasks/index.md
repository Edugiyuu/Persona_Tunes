---
title: Implementation Task Dashboard
last_assessed: 2026-08-31
portfolio_completion: 75
---

# Implementation Task Dashboard

This dashboard tracks implementation completion, not how complete the task
document is. New tasks start from [`_template.md`](./_template.md).

## Completion policy

- Every task's "Definition of done" is a list of binary acceptance criteria.
  A criterion passes or it does not; there is no partial credit and no weighting.
- `Completion % = criteria checked / total criteria`. Round to the nearest whole
  percent.
- A criterion counts as checked only when its "Proven by" cell names real
  evidence: a test, a command's output, a screenshot, or a file.
- Status values:
  - `planned` — every input is present, implementation has not started.
  - `blocked` — an input is missing, or an open decision blocks a criterion.
    A task with any `no` in its Inputs table is `blocked`, whatever its
    completion percentage says.
  - `in-progress` — at least one criterion checked since the task was written.
  - `paused` — deliberately parked. Unlike `blocked`, nothing is missing: the
    work could proceed, and someone decided it should not, for now. Keep the
    row and say who parked it and what would restart it.
  - `done` — every criterion checked with evidence. There is no 95%.
  - `dropped` — abandoned or superseded; keep the row with the reason.
- Portfolio completion is the equal-weight mean of the percentages of tasks that
  are actually in play. `paused` and `dropped` tasks are excluded — averaging in
  work nobody is doing makes the number say nothing about the work that is
  happening. Say how many are excluded next to the figure.
- Task percentage, the task's `updated:` date, its Log, and this dashboard all
  change in the same commit as the code.

RT-UI-001 through RT-UI-003 predate the template and still carry the old
weighted rubric. Their recorded percentages stand as-is and convert to criteria
counting the next time one is touched.

## Tasks

| ID | Task | Status | Completion | Current evidence |
|---|---|---|---:|---|
| RT-UI-001 | [Replace the artificial startup screen with real application loading](./rt-ui-001-functional-startup-loading.md) | done | 100% | Six-resource bootstrap, truthful recovery UI, 36 passing tests, clean builds, and complete browser acceptance evidence. |
| RT-UI-002 | [Add an animated Yukiko 3D model to the mode selector](./rt-ui-002-animated-yukiko-mode-selector.md) | paused | 10% | Parked by Edupa on 2026-08-30. RT-UI-004 rebuilt the same screen without a 3D model; the `Yukiko` component and the `.glb` assets are kept in place. Restarting it means deciding which screen it belongs to. |
| RT-UI-003 | [Rebuild the home menu in the Persona 3 Reload style](./rt-ui-003-persona3-reload-home-menu.md) | done | 100% | Persistent pointer/keyboard cursor, GSAP blade + slash with reduced-motion fallback, 39 passing tests, clean build, and browser acceptance evidence. |
| RT-UI-004 | [Rebuild the mode selector page in the Persona 3 Reload style](./rt-ui-004-persona3-reload-mode-selector.md) | done | 12/12 (100%) | 3D model gone (no `three` chunk in the build), plates and cursor ported from the home menu, blinking character artwork, 61 tests pass, clean lint and build, no overflow at seven widths, reduced-motion and tween-teardown both covered by tests. |
| RT-UI-005 | [Add an optional Elizabeth-guided navigation tutorial on first load](./rt-ui-005-elizabeth-navigation-guide.md) | blocked | 0/11 (0%) | Task written. Blocked on the Elizabeth portrait art (I-1) and three open decisions (spotlight mechanism, prompt persistence, portrait side). Voice lines and lip-sync frames split into a follow-up. |
| RT-UI-006 | [Rebuild the patch notes page in the Persona 3 Reload style](./rt-ui-006-persona3-reload-patch-notes.md) | planned | 0/9 (0%) | Task written. All inputs present. Static restyled cards (no cursor), patch data moves to a typed module, and the render-body `triggerH2Animation` yoyo is replaced with scoped GSAP. Two non-blocking decisions (ongoing motion, keep the random character). |

**Portfolio completion:** 75% (equal-weight mean of the four tasks in play: 100%, 100%, 100%, 0%). RT-UI-002 is paused and excluded; RT-UI-005 is blocked and excluded.

## Update checklist

1. Run the task's Verification block.
2. Check off only the criteria whose evidence you can point at, and write that
   evidence into the "Proven by" cell.
3. Recount `checked / total` and update the task's `status`, `updated:`, and Log.
4. Update this task's row and recalculate the portfolio percentage.
5. If an input went missing or a decision reopened, set the status back to
   `blocked` — even if criteria are already checked.
