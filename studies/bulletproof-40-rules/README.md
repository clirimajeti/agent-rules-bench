# bulletproof-40-rules: forty conventions as prose against forty lint rules

Confirmatory, Plan 4 in [analysis-plan.md](../analysis-plan.md), written before the runs.
96 runs, all ok: bulletproof-react `apps/react-vite`, tasks T1 to T4, Sonnet and Haiku, 4 repeats.

## Arms

The 40 conventions are one list, [plugin/conventions.mjs](plugin/conventions.mjs).
Each has one prose line, which is also its lint message and the words of the review fix, so both sides state a convention with the same weight.

| arm | always-loaded `CLAUDE.md` | lint rules + loop |
|---|---|---|
| `none` | short, links the project's `AGENTS.md` and docs | no |
| `prose` | `none` plus the 40 prose lines (757 words) | no |
| `rules` | as `none`, plus one pointer line per design-shaping convention (8) in `src/features/CLAUDE.md` | the 40 rules |

The 40 prose lines add 1.9k tokens to the first model request of every session (median 20.6k against 18.7k in `none` and `rules`), measured from the session transcripts.

## Results

Broken: a production-code break of any of the 40 conventions after the task, before any review fix.
Cost: total per run including the review fix.

| comparison | runs broken | cost change | 95% interval |
|---|---|---|---|
| `prose` against `rules` (H7, H8) | 3/32 against 0/32, p = 0.121 | +1% | -9% to +13%, p = 0.428 |
| `none` against `prose` (descriptive) | 32/32 against 3/32, p < 0.001 | +35% | +21% to +50% |
| `none` against `rules` (descriptive, not planned) | 32/32 against 0/32, p < 0.001 | +36% | +24% to +49% |

- H7 and H8 are not supported: with the 40 conventions in a short always-loaded file, prose and lint rules prevented breaks about equally and cost the same.
  With Holm's correction neither p is below the first threshold of 0.025.
- Stating the conventions mattered, either way: without them every run broke at least one, and the review fix made a run cost about 35% more.
- Only 4 of the 40 conventions were ever broken; the agent followed the other 36 in every arm, by copying the code around it.

Breaks after the task, per convention:

| convention | `none` | `prose` | `rules`, loop catches |
|---|---|---|---|
| `notifications-in-mutation-hook` | 32 | 3 | 8 |
| `roles-from-enum` | 22 | 0 | 29 |
| `ui-form-controls` | 8 | 0 | 3 |
| `role-checks-through-authorization` | 1 | 0 | 0 |
| `ownership-through-policies` | 0 | 0 | 2 |

- In `rules` the agent wrote a break in 13 of 32 runs (42 loop catches) and fixed all of them before the session ended, so no run needed a review fix.
  In `prose` the agent wrote fewer breaks, and 3 runs (2 Haiku, 1 Sonnet) kept one.
- Turns: `none` 30.7 per run including the fix, `prose` 20.5, `rules` 20.2.
- Verify: production code passes the original test suite in 89 of 96 runs (`none` 29, `prose` 30, `rules` 30); all 7 failures are type errors in the role-select change handler of T2, 6 of them Haiku.

## What this adds to the other studies

- When a convention sits where the agent reads it in every session and the file is short, prose works about as well as a lint rule, at equal weight.
- Prose stops costing the same when the file grows ([bulletproof-large-context](../bulletproof-large-context/README.md): +20%) or the agent can miss the text ([pooled](../pooled.md): -14% for lint rules).
- The 1.9k tokens of the 40 prose lines are paid in every session, also by tasks that touch none of the conventions; these tasks touched several, so this study does not measure that cost.

## Limits

- 32 runs per arm: H7 could detect only a large difference, and its null result is not evidence of equal compliance.
- Only 4 conventions were ever at risk in these tasks, so the comparison of prose and rules rests on those 4.
- One project, one set of conventions written by the experimenter from the project's docs and code; T4 was written for this study.

## How to reproduce

```bash
S=studies/bulletproof-40-rules/study.json
node --test studies/bulletproof-40-rules/plugin/   # the 40 rules against their examples
node bench/bench.mjs run $S --models sonnet,haiku
node bench/bench.mjs verify $S
node bench/bench.mjs compare $S --arm prose --against rules --models sonnet,haiku   # H7, H8
node bench/bench.mjs compare $S --arm none --against prose --models sonnet,haiku    # descriptive
node bench/bench.mjs compare $S --arm none --against rules --models sonnet,haiku    # descriptive
```
