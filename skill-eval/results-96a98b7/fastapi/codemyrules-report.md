# codemyrules report

Run on 2026-11-02, first run (no earlier `.claude/codemyrules/baseline.json`).
Selection followed the answers given in advance: every candidate stated in `CLAUDE.md` or `docs/*.md` was built, nothing found only in code and nothing general.
Nothing was committed.

## Stacks

- Backend: Python in `backend/` (Ruff 0.16.9 from `uv.lock`, mypy, ty), handled by `backend-pattern-rules`.
- Frontend: TypeScript/React in `frontend/` linted by Biome 2.5.14 (no ESLint), handled by `eslint-pattern-rules`.
- Generated code: `frontend/src/client/**` and `frontend/src/routeTree.gen.ts` (openapi-ts / TanStack Router), already excluded from Biome; `backend/app/alembic/` excluded from Ruff.
- Lint in CI: `.github/workflows/pre-commit.yml` runs prek, which runs Ruff, Biome (`npm run lint`), mypy and ty.
  ast-grep was not run before this change.

## Backend

### Rules in the main config (`sgconfig.yml`, 0 open hits)

All 23 are ast-grep rules at `error`, in `ast-grep/rules/`, with tests in `ast-grep/rule-tests/`:

| Rule | Convention (doc line) |
|---|---|
| `gen-no-import-routes` | nothing depends on routes (architecture.md:22) |
| `gen-crud-imports` | crud depends on models and core.security only (architecture.md:23) |
| `gen-models-imports` | models import nothing else from the app (architecture.md:24) |
| `gen-core-no-api-imports` | core never imports api (architecture.md:25) |
| `gen-routes-use-deps` | no `Session(...)`, engines or `jwt` in routes (backend.md:20, security.md:7) |
| `gen-engine-only-in-db` | `create_engine` only in `core/db.py` (database.md:15) |
| `gen-no-raw-sql` | no `text(...)` or string queries in `exec`/`execute` (database.md:18) |
| `gen-no-delete-in-loop` | bulk deletes use one `delete(...)` (database.md:32) |
| `gen-password-hashing-in-security` | hashing libs only in `core/security.py` (security.md:8) |
| `gen-cors-no-wildcard-origin` | no `allow_origins=["*"]` (security.md:32) |
| `gen-routes-no-broad-except` | no bare / `Exception` catches in routes (backend.md:52) |
| `gen-no-manual-422` | no hand-built 422s (api.md:25) |
| `gen-http-exception-detail` | `HTTPException(detail=...)` (api.md:27) |
| `gen-path-id-uuid` | `id` / `*_id` params are `uuid.UUID` (api.md:12, backend.md:14) |
| `gen-relationship-back-populates` | `Relationship(back_populates=...)` (database.md:10) |
| `gen-table-primary-key-uuid` | PK `uuid.UUID` with `default_factory=uuid.uuid4` (database.md:8) |
| `gen-table-created-at` | every table has `created_at` via `get_datetime_utc` (database.md:11, backend.md:39) |
| `gen-settings-singleton` | only `from app.core.config import settings` (backend.md:43) |
| `gen-count-in-database` | no `len(session.exec(...).all())` (database.md:17, partial) |
| `gen-no-bare-collection-response` | no bare list/dict responses (api.md:19, backend.md:37) |
| `gen-crud-keyword-session` | crud takes `*, session: Session` (backend.md:28) |
| `gen-tests-no-db-mock` | tests never patch crud, sessions or the engine (testing.md:13) |
| `gen-playwright-no-css-class-locators` | frontend rule, see below |

A temporary probe file confirmed that `sgconfig.yml` loads these rules and reports them.

### Suggestions layer (`sgconfig.suggestions.yml`, 78 open hits)

These rules go in `ast-grep/suggestions/` at `error`.
The main config and CI do not load them.
The feedback loop runs them on changed lines only.

