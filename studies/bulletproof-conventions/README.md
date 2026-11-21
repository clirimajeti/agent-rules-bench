# bulletproof-conventions: the bulletproof-react half of Plan 6

Plan 6, [plan-6.md](../plan-6.md) (final; registered on OSF on 2026-11-15 before any real run: https://osf.io/9hdjs, embargoed). Changes since then: [plan-6-deviations.md](../plan-6-deviations.md). Only the pilot has run; it is not analysed.
The Formbricks half is [formbricks-conventions](../formbricks-conventions/README.md).

## What is reused and what is new

- Reused unchanged from [bulletproof-40-rules](../bulletproof-40-rules/README.md) (Plan 4), as links: the 40 conventions and their rules (`plugin/`), the checker config (`eslint.config.mjs`) and the arm scripts (`arms/`).
- New: 4 tasks that Plans 4 and 5 did not use, 8 repeats, the local model in Codex, the seeded run order, and verify in a container.

| arm | always-loaded `CLAUDE.md` | lint rules + loop |
|---|---|---|
| `prose` | short, links the project's `AGENTS.md` and docs, plus the 40 prose lines | no |
| `rules` | short, links the project's `AGENTS.md` and docs; 8 pointer lines in `src/features/CLAUDE.md` | the 40 rules |

## Tasks

The prompts describe only the feature and never mention a convention.

- T1: admins pin discussions; pinned ones are listed first with a badge (mutation, role check, mock API).
- T2: comment count and last comment date on each discussion in the list (read only, mock API, dates).
- T3: change password on the profile page, with a check of the current password in the mock API (form, mutation, error).
- T4: admins filter and search the users list and export it as CSV (role filter, dates, download).

## Setup

The checkers use the ESLint install of `bulletproof-notify-querykey` (`node_modules` is a link to it).
`verify` needs Docker: every step runs in `node:24-bookworm` with only the checkout mounted (no credentials), installs with the frozen lockfile and `--ignore-scripts`, and runs the type check and the full Vitest suite.
On the unchanged commit (9506629) in the container: install 134 s, type check ok (10 s), 12 test files and 21 tests pass (29 s).

## How to run

```bash
S=studies/bulletproof-conventions/study.json
node --test studies/bulletproof-conventions/plugin/   # the 40 rules against their examples
node bench/bench.mjs run $S --dry-run                 # the seeded order of the 192 runs
node bench/bench.mjs run $S
node bench/bench.mjs verify $S
```

The pilot runs (24, never analysed) are in `results-pilot/`, with notes at the end of its `summary.md`.
