# jhipster-buried

Follow-up to [jhipster-clock-authorities](../jhipster-clock-authorities/README.md), where a one-sentence link to a two-rule doc was followed in every run.
This study tests the realistic case: the same two rules are single bullets in the middle of long linked docs.

Same repo, commit, tasks, rules, checkers and fix prompt as the first study.

## Arms

- `prose_buried` (baseline): `CLAUDE.md` gives a short overview and links to 8 docs (architecture, backend, API, persistence, security, testing, frontend, workflow; about 5,000 tokens in all).
  The clock rule is one bullet in the middle of the services section of `docs/backend.md`, the authorities rule one bullet in the middle of the authorization section of `docs/security.md`.
- `rules`: the identical docs without those two bullets, plus the ast-grep rules, the codemyrules feedback loop, and a one-line pointer for the clock rule in `src/main/java/CLAUDE.md`.
- `generated`: what codemyrules built on its own from the `prose_buried` state ([skill-eval run 96a98b7](../../skill-eval/results-96a98b7/SCORE.md)), applied by [arms/generated.sh](arms/generated.sh): 28 ast-grep and 5 ESLint rules (both study rules in the suggestions layer), the slimmed docs, its pointer file `src/main/java/CLAUDE.md` and its feedback loop.
  It answers whether installing the skill gives the result of the hand-written rules.

Both arms build their docs from [arms/files](arms/files/) with [arms/docs.sh](arms/docs.sh), so the docs differ only in the two bullets.

## Models

Sonnet and Haiku, 2 tasks x 4 repeats each: 32 runs.
Haiku shows whether a smaller model drops buried prose sooner.

## Result (2026-11-01)

| arm | model | runs broken after task | of those in production code | fix rounds | loop catches (main / test) | total cost per run | turns |
|---|---|---|---|---|---|---|---|
| prose_buried | sonnet | 3 of 8 | 0 | 3 | - | $0.282 ±0.124 | 24.5 |
| rules | sonnet | 0 of 8 | 0 | 0 | 7 / 20 | $0.235 ±0.066 (-17%) | 22.8 |
| prose_buried | haiku | 6 of 8 | 3 (clock) | 6 | - | $0.031 ±0.012 | 31.0 |
| rules | haiku | 0 of 8 | 0 | 0 | 0 / 15 | $0.023 ±0.004 (-26%) | 26.0 |

All runs ended with 0 breaks; cost differences are inside the spread.
Production versus test split for prose_buried comes from the fix sessions' own reports, because this run recorded only the final breaks per rule (fixed in the harness since).

## Reading

- **Scope mismatch, a flaw in this study:** the docs say the backend conventions apply to `src/main/java`, but the checkers and the loop apply both rules to tests too.
  Most prose_buried "breaks" (all of Sonnet's) are `Instant.now()` or `"ROLE_ADMIN"` in new integration tests, which the docs never asked about.
  Most rules-arm loop catches are in tests as well.
- **Production code, the fair comparison:** Sonnet followed the buried prose in all 8 runs; Haiku broke the buried clock rule in 3 of 8.
  With rules + pointer, Haiku never wrote a clockless `now()` in production code; Sonnet did in 3 runs and the loop caught each one before the turn ended.
- So the pointer alone is not the guarantee; the loop is.
- Cost: rules + loop was cheaper for both models (-17% Sonnet, -26% Haiku), mostly from avoided fix rounds, but inside the spread.

## Next

Decide whether the rules cover tests, make docs and checkers agree, and rerun.

## Generated arm (codemyrules' own output)

0 of 16 runs broke a rule in production code.
The 2 Haiku runs counted as broken wrote a clockless `now()` in `OperationResourceIT.java`, a test the skill's `gen-clock-now` does not cover (scoped to `service/**`, where the doc line sits).
The loop caught `gen-clock-now` 5 times (Haiku), fixed in the same turn.
Cost per run against `rules`: Haiku +3%, Sonnet -34%; Sonnet wrote tests in 0 of 8 runs against 4 of 8, so part of that is less work (-18% on runs without tests).
