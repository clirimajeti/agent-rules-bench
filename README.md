# agent-rules-bench

A benchmark for one question: **where should a coding rule live so an AI coding agent follows it, and what does that cost?**

A team can state a rule like "inject a `Clock`, never call `now()` directly" in several places:
- as text in a separate doc that `CLAUDE.md` links to, which the agent reads only if it follows the link: either a short doc of its own (`prose_linked`) or one bullet among thousands of tokens of other conventions (`prose_buried`),
- as text in `CLAUDE.md` itself, which Claude Code loads into every session (`prose_loaded`),
- as a lint rule (ESLint for TypeScript, ast-grep for Java and Python) that a feedback loop runs on every edit, telling the agent when it breaks the rule (`rule_only`),
- as that lint rule plus a one-line pointer in a folder `CLAUDE.md` naming it (`rules`, the setup [codemyrules](https://github.com/clirimajeti/codemyrules) builds).

agent-rules-bench runs the same coding tasks as headless Claude Code sessions against identical copies of a repository, one copy per setup ("arm"), and measures for each run:
- whether the code the agent added breaks the rules,
- the cost, tokens, turns and time,
- the cost of a review-fix round when the agent broke a rule,
- how often a feedback loop had to step in,
- whether the result builds.

The harness is generic: an arm is just a setup script, so it compares any two or more agent setups on any repo.
It was built to test the claims behind [codemyrules](https://github.com/clirimajeti/codemyrules), which turns a project's conventions into lint rules and slims its agent docs.

## Results so far

Public data: 344 runs (377 headless sessions, counting review fixes) on three open-source projects in Java, Python and TypeScript; every setup, prompt, session, diff and log is in `studies/`.
200 runs are exploratory (four studies), 144 confirmatory (an ablation with an [analysis plan](studies/analysis-plan.md) committed before its runs).
An internal Kotlin/Spring pilot (124 sessions, aggregate numbers only, see [studies/internal-backend](studies/internal-backend/README.md)) shaped the design and is not part of any pooled number.

Exploratory, pooled over the 152 runs that compare text with the lint rule + pointer + loop ([studies/pooled.md](studies/pooled.md)):
- **When the convention is written somewhere the agent can miss** (a doc linked from `CLAUDE.md`, or one bullet in long docs), the agent broke it in 17 of 56 runs.
  As a lint rule checked on every edit, it was broken in none, and the work cost **14% less (95% interval 5% to 22% less)**, because no run needed a review round to fix a break.
- **When the convention is written in `CLAUDE.md` itself**, the agent followed it in all 32 runs, just as it did with the lint rule, and both cost the same (0%, interval 11% less to 12% more).
  The lint rule's advantage there comes from outside these tasks: `CLAUDE.md` is loaded into every session, so every line in it costs tokens on every task, relevant or not.
  What happens when the always-loaded file grows is the confirmatory study below.
- Rule as a short doc with one clear link from `CLAUDE.md`: followed in every run, at equal cost ([jhipster-clock-authorities](studies/jhipster-clock-authorities/README.md)).
  So text fails when it is buried among other text, not because it is text.

Confirmatory ablation, 144 runs ([studies/ablation.md](studies/ablation.md)):
- Without the feedback loop, 8/48 runs broke a rule against 0/48 (exact CMH p = 0.001); all 8 were a mechanical rule that no prose stated.
  Design-shaping rules with their one-line pointer alone were broken in 0 of 48 runs.
- Without the pointer, runs cost 13% more (+3% to +24%): the loop caught the design-shaping rule 115 times against 45, so the agent got there through rework.

Confirmatory, all docs always loaded, 64 runs ([studies/bulletproof-large-context](studies/bulletproof-large-context/README.md)):
- With the project's `AGENTS.md` and all its guides in `CLAUDE.md` (15.7k tokens in every session), a run cost **20% more than with lint rules (95% interval 1% to 42% more, p = 0.016)**.
- Rule breaks: 3/16 with the large file, all Haiku, against 0/16 with lint rules (p = 0.100, not significant at 16 runs per arm).
  The same rule sentence held in a short `CLAUDE.md` (0/16), so it is the file's size that let it slip.

Functional correctness, all 344 runs (`bench.mjs verify`: each final diff built and tested on the plain upstream commit):
- Production code passes the project's original test suite in 340 of 344 runs; the setups do not differ, and the 4 failures are Haiku type and compile errors unrelated to the rules.

Local model in other harnesses, exploratory, 48 runs: qwen3.6 in pi and Codex on the bulletproof study ([studies/local-agents.md](studies/local-agents.md)):
- With the rule only in the docs, every run broke it in both harnesses (16/16); with lint rules and the loop, 1 of 16 did.
- The same text always loaded in `AGENTS.md` did not help in pi (8/8 broken) and helped partly in Codex (3/8).

## How it works

```bash
node bench/bench.mjs prepare   studies/<study>/study.json [--arms a,b]   # one fresh copy per arm, at the pinned commit
node bench/bench.mjs run       studies/<study>/study.json [--arms a,b] [--models m,n]   # all sessions, resumable; prints the summary
node bench/bench.mjs verify    studies/<study>/study.json   # build and test each run's final code; resumable
node bench/bench.mjs summarize studies/<study>/study.json   # summary.md and runs.csv from the results
```

1. **prepare** clones the repo once per arm into the study's workdir, at the pinned commit, removes the remote, runs the arm's setup script, commits the result and tags it `bench-base`.
   It never touches the source repo and refuses a workdir inside it.
   The workdir defaults to `~/.cache/agent-rules-bench/workdirs/<study>` (or `$BENCH_WORKDIRS`), outside any project: Claude Code loads every `CLAUDE.md` in the folders above a session, so `prepare` and `run` refuse a workdir below one.
2. **run** resets each copy to `bench-base` before every session and runs `claude -p` with project settings only (no personal hooks or plugins), the study's model, turn cap and allowed tools, and no terminal input.
   Arms run in parallel, sessions within an arm one after another.
   After each session it counts rule breaks on the lines the agent added, using the study's checkers.
   For arms with `"fix": true`, a run that broke a rule gets one more session with the study's review feedback.
   An optional build command runs at the end.
   Each run writes `results/<arm>-<model>-<task>-<rep>/result.json`; finished runs are skipped when you run again, and failed ones (for example on a usage limit) are run again.
3. **verify** checks that the code works, independently of the rule checkers: it applies each run's `diff.patch` to a clean checkout of the pinned commit, without any arm's setup or docs, and runs the study's `verify` steps (for example build and tests).
   A test step can be retried; a pass on a retry is recorded as flaky.
   Each run gets a `verify.json` and one log per step.
4. **summarize** reports mean and spread per arm and model: total cost split into draft and fix, turns, tokens, time, runs broken after the task and at the end, feedback-loop catches, builds, verify pass rates, and each arm against the baseline arm.

Use `run --dry-run` to see the planned sessions before spending anything, and `run --arms a,b` to run only some arms.

`pool` combines several studies: for each prose arm against the `rules` arm it reports the cost ratio with a 95% bootstrap interval, and a pooled geometric mean per kind of prose (arms named `prose_*loaded*` are always-loaded, other `prose_*` arms are prose the agent can miss).

## A study

A study is a folder under `studies/` with a `study.json`, one setup script per arm, and the rule files its checkers use.
See [studies/README.md](studies/README.md) and the [template](studies/_template/).

## Requirements and cost

- Node 22+ and git; no dependencies.
- Claude Code (`claude`) logged in; each session is billed like any other Claude Code use.
- Optional, for local models: [pi](https://github.com/earendil-works/pi-coding-agent) or the [Codex CLI](https://github.com/openai/codex), and a model server such as Ollama; a study names them in `models` (see [studies/README.md](studies/README.md)). The feedback loop runs in pi through an extension and in Codex through its hooks, both calling the same codemyrules scripts as the Claude Code hooks.
  Headless sessions use the subscription's usage window faster than interactive ones, so budget for that.
- `npm test` runs the harness against a fake `claude` and costs nothing.

## Related work

Practitioners argue that rules belong in tooling rather than prose, without controlled data:
- Evil Martians, [Stop writing rules in AGENTS.md: use agent hooks and nano-staged instead](https://evilmartians.com/chronicles/stop-writing-rules-in-agents-md-use-agent-hooks-and-nano-staged-instead): move rules into linters and a Claude Code `Stop` hook; its numbers are about tool speed only.

Research on agent context files, without rules or hooks:
- [Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?](https://arxiv.org/abs/2602.11988): context files barely change success and cost 20% and more.
- [Do Context Files Help Coding Agents? A Two-Agent Ablation Study on Real Repositories](https://arxiv.org/abs/2607.27250) ([code](https://github.com/codeprakhar25/context-files-coding-agents)): mainly efficiency effects.
- [Instruction Adherence in Coding Agent Configuration Files: A Factorial Study of Four File-Structure Variables](https://arxiv.org/abs/2605.10039).
- [Agent READMEs: An Empirical Study of Context Files for Agentic Coding](https://arxiv.org/abs/2511.12884).

Related benchmarks and tools:
- [mdarena](https://github.com/HudsonGri/mdarena): benchmarks `CLAUDE.md` variants against a repository's own merged pull requests.
- [claude-code-token-efficiency-benchmark](https://github.com/m-peker/claude-code-token-efficiency-benchmark): 460 headless runs over 16 Claude Code configurations.
- [twaldin/harness](https://github.com/twaldin/harness): a headless execution wrapper for CLI agents.

None of these compares where a rule lives, with rule compliance and fix-round cost as the measures.

## Limits

- Three public projects, seven rules and two tasks per project, with 8 runs per setup and model and a wide spread; the tasks are designed so that copying nearby code breaks a rule, so break rates are an upper bound for everyday work.
- The review-fix round is idealised: one precise prompt, no human time, no CI round trip.
- Rule breaks are counted with the study's own checkers on added lines, so a checker's blind spots are the study's blind spots.
