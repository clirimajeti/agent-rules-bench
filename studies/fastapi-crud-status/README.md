# fastapi-crud-status

Second stack: [full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template) (Python, FastAPI, SQLModel), backend only.
Tests the claim from the Java studies on a new language: rules + pointer + loop are cheaper where prose is missed and equal where prose is followed.

## Rules

Both go against the template's existing habits, so copying nearby code breaks them:
- `db-access-in-crud` (design-shaping): route handlers in `app/api/routes` never call `session.exec/get/add/delete/commit`; database access goes through `app/crud.py`. Existing routes call the session directly 32 times.
- `http-status-constants` (mechanical): `status.HTTP_404_NOT_FOUND`, never `status_code=404`. Existing code has 28 integer literals and one constant.

Docs and checkers both scope the rules to `backend/app`, not tests (fixing the scope mismatch of jhipster-buried).

## Arms

All arms get the same `CLAUDE.md` and 8 linked docs (about 4,000 tokens, built by [arms/docs.sh](arms/docs.sh)); they differ only in where the two rules are:
- `prose_buried` (baseline): one bullet each, mid-list in `docs/backend.md` and `docs/api.md`.
- `prose_loaded`: the two rules in the always-loaded `CLAUDE.md`.
- `rules`: no rule prose; ast-grep rules, the codemyrules feedback loop, and a one-line pointer for the DB rule in `backend/app/CLAUDE.md`.

The template ships a generic `library-skills` Claude skill and links to FastAPI and SQLModel skills that resolve only after `uv sync`; they are the same in every arm and left as they are.

## Tasks and size

T1: a per-user item stats endpoint. T2: clear an item's description with owner/superuser checks.
Sonnet and Haiku, 4 repeats: 48 runs.

## Result

Not run yet.
