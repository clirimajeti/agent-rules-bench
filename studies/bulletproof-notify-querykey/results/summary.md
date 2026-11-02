# bulletproof-notify-querykey

Repo: https://github.com/alan2207/bulletproof-react.git @ 9506629ed003a561c6627735480cce4994244bb4, baseline arm: prose_buried.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | builds |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| generated | haiku | 8 | 8 | $0.020 ±0.005 | $0.020 | $0.000 | 0 | 28.3 | 657488 | 14055 | 82 | 0 | 0 | 12 | - |
| generated | sonnet | 8 | 8 | $0.184 ±0.024 | $0.184 | $0.000 | 0 | 22.0 | 325732 | 6114 | 56 | 0 | 0 | 12 | - |
| prose_buried | haiku | 8 | 8 | $0.026 ±0.005 | $0.021 | $0.005 | 5 | 36.8 | 913209 | 15037 | 73 | 5 | 0 | 0 | - |
| prose_buried | sonnet | 8 | 8 | $0.195 ±0.067 | $0.179 | $0.016 | 1 | 21.4 | 343187 | 5751 | 38 | 1 | 0 | 0 | - |
| prose_loaded | haiku | 8 | 8 | $0.024 ±0.005 | $0.024 | $0.000 | 0 | 34.0 | 814301 | 15203 | 70 | 0 | 0 | 0 | - |
| prose_loaded | sonnet | 8 | 8 | $0.152 ±0.046 | $0.152 | $0.000 | 0 | 18.9 | 280852 | 4740 | 32 | 0 | 0 | 0 | - |
| rules | haiku | 8 | 8 | $0.021 ±0.003 | $0.021 | $0.000 | 0 | 27.1 | 767959 | 13242 | 65 | 0 | 0 | 1 | - |
| rules | sonnet | 8 | 8 | $0.177 ±0.030 | $0.177 | $0.000 | 0 | 22.3 | 305350 | 5392 | 35 | 0 | 0 | 0 | - |

## Against the baseline arm

- haiku: generated vs prose_buried: total cost -$0.006 (-23%)
- haiku: prose_loaded vs prose_buried: total cost -$0.002 (-9%), inside the spread
- haiku: rules vs prose_buried: total cost -$0.005 (-20%)
- sonnet: generated vs prose_buried: total cost -$0.011 (-5%), inside the spread
- sonnet: prose_loaded vs prose_buried: total cost -$0.043 (-22%), inside the spread
- sonnet: rules vs prose_buried: total cost -$0.018 (-9%), inside the spread
