# bulletproof-notify-querykey

Third stack: TypeScript/React with ESLint, on [bulletproof-react](https://github.com/alan2207/bulletproof-react) (`apps/react-vite`: React, Vite, TanStack Query, Zod).
Tests the ESLint path of codemyrules: a built-in ESLint rule configured for the project, and a custom ESLint rule with RuleTester tests.

## Rules

- `no-restricted-imports` for `useNotifications` in `src/features/*/components` (design-shaping): success notifications are shown inside the mutation hook in the feature's `api/` folder, not in components.
  All 7 existing feature components with a mutation call `useNotifications` themselves, so copying them breaks the rule.
- `local/query-key-from-options` (mechanical, custom rule in [plugin/](plugin/)): query keys come from the feature's query options; literal key arrays only inside `queryOptions(...)`.
  The existing code already follows it, but the example pattern in the project's own `AGENTS.md` breaks it (`useQuery({ queryKey: ['discussions', params] })`).

Both rules skip tests, `__tests__` and `src/testing`; the eval runs with `--no-inline-config`, so disable comments do not hide a break.

## Arms

All arms get the same `CLAUDE.md`, which points to the project's own `AGENTS.md` (about 1,700 tokens) and 9 guides in `docs/` (about 7,000 tokens, unchanged except for the rules):
- `prose_buried` (baseline): the notification rule as a bullet mid-list in `docs/api-layer.md`, the query-key rule as a sentence in the server-cache section of `docs/state-management.md`.
- `prose_loaded`: both rules in `CLAUDE.md`.
- `rules`: no rule prose; the ESLint rules with the codemyrules feedback loop, and a one-line pointer for the notification rule in `apps/react-vite/src/features/CLAUDE.md`.

## Setup

ESLint 9 and the TypeScript parser are installed once in this folder (`npm install` here; `node_modules` is git-ignored), so the copies need no `yarn install`.
The rules arm links `.claude/codemyrules/node_modules` to this folder's `node_modules`.

## Tasks and size

T1: edit your own comment (update API, edit button and form drawer, success message).
T2: admins change a user's role from the users table (update API, role select, refreshed list, success message).
Sonnet and Haiku, 4 repeats: 48 runs.

## Result (2026-11-02)

| arm | model | runs broken after task | fix rounds | loop catches | total cost per run | turns | input tokens |
|---|---|---|---|---|---|---|---|
| prose_buried | sonnet | 1 of 8 | 1 | - | $0.195 ±0.067 | 21.4 | 343k |
| prose_loaded | sonnet | 0 of 8 | 0 | - | $0.152 ±0.046 | 18.9 | 281k |
| rules | sonnet | 0 of 8 | 0 | 0 | $0.177 ±0.030 | 22.3 | 305k |
| prose_buried | haiku | 5 of 8 | 5 | - | $0.026 ±0.005 | 36.8 | 913k |
| prose_loaded | haiku | 0 of 8 | 0 | - | $0.024 ±0.005 | 34.0 | 814k |
| rules | haiku | 0 of 8 | 0 | 1 | $0.021 ±0.003 | 27.1 | 768k |

All 48 runs ended with 0 breaks. Every first-draft break was the notification rule (`useNotifications` in a component); the query-key rule was never broken, despite the counter-example in `AGENTS.md`.
The setups did the same work: 4-7 changed files per run, no run wrote tests, and every final diff shows the notification in the API hook.

## Reading

- **Buried prose fails for the design rule, mostly with Haiku:** 5 of 8 Haiku and 1 of 8 Sonnet first drafts copied the components and called `useNotifications` there.
- **The pointer did its job:** with rules + pointer, both models put the notification in the hook first time in 15 of 16 runs; the loop caught the one exception in the same turn.
- **Cost:** rules + loop were cheaper than buried prose (-9% Sonnet inside the spread, -20% Haiku outside it).
  Against always-loaded prose they were -12% for Haiku but +16% for Sonnet (inside the spread); the always-loaded Sonnet runs read less (281k vs 305k input tokens, 18.9 vs 22.3 turns), presumably because the answer was already in `CLAUDE.md`.
- With only two rules, the always-loaded text is about 100 tokens, so its per-session context cost is negligible here; it grows with every rule added and is paid in sessions that do not need the rules.
