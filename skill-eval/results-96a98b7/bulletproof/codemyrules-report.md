# codemyrules report

Project: `apps/react-vite` (React, Vite, TanStack Query, ESLint 8.57 with legacy `.eslintrc.cjs`).
Stacks: frontend only (JS/TS goes to `eslint-pattern-rules`).
There is no backend language in the repo, so `backend-pattern-rules` did not run.
The Next.js apps were left alone, as `CLAUDE.md` asks.
No generated source folders (`generators/` holds Plop templates and is already ignored by ESLint).
This is the first run: there was no earlier `baseline.json`.

## Frontend

### Setup changes

- Dependencies installed from the lockfile: `yarn install --frozen-lockfile --ignore-scripts --ignore-engines` (`node_modules` is git-ignored).
- The legacy config had no local-rules mechanism, so one dev dependency was added at an exact version:
  `yarn add -D --exact eslint-plugin-local-rules@3.0.2 --ignore-scripts` (changes `package.json` and `yarn.lock`).
  Rule ids are therefore `local-rules/gen-<name>`, not `local/gen-<name>`.
- Rules live in `apps/react-vite/eslint-rules/gen-<name>.cjs`, each with its own `gen-<name>.test.cjs`.
  The index is `apps/react-vite/eslint-local-rules.cjs`.
- Tests: 12 files, 150 RuleTester cases, all passing:
  `cd apps/react-vite && VITE_APP_API_URL=https://api.bulletproofapp.com npx vitest run eslint-rules`.
  The project's vitest setup file needs `VITE_APP_API_URL`; CI provides it with `mv .env.example .env` before `yarn test`, so the rule tests run in CI's `yarn test` as they are.
- The project's full build and test suite were not run, as instructed.

### Rules in the main config (0 open hits, run in CI by `yarn lint`)

| Rule | Convention (source) | Hits | Scope |
|---|---|---|---|
| `local-rules/gen-no-raw-http` | One API client: no `axios` import, `fetch` or `XMLHttpRequest` outside it (AGENTS.md L132, docs/api-layer.md L3-7) | 0 | `src/**`, except `src/lib/api-client.ts` |
| `local-rules/gen-api-calls-in-api-folder` | The API client and `useQuery`/`useMutation`/... only in a feature's `api/` folder (AGENTS.md L67, L130-133) | 0 | `src/**`, except `src/features/*/api/**` and `src/lib/**` |
| `local-rules/gen-fetcher-outside-hook` | Separate fetcher functions from hooks: no `api.*` call inside a `use*` function, `queryFn` or `mutationFn` (AGENTS.md L120, docs/api-layer.md L17-19) | 0 | `src/features/*/api/**` |
| `local-rules/gen-query-key-from-options` | Literal query keys only inside `queryOptions(...)`/`infiniteQueryOptions(...)`; everywhere else, take them from the query options (docs/state-management.md L41) | 0 | all TS |
| `local-rules/gen-no-feature-barrel` | No barrel files in features; import files directly (docs/project-structure.md L61) | 0 | all TS |
| `local-rules/gen-ui-wrappers` | Radix only inside `src/components/ui/`, react-hook-form and `@hookform/*` only inside `src/components/ui/form/` (AGENTS.md L103, L125, docs/components-and-styling.md L52, docs/state-management.md L59) | 0 | `src/**` |
| `local-rules/gen-no-nested-render-functions` | No `render*` functions returning JSX inside components; extract a component (AGENTS.md L98, docs/components-and-styling.md L9-34) | 0 | `src/**/*.tsx`, except tests |
| `local-rules/gen-lazy-state-initializer` | `useState(fn())` becomes `useState(() => fn())` (suggestion fix) (AGENTS.md L194, docs/performance.md L17-25) | 0 | all TS |
| `local-rules/gen-sanitized-inner-html` | `dangerouslySetInnerHTML` only as `{ __html: <x>.sanitize(...) }` (AGENTS.md L182, docs/security.md L23-25) | 0 | all TS |
| `local-rules/gen-no-http-mocking` | Tests do not mock `axios`, the API client or `fetch`; answer requests with MSW (AGENTS.md L165, docs/testing.md L53) | 0 | test files and `src/testing/**` |
| `check-file/filename-naming-convention` (existing rule, new key) | Hook files are named `use-*.ts` (AGENTS.md L228) | 0 | `src/**/hooks/*.{ts,tsx}` |
| `@typescript-eslint/naming-convention` (installed plugin, not enabled before) | camelCase variables and functions, PascalCase allowed for components, UPPER_CASE for constants (AGENTS.md L85-86) | 0 | all TS |

