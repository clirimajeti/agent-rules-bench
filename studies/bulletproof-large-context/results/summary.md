# bulletproof-large-context

Repo: https://github.com/alan2207/bulletproof-react.git @ 9506629ed003a561c6627735480cce4994244bb4, baseline arm: prose_loaded_large.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | capped | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| prose_loaded | haiku | 8 | 8 | $0.017 ±0.002 | $0.017 | $0.000 | 0 | 22.9 | 532534 | 11943 | 63 | 0 | 0 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| prose_loaded | sonnet | 8 | 8 | $0.133 ±0.026 | $0.133 | $0.000 | 0 | 17.5 | 177960 | 4835 | 38 | 0 | 0 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| prose_loaded_large | haiku | 8 | 8 | $0.020 ±0.004 | $0.018 | $0.002 | 3 | 21.9 | 697900 | 12006 | 70 | 3 | 0 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| prose_loaded_large | sonnet | 8 | 8 | $0.157 ±0.059 | $0.157 | $0.000 | 0 | 16.0 | 250700 | 4954 | 37 | 0 | 0 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| rules | haiku | 8 | 8 | $0.017 ±0.001 | $0.017 | $0.000 | 0 | 24.4 | 557389 | 11496 | 64 | 0 | 0 | 0 | 0 | - | typecheck 7/8, tests 7/8, code without own tests 8/8 |
| rules | sonnet | 8 | 8 | $0.128 ±0.038 | $0.128 | $0.000 | 0 | 19.4 | 177782 | 4603 | 36 | 0 | 0 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| rules_large | haiku | 8 | 8 | $0.016 ±0.002 | $0.016 | $0.000 | 0 | 18.3 | 547438 | 10637 | 55 | 0 | 0 | 3 | 0 | - | typecheck 8/8, tests 8/8 |
| rules_large | sonnet | 8 | 8 | $0.158 ±0.053 | $0.158 | $0.000 | 0 | 17.8 | 259214 | 4825 | 38 | 0 | 0 | 2 | 0 | - | typecheck 8/8, tests 8/8 |

## Against the baseline arm

- haiku: prose_loaded vs prose_loaded_large: total cost -$0.003 (-15%), inside the spread
- haiku: rules vs prose_loaded_large: total cost -$0.003 (-15%), inside the spread
- haiku: rules_large vs prose_loaded_large: total cost -$0.004 (-19%), inside the spread
- sonnet: prose_loaded vs prose_loaded_large: total cost -$0.025 (-16%), inside the spread
- sonnet: rules vs prose_loaded_large: total cost -$0.029 (-19%), inside the spread
- sonnet: rules_large vs prose_loaded_large: total cost +$0.001 (0%), inside the spread
