# jhipster-clock-authorities

Replication on [jhipster-sample-app](https://github.com/jhipster/jhipster-sample-app) at `6b000b5`, a public Spring Boot app whose existing code calls `Instant.now()` 7 times and hard-codes `'ROLE_ADMIN'` 4 times.
Rules: `use-clock-injection` (design-shaping) and `authorities-from-constants` (mechanical).
Two neutral tasks (admin-only endpoints over the last 7 and 30 days), Sonnet, 4 repeats, review fix available to every arm.

## Arms

- `prose_linked`: `CLAUDE.md` holds one sentence linking to `docs/conventions.md`, which holds the two rules.
- `prose_loaded`: the two rules directly in `CLAUDE.md`.
- `rules`: no prose rules; ast-grep rules, the codemyrules feedback loop, and a one-line pointer for the clock rule in `src/main/java/CLAUDE.md`.

## Result (2026-11-01)

| arm | runs broken | fix rounds | hook catches | cost per run | turns |
|---|---|---|---|---|---|
| prose_linked | 0 of 8 | 0 | - | $0.134 ±0.036 | 16.9 |
| prose_loaded | 0 of 8 | 0 | - | $0.135 ±0.042 | 15.4 |
| rules | 0 of 8 | 0 | 0 | $0.136 ±0.033 | 14.9 |

Every run injected a `Clock` and used `AuthoritiesConstants`; the diffs were checked by hand as well as by the rules.

## Reading

- When the agent sees the prose, rules + pointer are cost-neutral and the hooks never fire: a free guarantee (as in internal round 6).
- A short, prominent link is followed as reliably as always-loaded prose. The internal study's failures came from a rule buried in about 6,500 tokens of linked instruction files, so the variable is how buried the prose is, not only whether it is linked.
- Next: a `prose_buried` arm with a realistic set of longer convention files, to replicate the failure case on public code.

Full numbers: [results/summary.md](results/summary.md), per run: [results/runs.csv](results/runs.csv).
