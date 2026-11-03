# jhipster-clock-authorities

Repo: https://github.com/jhipster/jhipster-sample-app.git @ 6b000b5, baseline arm: prose_linked.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| prose_linked | sonnet | 8 | 8 | $0.134 ±0.036 | $0.134 | $0.000 | 0 | 16.9 | 263696 | 4158 | 28 | 0 | 0 | 0 | - | build 8/8, tests 8/8 |
| prose_loaded | sonnet | 8 | 8 | $0.135 ±0.042 | $0.135 | $0.000 | 0 | 15.4 | 255588 | 4269 | 29 | 0 | 0 | 0 | - | build 8/8, tests 8/8 |
| rules | sonnet | 8 | 8 | $0.136 ±0.033 | $0.136 | $0.000 | 0 | 14.9 | 244259 | 3666 | 26 | 0 | 0 | 0 | - | build 8/8, tests 8/8 |

## Against the baseline arm

- sonnet: prose_loaded vs prose_linked: total cost +$0.001 (1%), inside the spread
- sonnet: rules vs prose_linked: total cost +$0.002 (1%), inside the spread
