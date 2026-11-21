# n8n-conventions

Repo: https://github.com/n8n-io/n8n.git @ c08ba2dd33b2955577971e0e210c77c66ca7bd7e, baseline arm: prose.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | capped | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| prose | haiku | 4 | 4 | $0.072 ±0.067 | $0.063 | $0.010 | 3 | 44.0 | 1919946 | 23775 | 144 | 3 | 0 | 0 | 0 | - | - |
| prose | sonnet | 4 | 4 | $0.400 ±0.077 | $0.259 | $0.142 | 3 | 29.3 | 628113 | 9121 | 69 | 3 | 1 | 0 | 0 | - | - |
| rules | haiku | 4 | 4 | $0.070 ±0.087 | $0.070 | $0.000 | 0 | 33.5 | 1466591 | 20815 | 128 | 0 | 0 | 7 | 0 | - | - |
| rules | sonnet | 4 | 4 | $0.299 ±0.134 | $0.299 | $0.000 | 0 | 20.8 | 466832 | 8285 | 87 | 0 | 0 | 4 | 0 | - | - |

## Against the baseline arm

- haiku: rules vs prose: total cost -$0.002 (-3%), inside the spread
- sonnet: rules vs prose: total cost -$0.102 (-25%), inside the spread