| Rule | Hits | Files | Examples |
|---|---|---|---|
| `gen-routes-no-session-calls` (backend.md:22) | 32 | 3 | `routes/items.py:52` `session.get(Item, id)`, `routes/users.py`, `routes/private.py` |
| `gen-status-code-constants` (api.md:26) | 28 | 5 | `routes/items.py:54` `status_code=404`, `deps.py:55` `status_code=403` |
| `gen-endpoint-response-model` (api.md:17, backend.md:19) | 8 | 4 | `routes/items.py:99` `@router.delete("/{id}")`, `routes/login.py:23`, `routes/utils.py:29` |
| `gen-keyword-only-params` (backend.md:12) | 8 | 3 | `routes/items.py:14` `read_items`, `utils.py:70` `generate_reset_password_email` |
| `gen-router-prefix-tags` (backend.md:18, api.md:8) | 1 | 1 | `routes/login.py:20` `APIRouter(tags=["login"])` |
| `gen-model-str-max-length` (backend.md:38) | 1 | 1 | `models.py:53` `hashed_password: str` |

Every hit was checked against the agreed boundary: all 78 are real violations.
They match independent counts (`rg` for status codes, Python `ast` for the 8 keyword-only cases).
I narrowed one false positive found in testing (`request.session.get`) by limiting the receiver to the bare `session` variable.

- Run it: `npx -y -p @ast-grep/cli@0.51.0 ast-grep scan -c sgconfig.suggestions.yml <files>`
- Proposed CI test step: `ast-grep test -c sgconfig.suggestions.yml && ast-grep scan` (tests every rule, scans only the main rules).
- When a rule reaches 0 open hits, move it from `ast-grep/suggestions/` to `ast-grep/rules/`.

### Native Ruff config (`backend/pyproject.toml`)

```diff
     "T201",   # print statements are not allowed
+    "TID251", # banned APIs, see flake8-tidy-imports.banned-api
+    "DTZ",    # timezone-aware datetimes only
+    "S608",   # no SQL built from strings
 ]
+[tool.ruff.lint.per-file-ignores]
+"app/core/config.py" = ["TID251"]
+
+[tool.ruff.lint.flake8-tidy-imports.banned-api]
+"os.environ".msg = "Read configuration through `from app.core.config import settings`; ..."
+"os.environb" / "os.getenv" / "os.getenvb" (same message)
```

- TID251: no env reads outside `Settings` (architecture.md:38), 0 hits.
- DTZ: timezone-aware datetimes (backend.md:39), 0 hits.
- S608: no values formatted into SQL (database.md:30), 0 hits.
- Verified with Ruff 0.16.9: `ruff check .` in `backend/` passes, and a probe file triggers TID251, DTZ005 and S608.
- Ruff already covered: `X | None` (UP), mutable defaults (B006), `print` (T201), and type-checking by mypy strict.

### Where the rules went and why

- ast-grep, because the project has no custom rule set of its own, and these rules need folder scoping, "only through our helper" logic, or structural context that Ruff cannot express.
- Ruff, where a check the project already runs can express the convention (banned-api, DTZ, S608).
- ast-grep is not a project dependency: no build file or lockfile changed.
  It runs as `npx -y -p @ast-grep/cli@0.51.0 ast-grep` (or `uvx --from ast-grep-cli==0.51.0 ast-grep`).
  Proposed CI step, for example in pre-commit: `ast-grep test -c sgconfig.suggestions.yml && ast-grep scan`.
- Alternative not adopted: import-linter (`[tool.importlinter]`) for the four layer rules.
  It sees transitive imports, but it is a new dependency.

## Frontend

| Rule | Where | Hits | Convention |
|---|---|---|---|
| `lint/style/noRestrictedGlobals` (`fetch`) | `frontend/biome.json`, main | 0 | frontend.md:14 |
| `lint/nursery/noInlineStyles`, scoped to `src/**`, `fix: "none"` | `frontend/biome.json` override, main | 0 | frontend.md:25 |
| `gen-playwright-no-css-class-locators` | ast-grep (TypeScript), `frontend/tests/**/*.ts`, main | 0 | testing.md:23 |

```diff
         "noUselessElse": "error",
+        "noRestrictedGlobals": { "level": "error", "options": { "deniedGlobals": {
+          "fetch": "Call the backend only through the generated services in src/client (ItemsService, UsersService), never with fetch directly." } } }
 ...
   "overrides": [
+    { "includes": ["src/**"], "linter": { "rules": { "nursery": {
+      "noInlineStyles": { "level": "error", "fix": "none" } } } } },
```

