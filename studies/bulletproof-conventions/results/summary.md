# bulletproof-conventions

Repo: https://github.com/alan2207/bulletproof-react.git @ 9506629ed003a561c6627735480cce4994244bb4, baseline arm: prose.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | capped | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| prose | haiku | 32 | 32 | $0.020 ±0.007 | $0.018 | $0.002 | 7 | 22.7 | 545240 | 14613 | 71 | 7 | 4 | 0 | 0 | - | - |
| prose | sonnet | 32 | 32 | $0.165 ±0.055 | $0.143 | $0.022 | 8 | 15.6 | 228213 | 6447 | 43 | 8 | 0 | 0 | 0 | - | - |
| rules | haiku | 32 | 32 | $0.019 ±0.008 | $0.017 | $0.002 | 8 | 22.2 | 515680 | 13368 | 68 | 8 | 3 | 76 | 0 | - | - |
| rules | sonnet | 32 | 32 | $0.213 ±0.087 | $0.191 | $0.022 | 8 | 23.7 | 326756 | 7649 | 50 | 8 | 1 | 66 | 0 | - | - |

## Against the baseline arm

- haiku: rules vs prose: total cost -$0.001 (-5%), inside the spread
- sonnet: rules vs prose: total cost +$0.049 (29%), inside the spread
