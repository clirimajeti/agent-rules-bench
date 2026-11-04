# Analysis plan: ablation of pointer and feedback loop

This plan is committed before any of the runs it covers.
The studies before it (jhipster-clock-authorities, jhipster-buried, fastapi-crud-status, bulletproof-notify-querykey, arms `prose_*`, `rules` and `generated`) are exploratory.
The runs below are confirmatory; any change to this plan after the first run is listed under Deviations with its date.

## Question

The `rules` setup changes three things against prose: a lint rule, a one-line pointer for the design-shaping rule, and a feedback loop that lints every edit.
Which part does what?

## Arms

All three are built by the study's `arms/rules.sh` and differ in one thing each:

- `rules_control`: the full setup, the same as `rules`, run in the same batch as the ablations (no comparison with the earlier `rules` runs, which used an older codemyrules).
- `rule_only`: no pointer line; rules and feedback loop as in `rules_control`.
- `pointer_only`: no feedback loop (hooks not installed); the same pointer text as `rules_control`, word for word.

## Design

- Studies: jhipster-buried, fastapi-crud-status, bulletproof-notify-querykey, at their pinned commits, with their existing tasks, checkers and review-fix prompts.
- Models: `sonnet` and `haiku`; the resolved model ids are taken from the session JSON.
- 2 tasks x 4 repeats = 8 runs per arm, model and study; 48 runs per arm, 144 in all.
- Copies prepared fresh with codemyrules at commit 1e6fa0d; arms run in parallel in one batch.
- Sessions that fail (`ok: false`, for example on a usage limit) are run again, as the harness does; no other run is excluded or repeated.

## Outcomes

A break is a finding of the study's checkers on an added line in production code, that is, in a file that does not match the study's `verify.testFiles`.

- Primary 1 (the loop): the share of runs with a break when the task session ends, before any review fix.
- Primary 2 (the pointer): total cost per run, task plus review fix, as reported by Claude Code (`total_cost_usd`).
- Secondary: loop catches of the design-shaping rule (from `failures.log`), turns, runs with a break left at the end, and the verify outcome (production code passes the project's original suite).

## Hypotheses and tests

- H1: `pointer_only` has more runs with a break than `rules_control`.
  Test: one-sided Cochran-Mantel-Haenszel test over the 6 study x model strata, at alpha 0.05; Fisher's exact test per stratum is reported as well.
- H2: `rule_only` costs more per run than `rules_control`.
  Test: geometric mean of the per-stratum cost ratios with a 95% stratified bootstrap interval (10,000 resamples, fixed seed); H2 holds if the interval lies above 1.
- H3 (no direction): the verify outcome does not differ between the three arms; reported per arm with exact 95% intervals, no test.

The two primary hypotheses are tested separately, each at 0.05, without correction; everything else is descriptive.

## Reporting

- Every stratum is reported, not only the pooled result.
- Runs that did less work (for example wrote no tests, as in F7) stay in the primary analysis; a split by "wrote tests" is reported as exploratory.

## How to reproduce

```bash
S=(studies/jhipster-buried/study.json studies/fastapi-crud-status/study.json studies/bulletproof-notify-querykey/study.json)
node bench/bench.mjs compare "${S[@]}" --arm pointer_only --against rules_control --out studies/ablation-loop.md     # H1, H3
node bench/bench.mjs compare "${S[@]}" --arm rule_only --against rules_control --out studies/ablation-pointer.md     # H2, H3
```

`bench/compare.mjs` implements the tests; `bench/test/compare.test.mjs` checks them against hand-computed values.

## Deviations

- 2026-11-04, clarifications, no change of substance: the CMH test is the exact conditional version (the per-stratum hypergeometric distributions convolved, one-sided), which suits the small counts and the zero cells expected in `rules_control`; the bootstrap per stratum resamples runs within each arm; design-shaping rules are listed per study in `designRules` (use-clock-injection, db-access-in-crud, no-restricted-imports).
- 2026-11-04, timing: the analysis code was written and committed while the runs were in progress (101 of 144 had results). It was checked only on the exploratory arms (`prose_buried` against `rules`); no output for the three ablation arms was looked at before this commit.
- 2026-11-04, after the runs: the reproduce snippet used an unquoted string, which zsh does not split into words; it now uses an array. No change to the analysis.
- 2026-11-04, runs: 17 bulletproof Haiku sessions ended with `is_error` after a usage limit (most after one turn) and were rerun, as the Design section provides.

# Plan 2: missed rules across sessions (F6) and a stronger model (F3)

Written before any of these runs, under the same rules as the plan above.

## F6: does a missed rule compound across sessions?

- Study `bulletproof-sequence`: tasks T1, T2, T3 in a row on the same copy (`"sequence": true`), each session building on the code of the earlier ones, no review fix in between.
- Arms `prose_buried` and `rules`, set up exactly as in bulletproof-notify-querykey; Sonnet and Haiku; 4 chains per arm and model: 48 runs.
- Outcome: a production-code break of a study rule in the lines a session added (the harness counts only those, since each session's result is committed).
- H4: in sessions T2 and T3, `prose_buried` has more runs with a break than `rules`. Test: exact one-sided CMH over the model strata, alpha 0.05.
- Descriptive: within `prose_buried`, the share of T2 and T3 runs with a break after a chain whose earlier session broke the rule, against after one that did not.
  This is the compounding itself, but with 8 chains per model it is reported, not tested.

## F3: does a stronger model follow buried prose?

- Study bulletproof-notify-querykey, model `opus` added, arms `prose_buried` and `rules` only: 8 runs per arm, 16 in all.
- No hypothesis test: the question is where Opus falls against Sonnet (1/8) and Haiku (5/8) on buried prose, reported with exact 95% intervals.
- Cost is reported as in the other studies, `rules` against `prose_buried`.
- Both Opus copies are prepared fresh with codemyrules 1e6fa0d; their trees are identical to those of the sequence study, so Opus is compared only within its own stratum.

## How to reproduce

```bash
node bench/bench.mjs compare studies/bulletproof-sequence/study.json --arm prose_buried --against rules --tasks T2,T3   # H4
node bench/bench.mjs compare studies/bulletproof-notify-querykey/study.json --arm prose_buried --against rules   # F3, opus stratum
```
