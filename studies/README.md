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
| `models` | Claude Code model aliases (`sonnet`, `haiku`, `opus`), or agent specs such as `{ "id": "qwen36", "agent": "pi", "model": "ollama/qwen3.6:35b-a3b-coding" }` (optional `baseUrl`, `timeoutSec`, and `maxTurns` to override the study's cap for that model); the `id` is the model's name in run ids and summaries |
| `repeats`, `maxTurns`, `allowedTools` | defaults 4, 30, and read/edit tools plus `git status`, `git diff`, `ls` |
| `eval` | checkers run on changed files after each session, in ESLint, ast-grep or Ruff JSON format; `{files}` is replaced by the changed files, `{study}` by the study folder |
| `fix.prompt` | the review feedback for fix sessions |
| `build` | optional command run in the copy after each run |
| `verify` | optional checks that the final code works, run by `verify` after the runs: `steps` (each `name`, `command`, optional `cwd`, `timeoutSec`, `retries`, `setup`), `exclude` (patch paths left out, default `*.md` and `.claude/*`) and `keep` (ignored paths kept between runs, such as installed dependencies) |

## Good practice

- **Neutral prompts**: describe the task only. "Follow the project's conventions" sends every arm to the docs and hides the difference.
- **Same checkers for every arm**, kept in the study folder, not in the copies, so no arm is measured with its own rules.
- **Arms differ in one thing** where possible; a second difference makes the result hard to read.
- **Fresh copies of the same kind** for every arm: an earlier study found a cost difference that came from a differently prepared copy, not from the setup under test.
- **At least 8 runs per arm and model**; the spread between runs of the same setup is large.
- **Verify on the plain upstream code**: `verify` applies each run's patch to a clean checkout of the pinned commit, without any arm's setup, so every arm's code is built and tested the same way. Give test steps `retries` and read `flaky` in the summary: a suite that fails under load must not count against the agent. A step with `"setup": true` prepares the environment; when it fails, `verify` stops instead of blaming the run.
- **Other agents** (`"agent": "pi"` or `"codex"`): each arm gets a copy per agent (`<arm>.pi`, `<arm>.codex`), and setup scripts see `BENCH_AGENT`, so a file that only one agent loads by itself can be placed for each. Both pi and Codex load the root `AGENTS.md`, skip a `CLAUDE.md` next to it and never load a subfolder `CLAUDE.md` or `AGENTS.md` (tested by capturing their model requests), so a folder pointer reaches only Claude Code. Agents on local models run one copy at a time.
  - pi: an isolated config folder with only the model's provider, no personal extensions, skills or context files, no shell; the codemyrules loop through `bench/agents/pi-loop.mjs`.
  - Codex: an isolated `CODEX_HOME` with only the provider and the bench hooks (`bench/agents/codex-hook.mjs`), workspace-write sandbox. With a local model Codex has no `apply_patch` tool and edits through its shell, so the hook lints every file whose content changed after each tool call; the guard is not ported, and Codex has a shell the other agents do not, which a study must report. Turns are tool calls plus the final answer.
- Check `run --dry-run` first: it lists every session and the number still to run.
