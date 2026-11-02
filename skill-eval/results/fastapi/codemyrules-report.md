# codemyrules report

Date: 2026-11-02.
Scope: `backend/` (Python, via `backend-pattern-rules`) and `frontend/` (React/TypeScript, via `eslint-pattern-rules`).
Selection rule given in advance: build every candidate stated in `CLAUDE.md` or `docs/*.md`, including design-shaping ones.
Do not build general candidates or code-only conventions.
Nobody was available to answer questions, so every design question below was answered on your behalf, always choosing the safer option (see "Answers given on your behalf").

## Summary

- 32 ast-grep rules with tests and snapshots: 31 Python rules for `backend/` and 1 TypeScript rule for the Playwright tests.
- 6 Ruff rules enabled in `backend/pyproject.toml`, and 3 Biome rule changes in `frontend/biome.json`.
- `ast-grep test`: 32 passed, 0 failed.
- `ast-grep scan`: exits 0, with 76 warnings from 7 rules and no errors.
- `ruff check app`: clean.
- `biome lint`: 2 warnings, no errors.
- Agent docs: 1,874 characters removed from `docs/*.md` (about 468 on-demand tokens), with 31 lines deleted and 11 shortened.
  The always-loaded root `CLAUDE.md` holds no rule lines and was not changed.
- Feedback loop installed and smoke-tested.
- Baseline written to `.claude/codemyrules/baseline.json`.
- Not run, as you asked: the project's full build and its test suites.

## Setup detected

- Backend: `backend/pyproject.toml` (uv workspace member), with sources in `backend/app` and tests in `backend/tests`.
  Ruff (pinned 0.16.9 in `uv.lock`), mypy and ty run through `backend/scripts/lint.sh` and pre-commit (`uv run ruff check`).
- Generated code: Alembic revisions in `backend/app/alembic/versions` (Ruff excludes `alembic`).
  On the frontend, `frontend/src/client/**` (openapi-ts) and `src/routeTree.gen.ts`; Biome excludes both.
- Frontend: Biome 2.5.14 (`bun run lint`, pre-commit `local-biome-check`).
  There is no ESLint, and `node_modules` is not installed.
- ast-grep: the project did not use it before this run.
  It runs through `npx -y -p @ast-grep/cli@0.51.0 ast-grep`, with no change to `package.json` or `pyproject.toml`.
- Decision records: none (`docs/adr/` and `notes/decisions/` do not exist).
  `CONTRIBUTING.md` has no lintable conventions.
- Agent docs: root `CLAUDE.md` is always loaded; it links 8 `docs/*.md` files, which load on demand.
  No `AGENTS.md`, Copilot, Cursor or Windsurf files exist.
- Previous codemyrules run: none.

## Backend rules (ast-grep, `ast-grep/rules/`, tests in `ast-grep/rule-tests/`)

Why ast-grep: Ruff, the tool the project already runs, cannot scope a banned API to folders with its own message, or express "only through our helper".
Every rule below needs folder scoping, structure or a tailored message.
Rules with no open hits are `error`.
Rules with open hits are `warning`, so CI and the scan stay green.

