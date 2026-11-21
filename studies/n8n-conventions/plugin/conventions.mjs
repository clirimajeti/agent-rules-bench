// The conventions of this study, taken word for word from n8n's own instruction files at the pinned commit.
// One entry each: `sources` lists every instruction file that states the rule, with the exact bullet block the rules
// arm removes (all its lines); `prose` is the first block as one line without its bullet (it is also the lint message
// and the review's words); `pointer` marks a design-shaping rule (the rules arm adds that line to the root AGENTS.md);
// the examples are what the tests run. Globs are relative to the copy root.
// The blocks keep the maintainers' text exactly, including their em dashes.

// Generated from the pinned checkout (each bullet with its indented continuation lines).
const REPOS = "- **Repositories compose, they don't extend.** A repository is the boundary\n  that keeps TypeORM out of business logic. If it extended `BaseRepository`,\n  every service that injects it would also get `find`, `save`, `delete`,\n  `createQueryBuilder` and `.manager` for free, and TypeORM would leak through\n  inferred types that no lint rule can see. So a repository is a plain\n  `@Service()` class that holds a **file-private `BaseRepository` subclass (the\n  table)** as a private field and resolves the manager with\n  `this.table.managerFor(ctx)`. The table is never exported or registered with\n  DI. Every data access is a named use-case method on the repository that\n  calls the table internally; there is no generic `find`/`save`/`delete`\n  unless you write it for one operation. See\n  `packages/cli/src/modules/inbound-auth-core/database/repositories/trusted-source.repository.ts`\n  for a worked example. The existing `extends BaseRepository` / `extends\n  Repository` repositories are legacy. Do not copy them, and do not convert them\n  in unrelated PRs. This rule is not yet lint-enforced.";
const TX = "- **Transactions:** transaction orchestration belongs in the persistence layer.\n  Don't reach for `.manager` / `.manager.transaction(...)` or\n  `createQueryBuilder(...)` in business logic. Use the sanctioned primitive in\n  `@n8n/db`: inject the abstract `TransactionRunner` and wrap the unit of work in\n  `txRunner.run(ctx, async (ctx) => …)`. The callback receives an\n  `OperationContext` carrying the active transaction; thread that `ctx` into the\n  repository methods you call. `run` **requires** a context — pass an empty `{}`\n  at the operation entry point, and reuse the one you were handed everywhere\n  below it (a context that already carries a transaction is joined, not nested).\n  The `Transaction` handle is opaque and never exposes a driver type to\n  business logic. See `oauth-token.service.ts` for a worked service example\n  (its repositories predate the composition rule below; do not copy their shape).";
const AS_ROOT = "- **Avoid type casting with `as`** - use type guards or type predicates instead (except in test code where `as` is acceptable)";
const AS_NODES = "- Avoid type casting with `as` - use type guards instead";
const HELPERS = "- **Shared utilities:** before you hand-roll a utility (`isRecord`, secret or\n  PII redaction, JSON extraction from LLM output, Zod to JSON Schema, model-id\n  parsing, AI client HTTP transport and response-size limiting, …), you MUST\n  check the shared packages for an existing\n  implementation and use it: `@n8n/utils` (generic helpers, redaction),\n  `@n8n/ai-utilities` (AI- and LLM-specific helpers) and `n8n-workflow`\n  (workflow graph and traversal). A new shared helper usually belongs in one of\n  these packages too; domain logic stays in the package that owns the domain.";
const DEBOUNCE = "- Use centralized debounce times from `@n8n/frontend-constants/durations` instead of hardcoding:";
const ALIAS = "- In `editor-ui`, import a file from a different folder with the `@/` alias. `@/` is `editor-ui/src/`.\n  Do not add `../` imports in new or changed code. Old code still has them. Do not copy them.";
const NODE_OP = "- Use `NodeOperationError` for user-facing errors";
const NODE_API = "- Use `NodeApiError` for API-related errors";
const ANY_ROOT = "- **NEVER use `any` type** - use proper types or `unknown`";
const ANY_NODES = "- Never use `any` type - use proper types or `unknown`";

const ROOT = 'AGENTS.md', FRONTEND = 'packages/frontend/AGENTS.md', NODES = 'packages/nodes-base/AGENTS.md';
const prose = (block) => block.replace(/^- /, '').replace(/\n\s*/g, ' ');

