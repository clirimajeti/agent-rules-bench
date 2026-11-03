# jhipster-buried

Repo: https://github.com/jhipster/jhipster-sample-app.git @ 6b000b5, baseline arm: prose_buried.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| generated | haiku | 8 | 8 | $0.024 ±0.007 | $0.022 | $0.002 | 2 | 26.9 | 707362 | 16432 | 147 | 2 | 0 | 12 | - | build 8/8, tests 8/8 |
| generated | sonnet | 8 | 8 | $0.156 ±0.040 | $0.156 | $0.000 | 0 | 20.8 | 220697 | 5614 | 52 | 0 | 0 | 2 | - | build 8/8, tests 8/8 |
| prose_buried | haiku | 8 | 8 | $0.031 ±0.012 | $0.023 | $0.009 | 6 | 31.0 | 975315 | 17878 | 85 | 6 | 0 | 0 | - | build 8/8, tests 7/8 |
| prose_buried | sonnet | 8 | 8 | $0.282 ±0.124 | $0.227 | $0.055 | 3 | 24.5 | 534657 | 8225 | 56 | 3 | 0 | 0 | - | build 8/8, tests 8/8 |
| rules | haiku | 8 | 8 | $0.023 ±0.004 | $0.023 | $0.000 | 0 | 26.0 | 822525 | 13920 | 66 | 0 | 0 | 15 | - | build 8/8, tests 5/8 |
| rules | sonnet | 8 | 8 | $0.235 ±0.066 | $0.235 | $0.000 | 0 | 22.8 | 496043 | 7250 | 53 | 0 | 0 | 27 | - | build 8/8, tests 8/8 |

## Against the baseline arm

- haiku: generated vs prose_buried: total cost -$0.007 (-24%), inside the spread
- haiku: rules vs prose_buried: total cost -$0.008 (-26%), inside the spread
- sonnet: generated vs prose_buried: total cost -$0.126 (-45%)
- sonnet: rules vs prose_buried: total cost -$0.047 (-17%), inside the spread
