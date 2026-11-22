# Conventions: n8n-conventions

## repositories-compose

**Repositories compose, they don't extend.** A repository is the boundary that keeps TypeORM out of business logic. If it extended `BaseRepository`, every service that injects it would also get `find`, `save`, `delete`, `createQueryBuilder` and `.manager` for free, and TypeORM would leak through inferred types that no lint rule can see. So a repository is a plain `@Service()` class that holds a **file-private `BaseRepository` subclass (the table)** as a private field and resolves the manager with `this.table.managerFor(ctx)`. The table is never exported or registered with DI. Every data access is a named use-case method on the repository that calls the table internally; there is no generic `find`/`save`/`delete` unless you write it for one operation. See `packages/cli/src/modules/inbound-auth-core/database/repositories/trusted-source.repository.ts` for a worked example. The existing `extends BaseRepository` / `extends Repository` repositories are legacy. Do not copy them, and do not convert them in unrelated PRs. This rule is not yet lint-enforced.

## no-manager-in-business-logic

**Transactions:** transaction orchestration belongs in the persistence layer. Don't reach for `.manager` / `.manager.transaction(...)` or `createQueryBuilder(...)` in business logic. Use the sanctioned primitive in `@n8n/db`: inject the abstract `TransactionRunner` and wrap the unit of work in `txRunner.run(ctx, async (ctx) => …)`. The callback receives an `OperationContext` carrying the active transaction; thread that `ctx` into the repository methods you call. `run` **requires** a context — pass an empty `{}` at the operation entry point, and reuse the one you were handed everywhere below it (a context that already carries a transaction is joined, not nested). The `Transaction` handle is opaque and never exposes a driver type to business logic. See `oauth-token.service.ts` for a worked service example (its repositories predate the composition rule below; do not copy their shape).

## no-as-cast

**Avoid type casting with `as`** - use type guards or type predicates instead (except in test code where `as` is acceptable)

## shared-helpers

**Shared utilities:** before you hand-roll a utility (`isRecord`, secret or PII redaction, JSON extraction from LLM output, Zod to JSON Schema, model-id parsing, AI client HTTP transport and response-size limiting, …), you MUST check the shared packages for an existing implementation and use it: `@n8n/utils` (generic helpers, redaction), `@n8n/ai-utilities` (AI- and LLM-specific helpers) and `n8n-workflow` (workflow graph and traversal). A new shared helper usually belongs in one of these packages too; domain logic stays in the package that owns the domain.

## node-errors

Use `NodeOperationError` for user-facing errors. Use `NodeApiError` for API-related errors.

## no-any-in-nodes

Never use `any` type - use proper types or `unknown`
