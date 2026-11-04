# Local agents: qwen3.6 in pi and Codex

Exploratory, not part of the pre-stated plans: the same bulletproof study (bulletproof-notify-querykey), run with a local model in two other harnesses.

## Setup

- Model: `qwen3.6:35b-a3b-coding` (Q4_K_M) on Ollama, 262k context, on one laptop.
- Harnesses: pi (`qwen36`) and the Codex CLI (`qwen36codex`), each with an isolated config holding only the model's provider.
- Arms: `prose_buried`, `prose_loaded` and `rules`, set up as for Claude Code, 8 runs each (2 tasks x 4), 48 runs in all.
- Always-loaded prose goes into the root `AGENTS.md`, the only instruction file pi and Codex load by themselves.
  The folder pointer of `prose_buried` and `rules` stays as it is, so in these harnesses it is never loaded: the agent sees the rules only if it opens the docs.
- The codemyrules loop runs in pi through an extension (guard, lint after each edit, lint before stopping) and in Codex through its hooks (lint after each tool call, lint before stopping, no guard).
- Codex with a local model has no `apply_patch` and edits through its shell; pi gets no shell.
- Turn cap 60 per session, against 30 for Claude Code: at 30, 4 of the first 5 qwen runs hit the cap (kept apart in `bulletproof-notify-querykey/results-maxturns30/`).
  No run hit the 60-turn cap.
- Local models report no cost, so tokens stand in for it.

## Results

Runs broken: runs with a production-code break of a study rule after the task, before any review fix.

| harness | arm | runs broken | Fisher p against rules (one-sided) | broken at the end | loop catches | mean turns | mean input tokens | verify: production code passes |
|---|---|---|---|---|---|---|---|---|
| pi | prose_buried | 8/8 | <0.001 | 3 | 0 | 68.8 | 1,056,912 | 5/8 |
| pi | prose_loaded | 8/8 | <0.001 | 3 | 0 | 65.0 | 834,979 | 3/8 |
| pi | rules | 0/8 | | 0 | 7 | 36.9 | 450,835 | 4/8 |
| Codex | prose_buried | 8/8 | <0.001 | 2 | 0 | 45.5 | 452,726 | 7/8 |
| Codex | prose_loaded | 3/8 | 0.285 | 0 | 0 | 32.3 | 253,729 | 4/8 |
| Codex | rules | 1/8 | | 0 | 10 | 34.1 | 351,312 | 7/8 |

Loop catches count only design-shaping rules.
Turns and tokens include the review-fix session.

## What it shows

- Buried prose fails in both harnesses: every run broke a rule, almost all by importing across features (`no-restricted-imports`), the rule bulletproof states only in its docs.
- With rules and the loop, pi broke none and Codex one (fixed in review); the loop caught 7 and 10 design-rule breaks while the agent worked.
- Always-loaded prose depends on the harness: in pi it did not help at all (8/8), in Codex it cut breaks to 3/8, all on T1, and was the cheapest arm.
  Both copies have the same `AGENTS.md`, so the difference is in how the harness presents it or how the model acts in each harness, not in the text.
- In pi the rules arm needed about half the turns and input tokens of the prose arms; only the prose arms needed review-fix sessions (8 of 8 runs each, none in rules).
- Verify pass rates are low and noisy for both harnesses (3/8 to 7/8), mostly type errors; the arms do not differ in a consistent direction, so the rule setup does not explain them.

## Limits

- One model, one study, 8 runs per cell; a local quantized model is far weaker than the Claude models, so this shows the harnesses and setups, not local models in general.
- The pointer is never loaded by pi or Codex, so `prose_buried` here means docs the agent has to find by itself.
- Codex has a shell and no guard, pi has neither a shell nor bash-based search; the two harnesses are not one setup with two models.
- Codex counts turns as tool calls plus the final answer, pi as model turns; the turn columns compare arms within a harness, not across harnesses.
- One pi run (`prose_loaded-qwen36-T1-4`) spanned a laptop sleep; its time excludes the 1092 s asleep.

## How to reproduce

```bash
S=studies/bulletproof-notify-querykey/study.json
node bench/bench.mjs run $S --arms prose_buried,prose_loaded,rules --models qwen36,qwen36codex
node bench/bench.mjs verify $S --arms prose_buried,prose_loaded,rules
for m in qwen36 qwen36codex; do for a in prose_buried prose_loaded; do
  node bench/bench.mjs compare $S --arm $a --against rules --models $m
done; done
```
