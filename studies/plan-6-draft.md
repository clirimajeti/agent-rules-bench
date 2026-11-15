# Analysis plan 6 (DRAFT, not registered): conventions as always-loaded prose vs lint rules, two projects, two model families

Status: draft for review.
It becomes binding when it is committed and registered on OSF (embargoed) before the first run; every later change goes under Deviations with its date.

## Question

Plans 4 and 5 compared 40 conventions as short always-loaded prose with the same conventions as lint rules on one project, and each was even; pooled post hoc, prose was violated in 7 of 64 runs and lint rules in none.
This plan tests that pooled result as a confirmatory hypothesis, on two projects, with conventions that the project maintainers wrote, and with a second model family.

## Projects

- `bulletproof-react` at the pinned commit of Plans 4 and 5, with the 40 conventions of Plan 4 (written by the author).
- `formbricks` at `fa289168d43699043e8e4016c3aa38bc3109f865` (31 Oct 2026, before the wfx-loot wave), with conventions taken word for word from its `AGENTS.md` and `CODING_STANDARDS.md` (written by the maintainers).
  Only conventions that its own ESLint config does not enforce are used.

### Formbricks conventions (maintainers' words)

| Id | Kind | Text (source) | Existing code that violates it |
|---|---|---|---|
| F1 | design-shaping | "Server actions are legacy — do not add new ones. New backend work belongs in an `/api/v3` route consumed from the client with TanStack Query, ..." (AGENTS.md) | 57 files with `"use server"` (checker), 110 client components that call actions |
| F2 | mechanical | "React component props use `Readonly<>`." (CODING_STANDARDS.md, "Conventions Awaiting Automated Enforcement") | 383 components without (checker), 640 with |
| F3 | mechanical | "All user-facing dates and times must use shared formatting helpers instead of ad hoc `date-fns`, `Intl`, or `toLocale*` calls in components." (CODING_STANDARDS.md) | 1 component (checker); the other grep hits are numbers (`toLocaleString`) or type names |
| F4 | mechanical | "Only ever add or edit strings in `en-US.json`." (AGENTS.md) | none (a pure instruction) |

The checkers are in `formbricks-conventions/` (ESLint 9.17.0, one local rule per convention, examples tested); the counts above are their findings on the pinned commit.
A hand check of 8 evenly spaced `readonly-props` findings found 8 true positives; the full precision check is part of the measurement checks below.
`toLocaleString` is not checked, because on numbers it is not a date.

## Arms

- `prose`: the project's instruction files hold the conventions as prose (bulletproof: the 40 lines in a short `CLAUDE.md`, as in Plan 4; formbricks: its own `AGENTS.md`, `CLAUDE.md` and `CODING_STANDARDS.md` unchanged).
- `rules`: the same files without the convention lines; each convention is a lint rule with the in-session feedback loop, and each design-shaping convention has a one-line pointer.
  In formbricks the lines are removed from `AGENTS.md` and `CODING_STANDARDS.md` and nothing else changes.

The lint rules replace the prose; they are not added on top of it (decided 2026-11-14).
This keeps the question of the paper, "where should the rule live", and keeps the arms comparable with Plans 1 to 5.

## Design

- Models, primary: Claude Code with `sonnet` and `haiku`; the resolved model ids are recorded per run.
- Model, secondary: `qwen3.6:35b-a3b` in Codex with the same loop (second model family; violations and turns only, no cost).
- Tasks: 4 feature tasks per project; prompts describe only the feature and never mention conventions.
  Formbricks (prompts in `formbricks-conventions/study.json`): T1 API keys (last used, rotate), T2 webhooks (created date, duplicate), T3 profile (account activity, download my data), T4 tags (created date, delete unused tags).
  T1 to T3 sit next to legacy server actions; T4 sits next to the new API v3 pattern, as a contrast.
  bulletproof-react (prompts in `bulletproof-conventions/study.json`, none used in Plans 4 and 5): T1 admins pin discussions, T2 comment count and last comment date in the discussions list, T3 change password on the profile page, T4 admins filter, search and export the users list as CSV.
