# Analysis plan 7: n8n's own written rules vs the same rules as lint rules

Status: final, for registration on OSF (embargoed) before the first real run.
It is binding from its registration; every later change goes under Deviations with its date and reason.
The pilot (1 run per arm, model and task) ran before this plan was final and is not analysed.

## Question

Plan 6 did not support H12: over two projects, prose was violated in 28 of 128 runs and lint rules in 17 of 128 (p = 0.095 after Holm).
The two projects differed in two ways at once: who wrote the conventions (the author for bulletproof-react, the maintainers for Formbricks) and whether Claude Code reads them (always for bulletproof-react; for Formbricks, two conventions sat in a file that Claude Code does not load).
This plan asks the paper's question in the realistic case on a third project: rules that the maintainers wrote, in the instruction files that the agent reads, against the same rules as lint rules with the feedback loop.

## Project

- `n8n` (`https://github.com/n8n-io/n8n`, TypeScript monorepo) at `c08ba2dd33b2955577971e0e210c77c66ca7bd7e` (`master`, 1 Nov 2026, before the wfx-loot wave).
- n8n keeps its rules in many instruction files: at this commit, 26 `AGENTS.md` and 11 `CLAUDE.md`.
  The root `CLAUDE.md` is `@AGENTS.md`, so Claude Code reads the root `AGENTS.md` in every session; `packages/nodes-base/CLAUDE.md` is `@AGENTS.md`, so Claude Code reads `packages/nodes-base/AGENTS.md` when it works there.
  Checked with Claude Code 2.1.330: a `CLAUDE.md` with `@AGENTS.md` adds the file to the prompt; an `AGENTS.md` without it adds nothing.
- License: n8n is under the Sustainable Use License, except files with `.ee` in a file or folder name (n8n Enterprise License).
  The study is non-commercial research, published free of charge.
  The published diffs are modified n8n code under the Sustainable Use License (not CC BY 4.0), with a copy of the license in the study folder; no task is in an `.ee` area, and no diff that touches an `.ee` path is published (`check-ee.mjs`).

## Conventions (maintainers' words)

