# jhipster-buried

Repo: https://github.com/jhipster/jhipster-sample-app.git @ 6b000b5, baseline arm: prose_buried.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | builds |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| prose_buried | haiku | 8 | 8 | $0.031 ±0.012 | $0.023 | $0.009 | 6 | 31.0 | 975315 | 17878 | 85 | 6 | 0 | 0 | - |
| prose_buried | sonnet | 8 | 8 | $0.282 ±0.124 | $0.227 | $0.055 | 3 | 24.5 | 534657 | 8225 | 56 | 3 | 0 | 0 | - |
| rules | haiku | 8 | 8 | $0.023 ±0.004 | $0.023 | $0.000 | 0 | 26.0 | 822525 | 13920 | 66 | 0 | 0 | 15 | - |
| rules | sonnet | 8 | 8 | $0.235 ±0.066 | $0.235 | $0.000 | 0 | 22.8 | 496043 | 7250 | 53 | 0 | 0 | 27 | - |

## Against the baseline arm

- haiku: rules vs prose_buried: total cost -$0.008 (-26%), inside the spread
- sonnet: rules vs prose_buried: total cost -$0.047 (-17%), inside the spread
