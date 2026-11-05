# bulletproof-business-context: forty conventions in a realistic CLAUDE.md, and the context tax

Confirmatory, Plan 5 in [analysis-plan.md](../analysis-plan.md), written before the runs.
The three arms of [bulletproof-40-rules](../bulletproof-40-rules/README.md), built by the same script, with every arm's always-loaded `CLAUDE.md` also holding [context.md](context.md): 1,328 words of business context (product, roles, domain, screens, API, commands, workflow, known issues, roadmap) and no conventions.

| arm | `CLAUDE.md` | lint rules + loop |
|---|---|---|
| `none` | short header and business context, 1,379 words | no |
| `prose` | the same plus the 40 prose lines, 2,085 words | no |
| `rules` | as `none` | the 40 rules, and 8 pointers in `src/features/CLAUDE.md` |

Tasks: T1 to T4 of the 40-rules study, which need the conventions (4 repeats), and C1 to C4, outside the scope of all 40 conventions (8 repeats): a question, an end-to-end test, the Vite config and the Playwright config.
Sonnet and Haiku: 288 runs, all ok; `none-sonnet-T4-4` was rerun because its first review fix hit the usage limit.
The 40 prose lines add 1.9k tokens to the first model request of every session (median 23.1k against 21.2k in `none` and `rules`), measured from the session transcripts.

## Results

Broken: a production-code break of any of the 40 conventions after the task, before any review fix.
Cost: total per run including the review fix.

| comparison | tasks | runs broken | cost change | 95% interval |
|---|---|---|---|---|
| `prose` against `rules` (H9, H10) | T1-T4 | 4/32 against 0/32, p = 0.056 | -3% | -12% to +8%, p = 0.691 |
| `prose` against `rules` (H11) | C1-C4 | 0/64 against 0/64 | +3% | -19% to +29%, p = 0.402 |
| `none` against `prose` (descriptive) | T1-T4 | 32/32 against 4/32, p < 0.001 | +40% | +26% to +56% |
| `prose` against `none` (descriptive) | C1-C4 | 0/64 against 0/64 | +3% | -17% to +30% |
| `rules` against `none` (descriptive) | C1-C4 | 0/64 against 0/64 | +1% | -20% to +27% |

- H9, H10 and H11 are not supported; with Holm's correction the smallest p, 0.056 for H9, would have needed to be below 0.017.
- With the conventions among business context, prose still prevented most breaks: 4 of 32 runs broke one, against 3 of 32 in the 40-rules study, where the same lines stood alone.
  The breaks moved: here they were role checks, role strings and an ownership check, all in T2 (3 Sonnet, 1 Haiku); there it was the success notification.
- Lint rules prevented all of them: in 14 of 32 runs the agent wrote a break, the loop caught it (56 catches, 42 of them role strings), and the agent fixed it in the same session.
- Without the conventions every run broke at least one, and the review fix made a run cost 40% more.
- Manipulation check on C1-C4: no break, no loop catch, and no run changed `src/`.
- Verify: production code passes the original test suite in 280 of 288 runs (`none` 91, `prose` 94, `rules` 95 of 96); all 8 failures are type errors in the role select of T2, as in the 40-rules study.

### The context tax is below the noise

- On C1-C4 the cost is set by the prompt cache, not by the arm: the first session of each task writes about 20k tokens to the cache and costs about 5 times more (Sonnet C3: $0.09 to $0.10, against $0.016 to $0.019 for the next 7, in every arm).
- With the cache warm, a Sonnet session on C1-C4 cost $0.041 with the prose against $0.039 without (+4%), Haiku $0.0047 against $0.0044.
  The derived price of 1.9k always-loaded tokens over about 5 turns is of the same size, about $0.003 for Sonnet ([context-cost.md](../context-cost.md)).
- So at this size the always-loaded conventions cost a few percent of a short session, too little to detect with 64 runs per arm.

### Exploratory, not planned: Plans 4 and 5 pooled

- Prose broke a convention in 7 of 64 runs over both studies, lint rules in none (exact CMH over study and model, p = 0.007); cost -1% (-8% to +7%).
- The pooling was chosen after seeing both results, so it points to a confirmatory study; it is not a tested result.

## Limits

- The business context is written by the experimenter for a demo app, at one size; a real file may be longer, and older.
- 32 runs per arm on T1-T4: H9 could detect only a large difference.
- Sessions of an arm run back to back with identical prompts, so the cache is warmer than in a working day where prompts differ; the always-loaded prefix is cached either way.

## How to reproduce

```bash
S=studies/bulletproof-business-context/study.json
node bench/bench.mjs run $S --models sonnet,haiku
node bench/bench.mjs verify $S
node bench/bench.mjs compare $S --arm prose --against rules --models sonnet,haiku --tasks T1,T2,T3,T4   # H9, H10
node bench/bench.mjs compare $S --arm prose --against rules --models sonnet,haiku --tasks C1,C2,C3,C4   # H11
node bench/bench.mjs compare $S --arm none --against prose --models sonnet,haiku --tasks T1,T2,T3,T4    # descriptive
node bench/bench.mjs compare studies/bulletproof-40-rules/study.json $S --arm prose --against rules --models sonnet,haiku --tasks T1,T2,T3,T4   # exploratory pool
```