| Rule | Severity | Open hits | Example hits |
|---|---|---|---|
| `gen-no-db-access-in-routes` | warning | 29 in 3 files | `routes/items.py:23`, `routes/private.py:35`, `routes/users.py:43` |
| `gen-status-constants` | warning | 28 in 5 files | `routes/items.py:55`, `api/deps.py:43`, `routes/utils.py:14` |
| `gen-keyword-only-params` | warning | 8 in 3 files | `routes/items.py:14`, `utils.py:70`, `routes/users.py:163` |
| `gen-route-response-model` | warning | 8 in 4 files | `routes/login.py:23`, `routes/items.py:99`, `routes/utils.py:29` |
| `gen-router-prefix-tags` | warning | 1 | `routes/login.py:20` (`APIRouter(tags=["login"])`, no prefix) |
| `gen-str-field-max-length` | warning | 1 | `models.py:53` (`hashed_password: str`) |
| `gen-jinja-autoescape` | warning | 1 | `utils.py:29` (`Template(template_str)`) |
| `gen-no-env-outside-settings` | error | 0 | |
| `gen-settings-singleton` | error | 0 | |
| `gen-no-session-outside-deps` | error | 0 | |
| `gen-no-jwt-in-routes` | error | 0 | |
| `gen-password-hashing-in-security` | error | 0 | |
| `gen-no-imports-from-routes` | error | 0 | |
| `gen-crud-dependencies` | error | 0 | |
| `gen-models-dependencies` | error | 0 | |
| `gen-core-no-api-imports` | error | 0 | |
| `gen-http-exception-detail` | error | 0 | |
| `gen-no-manual-validation-error` | error | 0 | |
| `gen-uuid-id-params` | error | 0 | |
| `gen-no-bare-collection-response` | error | 0 | |
| `gen-crud-keyword-session` | error | 0 | |
| `gen-timestamp-utc` | error | 0 | |
| `gen-uuid-primary-key` | error | 0 | |
| `gen-relationship-back-populates` | error | 0 | |
| `gen-table-created-at` | error | 0 | |
| `gen-no-raw-sql` | error | 0 | |
| `gen-no-delete-in-loop` | error | 0 | |
| `gen-count-in-database` | error | 0 | |
| `gen-no-sensitive-logging` | error | 0 | |
| `gen-cors-no-wildcard-origin` | error | 0 | |
| `gen-no-db-mocks-in-tests` | error | 0 | |

Paths in the table are relative to `backend/app/`.
Every open hit was checked by hand and is a real violation within the rule's boundary.
No open hit is in generated code.

Worth knowing about two of these hits:
- `gen-jinja-autoescape`: `docs/security.md` said "the Jinja templates escape by default".
  That is not true: `jinja2.Template` has `autoescape=False` by default.
  The shortened doc line no longer makes that claim.
  The fix (`autoescape=True`) can change the rendered emails, so the rule gives a `note` and no autofix.
- `gen-router-prefix-tags`: `login.py` serves several path roots (`/login/...`, `/password-recovery/...`), so it has no single prefix.
  Either accept it as the one exception (a file in `ignores`) or split the router.

## Backend config change (Ruff, `backend/pyproject.toml`)

```diff
     "T201",   # print statements are not allowed
+    "BLE001", # no broad exceptions in routes (docs/backend.md "Errors"), scoped below
+    "LOG015", # module-level logger, not the root logger (docs/backend.md "Logging")
+    "S602", "S604", "S605", # no shell commands from strings (docs/security.md "Input handling")
+    "S608",   # no SQL built from strings (docs/database.md "Queries")
 ]
+[tool.ruff.lint.per-file-ignores]
+"!app/api/routes/**" = ["BLE001"]
```

Verified with Ruff 0.16.9 (the version in `uv.lock`): `ruff check app` and `ruff check tests` are clean.
A throwaway probe file showed every new code firing, and BLE001 firing only under `app/api/routes/`.

## Frontend

### Biome config change (`frontend/biome.json`)

```diff
-        "noExplicitAny": "off",
+        "noExplicitAny": "warn",
+      "nursery": {
+        "noInlineStyles": { "level": "error", "fix": "none" }
+      },
+        "noRestrictedGlobals": {
+          "level": "error",
+          "options": { "deniedGlobals": { "fetch": "Call the backend through the generated services in src/client (ItemsService, UsersService), never with fetch directly." } }
+        },
   overrides **/*.svg:
+          "nursery": { "noInlineStyles": "off" }
```

- `noRestrictedGlobals` (`fetch`): 0 hits.
- `noInlineStyles`: 0 hits in the code Biome checks; `src/components/ui/**` (vendored shadcn) is already excluded from Biome.
  It is turned off for `*.svg`, which hit 11 times in `public/assets/images`.
  It uses `fix: "none"` because `bun run lint` runs `--write --unsafe`, which would otherwise rewrite markup without review.
  Note that this is a nursery rule, so its behaviour may change between Biome releases.
- `noExplicitAny` at `warn`: 2 hits, `src/utils.ts:5` and `src/components/Sidebar/User.tsx:43`.
- TS-ignore comments were already covered: `noTsIgnore` is in Biome's recommended preset.

