# bulletproof-conventions

Repo: https://github.com/alan2207/bulletproof-react.git @ 9506629ed003a561c6627735480cce4994244bb4, baseline arm: prose.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | capped | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| prose | haiku | 4 | 4 | $0.020 ±0.007 | $0.019 | $0.001 | 1 | 22.5 | 616270 | 14389 | 74 | 1 | 1 | 0 | 0 | - | typecheck 2/4, tests 2/4, code without own tests 3/4 |
| prose | qwen36codex | 4 | 4 | $0.000 ±0.000 | $0.000 | $0.000 | 1 | 31.8 | 417334 | 9103 | 173 | 1 | 0 | 0 | 3 | - | typecheck 4/4, tests 2/4, code without own tests 3/4 |
| prose | sonnet | 4 | 4 | $0.156 ±0.060 | $0.133 | $0.023 | 1 | 14.8 | 233240 | 6226 | 39 | 1 | 0 | 0 | 0 | - | typecheck 4/4, tests 3/4, code without own tests 3/4 |
| rules | haiku | 4 | 4 | $0.021 ±0.009 | $0.019 | $0.002 | 1 | 28.5 | 630119 | 14515 | 77 | 1 | 0 | 11 | 0 | - | typecheck 3/4, tests 3/4, code without own tests 3/4 |
| rules | qwen36codex | 4 | 3 | $0.000 ±0.000 | $0.000 | $0.000 | 2 | 36.3 | 1747451 | 8891 | 1572 | 2 | 1 | 12 | 2 | - | typecheck 1/3, tests 0/3, code without own tests 1/3 |
| rules | sonnet | 4 | 4 | $0.193 ±0.097 | $0.175 | $0.018 | 1 | 23.8 | 262237 | 6182 | 40 | 1 | 1 | 7 | 0 | - | typecheck 4/4, tests 3/4, code without own tests 3/4 |

## Against the baseline arm

- haiku: rules vs prose: total cost +$0.001 (3%), inside the spread
- qwen36codex: no cost reported
- sonnet: rules vs prose: total cost +$0.037 (24%), inside the spread

## Pilot notes (added after the runs)

This is the pilot (`study.pilot.json`, 1 repeat, Sonnet, Haiku and Qwen in Codex). It was never analysed for the plan; it only tested the setup.

- A first attempt is not here: ESLint was not installed in the worktree, so the checker and the loop failed, and the harness counted that as 0 breaks. The harness now stops before any session when a checker or a loop fails.
- rules-qwen36codex-T3-1 failed: in its review fix the model wrote 86,000 tokens in one reply, and the session was killed by hand. Since then a session killed at its time limit counts as capped.
- Qwen reached the 30-turn cap in 5 of 8 runs; it gets 60 turns in the real runs.
- Breaks after the task: prose 3 of 12 runs, rules 4 of 12 (one of them the killed run). In all 4 rules runs the loop had reported that rule in that file, and the agent left it (`ignoredCatches`).
- Verify: most failures are type errors in T4 (role filter typed as `string`, select change handlers) and the existing `discussions.test.tsx` in T2, which finds rows by their full text, so new columns break it unless the agent updates the test.