Each convention is one bullet of an n8n instruction file, used word for word (the blocks are in `n8n-conventions/plugin/conventions.mjs`).
None of them is enforced by n8n's own linters.
The counts are the checkers' findings in n8n's existing non-test code at the pinned commit (`n8n-conventions/baseline-findings.md`); a hand check of 5 evenly spaced findings per rule found 5 true for five rules; for `no-manager-in-business-logic` the first sample had 2 false (a class's own `this.manager` field, and a `persistence/` folder), the checker was fixed for the first, the second sample had 4 true and 1 false (another `persistence/` folder), and the checker was fixed for that too.

| Id | Kind | Rule (short) | Source | Existing code that breaks it |
|---|---|---|---|---|
| repositories-compose | design-shaping | Repositories compose, they don't extend | root `AGENTS.md` | 155 |
| no-manager-in-business-logic | design-shaping | Transactions in the persistence layer: no `.manager` or `createQueryBuilder(...)` in business logic | root `AGENTS.md` | 92 |
| no-as-cast | mechanical | Avoid type casting with `as` (except in test code) | root and nodes-base `AGENTS.md` | 20,124 |
| shared-helpers | mechanical | Use the shared helpers (such as `isRecord`) instead of hand-rolling them | root `AGENTS.md` | 38 |
| node-errors | mechanical | `NodeOperationError` for user-facing errors, `NodeApiError` for API errors | nodes-base `AGENTS.md` | 58 |
| no-any-in-nodes | mechanical | Never use `any` | nodes-base and root `AGENTS.md` | 897 |

Two more candidates (`packages/frontend/AGENTS.md`: central debounce times, `@/` imports) are not used: n8n wrote them on 19 Nov 2026, after the pinned commit.

## Arms

- `prose`: n8n exactly as its maintainers ship it.
- `rules`: each convention's bullet block is removed from every instruction file that has it (each found once, word for word); each convention becomes a lint rule with the codemyrules feedback loop; each design-shaping convention gets a one-line pointer at the end of the root `AGENTS.md`.
  Nothing else changes.

As in Plan 6, the lint rules replace the prose; they are not added on top of it.
Each lint message is the convention's text, so both arms state each rule in the same words.

## Design

- Models: Claude Code with `sonnet` and `haiku`; the resolved model ids are recorded per run.
- Tasks: 4 feature tasks; prompts describe only the feature and never mention conventions or docs (prompts in `n8n-conventions/study.json`).
  T1: chat hub, delete old conversations with their messages; T2: OAuth clients, valid-token count per client and revoke all tokens of a client (both `packages/cli`, next to legacy repositories); T3: KoBoToolbox node, set the validation status of many submissions; T4: Bitwarden node, resend pending invitations (both `packages/nodes-base`).
  At each task's place four of the six rules apply, and the nearby code already breaks some of them (`n8n-conventions/README.md`).
- Runs: 2 arms x 2 models x 4 tasks x 8 repeats = 128 runs, 64 per arm.
- Order: `"seed": 20261122` in `study.json`, so the arms interleave in time.
- Turn cap: 60.
- Sessions that fail (usage limit, crash) are run again by the harness; a session that reaches its turn cap or time limit is a result and is not run again; no other run is excluded or repeated.
- Install, build and verify run in a container (`node:24-bookworm`, Docker with 24 GB memory, Node heap 16 GB) without the user's credentials; install uses the frozen lockfile and `--ignore-scripts`, and only `sqlite3` runs its install script (the build and the cli tests need its native module).
- Verify: type check of each changed package (`n8n`, `n8n-nodes-base`) and all tests in the module folder of each changed file (cli: `src/modules/<module>`; nodes-base: `nodes/<node>`; any other file: its own folder; `vitest related` was tried first and pulled in most of the cli suite, 20 minutes and more per run), with hook timeout 120 s and test timeout 60 s, since the cli API tests set up a server and database that take longer than Vitest's default 10 s in the container; a failing test step is tried up to 3 times).
  Test files that fail on the unchanged commit (two runs each, of the tests in the four task areas) are listed in `n8n-conventions/baseline-failing-tests.txt` and do not count: one file, `oauth-server/__tests__/test-trigger-resource-lifetime.api.test.ts`.

## Sample size

The author chose 128 runs.
With 64 runs per arm and lint rules violated in 1% of runs, the one-sided exact test at the Holm bar of 0.025 has 26% power if prose is violated in 8% of runs, 53% at 11%, 81% at 15% and 95% at 20%.
A smaller difference may not reach significance; it is then reported as not supported, with every stratum.

## Outcomes

- Primary 1: violating run (at least one checker finding on an added line in production code after the task session, before any review fix).
- Primary 2: total cost per run (task plus review fix), from Claude Code.
- Secondary: violating runs per rule (each rule's source file is in the table above), loop catches, ignored catches (findings the loop reported that the agent left in place), turns, cost without the review fix, verify outcome, violations left at the end.

## Hypotheses and tests

- H16: `prose` has more violating runs than `rules`.
  Exact conditional Cochran-Mantel-Haenszel test, one-sided, stratified by model and task.
- H17: the cost of `rules` is equivalent to the cost of `prose` within a margin of 10%.
  Two one-sided tests: H17 holds if the 90% stratified bootstrap interval of the geometric mean cost ratio (10,000 resamples, fixed seed) lies inside 0.90 to 1.10.
- H16 and H17 are corrected with Holm's method at a family-wise alpha of 0.05.
- H18 (descriptive): verify pass rate per arm with exact 95% intervals, no test.
- The analysis is `node bench/plan7.mjs`, committed before the first real run.

## Measurement checks

- A random sample of 40 diffs, drawn with a fixed seed and shown without the arm, is labelled by hand for each convention; the checkers' precision and recall are reported.
- Every loop finding in the `rules` arm is labelled as correct or false; the false-positive rate is reported.
- The effort of the lint rules is reported per convention: lines of rule code and number of test cases.

## Reporting

- Every stratum is reported, not only the pooled result.
- Cost is reported with and without the review fix.
- Null results are reported in full.

## Pilot (not analysed)

`n8n-conventions/study.pilot.json`: 1 run per arm, model and task (16 runs) on 2026-11-21, results in `n8n-conventions/results-pilot/`.

- All 16 sessions ok; none reached the turn cap of 60.
- Violating after the task: prose 6 of 8 (`no-as-cast` in T3 and T4, `no-manager-in-business-logic` in T1), rules 0 of 8.
- The loop caught a violation in 5 of 8 `rules` runs (11 catches), and the agent fixed every one (no ignored catches).
- T2 gave no violation in either arm; it is kept, since 2 runs per arm say little and T1, a similar backend task, gave violations.
- Cost per run: mean $0.21 (sonnet $0.35, haiku $0.07), max $0.49; the 128 runs come to about $27.
- The first pilot start failed in prepare: n8n also ships opencode setup, so the loop installer asked which agent to set up. `n8n-conventions/arms/rules.sh` now installs it for Claude Code only.

## Deviations

None yet.