- Biome is native and already runs in CI, so it wins over installing ESLint; `package.json` and `bun.lock` are unchanged.
- I scoped `noInlineStyles` to `src/**`: project-wide it flagged 11 `style` attributes inside `public/assets/images/*.svg`, which are not React styling.
- I set `fix: "none"` on it: its unsafe fix deletes the `style` attribute, and `bun run lint` runs `--write --unsafe`, so that fix would silently change behaviour.
- `noInlineStyles` is a nursery rule; it may be renamed or promoted in a later Biome minor (the lockfile pins 2.5.14).
- The Playwright rule uses ast-grep instead of a Biome GritQL plugin or a new ESLint setup, so it shares the backend rules' test harness and feedback loop.
- Verified with Biome 2.5.14: `biome lint ./` is clean with the new config, and a probe file triggers both Biome rules.
- Already covered: the TypeScript ignore directive, by `lint/suspicious/noTsIgnore` in the recommended preset (verified with a probe).
- Contradicted, not built: frontend.md:31 says "do not silence them with `any`", but `biome.json` turns `noExplicitAny` off.
  There are 2 hits: `src/components/Sidebar/User.tsx:43` and `src/utils.ts:5`.
  Decide between enforcing it (fix the 2 hits, or a suggestions config) and updating the doc.

## Agent-doc cleanup

All covered lines were in on-demand docs (`docs/*.md`, linked from the root `CLAUDE.md`).
The root `CLAUDE.md` has no rule-like lines, so the always-loaded docs lose 0 tokens.

- Deleted (29): api.md:12, 17, 19, 25, 26, 27; backend.md:12, 14, 18, 19, 20, 37, 38, 39, 43, 52; database.md:8, 10, 11, 18, 30, 32; architecture.md:38; security.md:7, 8, 32; testing.md:13, 23; frontend.md:14.
- Shortened (3):
  - backend.md:22 becomes "Routes reach the database only through functions in `app/crud.py`; add one when none fits (enforced by `gen-routes-no-session-calls`)."
    This convention shapes code before it is written, so the pointer stays.
  - backend.md:28 becomes "Functions in `crud.py` return models or `None`." (the session part is now a rule).
  - frontend.md:25 drops "no inline styles".
- Kept, because they are already one-line pointers or only partly covered: architecture.md:22-25 (layer rules, they shape design), api.md:8, api.md:18, backend.md:49, database.md:15, database.md:17, security.md:21, frontend.md:31.
- Removed: 2594 characters, about 648 on-demand tokens, and 0 always-loaded tokens.
- Pointers stay in place in `docs/backend.md`, which the root `CLAUDE.md` tells agents to read for backend work.
  No folder `CLAUDE.md` was created; `backend/app/api/routes/CLAUDE.md` would be the place for the backend.md:22 pointer if you want it loaded automatically.
- Honest benefit: the token saving is small and only on demand.
  The larger effect is fewer fix rounds, because the 6 suggestion rules cover patterns the existing route code breaks and agents would copy.
  That effect shows in `failures.log` and in review, not in the character count.

## Feedback loop: installed

- Fast tier (after each edit): ast-grep with `sgconfig.suggestions.yml`, on `.py` and `.ts`.
- Full tier (end of turn): `uv run ruff check --force-exclude --output-format=json`, on `.py`.
- Not in the loop: Biome, because the loop has no Biome output parser; it stays in pre-commit and CI.
  mypy and ty also stay in CI.
- Protected: `sgconfig*.yml`, `ast-grep/**`, `frontend/biome.json`, plus `.claude/codemyrules/` and `.claude/settings.local.json`.
  Lint settings inside `backend/pyproject.toml` are not guarded, because it is a shared build file.
  Optional: add `frontend/src/client/**` to `protect`, so hand edits to the generated client ask first.
- Files: `.claude/codemyrules/{guard,lint-edited,lint-turn,lib}.mjs`, `loop.json` and `.claude/settings.local.json`; both paths are added to `.git/info/exclude`.
- Smoke test: a new route file with `session.get(...)` was blocked with exit 2, and an edit to `routes/items.py` with only old hits stayed silent.
  I deleted the probe's failure-log entry afterwards.
- The guard also fired on the first draft of this report, because the report quoted suppression-comment keywords; I reworded the report instead of approving around it.
- Known local gap: `uv` is not installed on this machine, so the Ruff tier prints `codemyrules: ruff failed` and counts as clean until `uv` is available.

## Baseline (`.claude/codemyrules/baseline.json`)

