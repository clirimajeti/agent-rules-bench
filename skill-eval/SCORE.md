# Score: codemyrules d307701 (with eslint-pattern-rules b77ef86, backend-pattern-rules e45ca46), Opus, 2026-11-02

| | jhipster | FastAPI | bulletproof-react |
|---|---|---|---|
| Session | $5.85, 76 turns, 17 min | $5.32, 69 turns, 15 min | $3.59, 66 turns, 11 min |
| Rules built | 32 ast-grep + 7 ESLint | 32 ast-grep + 6 Ruff + 3 Biome | 17 ESLint (8 rule ids) |
| Rule tests, rerun | 32/32 ast-grep, 34/34 RuleTester | 32/32 ast-grep | probe files in the session; project ESLint: 0 errors, 61 warnings |
| Loop | installed, smoke-tested | installed | installed |

## Known rules (expected.json)

| Rule | Found | Existing hits (expected) | Level | Reaches the loop | Doc line |
|---|---|---|---|---|---|
| jhipster clock | yes | 7 (7) | warning | no | kept |
| jhipster role literals | yes | 4 (4) | warning | no | kept |
| FastAPI db access in routes | yes | 29 (32; the doc lists exec/get/add/delete/commit, the study checker also counted refresh) | warning | no | shortened to a pointer in place |
| FastAPI status constants | yes | 28 (28) | warning | no | shortened to a pointer in place |
| bulletproof notifications | yes | 7 (7) | warning | no | kept |
| bulletproof query keys | yes | 0 (0) | error | yes | kept (`docs/*.md` untouched) |

Found: 6 of 6, with correct hit counts. Enforced by the loop: 1 of 6.

## Findings

1. **Discovery and rule quality are strong.** Every known rule found, hit counts match, all generated tests pass, contradictions between docs and code are reported instead of silently picked.
2. **Rules the existing code breaks end up outside the loop.** Rules with open hits are set to warning so CI stays green, the loop blocks only errors, and the doc lines for warning rules are kept. These are exactly the rules agents break by copying nearby code, which the studies show is where the loop matters most. The hand-written rules arm used error level with the loop checking changed lines only, so existing hits never blocked anything.
3. **Doc slimming is small:** about 360 and 468 on-demand tokens (jhipster, FastAPI), 105 always-loaded (bulletproof), mostly because warning rules keep their lines.
4. **Pointers stay in place** in the long docs instead of a folder `CLAUDE.md`; FastAPI says a new file was outside the approved writes (the prompt's wording).
5. **Parent-folder memory leaked in:** the copies sat under a folder with its own `CLAUDE.md`, which every session loaded; bulletproof wrote a `notes/` folder because of it.
