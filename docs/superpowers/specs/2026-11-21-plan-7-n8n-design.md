# Plan 7 design: written rules in many instruction files vs coding rules, on n8n

Status: draft for the author's approval (2026-11-21).
After approval it becomes `studies/plan-7.md`, the registration text for OSF.

## Intent

Plan 6 did not support H12 (prose 28/128 vs lint rules 17/128 violating runs, p = 0.095 after Holm).
The pooled result mixed two projects that differ in two ways at once: who wrote the conventions (the author for bulletproof-react, the maintainers for Formbricks) and whether Claude Code reads them (always for bulletproof-react, partly not for Formbricks).
Plan 7 asks the paper's question again in the realistic case: written rules that the agent reads, against coding rules, on a large project whose maintainers wrote the rules and spread them over many instruction files.
The result goes into the EMSE paper, which waits for the LLM4Code decision (11 Dec 2026).

## Goals

- Compare maintainer-written rules in the project's own instruction files, which Claude Code reads, with the same rules as lint rules and the feedback loop.
- Use a project with many instruction files, as large teams have them.
- Keep the project as its maintainers ship it, except for what the `rules` arm must change.
- Results, verify and measurement checks done by about 5 Dec 2026, so the paper section can be written before 11 Dec.

## Non-goals

- No arm with prose that the agent does not read (the author rejected it: for Claude Code it tests "no rules vs rules", not "written vs coding rules").
- No new test of H12: H12 belongs to Plan 6 and stays as reported.
- No local model and no second harness (the overnight runs do not fit the time).
- No second new project.

## Anti-goals (a failure even if everything runs)

- Task prompts that hint at a rule, or that send the agent to the docs.
- Changes to n8n's instruction files in the `prose` arm.
- A rule that n8n's own linters already enforce, or that the existing code does not break.
- Published code from n8n's enterprise files (`.ee` in a file or folder name).

## Project

- n8n (`n8n-io/n8n`), TypeScript monorepo, about 212k stars, pinned to a `master` commit at registration (candidate: `75fe21cb66ca614e42f016ec4cd145652845f82b`, 21 Nov 2026).
- Instruction files: 30 `AGENTS.md` and 14 `CLAUDE.md`.
  The root `CLAUDE.md` is `@AGENTS.md`, so Claude Code reads the root `AGENTS.md` (481 lines) in every session.
  `packages/frontend` and `packages/nodes-base` (and 6 smaller folders) have their own `CLAUDE.md` with `@AGENTS.md`, which Claude Code reads when it works in that folder.
  Some folder files have no import (for example `packages/cli/AGENTS.md`); their rules are not used.
- Checked on 21 Nov 2026 with Claude Code 2.1.330 in the harness work folder: a `CLAUDE.md` with `@AGENTS.md` adds the file to the prompt (17,203 to 28,558 tokens with a test file), and an `AGENTS.md` without it adds nothing.

### License (stated in the study README and in the paper)

- n8n is under the Sustainable Use License, except enterprise files (`.ee` in a file or folder name: 1,301 of 35,993 files), which are under the n8n Enterprise License.
- The study is non-commercial research, and the results are published free of charge, which the Sustainable Use License allows.
- The study folder holds a copy of n8n's `LICENSE.md`, and its README states that the diffs in `results/` are modified n8n code under the Sustainable Use License, not under CC BY 4.0.
- The repository's top-level license text gets one line that carves out the n8n diffs.
- No task is placed in an `.ee` area; before publishing, a check confirms that no diff touches an `.ee` path, and any hunk that does is removed and listed.
- Only `master` is licensed, so the pinned commit is on `master`.

## Conventions (candidates, maintainers' words)

Each convention is one bullet of an n8n instruction file, used word for word.
Final list: the candidates whose checker passes its tests and finds the existing violations on the pinned commit; a dropped candidate is listed with its reason before registration.

| Id | Source file (read by Claude Code) | Rule (short) | Kind | Existing code that breaks it |
|---|---|---|---|---|
| N1 | root `AGENTS.md` | Repositories compose, they don't extend (a plain `@Service()` class with a private table) | design-shaping | 166 `extends BaseRepository` / `Repository<` |
| N2 | root `AGENTS.md` | No `.manager` / `.manager.transaction(...)` / `createQueryBuilder(...)` in business logic | design-shaping | 76 in `packages/cli/src` outside repositories |
| N3 | root and nodes-base `AGENTS.md` | Avoid type casting with `as` (except in test code) | mechanical | many; n8n's lint checks only the cast style |
| N4 | root `AGENTS.md` | Use the shared helpers (`isRecord`, ...) instead of hand-rolling them | mechanical | 13 local `isRecord` definitions |
| N5 | frontend `AGENTS.md` | Use centralized debounce times from `@n8n/frontend-constants/durations` | mechanical | 11 hardcoded delays |
| N6 | frontend `AGENTS.md` | In `editor-ui`, import a file from another folder with the `@/` alias | mechanical | 1,904 relative `../` imports |
| N7 | nodes-base `AGENTS.md` | `NodeOperationError` / `NodeApiError`, not `Error` | mechanical | 59 `throw new Error(` |
| N8 | root and nodes-base `AGENTS.md` | Never use `any` (n8n turns the lint off in nodes) | mechanical | 883 in nodes-base |

