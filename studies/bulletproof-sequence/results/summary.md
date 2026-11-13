# bulletproof-sequence

Repo: https://github.com/alan2207/bulletproof-react.git @ 9506629ed003a561c6627735480cce4994244bb4, baseline arm: prose_buried.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | capped | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| prose_buried | haiku | 12 | 0 | $0.000 ±0.000 | $0.000 | $0.000 | 0 | 1.0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | - | - |
| prose_buried | sonnet | 12 | 8 | $0.131 ±0.082 | $0.131 | $0.000 | 0 | 16.1 | 159666 | 4076 | 30 | 1 | 1 | 0 | 0 | - | - |
| rules | haiku | 12 | 0 | $0.000 ±0.000 | $0.000 | $0.000 | 0 | 1.0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | - | - |
| rules | sonnet | 12 | 8 | $0.126 ±0.081 | $0.126 | $0.000 | 0 | 12.5 | 160246 | 4085 | 29 | 0 | 0 | 2 | 0 | - | - |

## Against the baseline arm

- haiku: no cost reported
- sonnet: rules vs prose_buried: total cost -$0.005 (-4%), inside the spread
