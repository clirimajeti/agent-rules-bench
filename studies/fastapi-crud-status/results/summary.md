# fastapi-crud-status

Repo: https://github.com/fastapi/full-stack-fastapi-template.git @ f4bcfaba7c85be3c6332cc74a20819f586dcdbc6, baseline arm: prose_buried.

| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | builds | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| generated | haiku | 8 | 8 | $0.008 ±0.003 | $0.008 | $0.000 | 0 | 11.9 | 234898 | 5667 | 33 | 0 | 0 | 17 | - | typecheck 8/8, tests 8/8 |
| generated | sonnet | 8 | 8 | $0.073 ±0.023 | $0.073 | $0.000 | 0 | 12.8 | 137941 | 3071 | 31 | 0 | 0 | 23 | - | typecheck 8/8, tests 8/8 |
| pointer_only | haiku | 8 | 8 | $0.011 ±0.004 | $0.008 | $0.002 | 4 | 14.5 | 282963 | 6855 | 38 | 4 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| pointer_only | sonnet | 8 | 8 | $0.101 ±0.025 | $0.079 | $0.021 | 4 | 13.4 | 150131 | 3121 | 27 | 4 | 0 | 0 | - | typecheck 6/8, tests 6/8, code without own tests 8/8 |
| prose_buried | haiku | 8 | 8 | $0.019 ±0.006 | $0.017 | $0.002 | 2 | 22.3 | 723158 | 10825 | 76 | 2 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| prose_buried | sonnet | 8 | 8 | $0.161 ±0.055 | $0.161 | $0.000 | 0 | 15.0 | 363156 | 5222 | 37 | 0 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| prose_loaded | haiku | 8 | 8 | $0.015 ±0.003 | $0.015 | $0.000 | 0 | 16.4 | 557010 | 8918 | 67 | 0 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| prose_loaded | sonnet | 8 | 8 | $0.101 ±0.038 | $0.101 | $0.000 | 0 | 11.5 | 217445 | 2714 | 22 | 0 | 0 | 0 | - | typecheck 8/8, tests 8/8 |
| rule_only | haiku | 8 | 8 | $0.010 ±0.003 | $0.010 | $0.000 | 0 | 14.0 | 335208 | 6748 | 41 | 0 | 0 | 26 | - | typecheck 8/8, tests 8/8, flaky 1 |
| rule_only | sonnet | 8 | 8 | $0.079 ±0.027 | $0.079 | $0.000 | 0 | 13.0 | 164410 | 3118 | 29 | 0 | 0 | 26 | - | typecheck 8/8, tests 8/8 |
| rules | haiku | 8 | 8 | $0.014 ±0.004 | $0.014 | $0.000 | 0 | 17.5 | 568909 | 8179 | 66 | 0 | 0 | 18 | - | typecheck 8/8, tests 8/8 |
| rules | sonnet | 8 | 8 | $0.161 ±0.038 | $0.161 | $0.000 | 0 | 15.1 | 384060 | 5357 | 39 | 0 | 0 | 13 | - | typecheck 8/8, tests 8/8 |
| rules_control | haiku | 8 | 8 | $0.010 ±0.003 | $0.010 | $0.000 | 0 | 14.5 | 299662 | 7095 | 43 | 0 | 0 | 24 | - | typecheck 8/8, tests 8/8, flaky 1 |
| rules_control | sonnet | 8 | 8 | $0.077 ±0.021 | $0.077 | $0.000 | 0 | 12.5 | 143142 | 3194 | 29 | 0 | 0 | 14 | - | typecheck 8/8, tests 8/8, flaky 2 |

## Against the baseline arm

- haiku: generated vs prose_buried: total cost -$0.011 (-56%)
- haiku: pointer_only vs prose_buried: total cost -$0.008 (-44%)
- haiku: prose_loaded vs prose_buried: total cost -$0.004 (-23%), inside the spread
- haiku: rule_only vs prose_buried: total cost -$0.009 (-46%)
- haiku: rules vs prose_buried: total cost -$0.005 (-26%), inside the spread
- haiku: rules_control vs prose_buried: total cost -$0.009 (-47%)
- sonnet: generated vs prose_buried: total cost -$0.088 (-55%)
- sonnet: pointer_only vs prose_buried: total cost -$0.061 (-38%)
- sonnet: prose_loaded vs prose_buried: total cost -$0.060 (-37%)
- sonnet: rule_only vs prose_buried: total cost -$0.082 (-51%)
- sonnet: rules vs prose_buried: total cost +$0.000 (0%), inside the spread
- sonnet: rules_control vs prose_buried: total cost -$0.084 (-52%)
