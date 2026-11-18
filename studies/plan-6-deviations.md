# Plan 6: deviations from the registered plan

The registered plan is [plan-6.md](plan-6.md), registered on OSF on 2026-11-15 (https://osf.io/9hdjs, embargoed).
That file stays as registered; every change is listed here, with its date, its reason, and what was known when it was made.

## D1 (2026-11-15): exploratory runs with Claude Opus 5.5 and Claude Fable 5.2

- What: both projects, both arms, all 4 tasks, 2 repeats, with `claude-opus-5-5` and `claude-fable-5-2` in Claude Code (`study.latest.json` in each study, 32 runs per project).
- Why: the primary models are Claude Sonnet 5.5 and Claude Haiku 5.5 (every run recorded these ids); readers will ask whether the result holds for the newest larger models.
- Status: exploratory and descriptive only. These runs are not part of H12 to H15 and change no registered test. With 2 repeats per cell they cannot support a test; they are reported per model as counts.
- Known when added: all 256 primary Claude runs were done, and a first descriptive look at them had been made.
- Cost estimate (from the Sonnet 5.5 runs and the price per token: Opus 5.5 about 2 times, Fable 5.2 about 4 times Sonnet 5.5): Opus 5.5 about $27, Fable 5.2 about $55, both projects.
- Done for Fable 5.2 (2026-11-16): bulletproof 2 repeats (16 runs); Formbricks 1 repeat (8 runs). Fable 5.2 was included in the Pro plan only until 17 Nov, and the usage limits of both accounts left no room for a second Formbricks repeat (a Formbricks run cost $3.30 to $5.50 with Fable). `formbricks-conventions/study.latest.json` was set to 1 repeat before its fifth run.
- Opus 5.5 (2026-11-17): 2 repeats in both projects as planned; `formbricks-conventions/study.latest.json` was set back to 2 repeats before the first Opus run (runs with `--models opus55`, so no Fable run was added).

## D4 (2026-11-16): turn cap of the local model on Formbricks raised from 60 to 120

- What: `maxTurns` of `qwen36codex` in `formbricks-conventions/study.json` is 120 instead of 60; the 60-minute time limit is unchanged.
- Why: in the Formbricks Qwen pilot (8 runs, 15 to 16 Nov, in `results-pilot/`) 6 of 8 task sessions reached 60 turns; Codex counts each tool call as a turn, and the prose runs that were not capped needed about 110. With 60, most results would measure the cap.
- When: after that pilot and before any Formbricks Qwen run of the main study, as `plan-6.md` allows ("if it changes the local model's turn cap or time limit, the change is listed under Deviations before those runs start").
- Known when changed: the pilot, the 64 bulletproof Qwen runs (cap 60, 1 capped), and the Claude runs. Bulletproof keeps 60 for the local model.

## D2 (found 2026-11-15, decided 2026-11-18): a checker false positive in bulletproof T4

- Found: after the 128 bulletproof Claude runs, before any Formbricks or local model run.
- What: `role-checks-through-authorization` flags role filter code that the task asks for (for example `user.role !== role` in a users filter). That is filtering, not an access check.
  Almost all violations in bulletproof are this pattern: prose 16 of 18 findings, rules 16 of 17; T1 to T3 have no violation in either arm.
- Decision: the registered analysis of H12 runs unchanged, with these findings counted as violations.
  A sensitivity analysis repeats H12 without the findings that the hand labels mark as false positives.
- Labels: the registered measurement checks (40 diffs per project, every loop finding of the `rules` arm), plus every T4 finding of both arms, labelled with the arm hidden.
  The labels decide what is a false positive, not the author's reading of the rule.
- The rule is not changed for this study; a fix goes to codemyrules and is reported as such.
- Reported with it: in every `rules` run of T4 the loop reported the finding and the agent kept the code (`ignoredCatches`), as the loop text allows for cases it thinks legitimate.
- Expected consequence, stated before the analysis: without the false positives bulletproof may have no violation in either arm, so H12 would rest mostly on Formbricks.
- Known when decided: all runs of both projects and their verify outcomes; no test of H12 to H15 had been run.

## D3 (found 2026-11-15, decided 2026-11-18): prose location per convention in Formbricks

- What: the plan keeps the maintainers' files unchanged but does not say which of them Claude Code loads. F1 and F4 are in `AGENTS.md`, which `CLAUDE.md` imports (always loaded); F2 and F3 are in `CODING_STANDARDS.md`, which `AGENTS.md` only mentions (not loaded unless the agent opens it).
- Decision: the prose stays where the maintainers put it; the registered analysis is unchanged.
  The Formbricks results are also reported per convention with its prose location (always loaded or not loaded), descriptive only, with exact 95% intervals and no test.
- Mechanism check (exploratory): from the session logs, whether each `prose` run opened `CODING_STANDARDS.md`, and the F2 and F3 violation rates of the runs that did and did not.
  This includes the D1 runs (Opus 5.5 and Fable 5.2), reported separately.
- Known when decided: all runs of both projects and their verify outcomes; no test of H12 to H15 had been run.

## D5 (found 2026-11-17, decided 2026-11-18): project tests that the task itself breaks

- Found: during verify. Bulletproof T2: `discussions.test.tsx` finds table rows by their full accessible name, so any run that adds the columns T2 asks for fails it (Sonnet 0 of 8 in both arms).
  Formbricks T1: `api-keys.test.ts` asserts the exact Prisma `select`, so adding `lastUsedAt`, which T1 asks for, fails it.
- Decision: H15 is reported as registered.
  A sensitivity analysis reports the verify pass rate again without the project tests that a minimal correct solution of the task also fails.
- Criterion, fixed before the sensitivity analysis: for each task, a minimal correct solution is written by hand and verified in the same container; a project test file that fails on it is left out for that task in every run of both arms.
  Only that test file is left out; the type check and all other tests still count.
- Known when decided: all runs of both projects and their verify outcomes, including which tests failed; no test of H12 to H15 had been run.
