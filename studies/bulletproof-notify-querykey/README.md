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

## Result

Not run yet.
