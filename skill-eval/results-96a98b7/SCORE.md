# Score: codemyrules 96a98b7 (with eslint-pattern-rules 9a314ac, backend-pattern-rules 383f0c8), Opus, 2026-11-02

Second run, after adding the suggestions layer.
Copies sat under `~/.cache/agent-rules-bench/workdirs`, so no parent `CLAUDE.md` was loaded (no `notes/` written).
FastAPI and bulletproof hit the spend limit and were resumed; the cost includes the failed attempts.

| | jhipster | FastAPI | bulletproof-react |
|---|---|---|---|
| Session | $5.01, 69 turns, 14 min | $7.86 (2.17 + 5.69), 63 turns, 14 min | $4.81, 84 turns, 16 min |
| Rules built | 28 ast-grep + 5 ESLint | 29 ast-grep + 3 Ruff + 2 Biome | 15 ESLint (12 custom) |
| Rule tests, rerun | 28/28 ast-grep, 17/17 node --test | 29/29 ast-grep | 150/150 RuleTester (vitest) |
| Main config, rerun | 0 findings | 0 findings | 0 errors |
| Suggestions config, rerun | 28 hits in 9 rules | 78 hits in 6 rules | 58 hits in 4 rules |
| Loop | runs the suggestions configs | runs the suggestions config | runs the suggestions config |

## Known rules (expected.json)

| Rule | Found | Existing hits (expected) | Layer | Reaches the loop | Doc line |
|---|---|---|---|---|---|
| jhipster clock | yes | 4 (7; scoped to `service/**`, see below) | suggestions | yes | deleted, pointer in a new `src/main/java/CLAUDE.md` |
| jhipster role literals | yes | 4 (4) | suggestions | yes | deleted |
| FastAPI db access in routes | yes | 32 (32) | suggestions | yes | shortened to a pointer in place |
| FastAPI status constants | yes | 28 (28) | suggestions | yes | deleted |
| bulletproof notifications | yes | 7 (7) | suggestions | yes | kept in `docs/api-layer.md` (linked guide, kept on purpose) |
| bulletproof query keys | yes | 0 (0) | main | yes | kept in `docs/` |

Found: 6 of 6.
Enforced by the loop: 6 of 6 (first run: 1 of 6).

## Compared with the first run

| | d307701 | 96a98b7 |
|---|---|---|
| Known rules in the loop | 1 of 6 | 6 of 6 |
| Rules with open hits | warning, outside the loop | error, suggestions layer, in the loop |
| CI | green | green (main config unchanged in behaviour) |
| Doc tokens removed | ~360 / ~468 on demand, ~105 always loaded | ~679 / ~648 on demand, ~135 always loaded |
| Cost | $14.76 | $17.68 (includes $2.17 of a failed attempt) |

## Findings

1. **The suggestions layer closes the gap.** Every rule the existing code breaks now runs at error on changed lines in the loop, while CI runs only the main config and stays green.
2. **More doc lines go**, because suggestion rules count as enforced: jhipster deleted 26 lines and shortened 5, FastAPI deleted 29 and shortened 3.
   The savings are still small, since these docs are on demand.
3. **Pointer placement varies:** jhipster created a folder `CLAUDE.md`, FastAPI and bulletproof kept the pointers in place, each recorded as a design answer.
4. **The clock rule is narrower than the study checker:** scoped to `service/**` where the doc line sits, it leaves 3 hits in `AuthenticateController` and `AbstractAuditingEntity` outside the rule.
5. **Skill gaps found:**
   - `measure.mjs` reports 0 on-demand tokens in all three, because Markdown-linked `docs/*.md` are not counted.
   - FastAPI's Ruff tier calls `uv`, which is not installed here; the loop prints "ruff failed" and counts the tier as clean instead of refusing the config at install.
   - The loop has no Biome parser, so FastAPI's Biome rules stay in CI only.
   - bulletproof added a dev dependency (`eslint-plugin-local-rules@3.0.2`, exact version, pre-approved by the prompt) because the legacy config cannot load local rules otherwise.