Verified with Biome 2.5.14 (the version in `bun.lock`): `biome lint .` reports 2 warnings and no errors.
A probe file showed `fetch` and `style={...}` failing.

### Playwright rule (ast-grep, TypeScript)

| Rule | Severity | Open hits |
|---|---|---|
| `gen-playwright-no-css-selectors` | error | 0 (the existing `locator("form")`, `"body"` and `"html"` calls are tag selectors and allowed) |

Why ast-grep and not ESLint: the project runs Biome, not ESLint.
Installing ESLint for one rule would add a second JS linter.
Biome GritQL plugins have no test harness, while the ast-grep rule shares the backend's tests, snapshots and feedback loop.
`package.json` was not changed.

## Registration, install and CI

`sgconfig.yml` (new, repo root):

```yaml
ruleDirs: [ast-grep/rules]
testConfigs:
  - testDir: ast-grep/rule-tests
```

Run it with no install: `npx -y -p @ast-grep/cli@0.51.0 ast-grep test && npx -y -p @ast-grep/cli@0.51.0 ast-grep scan`.
Recommended CI step, for example in `.github/workflows/pre-commit.yml` or as a local pre-commit hook: the same two commands.
Add `--error=<rule-id>` to `scan` for a warning rule once its hits are fixed, or promote the rule to `error`.

## Agent-doc cleanup

All edited lines are in `docs/*.md`, which load on demand.
The always-loaded root `CLAUDE.md` holds no rule lines, so the context paid in every session is unchanged at 334 tokens.
In total, 1,874 characters were removed (about 468 tokens), only when an agent opens these docs.
The bigger benefit is not the token count but fewer fix rounds: a broken convention now fails on the line where it happens, with its fix in the message.

Deleted, because the rule's message and note carry the line:
- `docs/api.md`: uuid path parameters, "do not return bare lists or dictionaries", "do not build 422 by hand", "errors use `HTTPException(detail=...)`".
- `docs/architecture.md`: "do not read environment variables anywhere else".
- `docs/backend.md`: uuid identifiers, `response_model` (duplicate of `api.md`), timestamps via `get_datetime_utc`, settings import, broad exceptions in routes, module-level logger, never log secrets.
- `docs/database.md`: uuid primary keys, `back_populates`, `created_at` on every table, raw SQL, formatted SQL, delete in a loop.
- `docs/security.md`: never decode tokens in a route, passwords only through `core/security.py`, SQL and shell from user input, never log secrets, CORS `*`.
- `docs/testing.md`: do not mock the database, role and label selectors.

Shortened to an in-place pointer, because these shape code before it is written, or the rule is a warning and the loop will not show it:
- `docs/api.md:17`: `response_model` (`gen-route-response-model`).
- `docs/architecture.md:22`: the import directions in one line, naming the four layering rules.
- `docs/backend.md`: keyword-only arguments, one router per module, sessions and current user from `deps.py`, crud return types, `max_length`.
- `docs/database.md`: session from `SessionDep`.
- `docs/security.md`: "Escape user content in emails (`gen-jinja-autoescape`)", with the incorrect autoescape claim removed.
- `docs/frontend.md`: generated services (Biome bans `fetch`), and "no inline styles" removed from the styling line.

Kept unchanged:
- `docs/api.md` status-code line, `docs/backend.md` "routes never call `session.*`" line, and `docs/frontend.md` `any` / TS-ignore line.
  These are contradicted conventions (see below), so the doc stays the record of the decision until you settle it.
- Partly covered lines, for example "Raise `HTTPException` with a short, user-facing `detail`" and "Load only what you need".

Where the pointers went: in place, in the `docs/*.md` file that already held the line.
Better placement, not done because new files were outside the approved writes: a `backend/CLAUDE.md` holding the backend pointers, and a `frontend/CLAUDE.md` for the frontend ones.
Each would load whenever an agent works in that folder, instead of only when it follows a link.

## Feedback loop (installed)

