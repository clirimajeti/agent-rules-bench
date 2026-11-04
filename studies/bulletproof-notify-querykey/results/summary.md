# bulletproof-notify-querykey

Repo: https://github.com/alan2207/bulletproof-react.git @ 9506629ed003a561c6627735480cce4994244bb4, baseline arm: prose_buried.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| generated | haiku | 8 | 8 | $0.020 ±0.005 | $0.020 | $0.000 | 0 | 28.3 | 657488 | 14055 | 82 | 0 | 0 | 12 | - | typecheck 7/8, tests 7/8, code without own tests 7/8 |
| generated | sonnet | 8 | 8 | $0.184 ±0.024 | $0.184 | $0.000 | 0 | 22.0 | 325732 | 6114 | 56 | 0 | 0 | 12 | - | typecheck 8/8, tests 8/8 |
| pointer_only | haiku | 8 | 8 | $0.016 ±0.003 | $0.016 | $0.000 | 0 | 21.5 | 478953 | 10286 | 840 | 0 | 0 | 0 | - | typecheck 8/8, tests 8/8, flaky 1 |
| pointer_only | sonnet | 8 | 8 | $0.151 ±0.025 | $0.151 | $0.000 | 0 | 17.4 | 215460 | 5890 | 37 | 0 | 0 | 0 | - | typecheck 8/8, tests 8/8, flaky 1 |
| prose_buried | haiku | 8 | 8 | $0.026 ±0.005 | $0.021 | $0.005 | 5 | 36.8 | 913209 | 15037 | 73 | 5 | 0 | 0 | - | typecheck 7/8, tests 7/8, code without own tests 8/8 |
| prose_buried | sonnet | 8 | 8 | $0.195 ±0.067 | $0.179 | $0.016 | 1 | 21.4 | 343187 | 5751 | 38 | 1 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| prose_loaded | haiku | 8 | 8 | $0.024 ±0.005 | $0.024 | $0.000 | 0 | 34.0 | 814301 | 15203 | 70 | 0 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| prose_loaded | sonnet | 8 | 8 | $0.152 ±0.046 | $0.152 | $0.000 | 0 | 18.9 | 280852 | 4740 | 32 | 0 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| rule_only | haiku | 8 | 8 | $0.018 ±0.003 | $0.018 | $0.000 | 0 | 21.8 | 581409 | 11692 | 843 | 0 | 0 | 8 | - | typecheck 8/8, tests 8/8 |
| rule_only | sonnet | 8 | 8 | $0.171 ±0.026 | $0.171 | $0.000 | 0 | 22.0 | 244443 | 6438 | 41 | 0 | 0 | 15 | - | typecheck 8/8, tests 8/8, flaky 1 |
| rules | haiku | 8 | 8 | $0.021 ±0.003 | $0.021 | $0.000 | 0 | 27.1 | 767959 | 13242 | 65 | 0 | 0 | 1 | - | typecheck 6/8, tests 6/8, code without own tests 7/8 |
| rules | sonnet | 8 | 8 | $0.177 ±0.030 | $0.177 | $0.000 | 0 | 22.3 | 305350 | 5392 | 35 | 0 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| rules_control | haiku | 8 | 8 | $0.016 ±0.003 | $0.016 | $0.000 | 0 | 24.6 | 498715 | 10599 | 612 | 0 | 0 | 2 | - | typecheck 8/8, tests 8/8, flaky 1 |
| rules_control | sonnet | 8 | 8 | $0.127 ±0.034 | $0.127 | $0.000 | 0 | 19.3 | 183567 | 5003 | 32 | 0 | 0 | 2 | - | typecheck 8/8, tests 8/8, flaky 1 |

## Against the baseline arm

- haiku: generated vs prose_buried: total cost -$0.006 (-23%)
- haiku: pointer_only vs prose_buried: total cost -$0.010 (-39%)
- haiku: prose_loaded vs prose_buried: total cost -$0.002 (-9%), inside the spread
- haiku: rule_only vs prose_buried: total cost -$0.008 (-31%)
- haiku: rules vs prose_buried: total cost -$0.005 (-20%)
- haiku: rules_control vs prose_buried: total cost -$0.010 (-38%)
- sonnet: generated vs prose_buried: total cost -$0.011 (-5%), inside the spread
- sonnet: pointer_only vs prose_buried: total cost -$0.043 (-22%), inside the spread
- sonnet: prose_loaded vs prose_buried: total cost -$0.043 (-22%), inside the spread
- sonnet: rule_only vs prose_buried: total cost -$0.024 (-12%), inside the spread
- sonnet: rules vs prose_buried: total cost -$0.018 (-9%), inside the spread
- sonnet: rules_control vs prose_buried: total cost -$0.067 (-35%)
