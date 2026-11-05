# bulletproof-40-rules

Repo: https://github.com/alan2207/bulletproof-react.git @ 9506629ed003a561c6627735480cce4994244bb4, baseline arm: prose.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | capped | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | haiku | 16 | 16 | $0.026 ±0.005 | $0.019 | $0.007 | 16 | 34.0 | 775911 | 16751 | 92 | 16 | 0 | 0 | 0 | - | typecheck 14/16, tests 14/16, code without own tests 14/16, flaky 1 |
| none | sonnet | 16 | 16 | $0.239 ±0.045 | $0.166 | $0.073 | 16 | 27.3 | 337364 | 9013 | 57 | 16 | 1 | 0 | 0 | - | typecheck 15/16, tests 15/16, code without own tests 15/16 |
| prose | haiku | 16 | 16 | $0.021 ±0.006 | $0.020 | $0.001 | 2 | 25.3 | 598034 | 15139 | 76 | 2 | 0 | 0 | 0 | - | typecheck 14/16, tests 14/16, code without own tests 14/16 |
| prose | sonnet | 16 | 16 | $0.168 ±0.042 | $0.163 | $0.005 | 1 | 15.7 | 214914 | 6668 | 40 | 1 | 0 | 0 | 0 | - | typecheck 16/16, tests 16/16 |
| rules | haiku | 16 | 16 | $0.019 ±0.003 | $0.019 | $0.000 | 0 | 21.2 | 503259 | 13603 | 67 | 0 | 0 | 23 | 0 | - | typecheck 14/16, tests 14/16, code without own tests 14/16 |
| rules | sonnet | 16 | 16 | $0.175 ±0.042 | $0.175 | $0.000 | 0 | 19.3 | 245272 | 6191 | 39 | 0 | 0 | 19 | 0 | - | typecheck 16/16, tests 16/16 |

## Against the baseline arm

- haiku: none vs prose: total cost +$0.006 (27%)
- haiku: rules vs prose: total cost -$0.001 (-6%), inside the spread
- sonnet: none vs prose: total cost +$0.071 (42%)
- sonnet: rules vs prose: total cost +$0.007 (4%), inside the spread
