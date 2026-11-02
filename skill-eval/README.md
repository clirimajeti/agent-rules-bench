# skill-eval: does codemyrules build the rules itself?

The studies compare where a rule lives, with rules written by hand.
This evaluates the tool: given a project whose docs state its conventions, does codemyrules find them, build correct rules, slim the docs and set up the loop?

## Setup

One fresh copy per public project, in the state of its study's `prose_buried` arm, so the two known rules are stated in the project's docs ([expected.json](expected.json)).
The three skills (codemyrules, eslint-pattern-rules, backend-pattern-rules) are copied into the copy's `.claude/skills/`; their commits are in `.claude/skills/VERSIONS`.

The skill asks before every write, and a headless session cannot answer, so [prompt.md](prompt.md) gives the user's answers in advance: pick every convention the docs state, approve the writes, do not run the full build.
The session may use Bash (scans, rule tests, dependency installs), so it runs only in these isolated copies.

```bash
node skill-eval/eval.mjs prepare            # copies under ~/.cache/agent-rules-bench/workdirs/skill-eval/<target>/skill
node skill-eval/eval.mjs run [--model opus]  # one session per target not yet done (default sonnet)
node skill-eval/eval.mjs run --resume       # continue sessions that failed (for example on a usage limit)
node skill-eval/eval.mjs status
```

A fresh run resets its copy first; `--resume` keeps the copy as it is and continues the failed session (`claude -p --resume`), keeping earlier attempts as `session.1.json`, ... so their cost counts. Each run writes `results/<target>/`: `session.json`, `changes.patch` (everything it added or changed, without the copied skills), `claude/` (the git-excluded loop files and settings) and `codemyrules-report.md`.

## Scoring

Against [expected.json](expected.json), per target:
- **Found**: is each known rule among the candidates, and built?
- **Correct**: existing hits against the known counts; every extra hit checked by hand as a true or false positive; the rule's own tests pass when rerun.
- **Docs**: the doc lines the built rules cover deleted or shortened, a pointer kept only for design-shaping rules, tokens removed (always-loaded and on-demand apart).
- **Loop**: installed and catching a known break.
- **Extra candidates**: what else it proposed, and whether those are real conventions.
- **Cost**: the session's cost, turns and time.

A later step can run the bench tasks against what codemyrules built (an arm that applies `changes.patch` and `claude/`), to compare it with the hand-written rules arm.