Each rule was run over the real code with `try-rule.mjs` and through the project's own ESLint.
The project's `eslint src` with the main config still reports 0 problems.
Every main-config rule was confirmed to fire in the project's ESLint on a violating snippet.
`try-rule` hits that need explaining: `gen-no-raw-http` reports `src/lib/api-client.ts:1` (the client itself, which the config excludes), and `gen-api-calls-in-api-folder` reports 25 hits, all in `src/features/*/api/**` and `src/lib/**`, which the config excludes.

Config change (`apps/react-vite/.eslintrc.cjs`, shortened):

```diff
-  plugins: ['check-file'],
+  plugins: ['check-file', 'local-rules'],
   ...
             '**/*.{ts,tsx}': 'KEBAB_CASE',
+            'src/**/hooks/*.{ts,tsx}': 'use-+([a-z0-9-])',
   ...
+        '@typescript-eslint/naming-convention': ['error',
+          { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
+          { selector: 'function', format: ['camelCase', 'PascalCase'] }],
+        'local-rules/gen-query-key-from-options': 'error',
+        'local-rules/gen-lazy-state-initializer': 'error',
+        'local-rules/gen-sanitized-inner-html': 'error',
+        'local-rules/gen-no-feature-barrel': 'error',
+    { files: ['src/**/*.ts', 'src/**/*.tsx'], rules: { 'local-rules/gen-ui-wrappers': ['error', { wrappers: [radix, react-hook-form] }] } },
+    { files: [...src TS], excludedFiles: ['src/lib/api-client.ts'], rules: { 'local-rules/gen-no-raw-http': 'error' } },
+    { files: [...src TS], excludedFiles: ['src/features/*/api/**', 'src/lib/**'], rules: { 'local-rules/gen-api-calls-in-api-folder': 'error' } },
+    { files: ['src/features/*/api/**/*.ts(x)'], rules: { 'local-rules/gen-fetcher-outside-hook': 'error' } },
+    { files: ['src/**/*.tsx'], excludedFiles: [tests, 'src/testing/**'], rules: { 'local-rules/gen-no-nested-render-functions': 'error' } },
+    { files: [tests, 'src/testing/**'], rules: { 'local-rules/gen-no-http-mocking': 'error' } },
```

### Suggestions layer (`apps/react-vite/.eslintrc.suggestions.cjs`, rules the existing code breaks)

| Rule | Convention (source) | Open hits | A few hits |
|---|---|---|---|
| `local-rules/gen-absolute-imports` | Use `@/` imports instead of `../` (AGENTS.md L80, docs/project-standards.md L25-51); offers a suggestion fix to the `@/` path | 48 in 37 files | `src/components/errors/main.tsx:1` `'../ui/button'`, `src/features/discussions/components/discussions-list.tsx:11` `'../api/get-discussions'`, `src/hooks/__tests__/use-disclosure.test.ts:3` |
| `no-restricted-imports` (built-in) | Feature components never call `useNotifications`; the success notification goes in the mutation hook's `onSuccess` (docs/api-layer.md L18) | 7 in 7 files | `src/features/discussions/components/create-discussion.tsx:5`, `src/features/comments/components/delete-comment.tsx:5`, `src/features/users/components/update-profile.tsx:5` |
| `local-rules/gen-ui-wrappers` (adds the `Link` entry on top of the main config) | `Link` only through `@/components/ui/link` (docs/components-and-styling.md L52-54) | 2 in 2 files | `src/features/auth/components/login-form.tsx:1`, `src/features/auth/components/register-form.tsx:2` |
| `local-rules/gen-lazy-routes` | Route modules load through `lazy: () => import(...)` (AGENTS.md L188, docs/performance.md L7-9) | 1 | `src/app/router.tsx:12` (static import of `./routes/app/root`) |

- Run it: `cd apps/react-vite && npx --no-install eslint -c .eslintrc.suggestions.cjs <files>` (it merges over `.eslintrc.cjs`).
- CI keeps running only the main config, so nothing old breaks.
- Proposed script (not added; `package.json` was changed only by the dependency install): `"lint:suggestions": "eslint -c .eslintrc.suggestions.cjs src"`.
- When a rule's open hits reach 0, move it into `.eslintrc.cjs` and out of the suggestions file.
- `gen-ui-wrappers` has 0 hits for Radix and react-hook-form, and those entries already run in the main config; only the `Link` entry is suggestions-only.