- Runs, primary: 2 projects x 2 models x 4 tasks x 8 repeats = 64 per arm per project, 128 per arm, 256 in all.
- Runs, secondary: 2 projects x 4 tasks x 8 repeats = 64 per arm, 128 in all (the local model costs nothing, only time).
- Order: `"seed": 20261114` in each study.json, so the arms interleave in time; `run --dry-run` prints the order.
- Turn cap: 30 (bulletproof, as before); formbricks: 60. Each project had a pilot of 1 run per arm, model and task, which is not analysed (`results-pilot/`).
  The local model gets 60 on both projects: in the bulletproof pilot it reached 30 turns in 5 of 8 runs.
- Time limit per session of the local model: 30 minutes (bulletproof) and 60 minutes (formbricks); a normal session takes a few minutes. A session that reaches it (a runaway reply; seen once in the bulletproof pilot: 86,000 tokens in one reply) is killed and counts as capped, like a session that runs out of turns: it is a result, and it is not run again.
- Sessions that fail (usage limit, crash) are run again by the harness; no other run is excluded or repeated.
- Safety: install, build and verify run in a container (`node:24-bookworm`) without the user's credentials; install uses the frozen lockfile and `--ignore-scripts`.
- Verify (bulletproof): type check of `apps/react-vite` and the full Vitest suite (all 21 tests pass on the unchanged commit).
- Verify (formbricks): type check of `apps/web` and the unit tests related to the changed files (`vitest related`); the test files that fail on the unchanged commit are excluded and listed in `formbricks-conventions/baseline-failing-tests.txt`.

## Sample size

With a one-sided exact test at alpha 0.05, 128 runs per arm give 80% power if prose is violated in 8% of runs and lint rules in 1%, and 90% power for 11% against 1%.
The rate of 8% is below the pooled 7 of 64 (11%) of Plans 4 and 5, to allow for a smaller effect on new tasks.

## Outcomes

- Primary 1: violating run (at least one checker finding on an added line in production code after the task session, before any review fix).
- Primary 2: total cost per run (task plus review fix), from Claude Code.
- Secondary: violations per run, loop catches, turns, tokens, verify outcome, violations left at the end.
- Secondary (`rules` arm): ignored catches, the violations left after the task session whose rule and file the loop had reported during that session (`ignoredCatches` in each result). It separates "the loop did not see it" from "the agent saw it and left it". Reported per model with exact 95% intervals, no test. In the bulletproof pilot all 4 `rules` runs with a violation after the task were of this kind.
- Secondary (verify): a failing test file that the run changed nothing in, while the run changed the code it tests, is reported as "existing test not updated" (3 of 16 runs in the Formbricks pilot; T2 of bulletproof changes the rows that `discussions.test.tsx` finds by their full text).

## Hypotheses and tests

- H12: `prose` has more violating runs than `rules`.
  Exact conditional Cochran-Mantel-Haenszel test, one-sided, stratified by project and model.
- H13: the cost of `rules` is equivalent to the cost of `prose` within a margin of 10%.
  Two one-sided tests: H13 holds if the 90% stratified bootstrap interval of the geometric mean cost ratio (10,000 resamples, fixed seed) lies inside 0.90 to 1.10.
- H12 and H13 are corrected with Holm's method at a family-wise alpha of 0.05.
- H14 (secondary): the same comparison as H12 for the local model in Codex, exact Fisher test, reported separately and not part of the family.
- H15 (descriptive): verify pass rate per arm with exact 95% intervals, no test.

## Measurement checks

- A random sample of 40 diffs per project, drawn with a fixed seed and shown without the arm, is labelled by hand for each convention; the checkers' precision and recall are reported.
- Every loop finding (`failures.log`) in the `rules` arm is labelled as correct or false; the false-positive rate is reported.
- The time to write and test each lint rule is recorded.

## Reporting

- Every stratum is reported, not only the pooled result.
- Cost is reported with and without the review fix.
- Null results are reported in full.

## Deviations

None yet.
