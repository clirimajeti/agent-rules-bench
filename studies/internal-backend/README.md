# Internal backend study (aggregate results only)

Six rounds on an internal Kotlin/Spring codebase, one small module (36 Kotlin files) whose existing code already broke the tested rule.
The code, prompts and raw results stay internal; these are the aggregate numbers.

Rules tested: a design-shaping one (time through an injected `Clock`) and a mechanical one (log messages start lowercase).
Sessions: headless Claude Code, project settings only, Sonnet and Haiku, max 30 turns, 124 sessions in total.

| Round | Comparison | Result |
|---|---|---|
| 1 | hinted prompts ("follow the ADRs") | no difference; the hint sent every arm to the docs (confounded) |
| 2 | prose in a linked file vs rule only (hooks, no prose) | rule broken in 8 of 8 (Sonnet) and 5 of 8 (Haiku) runs vs 0; rule only cost about 2x (Sonnet) from rework |
| 3 | rule + one-line folder pointer; three sessions in a row | 0 breaks, hook catches 25 -> 2, cost about 20% below rule only; linked prose repeated the break in every follow-up session |
| 4 | total cost: linked prose + review fix vs rule + pointer | $0.289 vs $0.225 per case (-22%), turns -32%, time -29%, builds 7/8 vs 8/8 |
| 5 | same prose linked vs always loaded (+6,500 tokens) | always loaded: 1 of 8 broken vs 7 of 8; about $0.009 per 1,000 always-loaded tokens per Sonnet session |
| 6 | always-loaded prose vs codemyrules end state, same batch, fresh identical copies | 0 vs 0 breaks; $0.164 vs $0.174 per session (+6%, inside the spread) |

Conclusion: a rule plus a one-line pointer is always correct; it saves cost where the prose would be missed and is cost-neutral where the prose is always loaded.
Limits: one module, two rules, 8-12 runs per setup, an idealised review.
