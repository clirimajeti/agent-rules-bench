# Writing a study

A study answers one comparison on one repository.
Copy [`_template/`](_template/) to `studies/<name>/` and fill it in.

## study.json

```json
{
  "name": "petclinic-clock",
  "description": "Clock injection: linked prose vs rule + pointer",
  "repo": { "source": "https://github.com/<owner>/<repo>.git", "commit": "<sha or tag>" },
  "tasks": [{ "id": "T1", "prompt": "Describe the task only, with no hint about the rule. Do not run the build." }],
  "arms": [
    { "id": "prose", "setup": "arms/prose.sh", "fix": true },
    { "id": "rules", "setup": "arms/rules.sh" }
  ],
  "baselineArm": "prose",
  "models": ["sonnet"],
  "repeats": 4,
  "maxTurns": 30,
  "eval": [
    { "name": "rules", "format": "ast-grep", "command": ["npx", "-y", "-p", "@ast-grep/cli@0.51.0", "ast-grep", "scan", "-c", "{study}/sgconfig.yml", "--json=compact", "{files}"], "extensions": [".java"] }
  ],
  "fix": { "prompt": "Code review feedback on your uncommitted change: ... Fix it." },
  "build": { "command": ["./mvnw", "-q", "-o", "compile"], "timeoutSec": 600 }
}
```

| Key | Meaning |
|---|---|
| `name` | lowercase letters, digits and `-`; also the default workdir name |
| `repo.source` | git URL or local path; `repo.commit` pins the starting point for every copy |
| `workdir` | optional; where the copies go, default `~/.cache/agent-rules-bench/workdirs/<name>` (or `$BENCH_WORKDIRS/<name>`); never below a folder with its own `CLAUDE.md`, which every session would load, so `prepare` and `run` refuse that |
| `tasks` | the prompts; ids use letters, digits or `_` |
| `arms` | one copy each; `setup` is a script run inside the fresh copy (env: `BENCH_COPY`, `BENCH_STUDY_DIR`, `BENCH_ARM`), `fix: true` gives runs that broke a rule one review-fix session |
| `baselineArm` | the arm others are compared with; default the first |
| `models` | Claude Code model aliases (`sonnet`, `haiku`, `opus`) |
| `repeats`, `maxTurns`, `allowedTools` | defaults 4, 30, and read/edit tools plus `git status`, `git diff`, `ls` |
| `eval` | checkers run on changed files after each session, in ESLint, ast-grep or Ruff JSON format; `{files}` is replaced by the changed files, `{study}` by the study folder |
| `fix.prompt` | the review feedback for fix sessions |
| `build` | optional command run in the copy after each run |

## Good practice

- **Neutral prompts**: describe the task only. "Follow the project's conventions" sends every arm to the docs and hides the difference.
- **Same checkers for every arm**, kept in the study folder, not in the copies, so no arm is measured with its own rules.
- **Arms differ in one thing** where possible; a second difference makes the result hard to read.
- **Fresh copies of the same kind** for every arm: an earlier study found a cost difference that came from a differently prepared copy, not from the setup under test.
- **At least 8 runs per arm and model**; the spread between runs of the same setup is large.
- Check `run --dry-run` first: it lists every session and the number still to run.
