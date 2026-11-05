# bulletproof-business-context: forty conventions in a realistic CLAUDE.md, and the context tax

Confirmatory, Plan 5 in [analysis-plan.md](../analysis-plan.md), written before the runs.
The three arms of [bulletproof-40-rules](../bulletproof-40-rules/README.md), built by the same script, with every arm's always-loaded `CLAUDE.md` also holding [context.md](context.md): 1,328 words of business context (product, roles, domain, screens, API, commands, workflow, known issues, roadmap) and no conventions.

| arm | `CLAUDE.md` | lint rules + loop |
|---|---|---|
| `none` | short header and business context, 1,379 words | no |
| `prose` | the same plus the 40 prose lines, 2,085 words | no |
| `rules` | as `none` | the 40 rules, and 8 pointers in `src/features/CLAUDE.md` |

Tasks: T1 to T4 of the 40-rules study, which need the conventions (4 repeats), and C1 to C4, outside the scope of all 40 conventions (8 repeats): a question, an end-to-end test, the Vite config and the Playwright config.
Sonnet and Haiku: 288 runs.

Results follow after the runs.
