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

## D2 (2026-11-22): verify setup no longer builds the package that the run changed

- Found: during verify, after 28 of 128 runs, before any hand label.
- What: the setup step built every workspace package that `n8n` (cli) and `n8n-nodes-base` depend on, and `n8n` depends on `n8n-nodes-base`.
  So for a run that changed nodes-base (T3, T4), setup also compiled the agent's code.
  In `prose-haiku-T4-5` that code does not compile (an import of `@n8n/utils`, which is not a dependency of nodes-base), setup failed, and the harness stopped the whole verify, as it does for every setup failure.
- Decision: a run that changed nodes-base builds only what nodes-base depends on; a run that changed cli builds what cli and nodes-base depend on, as before (`verify.sh`).
  Setup still builds the agent's changes to other packages (T1 and T2 runs also change `@n8n/api-types` and `@n8n/db`); no run changed both cli and nodes-base.
  The typecheck and test steps are unchanged, so such a run now counts as a verify failure.
- Two earlier attempts were dropped: leaving nodes-base out of the build filter (turbo still built it, as a dependency of another package), and setting the run's cli and nodes-base changes aside with `git stash` (twice, in `prose-haiku-T4-5` and `prose-sonnet-T3-8`, the stash could not be put back because of a git index lock in the checkout that the container mounts, and verify stopped).
  The runs verified with either version passed setup and are not verified again: setup prepares the environment, and the type check and tests saw the same code.

## D3 (2026-11-22): a build failure in a package that the run changed fails the run's typecheck

- Found: during verify, after 75 of 128 runs, before any hand label.
- What: setup builds the agent's changes to other packages (D2).
  In `rules-haiku-T2-4` the agent's migration in `@n8n/db` does not compile (`Expected 3 arguments, but got 2`), setup failed, and the harness stopped the whole verify.
- Decision: when the build fails and the run changed a package outside cli and nodes-base, setup records it and the typecheck step of that run fails (`verify.sh`); the tests are then skipped, as for every typecheck failure.
  A build failure in a run that changed no other package still stops the verify, so a failure of the environment is not counted against a run.
- No run verified before this change had a setup failure, so none is verified again.

## Verify of the pilot

The pilot verify (not analysed) was stopped after the first four runs, one per task, when the plan was registered; all four passed the type check and the tests.
This is not a deviation from the plan, which does not analyse the pilot.
