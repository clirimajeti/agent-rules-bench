# Pooled results

Rules side: the "generated" arm.

Rules + pointer + loop against prose, total cost per run including review fixes. Ratio = rules / prose; 95% bootstrap interval; first-draft breaks are runs with a rule broken after the task, before any review.

## Pooled

| against | model | comparisons | cost change | 95% interval | prose: runs broken | rules: runs broken |
|---|---|---|---|---|---|---|
| prose the agent can miss (linked or buried) | haiku | 3 | -36% | -45% to -24% | 13/24 | 2/24 |
| prose the agent can miss (linked or buried) | sonnet | 3 | -38% | -47% to -26% | 4/24 | 0/24 |
| prose the agent can miss (linked or buried) | all | 6 | -37% | -44% to -29% | 17/48 | 2/48 |
| always-loaded prose | haiku | 2 | -31% | -42% to -18% | 0/16 | 0/16 |
| always-loaded prose | sonnet | 1 | +21% | -1% to +50% | 0/8 | 0/8 |
| always-loaded prose | all | 3 | -17% | -27% to -5% | 0/24 | 0/24 |

Excluded from pooling: fastapi-crud-status/sonnet/prose_loaded.

## Per comparison

| study | model | prose arm | cost change | 95% interval | prose broken | rules broken |
|---|---|---|---|---|---|---|
| jhipster-buried | haiku | prose_buried | -24% | -42% to +8% | 6/8 | 2/8 |
| jhipster-buried | sonnet | prose_buried | -45% | -60% to -21% | 3/8 | 0/8 |
| fastapi-crud-status | haiku | prose_buried | -56% | -68% to -39% | 2/8 | 0/8 |
| fastapi-crud-status | haiku | prose_loaded | -43% | -56% to -25% | 0/8 | 0/8 |
| fastapi-crud-status | sonnet | prose_buried | -55% | -66% to -38% | 0/8 | 0/8 |
| fastapi-crud-status | sonnet | prose_loaded | -28% | -48% to 0% | 0/8 | 0/8 |
| bulletproof-notify-querykey | haiku | prose_buried | -23% | -36% to -6% | 5/8 | 0/8 |
| bulletproof-notify-querykey | haiku | prose_loaded | -16% | -30% to +4% | 0/8 | 0/8 |
| bulletproof-notify-querykey | sonnet | prose_buried | -5% | -25% to +19% | 1/8 | 0/8 |
| bulletproof-notify-querykey | sonnet | prose_loaded | +21% | -1% to +50% | 0/8 | 0/8 |