### Agent-doc lines

`AGENTS.md` is always loaded.
Changes there, each now covered by a verified rule:

| Line (before) | Action | Rule |
|---|---|---|
| L80 "Absolute imports - Use `@/` prefix for all src imports" | deleted | `gen-absolute-imports` (suggestions layer, which the loop runs) |
| L98 "Extract render functions" | deleted | `gen-no-nested-render-functions` |
| L103 "Headless UI components using Radix UI primitives" | shortened to a pointer that names the wrapper folder and the rule | `gen-ui-wrappers` |
| L120 "Separate fetcher functions from hooks" | deleted | `gen-fetcher-outside-hook` |
| L125 "Create reusable Form and Input components" | turned into a pointer: forms use `@/components/ui/form` | `gen-ui-wrappers` |
| L127-148 "API Layer" structure and example code | shortened to a 3-line pointer with the canonical example file and rule names | `gen-api-calls-in-api-folder`, `gen-fetcher-outside-hook`, `gen-no-raw-http`, `gen-query-key-from-options` |
| L165 "Use real HTTP requests with MSW instead of mocking fetch" | deleted | `gen-no-http-mocking` |
| L182 "Use DOMPurify for HTML content sanitization" | deleted | `gen-sanitized-inner-html` |
| L188 "Route-level splitting - Lazy load pages/routes" | deleted | `gen-lazy-routes` (suggestions layer) |
| L194 "State initializer functions" | deleted | `gen-lazy-state-initializer` |
| L228 "Hooks: `use-kebab-case.ts`" | deleted | `check-file/filename-naming-convention` |

- Removed: 539 characters, about **135 tokens per session** (always loaded); `AGENTS.md` went from 9161 to 8622 characters.
- On-demand tokens removed: 0.
- The old API example in `AGENTS.md` used a literal `queryKey` inside `useQuery`, which `gen-query-key-from-options` now forbids, so replacing it with a pointer to the real `get-discussions.ts` also removes a misleading example.
- Where the pointers went: the root `AGENTS.md`.
  These rules apply to the whole app, and `AGENTS.md` is the only agent doc that describes the app's structure.
  A folder `CLAUDE.md` would not load earlier, since all work happens in `apps/react-vite`.
- Kept, because only part of them is covered: L85-86 PascalCase/camelCase (the rule allows PascalCase for any variable or function, so it does not force components to be PascalCase or plain functions to be camelCase), L181 "Sanitize all user inputs" (wider than `dangerouslySetInnerHTML`), L189 "Avoid excessive splitting".
- Kept, because the rules that cover them existed before this run: L84 and L227-231 kebab-case (check-file), L89-90 cross-feature and unidirectional imports (`import/no-restricted-paths`).
- Kept: the matching lines in `docs/*.md` (project-standards L25-51, api-layer L3-19, state-management L41 and L59, components-and-styling L9-54, performance L7-25, security L23-25, testing L53, project-structure L61).
  These files are Bulletproof React's published guide for human readers, and agents only open them through links in `CLAUDE.md`, so they cost no tokens per session.
  Cutting them would damage the guide and save nothing.
- Note: `AGENTS.md` also describes the two Next.js apps, which do not run these rules.
  The deleted lines no longer guide work there.
  That is acceptable while `CLAUDE.md` limits work to `apps/react-vite`; if the Next.js apps come back into scope, port the rules to their ESLint configs.

The token count is the smaller benefit.
The larger one is fewer fix rounds: an agent that breaks one of these conventions is told exactly what to change on the line it just wrote, instead of a reviewer finding it later.
That shows up in the failure log and in review, not in the character count.

### General rules (not picked: the instructions say to pick only conventions from the agent docs)

Counted with one `--rule` run over `src/**/*.{ts,tsx}`, without changing the config:

| Rule | Standard value | Hits |
|---|---|---|
| `max-lines-per-function` (skip blanks and comments) | 50 | 18 in 17 files |
| `no-else-return` | on | 2 in 2 files |
| `no-console` | error | 2 in 2 files |
| `react/no-danger` | on | 1 (the sanitized `md-preview.tsx`; `gen-sanitized-inner-html` covers the project's version of this) |
| `complexity` 10, `max-depth` 4, `max-params` 3, `no-nested-ternary`, `max-lines` 400, `eqeqeq`, `no-unreachable-loop`, `no-self-compare`, `no-constant-binary-expression`, `array-callback-return`, `no-implied-eval`, `no-new-func`, `no-script-url`, `vitest/no-focused-tests`, `vitest/no-disabled-tests` | standard | 0 each |

- Already covered: unused vars (`@typescript-eslint/no-unused-vars`), React hooks rules, `no-debugger`, `no-eval`, `no-fallthrough`, `no-unsafe-optional-chaining`, `no-constant-condition`, `react/jsx-no-target-blank`, `vitest/expect-expect` and `vitest/no-identical-title` (presets), and ignores for the generated folders.
- Need a type-aware config (`parserOptions.project`), which the project does not have: `@typescript-eslint/no-floating-promises`, `no-misused-promises`, `switch-exhaustiveness-check`.
- Need a plugin the project lacks: `sonarjs/no-commented-code` (`yarn add -D --exact eslint-plugin-sonarjs@<version>`).
- Report-only tools: `knip` for unused files and exports, a secret scanner (gitleaks or trufflehog) in CI.

### Conventions not built

- "Lucide React for icons" (AGENTS.md L255): contradicted, because 4 files in `src/components/ui` use `@radix-ui/react-icons`. A question for the team, so neither side was built.
- "Limit prop count" (AGENTS.md L99, docs/components-and-styling.md L40-42): no rule counts a component's props without type information.
- "PascalCase for React components" (AGENTS.md L85): telling a component from a function needs heuristics that `naming-convention` lacks; only partly covered (see above).
- "Error Boundaries at feature level", "Colocation", "Composition over props", "Type-first", "Zustand for global state", "Zod for forms": design guidance, no reliable lint signal.
- "JWT in HttpOnly cookies (preferred) or localStorage": a preference with an allowed alternative, not a rule.
- Barrel files in `src/components/ui/*/index.ts` (13 files): the docs advise against barrels only for features, so the rule is scoped to `src/features`.
- Implicit conventions found only in code (not built, as instructed): `useQueryClient().invalidateQueries` always runs inside the mutation hook's `onSuccess`.

### Scan log

| Signal | Good form | Bad form | Verdict |
|---|---|---|---|
| `../` imports vs `@/` | 81 files use `@/` | 37 files (48 imports) use `../` | suggestions layer |
| `axios` import / `fetch(` | only `src/lib/api-client.ts` | 0 | main |
| API client imports | 12, all in `features/*/api` | 0 | main |
| `useQuery`/`useMutation` outside `api/` | - | 0 | main |
| inline `api.*` in `queryFn`/`mutationFn`/hooks | 16 fetchers | 0 | main |
| literal `queryKey` outside `queryOptions` | 5 inside | 0 | main |
| `index.ts` in `src/features` | - | 0 (13 in `src/components`) | main, features only |
| `@radix-ui/*` outside `components/ui` | 12 inside | 0 | main |
| `react-hook-form` outside `components/ui/form` | 6 inside | 0 | main |
| `Link` from `react-router` outside the wrapper | wrapper used elsewhere | 2 | suggestions layer |
| `useNotifications` in `features/*/components` | 0 in `api/` | 7 | suggestions layer (see question 1) |
| nested `render*` functions | - | 0 | main |
| `useState(call())` | - | 0 | main |
| `dangerouslySetInnerHTML` without sanitize | 1 sanitized | 0 | main |
| `vi.mock`/`spyOn` of HTTP | `vi.mock('zustand')` only | 0 | main |
| static route imports in `router.tsx` | 5 lazy | 1 (`root`) | suggestions layer |
| hook files not `use-*` | 1 | 0 | main |
| naming-convention violations | - | 0 | main |
| lint and TypeScript suppression comments in `src` | - | 0 | no rule is fighting the code |

## Backend

None: the repo has no backend language that `backend-pattern-rules` covers.

## Feedback loop: installed

- Installed with `node .claude/skills/codemyrules/scripts/install.mjs . --config /tmp/cmr/loop.json --apply`.
- Created: `.claude/codemyrules/{guard,lint-edited,lint-turn,lib}.mjs`, `.claude/codemyrules/loop.json`, `.claude/settings.local.json` (PreToolUse guard, PostToolUse fast check, Stop full check).
- Added to `.git/info/exclude`: `.claude/codemyrules/` and `.claude/settings.local.json`, so no tracked file changed.
- Fast tier: none.
  The project has no `eslint_d` and no ast-grep config, so ESLint runs once per turn.
- Full tier: ESLint for `.ts` and `.tsx`, with the suggestions config, so suggestions-layer rules also guard every changed line.
  The hooks run from the repo root, but the project's own config (the import resolver and the `import/no-restricted-paths` zones) needs `apps/react-vite` as the working directory.
  So the command is a short `node -e` wrapper: it changes into `apps/react-vite`, keeps only that app's files, and runs `node_modules/.bin/eslint -c .eslintrc.suggestions.cjs --format json`.
  Smoke-tested through the hook library: on `login-form.tsx` it reports `local-rules/gen-ui-wrappers` at line 1.
- Protected paths (edits ask the user first): `**/.eslintrc*` (including the suggestions config), `**/eslint.config.*`, `**/.prettierrc`, `apps/react-vite/eslint-rules/**`, `apps/react-vite/eslint-local-rules.cjs`, plus `.claude/codemyrules/` and `.claude/settings.local.json`.
- Not guarded: lint settings inside `package.json` (`lint-staged`, the `lint` script).
- The guard is already active in this session: it stopped the first write of this report, because the scan log quoted suppression-comment tokens literally (the row now describes them in words).
- To uninstall: delete `.claude/codemyrules/` and remove the three entries from `.claude/settings.local.json`.

## Baseline

`.claude/codemyrules/baseline.json`, written 2026-11-02:
- Always-loaded doc tokens: **2286 per session** (root `CLAUDE.md` + `AGENTS.md`, after the cleanup; about 2444 before).
- On-demand doc tokens: 0 (the measure counts folder-level agent docs; the linked `docs/*.md` guide is not counted).
- Rules: 15, with 58 open hits in total (`gen-absolute-imports` 48, `no-restricted-imports` 7, `gen-ui-wrappers` 2, `gen-lazy-routes` 1, all others 0).
- `no-restricted-imports` holds only the `useNotifications` convention, so its count is not shared with anything else.
- `check-file/filename-naming-convention` shares its id with the existing kebab-case rule; both are at 0 hits.

On the next run, `measure.mjs report` compares against this.
A rule that keeps failing in `failures.log` is a sign agents need a one-line pointer for it up front.

## Design questions answered on your behalf

Nobody could answer during the run, so I took the safer side where there was a choice:

1. **`useNotifications` in feature components (docs/api-layer.md L18 vs 7 components that do it).**
   Answer: enforce the doc, in the suggestions layer only, so new code follows it and CI stays green.
   Reason: the doc states it as a firm rule and you asked for every documented convention.
   Alternative: treat it as a contradiction and update the doc to match the code (all 7 mutations show their notification in the component today).
2. **Scope of "Use `@/` for all src imports".**
   Answer: forbid only parent-relative `../` imports (48 hits), and allow sibling `./` imports.
   Reason: narrower, and it matches the reason the docs give (avoid `../../../`).
   Alternative: forbid `./` as well, which flags about 51 more files.
3. **Fixes.**
   Answer: `gen-absolute-imports` and `gen-lazy-state-initializer` offer `suggest` fixes, not autofixes; the other rules have no fix.
   Alternative: `fix` for `gen-absolute-imports`, where the resolved path is provably the same.
4. **Type-only imports.**
   Answer: `import type` from `react-hook-form`, `@radix-ui/*` or the API client is allowed outside the wrapper folders.
   Alternative: flag those too.
5. **`gen-lazy-routes` and the app layout.**
   Answer: the static import of `./routes/app/root` in `router.tsx` counts as a hit (suggestions layer).
   Alternative: allow the layout route and move the rule to the main config at 0 hits.
6. **`NavLink`.**
   Answer: only `Link` must go through `@/components/ui/link`; `NavLink` in `dashboard-layout.tsx` stays allowed, since the docs show a wrapper only for `Link`.
   Alternative: add `NavLink` to the rule (1 more hit).
7. **Custom rules through a new dev dependency.**
   Answer: added `eslint-plugin-local-rules@3.0.2`, because the legacy config cannot load local rules otherwise and you approved exact-version dev dependencies.
   Alternative: express the zero-logic conventions as `no-restricted-imports` / `no-restricted-syntax` without a new package.
   Several of those would then share one rule id and override each other across `overrides` blocks, which is why I chose named rules.
8. **Pointer placement.**
   Answer: the remaining pointers (UI wrappers, forms, API layer) stay in the root `AGENTS.md`.
   Alternative: move them to `apps/react-vite/src/features/CLAUDE.md` (API layer) and `apps/react-vite/src/components/CLAUDE.md` (wrappers).
