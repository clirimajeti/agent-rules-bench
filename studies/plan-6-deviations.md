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

## D4 (2026-11-16): turn cap of the local model on Formbricks raised from 60 to 120

- What: `maxTurns` of `qwen36codex` in `formbricks-conventions/study.json` is 120 instead of 60; the 60-minute time limit is unchanged.
- Why: in the Formbricks Qwen pilot (8 runs, 15 to 16 Nov, in `results-pilot/`) 6 of 8 task sessions reached 60 turns; Codex counts each tool call as a turn, and the prose runs that were not capped needed about 110. With 60, most results would measure the cap.
- When: after that pilot and before any Formbricks Qwen run of the main study, as `plan-6.md` allows ("if it changes the local model's turn cap or time limit, the change is listed under Deviations before those runs start").
- Known when changed: the pilot, the 64 bulletproof Qwen runs (cap 60, 1 capped), and the Claude runs. Bulletproof keeps 60 for the local model.

## D2 (found 2026-11-15, decision pending): a checker false positive in bulletproof T4

- Found: after the 128 bulletproof Claude runs, before any Formbricks or local model run.
- What: `role-checks-through-authorization` flags role filter code that the task asks for (for example `user.role !== role` in a users filter). That is filtering, not an access check.
  Almost all violations in bulletproof are this pattern: prose 16 of 18 findings, rules 16 of 17; T1 to T3 have no violation in either arm.
- Proposal: run the registered analysis unchanged, and add a sensitivity analysis without the findings that the registered hand labelling (measurement checks) marks as false positives.

## D3 (found 2026-11-15, decision pending): prose location per convention in Formbricks

- What: the plan keeps the maintainers' files unchanged but does not say which of them Claude Code loads. F1 and F4 are in `AGENTS.md`, which `CLAUDE.md` imports (always loaded); F2 and F3 are in `CODING_STANDARDS.md`, which `AGENTS.md` only mentions (not loaded unless the agent opens it).
- Proposal: report the Formbricks results per convention, with the prose location, as a descriptive addition.
