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
- `generated`: what codemyrules built on its own from the `prose_buried` state ([skill-eval run 96a98b7](../../skill-eval/results-96a98b7/SCORE.md)), applied by [arms/generated.sh](arms/generated.sh): its ast-grep, Ruff and Biome rules (both study rules in the suggestions layer), the slimmed docs with the DB pointer kept in `docs/backend.md`, and its feedback loop.
  The loop's Ruff tier is left out: it runs through `uv`, which the bench machine lacks, and checks neither study rule.

The template ships a generic `library-skills` Claude skill and links to FastAPI and SQLModel skills that resolve only after `uv sync`; they are the same in every arm and left as they are.

## Tasks and size

T1: a per-user item stats endpoint. T2: clear an item's description with owner/superuser checks.
Sonnet and Haiku, 4 repeats: 48 runs.

## Result (2026-11-02)

| arm | model | runs broken after task | fix rounds | loop catches (db / status) | runs with tests | total cost per run | turns |
|---|---|---|---|---|---|---|---|
| prose_buried | sonnet | 0 of 8 | 0 | - | 5 of 8 | $0.161 ±0.055 | 15.0 |
| prose_loaded | sonnet | 0 of 8 | 0 | - | 0 of 8 | $0.101 ±0.038 | 11.5 |
| rules | sonnet | 0 of 8 | 0 | 5 / 8 | 6 of 8 | $0.161 ±0.038 | 15.1 |
| prose_buried | haiku | 2 of 8 | 2 | - | 4 of 8 | $0.019 ±0.006 | 22.3 |
| prose_loaded | haiku | 0 of 8 | 0 | - | 5 of 8 | $0.015 ±0.003 | 16.4 |
| rules | haiku | 0 of 8 | 0 | 8 / 10 | 4 of 8 | $0.014 ±0.004 | 17.5 |

All 48 runs ended with 0 breaks; the diffs were checked by hand: no added route code calls the session, every new status code is a constant, and every run added a crud function.
4 Sonnet runs come from a first attempt that hit a usage limit; the rest from the resumed run, with the same setup.

## Reading

- **Buried prose held up better here than on Java:** Sonnet 0 of 8, Haiku 2 of 8 broken. The agents read the linked docs (most wrote tests, which only `docs/testing.md` asks for).
- **Without prose, the mechanical rule was broken by imitation:** in the rules arm every T2 first draft (8 of 8) wrote `status_code=404` like the existing code; the loop caught it in the same turn. In the internal study the mechanical rule was never broken without prose; here existing code pulls the other way.
- **Always-loaded prose was cheapest for Sonnet (-37%) because it did less work:** with the rules in `CLAUDE.md`, Sonnet stopped opening the linked docs and wrote no tests in any run, missing the testing convention. Like for like, Sonnet with tests cost $0.192 (buried) vs $0.166 (rules); without tests $0.109 (buried), $0.101 (loaded), $0.147 (rules, 2 runs).
- So the side effect of always-loaded rules is that the agent may skip the rest of the docs; the cost comparison is confounded by that.

## Generated arm (codemyrules' own output)

0 of 16 runs broke either rule; the loop caught `gen-status-code-constants` 22 times and `gen-routes-no-session-calls` 7 times, each fixed in the same turn.
Cost per run against `rules`: Haiku -41%, Sonnet -55%.
These runs wrote tests in 1 of 16 runs against 10 of 16, as with `prose_loaded` Sonnet; on runs without tests it is still -33% (Haiku) and -50% (Sonnet).
