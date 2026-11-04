# bulletproof-large-context: a large always-loaded file against lint rules

Confirmatory, Plan 3 in [analysis-plan.md](../analysis-plan.md), written before the runs.
64 runs, all ok: bulletproof-react, tasks T1 and T2, Sonnet and Haiku, 4 repeats, the rules, checkers and review fix of [bulletproof-notify-querykey](../bulletproof-notify-querykey/README.md).

## Arms

| arm | always-loaded `CLAUDE.md` | the two rules | lint rules + loop |
|---|---|---|---|
| `prose_loaded_large` | the project's `AGENTS.md` and all nine guides from `docs/`, verbatim | inside the guides, where `prose_buried` puts them | no |
| `rules` | short, links the docs | none (one-line pointer in `src/features/CLAUDE.md`) | yes |
| `rules_large` | as `prose_loaded_large`, without the two rules | none (pointer) | yes |
| `prose_loaded` | short, with the two rules | in `CLAUDE.md` | no |

Claude Code loads the whole large file: the first model request of every session carries 15.7k more tokens in the `_large` arms (about 33k against 17.2k), measured from the session transcripts.

## Results

Broken: a production-code break of a study rule after the task, before any review fix.
Cost: total per run including the review fix.

| comparison | runs broken | cost change | 95% interval |
|---|---|---|---|
| `prose_loaded_large` against `rules` (H5, H6) | 3/16 against 0/16, p = 0.100 | +20% | +1% to +42%, p = 0.016 |
| `rules_large` against `rules` (context tax) | 0/16 against 0/16 | +9% | -7% to +27% |
| `prose_loaded_large` against `prose_loaded` (dilution) | 3/16 against 0/16, p = 0.100 | +18% | 0% to +37% |

- H6 is supported: with all docs always loaded, a run costs 20% more than with lint rules and the docs on demand.
  With Holm's correction its p = 0.016 is below the first threshold of 0.025.
- H5 is not supported (p = 0.100 against 0.05): 3 of 16 runs broke a rule with the large file, none with lint rules.
  All 3 are Haiku showing the success notification in the component, the rule the large file states in its API-layer guide.
- The same rule sentence held in a short `CLAUDE.md` (0/16) and slipped in the large one (3/16, all Haiku): the always-loaded file stops protecting a rule as it grows.
- With lint rules, the large file made the agent write the notification break in 4 of 16 runs (3 Haiku, 1 Sonnet; 5 loop catches), against none with the short file; the loop fixed all of them before the session ended.
- The measured context tax is smaller and noisier than the derived one: `rules_large` cost Sonnet $0.030 more per run (+23%, -8% to +65%) against $0.09 derived for 15.7k tokens at median turns; for Haiku it was 4% cheaper, with fewer turns.
- Verify: production code passes the original test suite in all 64 runs; one Haiku `rules` run failed only its own new test.

## Limits

- 16 runs per arm and comparison: H5 could detect only a large difference, and its null result is not evidence of equal compliance.
- One project and one large file, the project's own docs; a file of another size or content may dilute more or less.
- Sessions that run back to back share the prompt cache, so the always-loaded prefix is written to cache less than once per session; the measured tax includes that, the derived price does not.

## How to reproduce

```bash
S=studies/bulletproof-large-context/study.json
node bench/bench.mjs run $S --models sonnet,haiku
node bench/bench.mjs verify $S
node bench/bench.mjs compare $S --arm prose_loaded_large --against rules --models sonnet,haiku          # H5, H6
node bench/bench.mjs compare $S --arm rules_large --against rules --models sonnet,haiku                 # context tax
node bench/bench.mjs compare $S --arm prose_loaded_large --against prose_loaded --models sonnet,haiku   # dilution
```