- Always-loaded docs: 334 tokens per session (root `CLAUDE.md`).
- On-demand docs: 0 as measured.
  `measure.mjs` counts only `@import`ed and folder docs, not the Markdown-linked `docs/*.md`.
- Rules: 34, with 78 open hits (all in the 6 suggestion rules).
- `DTZ` is recorded as one family key; Ruff reports it per code (`DTZ005` and so on).
- On a re-run, `node .claude/skills/codemyrules/scripts/measure.mjs report .` compares against this file.
  A rule that fails often there needs an up-front pointer in the folder it applies to.

## Not built

- Doc lines no lint rule can check: api.md:9, 10, 11, 13, 18 (count is the total), 20, 24, 28, 32-34, 38-39, 43-44; backend.md:10, 11, 21, 23-24, 29-31, 36, 44-45, 49-51, 56-58; database.md:9, 15-16 (outside routes), 17 (column selection), 22-25, 29, 31, 36-37; security.md:5-6, 9, 13-16, 20-22, 26-28, 33, 37; testing.md:3, 7-12, 17-18, 22, 24, 28-29; frontend.md:9, 15-16, 20-21, 26, 30; architecture.md:26, 31, 37, 39, 43-44.
  These are about process, judgement, cross-file behaviour or types.
  Line numbers refer to the docs as they were before the cleanup.
- Code-only conventions (listed, not built, as instructed): `useQuery`/`useMutation` around generated services (13 files), list endpoints ordering by `created_at` desc, and `HTTPException` detail wording reuse.
- General rules: not offered, as instructed.
  I probed BLE001 (0 hits) and did not build it, since the doc scope is routes only, which `gen-routes-no-broad-except` covers.

## Scan log

| Signal | Count | Verdict |
|---|---|---|
| `status_code=<int>` | 28 / 5 files, 1 file uses `status.` | suggestions |
| session calls in routes | 32 / 3 files | suggestions |
| route decorators without `response_model` | 8 of 23 | suggestions |
| >2 positional params without `*` | 8 / 3 files (crud.py follows) | suggestions |
| `APIRouter` without prefix | 1 of 5 routers | suggestions |
| table/Base `str` without `max_length` | 1 | suggestions |
| env reads, `create_engine` outside db, `jwt` in routes, raw SQL, broad except, hashing libs, CORS `*`, bare collections, `len(...all())`, db mocks in tests | 0 each | main |
| frontend `fetch`, inline styles outside `ui/`, TS ignore directives, class locators | 0 each | main / covered |
| frontend `any` | 2 | contradicted |
| suppression comments | 2 (alembic `env.py`, `core/config.py`) | no cluster |

Tests: `ast-grep test -c sgconfig.suggestions.yml` passes 29 of 29 with snapshots.

## Design answers given on your behalf

Nobody could answer, so I took the safer side; the alternatives are noted.

1. Severity `error` for every rule; rules with existing hits went into the suggestions layer, keeping CI green.
   Alternative: fix the 78 hits now and move the 6 rules into the main config.
2. No autofix anywhere (`note` only, `fix: "none"` on `noInlineStyles`).
   Alternative: a fix for `status_code=404` to `status.HTTP_404_NOT_FOUND`, which also needs an import.
3. `gen-routes-no-session-calls` also bans `refresh`, `execute`, `flush`, `merge`, `scalar(s)` and `add_all`, beyond the five methods the doc names.
   Alternative: only the five.
4. `gen-password-hashing-in-security` also bans `hashlib` and `hmac` outside `core/security.py`.
   Alternative: only password libraries (`pwdlib`, `passlib`, `bcrypt`, `argon2`).
5. TID251 and DTZ also apply to `backend/tests`.
   Alternative: a per-file ignore for `tests/**`.
6. `noInlineStyles` is scoped to `src/**`, leaving the shadcn `ui/` folder excluded, as Biome already does.
   Alternative: also lint `ui/`, which has 4 inline styles.
7. The layer rules are ast-grep (direct imports only).
   Alternative: import-linter contracts, which also catch transitive imports.
8. The backend.md:22 pointer stays in `docs/backend.md`.
   Alternative: move it to a new `backend/app/api/routes/CLAUDE.md`.
9. `noExplicitAny` is left off (contradicted).
   Alternative: enforce it and fix the 2 hits.
