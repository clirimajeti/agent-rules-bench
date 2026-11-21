# n8n-conventions

Plan 7 (draft, not registered).
Design: [docs/superpowers/specs/2026-11-21-plan-7-n8n-design.md](../../docs/superpowers/specs/2026-11-21-plan-7-n8n-design.md).

n8n's own written rules, in its own instruction files, against the same rules as lint rules with the feedback loop.
n8n keeps its rules in many instruction files: 30 `AGENTS.md` and 14 `CLAUDE.md`.
Claude Code reads the root `AGENTS.md` in every session (the root `CLAUDE.md` is `@AGENTS.md`), and a folder's `AGENTS.md` when it works in a folder whose `CLAUDE.md` imports it.

- `prose`: n8n exactly as its maintainers ship it.
- `rules`: each rule's bullet removed from every instruction file that has it, each rule a lint rule with the codemyrules feedback loop, and a pointer line for each design-shaping rule.

## Tasks

Each task sits next to n8n code that already breaks the rules that apply there ([baseline-findings.md](baseline-findings.md)), and outside every `.ee` area.
The prompts name only the feature; none contains a word of a rule (checked by grep for rule words such as repository, transaction, error, any, cast, helper).

| Task | Place | Rules that apply | Nearby code that breaks them |
|---|---|---|---|
| T1 | `packages/cli/src/modules/chat-hub` | repositories-compose, no-manager-in-business-logic, no-as-cast, shared-helpers | `ChatHubSessionRepository extends BaseRepository`, `messageRepository.manager.transaction` in `chat-hub.service.ts` |
| T2 | `packages/cli/src/modules/oauth-server` | repositories-compose, no-manager-in-business-logic, no-as-cast, shared-helpers | six repositories that extend `Repository` or `BaseRepository`, `createQueryBuilder` in `oauth-server.service.ts` |
| T3 | `packages/nodes-base/nodes/KoBoToolbox` | node-errors, no-any-in-nodes, no-as-cast, shared-helpers | `throw new Error` and `any` in `GenericFunctions.ts` |
| T4 | `packages/nodes-base/nodes/Bitwarden` | node-errors, no-any-in-nodes, no-as-cast, shared-helpers | `Promise<any>` and casts in `GenericFunctions.ts` |

T1 and T2 read the root `AGENTS.md`; T3 and T4 also read `packages/nodes-base/AGENTS.md`.

## License

- n8n is under the Sustainable Use License, except files with `.ee` in a file or folder name, which are under the n8n Enterprise License.
  A copy of n8n's license is in [N8N-LICENSE.md](N8N-LICENSE.md).
- The diffs in `results/*/diff.patch` are modified n8n code, under the Sustainable Use License, not under CC BY 4.0.
  The study modified n8n: the agent changed its code in every run, and the `rules` arm removed rule bullets from its instruction files.
  The study is non-commercial research, and the results are published free of charge.
- No enterprise code is published: no task is in an `.ee` area, and `node check-ee.mjs results` must print nothing before results are published.
- The rest of this folder is under the repository's licenses: MIT for code, CC BY 4.0 for text.