The counts are first greps; the checkers give the final counts.
The checkers count only where n8n's own linters do not enforce the rule (for N8: nodes-base).

## Arms

- `prose`: n8n exactly as shipped. Nothing is added, removed or moved.
- `rules`: each convention bullet is removed from every instruction file that has it (each found word for word; a bullet that spans several lines is removed whole).
  Each convention becomes a lint rule with the codemyrules feedback loop.
  Each design-shaping convention gets a one-line pointer in the instruction file that held it.
  Nothing else changes.

As in Plan 6, the lint rules replace the prose; they are not added on top of it.
Each lint message is the convention's prose line, so both arms state each rule in the same words.

## Tasks

Four feature tasks, one per area, so that every source file is read in at least one task.
Each task is placed where 3 to 4 of the rules apply, so that the agent has several chances to break one:

- T1 and T2: backend features in `packages/cli` next to code that breaks N1 and N2 (root rules).
- T3: an `editor-ui` feature (frontend rules plus root rules).
- T4: a change to a node in `packages/nodes-base` (nodes-base rules plus root rules).

Prompts describe only the feature and never mention conventions or docs.
No task touches an `.ee` area.
The prompts are written and piloted before registration (builder's work).

## Design

- Models: Claude Code with `sonnet` and `haiku`; resolved model ids recorded per run.
- Runs: 2 arms x 2 models x 4 tasks x 8 repeats = 128 runs (64 per arm; the author chose this size on 2026-11-21).
- Power: with 64 runs per arm and lint rules at 1%, the one-sided exact test at the Holm bar of 0.025 has 26% power if prose is violated in 8% of runs, 53% at 11%, 81% at 15% and 95% at 20%.
  To raise the violation rate, each task is placed where 3 to 4 of the rules apply, not 1 to 2.
  The registration states this power.
- Turn cap 60, `"seed"` fixed in `study.json`, arms interleaved.
- Pilot: 1 run per arm, model and task (16 runs), not analysed.
- Install, build and verify in a container without credentials (as Plan 6); install with the frozen lockfile and `--ignore-scripts` if the build allows it.
- Verify: type check of each changed package and the related unit tests; test files that fail on the unchanged commit are listed and excluded.

## Hypotheses (primary, Holm over H16 and H17 at family-wise alpha 0.05)

- H16: `prose` has more violating runs than `rules` (exact conditional CMH test, one-sided, stratified by model and task).
- H17: the cost of `rules` is equivalent to the cost of `prose` within 10% (90% stratified bootstrap interval of the geometric mean cost ratio inside 0.90 to 1.10).

Secondary, reported without a test decision: violations per convention and per source file; whether the agent opened instruction files itself; loop catches and ignored catches; cost with and without the review fix; verify pass rate per arm (H18, descriptive).

## Measurement checks (as Plan 6)

- 40 diffs drawn with a fixed seed, shown without the arm, labelled by hand per convention: checker precision and recall.
- Every loop finding in the `rules` arm labelled correct or false.
- Effort per lint rule: lines of rule code and test cases.

## Timeline

| When | What |
|---|---|
| 22-24 Nov | Study folder, checkers with tests, arms, verify in Docker, task prompts |
| 25 Nov | Pilot (16 runs), final convention list, plan text |
| 26 Nov | Registration on OSF (the author submits) |
| 26-28 Nov | 128 runs |
| 2-5 Dec | Verify, hand labels, results |
| 6-10 Dec | Paper section, abstract, threats; EMSE upload after 11 Dec |

## Left to the builder

- The checker for each convention (ESLint rule or ast-grep, with tests).
- The four task prompts and their exact places in the code.
- The verify steps and the list of baseline-failing tests.
- The exact OSF text, from this design.

## Risks

- n8n is very large: install and type check are slow, and each run may cost more than on Formbricks.
  The pilot measures this; if 128 runs do not fit the time or budget, the plan changes before registration, never after.
- With 64 runs per arm, a small difference (below about 10 percentage points) may not reach significance; the paper then reports it as not supported, with every stratum.
- Some candidates may fail the checker test; then the plan has fewer conventions, listed before registration.
