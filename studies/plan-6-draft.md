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
| F1 | design-shaping | "Server actions are legacy, do not add new ones. New backend work belongs in an `/api/v3` route consumed from the client with TanStack Query" (AGENTS.md) | 59 files with `"use server"`, 110 client components that call actions |
| F2 | mechanical | "React component props use `Readonly<>`." (CODING_STANDARDS.md, "Conventions Awaiting Automated Enforcement") | about 122 components without, 640 with |
| F3 | mechanical | "All user-facing dates and times must use shared formatting helpers instead of ad hoc `date-fns`, `Intl`, or `toLocale*` calls in components." (CODING_STANDARDS.md) | 16 component files |
| F4 | mechanical | "Only ever add or edit strings in `en-US.json`." (AGENTS.md) | none (a pure instruction) |

To check before registration: the counts above are rough `git grep` counts; each checker must be run on the pinned commit and its false positives read by hand.

## Arms

- `prose`: the project's instruction files hold the conventions as prose (bulletproof: the 40 lines in a short `CLAUDE.md`, as in Plan 4; formbricks: its own `AGENTS.md`, `CLAUDE.md` and `CODING_STANDARDS.md` unchanged).
- `rules`: the same files without the convention lines; each convention is a lint rule with the in-session feedback loop, and each design-shaping convention has a one-line pointer.
  In formbricks the lines are removed from `AGENTS.md` and `CODING_STANDARDS.md` and nothing else changes.

Open choice for the user: `rules` could keep the prose and add the lint rules (additive, what a team would do), instead of replacing it (what the earlier plans did).
Replacing tests "where should the rule live"; adding tests "does a lint rule help on top of prose".

## Design

- Models, primary: Claude Code with `sonnet` and `haiku`; the resolved model ids are recorded per run.
- Model, secondary: `qwen3.6:35b-a3b` in Codex with the same loop (second model family; violations and turns only, no cost).
- Tasks: 4 feature tasks per project; prompts describe only the feature.
  Formbricks tasks are placed where the legacy pattern is next to the code (for example account notification and profile settings, which still use server actions).
- Runs, primary: 2 projects x 2 models x 4 tasks x 8 repeats = 64 per arm per project, 128 per arm, 256 in all.
- Runs, secondary: 2 projects x 4 tasks x 4 repeats = 32 per arm, 64 in all.
- Order: `"seed"` in each study.json (value fixed in this plan), so the arms interleave in time.
- Turn cap: 30 (bulletproof, as before); formbricks: 60, fixed after a pilot of 4 runs per arm that is not analysed.
- Sessions that fail (usage limit, crash) are run again by the harness; no other run is excluded or repeated.
- Safety: install, build and verify run in a container (`node:24-bookworm`) without the user's credentials; install uses the frozen lockfile and `--ignore-scripts`.

## Sample size

With a one-sided exact test at alpha 0.05, 128 runs per arm give 80% power if prose is violated in 8% of runs and lint rules in 1%, and 90% power for 11% against 1%.
The rate of 8% is below the pooled 7 of 64 (11%) of Plans 4 and 5, to allow for a smaller effect on new tasks.

## Outcomes

- Primary 1: violating run (at least one checker finding on an added line in production code after the task session, before any review fix).
- Primary 2: total cost per run (task plus review fix), from Claude Code.
- Secondary: violations per run, loop catches, turns, tokens, verify outcome, violations left at the end.

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