- Fast tier, after every edit: ast-grep (`npx -y -p @ast-grep/cli@0.51.0 ast-grep scan --json=compact`) on `.py` and `.ts`.
- Full tier, at the end of each turn: Ruff (`uv run ruff check --output-format=json`) on `.py`.
- Guard, before every edit: asks you before any new ignore comment, and before edits to `sgconfig.yml`, `ast-grep/**`, `frontend/biome.json`, `.claude/codemyrules/` and `.claude/settings.local.json`.
- Files: `.claude/codemyrules/{guard,lint-edited,lint-turn,lib}.mjs`, `loop.json`, and the hooks in `.claude/settings.local.json`.
  Both paths were added to `.git/info/exclude`, so nothing tracked changes.
- Smoke test: an `os.getenv` probe in `backend/app` was blocked with exit 2 and one finding line.
  That probe left one `gen-no-env-outside-settings` entry in `.claude/codemyrules/failures.log`.
  Deleting it needed approval, so delete that file before reading the first `measure.mjs report`.
- The guard also fired while this report was being written: the report quoted a TypeScript ignore directive.
  The wording was changed, and no guard setting was touched.

Limits you should know about:
- Biome is not in the loop, because the loop only reads ESLint, ast-grep and Ruff output.
  The Biome rules run in `bun run lint`, pre-commit and CI only.
- `uv` is not on this machine's PATH, so the Ruff tier prints `codemyrules: ruff failed: ...` and counts as clean until `uv` is installed.
- The loop blocks on errors only.
  The 7 warning rules (`gen-no-db-access-in-routes`, `gen-status-constants`, `gen-keyword-only-params`, `gen-route-response-model`, `gen-router-prefix-tags`, `gen-str-field-max-length`, `gen-jinja-autoescape`) and Biome `noExplicitAny` will not reach an agent until you promote them.
  The loop only checks changed lines, so promoting a rule after its old hits are fixed blocks nothing old.
- Lint settings inside `backend/pyproject.toml` are not guarded.
  It is a shared build file, so guarding it would prompt on every dependency edit.

## Baseline

`.claude/codemyrules/baseline.json`, recorded 2026-11-02:
- Always-loaded doc tokens: 334 per session (root `CLAUDE.md`, measured after the cleanup, which did not change it).
- On-demand doc tokens: 0 as `measure.mjs` counts them.
  It does not treat the linked `docs/*.md` as agent docs, so they are now about 3,346 tokens (13,382 characters), down from about 3,814.
- Rules: 41 (32 ast-grep, 6 Ruff, 3 Biome), with 78 open hits: the 76 ast-grep warnings above and the 2 `noExplicitAny` warnings.

A later run of `node .claude/skills/codemyrules/scripts/measure.mjs report .` compares against this baseline.
A rule that keeps failing in that log needs an up-front pointer in the folder it applies to.

## Contradicted conventions (built on the doc's side, at warning)

| Convention | Doc | Code today | What was built |
|---|---|---|---|
| Status codes from `fastapi.status` | `docs/api.md` | 28 integer literals, 1 constant | `gen-status-constants`, warning |
| Routes never call `session.*`; use `crud.py` | `docs/backend.md` | 29 direct calls in 3 route files, 8 crud calls | `gen-no-db-access-in-routes`, warning |
| No `any` | `docs/frontend.md` | Biome `noExplicitAny` switched off, 2 uses | `noExplicitAny: "warn"` |

## Conventions not built

From the docs, not lintable with syntax alone:
- Same error text for the same situation; ownership checks (`owner_id == current_user.id`); 404 vs 403.
- Deterministic ordering, `limit` everywhere, filtering in the database.
- Indexes for new queries, migration rules, data protection, superuser-only dependencies.
- Token lifetimes, the default-secret startup check, never returning table models with secrets (needs types).
- `useQuery`/`useMutation` invalidation, `handleError`, React Hook Form, disabled submit buttons, dark mode, never editing `src/client`.
- Test naming, one behaviour per test, own data per test, fixtures and helpers, flaky tests.
- Process lines in `docs/workflow.md`.

Found only in code, so not built (your instruction): nothing beyond the documented conventions reached a clear majority worth a rule.

