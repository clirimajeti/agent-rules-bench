# formbricks-conventions

Repo: https://github.com/formbricks/formbricks.git @ fa289168d43699043e8e4016c3aa38bc3109f865, baseline arm: prose.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | capped | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| prose | haiku | 4 | 4 | $0.047 ±0.007 | $0.045 | $0.002 | 1 | 49.5 | 1888397 | 26592 | 145 | 1 | 0 | 0 | 0 | - | typecheck 4/4, tests 4/4 |
| prose | sonnet | 4 | 4 | $0.796 ±0.210 | $0.796 | $0.000 | 0 | 64.0 | 2222120 | 23023 | 152 | 0 | 0 | 0 | 0 | - | typecheck 4/4, tests 3/4, code without own tests 3/4 |
| rules | haiku | 4 | 4 | $0.151 ±0.077 | $0.151 | $0.000 | 0 | 60.8 | 3139117 | 36959 | 208 | 0 | 0 | 0 | 0 | - | typecheck 4/4, tests 4/4 |
| rules | sonnet | 4 | 4 | $0.616 ±0.124 | $0.616 | $0.000 | 0 | 50.0 | 1464750 | 18300 | 128 | 0 | 0 | 0 | 0 | - | typecheck 4/4, tests 2/4, code without own tests 2/4 |

## Against the baseline arm

- haiku: rules vs prose: total cost +$0.105 (223%)
- sonnet: rules vs prose: total cost -$0.180 (-23%), inside the spread

## Pilot notes (added after the runs)

This is the pilot (`study.pilot.json`, 1 repeat, Sonnet and Haiku). It was never analysed for the plan; it only tested the setup.
The first verify pass had a bug: test paths with `(`, for example `app/(app)/...`, broke the shell command, so 6 runs failed for no real reason.
After the fix (`verify-tests.mjs`), the 8 failed runs were verified again:

- typecheck: 16/16 ok.
- tests: 13/16 ok. The 3 real failures are existing tests that the agent did not update:
  - prose-sonnet-T1-1 and rules-sonnet-T1-1: `modules/organization/settings/api-keys/lib/api-keys.test.ts` (the new `lastUsedAt` field).
  - rules-sonnet-T3-1: `modules/core/rate-limit/rate-limit-configs.test.ts` (a new `dataExport` rate-limit key; the test lists all keys).
- Convention violations after the task (checkers on added lines): prose 2/8 runs, rules 0/8.

## Qwen pilot (added 2026-11-16, never analysed)

8 runs, Qwen 3.6 in Codex, 1 per arm and task, with maxTurns 60 and a 60-minute time limit.
- 6 of 8 task sessions reached the 60-turn cap (prose 3 of 4, rules 3 of 4); Codex counts each tool call as a turn here, and Formbricks tasks need many.
- rules-qwen36codex-T1-1: the review fix session reached the 60-minute limit and was killed (counted as capped).
- Breaks after the task: prose 6 in 3 runs, rules 1 in 1 run; loop catches in rules: 8.
