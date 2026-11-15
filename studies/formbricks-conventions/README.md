# formbricks-conventions

Plan 6, [plan-6.md](../plan-6.md) (final; registered on OSF on 2026-11-15 before any real run: https://osf.io/9hdjs, embargoed). Changes since then: [plan-6-deviations.md](../plan-6-deviations.md). Only the pilot has run; it is not analysed.
Four conventions that the Formbricks maintainers wrote and do not lint, at commit `fa28916` (31 Oct 2026, before the wfx-loot wave):

| Rule | Kind | Source |
|---|---|---|
| `no-new-server-actions` | design-shaping | `AGENTS.md`: server actions are legacy, new backend work goes in `/api/v3` with TanStack Query |
| `readonly-props` | mechanical | `CODING_STANDARDS.md`: React component props use `Readonly<>` |
| `shared-date-formatting` | mechanical | `CODING_STANDARDS.md`: user-facing dates through the shared helpers |
| `en-us-locale-only` | mechanical | `AGENTS.md`: only edit `en-US.json` |

- `prose`: Formbricks as its maintainers ship it.
- `rules`: the four lines removed (each found once, word for word), the four lint rules with the codemyrules feedback loop, and one pointer line for the design-shaping rule at the end of `apps/web/AGENTS.md`.

## Setup

```bash
cd studies/formbricks-conventions && npm ci --ignore-scripts   # ESLint and parsers for the checkers
npm test                                                        # every rule against its examples
FORMBRICKS_SRC=<checkout of fa28916> npm test                   # also: each source line is in the docs, once
```

`verify` needs Docker: every step runs in `node:24-bookworm` with only the checkout mounted (no credentials), installs with the frozen lockfile and `--ignore-scripts`, and runs the type check and the tests related to the changed files.
The 8 test files in `baseline-failing-tests.txt` fail on the unchanged commit in the container (two full runs: 18 and 21 failing tests, so some are flaky) and are excluded.

The pilot runs (16, never analysed) are in `results-pilot/`, with notes at the end of its `summary.md`.