## General rules not picked

Hit counts are from Ruff 0.16.9, in the form `app/` + `tests/`:
- 0 hits: `C901` (complexity 10), `PLR0913`, `PLR0915`, `PLR0911`, `RET505`, `DTZ`, `SIM115`, `S113`, `PT`, `FBT`.
- `ERA001`: 2 + 1.
- `PLR2004`: 0 + 50.
- Ruff `S` (bandit) as a whole: 3 + 168, mostly `S101` assert in tests.

ESLint general rules: not offered, because the project does not run ESLint.
Biome has equivalents for many of them.

## Scan log

| Signal | Good | Bad | Verdict |
|---|---|---|---|
| env reads outside config | n/a | 0 | rule, error |
| `Session(`/`create_engine` outside deps/db/startup | 3 sanctioned | 0 | rule, error |
| `jwt` in routes | n/a | 0 | rule, error |
| hashing libs outside `core/security.py` | 1 file | 0 | rule, error |
| import directions (routes, crud, models, core) | all | 0 | 4 rules, error |
| `HTTPException` without `detail` | 30 | 0 | rule, error |
| integer status codes | 1 | 28 | contradicted, warning |
| session calls in routes | 8 crud calls | 29 | contradicted, warning |
| endpoints without `response_model` | 15 | 8 | rule, warning |
| 3+ params without `*` (app) | about 10 | 8 | rule, warning |
| str fields without `max_length` | 12 | 1 | rule, warning |
| Jinja without autoescape | 0 | 1 | rule, warning |
| root-logger calls, broad except, SQL/shell strings | n/a | 0 | Ruff config |
| `print` | n/a | 0 | covered (T201) |
| `Optional`/`List` | n/a | 0 | covered (UP) |
| mutable defaults | n/a | 0 | covered (B006) |
| untyped signatures | n/a | n/a | covered (mypy strict) |
| suppression comments | 4 (2 Ruff, 2 mypy) | | no cluster |
| frontend `fetch` | 0 | 0 | Biome config |
| inline styles outside `ui/` | 0 | 0 | Biome config |
| `any` | | 2 | contradicted, warn |
| TS-ignore comments | | 0 | covered (noTsIgnore) |
| Playwright CSS-class selectors | about 250 role/label calls | 0 | rule, error |

## Answers given on your behalf

1. Contradicted conventions (status constants, `session.*` in routes, `any`): enforce the doc at warning level, and keep the doc lines.
   Reason: your selection asked for every documented convention, and a warning breaks nothing.
   Alternative: update the docs to match the code, and delete these rules.
2. `gen-route-response-model`: flags every endpoint without `response_model`, as the doc says.
   Alternative: accept a typed return annotation (`-> Message`), which FastAPI also uses for the schema; that has 0 hits.
3. `gen-keyword-only-params`: covers all of `backend/app` except methods' `self`/`cls`, and leaves tests out.
   Alternative: only `crud.py` and `utils.py`, leaving FastAPI route handlers out.
4. `gen-str-field-max-length`: flags `Field(...)` calls without `max_length`, plus bare `str` columns in `table=True` classes.
   Response-only schemas without `Field` (for example `Message`) are left out.
   Alternative: every `str` field in `models.py`.
5. `gen-router-prefix-tags` at warning, with `login.py` as an open hit.
   Alternative: add `login.py` to `ignores` and make the rule an error.
6. `gen-jinja-autoescape`: a `note` and no autofix.
   Alternative: an autofix to `autoescape=True` after checking the email templates.
7. `noInlineStyles`: `fix: "none"`, and off for SVG.
   Alternative: let Biome fix it unsafely.
8. Playwright rule written in ast-grep instead of adding ESLint.
   Alternative: install `eslint` and `typescript-eslint` at exact versions and port the rule to a RuleTester-tested ESLint rule.
9. Doc pointers shortened in place.
   Alternative: move them into new `backend/CLAUDE.md` and `frontend/CLAUDE.md` files.
10. Severity: rules with 0 open hits are `error`, and rules with open hits are `warning`, with promotion once the hits are fixed.