// Where n8n's own code lives for each area the tasks touch; tests, stories, mocks and e2e specs are left alone.
const CLI = ['packages/cli/src/**/*.ts'];
const EDITOR = ['packages/frontend/editor-ui/src/**/*.{ts,vue}'];
const FRONTEND_SRC = ['packages/frontend/**/*.{ts,vue}'];
const NODE_SRC = ['packages/nodes-base/{nodes,credentials,utils}/**/*.ts'];
export const TESTS = ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**', '**/__mocks__/**', '**/test/**', '**/tests/**', '**/*.stories.ts', '**/e2e/**', '**/playwright/**'];

// one placeholder example each; the checker tasks replace them
const todo = (file) => ({ valid: [{ filename: file, code: 'export const ok = 1;' }], invalid: [{ filename: file, code: 'export const todo = 1;' }] });

export const conventions = [
  {
    id: 'repositories-compose', kind: 'design', files: ['packages/**/*.ts'],
    sources: [{ file: ROOT, block: REPOS }], prose: prose(REPOS),
    pointer: 'Repositories compose, they don\'t extend: a repository is a plain `@Service()` class that holds a file-private `BaseRepository` subclass as its table (enforced by lint).',
    valid: [
      { filename: 'packages/cli/src/modules/x/database/repositories/x.repository.ts', code: 'class XTable extends BaseRepository<X> {}\n@Service()\nexport class XRepository {\n  constructor(private readonly table: XTable) {}\n}' },
      { filename: 'packages/cli/src/x.ts', code: 'export class XService extends BaseService {}' },
    ],
    invalid: [
      { filename: 'packages/@n8n/db/src/repositories/x.repository.ts', code: 'export class XRepository extends Repository<X> {}', line: 1 },
      { filename: 'packages/cli/src/modules/x/database/repositories/x.repository.ts', code: 'import { Service } from "@n8n/di";\n@Service()\nclass XRepository extends BaseRepository<X> {}', line: 2 },
    ],
  },
  {
    id: 'no-manager-in-business-logic', kind: 'design', files: CLI,
    ignores: ['**/repositories/**', '**/database/**', '**/databases/**', '**/migrations/**', '**/*.repository.ts'],
    sources: [{ file: ROOT, block: TX }], prose: prose(TX),
    pointer: 'Transactions belong in the persistence layer: no `.manager` or `createQueryBuilder(...)` in business logic; use the `TransactionRunner` from `@n8n/db` (enforced by lint).',
    valid: [
      { filename: 'packages/cli/src/modules/x/database/repositories/x.repository.ts', code: 'export const a = (r: R) => r.manager.transaction(async () => 1);' },
      { filename: 'packages/cli/src/services/x.service.ts', code: 'export const a = (tx: TransactionRunner) => tx.run({}, async (ctx) => ctx);' },
    ],
    invalid: [
      { filename: 'packages/cli/src/services/x.service.ts', code: 'export const a = (r: R) => r.manager.transaction(async () => 1);' },
      { filename: 'packages/cli/src/controllers/x.controller.ts', code: 'export const a = (r: R) => r.createQueryBuilder("x").getMany();' },
    ],
  },
  {
    id: 'no-as-cast', kind: 'mechanical', files: [...CLI, ...EDITOR, ...NODE_SRC],
    sources: [{ file: ROOT, block: AS_ROOT }, { file: NODES, block: AS_NODES }], prose: prose(AS_ROOT),
    valid: [
      { filename: 'packages/cli/src/x.ts', code: 'export const a = [1, 2] as const;' },
      { filename: 'packages/cli/src/x.test.ts', code: 'export const a = b as string;' },
      { filename: 'packages/cli/src/__tests__/x.ts', code: 'export const a = b as string;' },
    ],
    invalid: [
      { filename: 'packages/cli/src/x.ts', code: 'export const a = b as string;' },
      { filename: 'packages/nodes-base/nodes/X/X.node.ts', code: 'export const a = JSON.parse(s) as { id: string };' },
    ],
  },
  {
    id: 'shared-helpers', kind: 'mechanical', files: [...CLI, ...EDITOR, ...NODE_SRC], ignores: ['packages/@n8n/utils/**'],
    sources: [{ file: ROOT, block: HELPERS }], prose: prose(HELPERS),
    valid: [
      { filename: 'packages/@n8n/utils/src/is-record.ts', code: 'export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);' },
      { filename: 'packages/cli/src/x.ts', code: 'import { isRecord } from "@n8n/utils";\nexport const a = (v: unknown) => isRecord(v);' },
      { filename: 'packages/cli/src/x.ts', code: 'export const a = (v: unknown) => typeof v === "object" && v !== null;' },
    ],
    invalid: [
      { filename: 'packages/cli/src/x.ts', code: 'export const isRecord = (v: unknown) => Boolean(v);' },
      { filename: 'packages/cli/src/x.ts', code: 'export function isRecord(v: unknown) { return Boolean(v); }' },
      { filename: 'packages/cli/src/x.ts', code: 'export const a = (v: unknown) => !Array.isArray(v) && v !== null && typeof v === "object";' },
    ],
  },
  {
    id: 'central-debounce-times', kind: 'mechanical', files: FRONTEND_SRC,
    sources: [{ file: FRONTEND, block: DEBOUNCE }], prose: prose(DEBOUNCE),
    ...todo('packages/frontend/editor-ui/src/x.ts'),
  },
  {
    id: 'editor-ui-alias-imports', kind: 'mechanical', files: EDITOR,
    sources: [{ file: FRONTEND, block: ALIAS }], prose: prose(ALIAS),
    ...todo('packages/frontend/editor-ui/src/x.ts'),
  },
  {
    id: 'node-errors', kind: 'mechanical', files: NODE_SRC,
    sources: [{ file: NODES, block: NODE_OP }, { file: NODES, block: NODE_API }], prose: `${prose(NODE_OP)}. ${prose(NODE_API)}.`,
    ...todo('packages/nodes-base/nodes/X/X.node.ts'),
  },
  {
    id: 'no-any-in-nodes', kind: 'mechanical', files: NODE_SRC,
    sources: [{ file: NODES, block: ANY_NODES }, { file: ROOT, block: ANY_ROOT }], prose: prose(ANY_NODES),
    ...todo('packages/nodes-base/nodes/X/X.node.ts'),
  },
];

export const ruleText = Object.fromEntries(conventions.map((c) => [`local/${c.id}`, c.prose]));
