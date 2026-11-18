# bulletproof-conventions

Repo: https://github.com/alan2207/bulletproof-react.git @ 9506629ed003a561c6627735480cce4994244bb4, baseline arm: prose.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | capped | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| prose | fable52 | 8 | 8 | $0.935 ±0.233 | $0.817 | $0.118 | 2 | 19.1 | 251207 | 8716 | 77 | 2 | 0 | 0 | 0 | - | typecheck 8/8, tests 7/8, code without own tests 7/8 |
| prose | haiku | 32 | 32 | $0.020 ±0.007 | $0.018 | $0.002 | 7 | 22.7 | 545240 | 14613 | 71 | 7 | 4 | 0 | 0 | - | typecheck 28/32, tests 24/32, code without own tests 24/32 |
| prose | opus55 | 8 | 8 | $0.505 ±0.198 | $0.422 | $0.083 | 2 | 26.8 | 460774 | 8176 | 77 | 2 | 0 | 0 | 0 | - | typecheck 7/8, tests 7/8, code without own tests 7/8 |
| prose | qwen36codex | 32 | 32 | $0.000 ±0.000 | $0.000 | $0.000 | 20 | 42.9 | 481411 | 12613 | 261 | 20 | 5 | 0 | 0 | - | typecheck 9/32, tests 7/32, code without own tests 11/32 |
| prose | sonnet | 32 | 32 | $0.165 ±0.055 | $0.143 | $0.022 | 8 | 15.6 | 228213 | 6447 | 43 | 8 | 0 | 0 | 0 | - | typecheck 32/32, tests 24/32, code without own tests 24/32 |
| rules | fable52 | 8 | 8 | $1.421 ±0.458 | $1.365 | $0.056 | 1 | 36.4 | 531861 | 12541 | 114 | 1 | 0 | 23 | 0 | - | typecheck 8/8, tests 7/8, code without own tests 8/8 |
| rules | haiku | 32 | 32 | $0.019 ±0.008 | $0.017 | $0.002 | 8 | 22.2 | 515680 | 13368 | 68 | 8 | 3 | 76 | 0 | - | typecheck 27/32, tests 26/32, code without own tests 26/32 |
| rules | opus55 | 8 | 8 | $0.820 ±0.284 | $0.787 | $0.032 | 1 | 33.5 | 860356 | 12720 | 121 | 1 | 0 | 18 | 0 | - | typecheck 8/8, tests 6/8, code without own tests 7/8 |
| rules | qwen36codex | 32 | 32 | $0.000 ±0.000 | $0.000 | $0.000 | 3 | 36.2 | 428901 | 11306 | 294 | 3 | 2 | 133 | 1 | - | typecheck 12/32, tests 5/32, code without own tests 9/32 |
| rules | sonnet | 32 | 32 | $0.213 ±0.087 | $0.191 | $0.022 | 8 | 23.7 | 326756 | 7649 | 50 | 8 | 1 | 66 | 0 | - | typecheck 31/32, tests 23/32, code without own tests 23/32 |

## Against the baseline arm

- fable52: rules vs prose: total cost +$0.486 (52%)
- haiku: rules vs prose: total cost -$0.001 (-5%), inside the spread
- opus55: rules vs prose: total cost +$0.315 (62%)
- qwen36codex: no cost reported
- sonnet: rules vs prose: total cost +$0.049 (29%), inside the spread
