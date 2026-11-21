# Findings on the pinned n8n commit

Commit: `c08ba2dd33b2955577971e0e210c77c66ca7bd7e` (`master`, 1 Nov 2026), the last commit before 1 Nov 2026.
It is pinned before the wfx-loot supply-chain wave (from 10 Nov 2026), as Plan 6 pinned Formbricks (the author's choice, 2026-11-21).
At this commit n8n has 26 `AGENTS.md` files.

Counts from `node count-findings.mjs <checkout>`: the study's checkers over all of n8n's non-test code in each rule's scope.

| Rule | Source file | Findings | Files |
|---|---|---|---|
| repositories-compose | root `AGENTS.md` | 155 | 155 |
| no-manager-in-business-logic | root `AGENTS.md` | 92 | 42 |
| no-as-cast | root and nodes-base `AGENTS.md` | 20124 | 2335 |
| shared-helpers | root `AGENTS.md` | 38 | 32 |
| node-errors | nodes-base `AGENTS.md` | 58 | 23 |
| no-any-in-nodes | nodes-base and root `AGENTS.md` | 897 | 302 |

## Hand check

Five findings per rule, evenly spaced in the sorted list, each read in the code.

| Rule | True of 5 | Note |
|---|---|---|
| repositories-compose | 5 | exported classes that extend `Repository` or `BaseRepository` |
| no-manager-in-business-logic | 4 | first sample: 3 of 5; `license.ts` uses its own `this.manager` field (a LicenseManager), and `modules/data-table/persistence/` is the persistence layer. The checker now skips `this.manager` and `persistence/` folders (test examples added); second sample: 4 of 5 true, and the false one was the `persistence/` case fixed after it |
| no-as-cast | 5 | a multi-line `{ ... } as T` is reported on the line where the expression starts |
| shared-helpers | 5 | hand-rolled `isRecord` checks and one local `isRecord` |
| node-errors | 5 | `throw new Error(...)` in nodes |
| no-any-in-nodes | 5 | `any` in node helpers |

## Rules left out

- `central-debounce-times` and `editor-ui-alias-imports` (`packages/frontend/AGENTS.md`): n8n wrote them on 19 Nov 2026, after the pinned commit, so they are not in the pinned instruction files.
