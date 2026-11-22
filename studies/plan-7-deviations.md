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

## D2 (2026-11-22): verify setup builds the workspace without the run's changes to cli and nodes-base

- Found: during verify, after 28 of 128 runs, before any hand label.
- What: the setup step built every workspace package that `n8n` depends on, and `n8n` depends on `n8n-nodes-base`.
  So for a run that changed nodes-base (T3, T4), setup also compiled the agent's code.
  In `prose-haiku-T4-5` that code does not compile (an import of `@n8n/utils`, which is not a dependency of nodes-base), setup failed, and the harness stopped the whole verify, as it does for every setup failure.
- Decision: setup sets the run's changes to `packages/cli` and `packages/nodes-base` aside while it builds and puts them back afterwards (`verify.sh`); the typecheck and test steps of that run see the agent's code, as the plan says, so such a run counts as a verify failure.
  (Leaving nodes-base out of the build filter was tried first and did not work: turbo still built it, as a dependency of another package.)
  The 28 runs verified before are not verified again: each of them passed setup, so the change has no effect on them.
- Why: a setup failure is meant to be a fault of the environment, not of the agent; the registered checks (type check and tests) are unchanged.

## Verify of the pilot

The pilot verify (not analysed) was stopped after the first four runs, one per task, when the plan was registered; all four passed the type check and the tests.
This is not a deviation from the plan, which does not analyse the pilot.
