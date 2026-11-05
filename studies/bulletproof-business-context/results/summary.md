# bulletproof-business-context

Repo: https://github.com/alan2207/bulletproof-react.git @ 9506629ed003a561c6627735480cce4994244bb4, baseline arm: prose.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | capped | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | haiku | 48 | 48 | $0.014 ±0.014 | $0.011 | $0.003 | 16 | 18.3 | 441552 | 9406 | 52 | 16 | 0 | 0 | 0 | - | typecheck 45/48, tests 44/48, code without own tests 46/48 |
| none | sonnet | 48 | 48 | $0.123 ±0.117 | $0.092 | $0.031 | 16 | 12.3 | 219806 | 4247 | 33 | 16 | 0 | 0 | 0 | - | typecheck 45/48, tests 45/48, code without own tests 45/48, flaky 1 |
| prose | haiku | 48 | 48 | $0.011 ±0.009 | $0.011 | $0.000 | 1 | 12.5 | 327480 | 7570 | 40 | 1 | 0 | 0 | 0 | - | typecheck 45/48, tests 44/48, code without own tests 46/48, flaky 2 |
| prose | sonnet | 48 | 48 | $0.100 ±0.084 | $0.094 | $0.006 | 3 | 9.0 | 173115 | 3592 | 28 | 3 | 0 | 0 | 0 | - | typecheck 48/48, tests 48/48 |
| rules | haiku | 48 | 48 | $0.011 ±0.010 | $0.011 | $0.000 | 0 | 14.8 | 351158 | 7583 | 42 | 0 | 0 | 12 | 0 | - | typecheck 47/48, tests 47/48, code without own tests 47/48 |
| rules | sonnet | 48 | 48 | $0.099 ±0.080 | $0.099 | $0.000 | 0 | 10.3 | 175654 | 3605 | 29 | 0 | 0 | 44 | 0 | - | typecheck 48/48, tests 48/48 |

## Against the baseline arm

- haiku: none vs prose: total cost +$0.003 (31%), inside the spread
- haiku: rules vs prose: total cost +$0.000 (3%), inside the spread
- sonnet: none vs prose: total cost +$0.023 (23%), inside the spread
- sonnet: rules vs prose: total cost -$0.001 (-1%), inside the spread
