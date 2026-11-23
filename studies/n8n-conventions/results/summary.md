# n8n-conventions

Repo: https://github.com/n8n-io/n8n.git @ c08ba2dd33b2955577971e0e210c77c66ca7bd7e, baseline arm: prose.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | capped | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| prose | haiku | 32 | 32 | $0.083 ±0.113 | $0.080 | $0.003 | 9 | 36.5 | 1634955 | 21366 | 102 | 9 | 0 | 0 | 0 | - | typecheck 30/32, tests 28/32, code without own tests 28/32, flaky 1 |
| prose | sonnet | 32 | 32 | $0.310 ±0.108 | $0.210 | $0.100 | 22 | 26.8 | 570363 | 8940 | 59 | 22 | 1 | 0 | 0 | - | typecheck 30/32, tests 29/32, code without own tests 30/32 |
| rules | haiku | 32 | 32 | $0.056 ±0.066 | $0.056 | $0.000 | 0 | 31.7 | 1512738 | 18455 | 102 | 0 | 0 | 42 | 0 | - | typecheck 30/32, tests 27/32, code without own tests 27/32 |
| rules | sonnet | 32 | 32 | $0.227 ±0.102 | $0.227 | $0.000 | 0 | 19.3 | 406292 | 7125 | 49 | 0 | 0 | 40 | 0 | - | typecheck 27/32, tests 27/32, code without own tests 27/32 |

## Against the baseline arm

- haiku: rules vs prose: total cost -$0.027 (-32%), inside the spread
- sonnet: rules vs prose: total cost -$0.082 (-27%), inside the spread
