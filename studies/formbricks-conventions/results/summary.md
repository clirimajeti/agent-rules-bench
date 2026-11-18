# formbricks-conventions

Repo: https://github.com/formbricks/formbricks.git @ fa289168d43699043e8e4016c3aa38bc3109f865, baseline arm: prose.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | capped | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| prose | fable52 | 4 | 4 | $4.092 ±0.982 | $4.092 | $0.000 | 0 | 105.3 | 2762580 | 33792 | 303 | 0 | 0 | 0 | 0 | - | typecheck 3/4, tests 3/4, code without own tests 3/4 |
| prose | haiku | 32 | 32 | $0.104 ±0.077 | $0.094 | $0.010 | 9 | 58.8 | 2684015 | 33605 | 167 | 9 | 0 | 0 | 0 | - | typecheck 27/32, tests 23/32, code without own tests 23/32 |
| prose | opus55 | 8 | 8 | $2.487 ±0.367 | $2.487 | $0.000 | 0 | 89.9 | 4913456 | 30140 | 302 | 0 | 0 | 0 | 1 | - | typecheck 6/8, tests 5/8, code without own tests 5/8 |
| prose | qwen36codex | 32 | 32 | $0.000 ±0.000 | $0.000 | $0.000 | 27 | 104.1 | 2324478 | 20147 | 470 | 27 | 0 | 0 | 0 | - | typecheck 2/32, tests 2/32, code without own tests 2/32 |
| prose | sonnet | 32 | 32 | $0.716 ±0.177 | $0.705 | $0.011 | 4 | 61.9 | 1880872 | 21177 | 147 | 4 | 0 | 0 | 0 | - | typecheck 30/32, tests 22/32, code without own tests 22/32 |
| rules | fable52 | 5 | 4 | $3.461 ±1.334 | $3.461 | $0.000 | 0 | 79.0 | 2196803 | 29164 | 270 | 0 | 0 | 0 | 0 | - | typecheck 4/4, tests 4/4 |
| rules | haiku | 32 | 32 | $0.127 ±0.117 | $0.126 | $0.001 | 1 | 59.3 | 2741016 | 34385 | 176 | 1 | 0 | 8 | 0 | - | typecheck 26/32, tests 23/32, code without own tests 23/32 |
| rules | opus55 | 8 | 8 | $2.326 ±0.647 | $2.326 | $0.000 | 0 | 74.6 | 4431741 | 28267 | 295 | 0 | 0 | 0 | 3 | - | typecheck 8/8, tests 8/8 |
| rules | qwen36codex | 32 | 32 | $0.000 ±0.000 | $0.000 | $0.000 | 16 | 114.0 | 2982399 | 22931 | 596 | 16 | 0 | 119 | 4 | - | typecheck 5/32, tests 5/32, code without own tests 5/32 |
| rules | sonnet | 32 | 32 | $0.601 ±0.169 | $0.601 | $0.000 | 0 | 55.8 | 1567171 | 17747 | 129 | 0 | 0 | 18 | 0 | - | typecheck 29/32, tests 23/32, code without own tests 24/32 |

## Against the baseline arm

- fable52: rules vs prose: total cost -$0.631 (-15%), inside the spread
- haiku: rules vs prose: total cost +$0.023 (22%), inside the spread
- opus55: rules vs prose: total cost -$0.161 (-6%), inside the spread
- qwen36codex: no cost reported
- sonnet: rules vs prose: total cost -$0.114 (-16%), inside the spread
