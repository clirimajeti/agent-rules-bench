# agent-rules-bench

A benchmark for one question: **where should a coding rule live so an AI coding agent follows it, and what does that cost?**

A team can state a rule like "inject a `Clock`, never call `now()` directly" in several places:
- as prose in an instructions file the agent only reads when it follows a link,
- as prose in an always-loaded file (`CLAUDE.md`, `AGENTS.md`),
- as a lint rule the agent learns about only when it breaks it,
- as a lint rule plus a one-line pointer, with a feedback loop that lints every edit.

agent-rules-bench runs the same coding tasks as headless Claude Code sessions against identical copies of a repository, one copy per setup ("arm"), and measures for each run:
- whether the code the agent added breaks the rules,
- the cost, tokens, turns and time,
- the cost of a review-fix round when the agent broke a rule,
- how often a feedback loop had to step in,
- whether the result builds.

The harness is generic: an arm is just a setup script, so it compares any two or more agent setups on any repo.
It was built to test the claims behind [codemyrules](https://github.com/clirimajeti/codemyrules), which turns a project's conventions into lint rules and slims its agent docs.

## Results so far

Six rounds on an internal Kotlin/Spring codebase (124 sessions; aggregate numbers only, see [studies/internal-backend](studies/internal-backend/README.md)):
- Rules + a one-line pointer gave correct code in every run.
- Against prose the agent does not load by default, that was about 22% cheaper in total once the review fix is counted.
- Against prose the agent always loads, it was cost-neutral, adding a guarantee.
- Always-loaded prose costs about $0.009 per 1,000 tokens per Sonnet session.

First public replication on jhipster-sample-app (24 sessions, all raw data, see [studies/jhipster-clock-authorities](studies/jhipster-clock-authorities/README.md)):
- With a short, prominent link to the conventions, every arm followed both rules and costs were equal within 1%.
- So rules + pointer stay cost-neutral when the agent sees the prose, and the internal failures depend on how buried the prose is.

Pooled over the four public studies (152 runs, [studies/pooled.md](studies/pooled.md)):
- Against prose the agent can miss: rules + loop cost **-14% (95% interval -22% to -5%)**, with first drafts broken in 0/56 runs against 17/56.
- Against always-loaded prose: **-0% (-11% to +12%)**, no breaks on either side.

## How it works

```bash
node bench/bench.mjs prepare   studies/<study>/study.json [--arms a,b]   # one fresh copy per arm, at the pinned commit
node bench/bench.mjs run       studies/<study>/study.json   # all sessions, resumable; prints the summary
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
3. **summarize** reports mean and spread per arm and model: total cost split into draft and fix, turns, tokens, time, runs broken after the task and at the end, feedback-loop catches, builds, and each arm against the baseline arm.

Use `run --dry-run` to see the planned sessions before spending anything, and `run --arms a,b` to run only some arms.

`pool` combines several studies: for each prose arm against the `rules` arm it reports the cost ratio with a 95% bootstrap interval, and a pooled geometric mean per kind of prose (arms named `prose_*loaded*` are always-loaded, other `prose_*` arms are prose the agent can miss).

## A study

A study is a folder under `studies/` with a `study.json`, one setup script per arm, and the rule files its checkers use.
See [studies/README.md](studies/README.md) and the [template](studies/_template/).

## Requirements and cost

- Node 22+ and git; no dependencies.
- Claude Code (`claude`) logged in; each session is billed like any other Claude Code use.
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

- Results so far come from one module and two rules, with 8-12 runs per setup and a wide spread.
- The review-fix round is idealised: one precise prompt, no human time, no CI round trip.
- Rule breaks are counted with the study's own checkers on added lines, so a checker's blind spots are the study's blind spots.
