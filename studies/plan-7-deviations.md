# Plan 7: deviations from the registered plan

The registered plan is [plan-7.md](plan-7.md), registered on OSF on 2026-11-22 (https://osf.io/6v8yx, embargoed).
That file stays as registered; every change is listed here, with its date, its reason, and what was known when it was made.

## D1 (2026-11-22): a sensitivity analysis without linter errors

- Found: after the 128 runs and the registered analysis (`bench/plan7.mjs`), before verify and before any hand label.
- What: in two prose runs (`prose-sonnet-T4-4`, `prose-sonnet-T4-6`) the only finding after the task is not a study rule but an ESLint parse error: the agent had written `export class Bitwardenimplements INodeType` (a missing space), and the review fix corrected it.
  The registered analysis counts every checker finding, so it counts these two runs as violating.
- Decision: the registered analysis of H16 stays as it is (prose 31/64, rules 0/64, p < 0.001).
  A sensitivity analysis counts only findings of the six study rules: prose 29/64, rules 0/64, p < 0.001.
  The conclusion does not change.
- Why: a syntax error is not a break of a written rule; Plan 6 also left such linter errors out of its measurement checks.

## Verify of the pilot

The pilot verify (not analysed) was stopped after the first four runs, one per task, when the plan was registered; all four passed the type check and the tests.
This is not a deviation from the plan, which does not analyse the pilot.
