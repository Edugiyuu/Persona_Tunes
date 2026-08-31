---
id: RT-XX-000
title: <what changes, in one imperative line>
status: planned          # planned | blocked | in-progress | paused | done | dropped
branch: <git branch, or - if none yet>
area: <frontend/mode-selector, backend/api, docs, ...>
owner: <name — not TBD>
created: YYYY-MM-DD
updated: YYYY-MM-DD
depends_on: []           # task ids that must land first
supersedes: []           # task ids this replaces
---

# <ID>: <title>

> **Done means:** one sentence describing what a user sees or can do that they
> could not before. If you cannot write this line, the task is not ready.

## Why

Two or three sentences. The problem, not the solution. If there is history worth
knowing — a failed attempt, a commit that half-did it — one more sentence and a
reference. Anything longer belongs in a linked doc.

## Inputs

Everything this task needs and does not produce itself. **A missing input is a
blocker, not a footnote** — if any row is `no`, the task status is `blocked`.

| # | What | Where | Have it? |
|---|---|---|---|
| I-1 | Reference screenshot of the target look | `docs/refs/<file>.png` | yes |
| I-2 | Character artwork for the empty right side | — | **no — blocks AC-4** |
| I-3 | Decision: does RT-UI-002 survive? | see D-1 | **no — blocks AC-9** |

## Definition of done

Every row is binary — it passes or it does not. Completion is
`checked ÷ total`, nothing weighted. A row that cannot be proven is not an
acceptance criterion; either make it provable or move it to Inputs as a missing
decision.

| # | The check | Proven by | ✓ |
|---|---|---|:-:|
| AC-1 | <observable behaviour or state, from the user's side> | <test name, command, screenshot, or file> | ☐ |
| AC-2 | | | ☐ |
| AC-3 | | | ☐ |

**Completion: 0/3 (0%)**

## Touches

One line per file. *What* changes, never *how* — the how goes stale the moment
the code lands, and it pre-decides work for whoever implements it.

| File | Change |
|---|---|
| `path/to/File.tsx` | <one line> |
| `path/to/File.css` | <one line> |
| `path/to/File.test.tsx` | new — covers AC-2, AC-3 |

## Not this task

- <the adjacent thing someone will assume is included>
- <the tempting refactor that is a separate task>

## Approach

*Optional, max 10 lines, and only for a call that is not obvious from the
files above.* Constraints and the one decision already made — not a design doc.
Delete this section if there is nothing non-obvious to say.

## Verification

Copy-pasteable, in order. No prose.

```bash
cd frontend && npm run test
```

```bash
cd frontend && npx eslint <changed paths>
```

```bash
cd frontend && npm run build
```

Manual, if any: the URL, the exact steps, and what you should see.

## Open decisions

Real questions only. Missing things go in Inputs. Every row names what it blocks
and who answers it — an unowned decision never gets made.

| # | Question | Blocks | Owner | Answer |
|---|---|---|---|---|
| D-1 | <question> | AC-4 | <name> | — |

## Log

Newest last. One line per real change of state — not per edit.

| Date | What happened |
|---|---|
| YYYY-MM-DD | Task written. Blocked on I-2. |

---

<!--
HOW TO USE THIS TEMPLATE

1. Copy to `docs/tasks/<id>-<kebab-title>.md` and delete this comment block.
2. Write the "Done means" line first. If it will not come out in one sentence,
   the task is two tasks.
3. Fill Inputs before Definition of done. Missing inputs set the status to
   `blocked` and the task does not get picked up.
4. Acceptance criteria describe what is observable, never what code exists.
   "The cursor wraps at both ends" — yes. "A useMenuCursor hook exists" — no.
5. Update `updated:`, the completion count, and the Log in the same change as
   the code. A doc that lags the code is worse than no doc.
6. `done` requires every AC checked with real evidence in the "Proven by"
   column. There is no 95%.
-->
