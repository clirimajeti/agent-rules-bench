# pointer_only against rules_control

Stratified by study x model. Breaks are runs with a production-code break after the task, before any review fix; cost is total cost per run including the fix (pointer_only / rules_control).

## Pooled

- Runs broken: pointer_only 8/48, rules_control 0/48; exact CMH, one-sided (pointer_only breaks more): p = 0.001.
- Cost: +12% (95% stratified bootstrap interval +0% to +24%).

## Per stratum

| study | model | pointer_only broken | rules_control broken | Fisher p (one-sided) | cost change | 95% interval |
|---|---|---|---|---|---|---|
| jhipster-buried | sonnet | 0/8 | 0/8 | 1.000 | +46% | +7% to +88% |
| jhipster-buried | haiku | 0/8 | 0/8 | 1.000 | -17% | -42% to +17% |
| fastapi-crud-status | sonnet | 4/8 | 0/8 | 0.038 | +30% | +4% to +65% |
| fastapi-crud-status | haiku | 4/8 | 0/8 | 0.038 | +6% | -22% to +40% |
| bulletproof-notify-querykey | sonnet | 0/8 | 0/8 | 1.000 | +19% | -2% to +48% |
| bulletproof-notify-querykey | haiku | 0/8 | 0/8 | 1.000 | -2% | -19% to +17% |

## Secondary (descriptive)

| arm | runs | design-rule loop catches | mean turns | runs broken at the end | verify: production code passes | exact 95% interval |
|---|---|---|---|---|---|---|
| pointer_only | 48 | 0 | 19.4 | 0 | 47/48 | 89-100% |
| rules_control | 48 | 45 | 19.8 | 0 | 47/48 | 89-100% |
