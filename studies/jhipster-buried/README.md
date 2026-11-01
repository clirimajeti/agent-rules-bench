# jhipster-buried

Follow-up to [jhipster-clock-authorities](../jhipster-clock-authorities/README.md), where a one-sentence link to a two-rule doc was followed in every run.
This study tests the realistic case: the same two rules are single bullets in the middle of long linked docs.

Same repo, commit, tasks, rules, checkers and fix prompt as the first study.

## Arms

- `prose_buried` (baseline): `CLAUDE.md` gives a short overview and links to 8 docs (architecture, backend, API, persistence, security, testing, frontend, workflow; about 5,000 tokens in all).
  The clock rule is one bullet in the middle of the services section of `docs/backend.md`, the authorities rule one bullet in the middle of the authorization section of `docs/security.md`.
- `rules`: the identical docs without those two bullets, plus the ast-grep rules, the codemyrules feedback loop, and a one-line pointer for the clock rule in `src/main/java/CLAUDE.md`.

Both arms build their docs from [arms/files](arms/files/) with [arms/docs.sh](arms/docs.sh), so the docs differ only in the two bullets.

## Models

Sonnet and Haiku, 2 tasks x 4 repeats each: 32 runs.
Haiku shows whether a smaller model drops buried prose sooner.

## Result

Not run yet.
