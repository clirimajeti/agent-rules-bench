# formbricks-conventions

Repo: https://github.com/formbricks/formbricks.git @ fa289168d43699043e8e4016c3aa38bc3109f865, baseline arm: prose.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | capped | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| prose | haiku | 32 | 32 | $0.104 ±0.077 | $0.094 | $0.010 | 9 | 58.8 | 2684015 | 33605 | 167 | 9 | 0 | 0 | 0 | - | - |
| prose | qwen36codex | 4 | 4 | $0.000 ±0.000 | $0.000 | $0.000 | 3 | 91.5 | 4767102 | 22922 | 540 | 3 | 0 | 0 | 3 | - | - |
| prose | sonnet | 32 | 32 | $0.716 ±0.177 | $0.705 | $0.011 | 4 | 61.9 | 1880872 | 21177 | 147 | 4 | 0 | 0 | 0 | - | - |
| rules | haiku | 32 | 32 | $0.127 ±0.117 | $0.126 | $0.001 | 1 | 59.3 | 2741016 | 34385 | 176 | 1 | 0 | 8 | 0 | - | - |
| rules | qwen36codex | 4 | 4 | $0.000 ±0.000 | $0.000 | $0.000 | 1 | 74.0 | 1309486 | 12207 | 1190 | 1 | 1 | 8 | 3 | - | - |
| rules | sonnet | 32 | 32 | $0.601 ±0.169 | $0.601 | $0.000 | 0 | 55.8 | 1567171 | 17747 | 129 | 0 | 0 | 18 | 0 | - | - |

## Against the baseline arm

- haiku: rules vs prose: total cost +$0.023 (22%), inside the spread
- qwen36codex: no cost reported
- sonnet: rules vs prose: total cost -$0.114 (-16%), inside the spread
