# rule_only against rules_control

Stratified by study x model. Breaks are runs with a production-code break after the task, before any review fix; cost is total cost per run including the fix (rule_only / rules_control).

## Pooled

- Runs broken: rule_only 0/48, rules_control 0/48; exact CMH, one-sided (rule_only breaks more): p = 1.000.
- Cost: +13% (95% stratified bootstrap interval +3% to +24%).

## Per stratum

| study | model | rule_only broken | rules_control broken | Fisher p (one-sided) | cost change | 95% interval |
|---|---|---|---|---|---|---|
| jhipster-buried | sonnet | 0/8 | 0/8 | 1.000 | +21% | +7% to +38% |
| jhipster-buried | haiku | 0/8 | 0/8 | 1.000 | +10% | -14% to +46% |
| fastapi-crud-status | sonnet | 0/8 | 0/8 | 1.000 | +2% | -22% to +34% |
| fastapi-crud-status | haiku | 0/8 | 0/8 | 1.000 | +2% | -21% to +33% |
| bulletproof-notify-querykey | sonnet | 0/8 | 0/8 | 1.000 | +34% | +11% to +65% |
| bulletproof-notify-querykey | haiku | 0/8 | 0/8 | 1.000 | +11% | -5% to +30% |

## Secondary (descriptive)

| arm | runs | design-rule loop catches | mean turns | runs broken at the end | verify: production code passes | exact 95% interval |
|---|---|---|---|---|---|---|
| rule_only | 48 | 115 | 20.5 | 0 | 48/48 | 93-100% |
| rules_control | 48 | 45 | 19.8 | 0 | 47/48 | 89-100% |
