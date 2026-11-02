# codemyrules report

Run on 2026-11-02 against `jhipsterSampleApplication` (branch `bench`), first run (no earlier baseline).

## Setup found

- Backend: Java 21 / Maven in `src/main/java` and `src/test/java`, owned by `backend-pattern-rules` (ast-grep 0.51.0 through `npx`, no build file touched).
- Frontend: Angular in `src/main/webapp`, ESLint 10.10.0 flat config `eslint.config.ts` with angular-eslint 22.5.0, owned by `eslint-pattern-rules`.
- Generated code: JHipster 9.4.0 (`.yo-rc.json`, `.jhipster/`) generated almost all CRUD, admin and account code.
  Rules guard new code there, but existing hits in generated files are fixed in the JHipster templates or a blueprint, or as marked hand edits (docs/architecture.md), since a plain hand edit is lost on the next `jhipster upgrade`.
- Already enforced: ArchUnit `TechnicalStructureTest` (layer rules), Checkstyle (NoHttp only), Prettier, ESLint (`npm run lint`, run as `pretest` in CI).
- Agent docs: root `CLAUDE.md` (always loaded) linking `docs/*.md` (on demand, only when followed).
  No decision records.
- `node_modules` was installed with `npm install --ignore-scripts --no-package-lock` (no lockfile exists; `package.json` is unchanged and `node_modules/` is git-ignored).

## Backend: ast-grep rules

Every rule is `severity: error`, has a test file with valid and invalid cases from the real code, and a recorded snapshot.
`ast-grep test -c sgconfig.suggestions.yml`: 28 passed, 0 failed.
Plain `ast-grep scan` (main config): 0 findings.

### Main layer (`ast-grep/rules/`, 0 open hits each)

| Rule | Doc source |
|---|---|
| gen-no-field-injection | backend.md: no `@Autowired` field injection (scope `src/main/java`) |
| gen-no-null-collection-return | backend.md: no `null` from collection-returning methods |
| gen-logger-declaration | backend.md: `private static final Logger LOG = LoggerFactory.getLogger(...)` |
| gen-no-log-concatenation | backend.md: parameterised log messages (literal-only concatenation allowed) |
| gen-no-empty-catch | backend.md: never swallow an exception (empty or comment-only catch) |
| gen-dto-suffix | backend.md: types in `service.dto` end with `DTO` |
| gen-admin-resource-preauthorize | security.md: `/api/admin` resources carry `@PreAuthorize` per endpoint |
| gen-no-security-context-holder-in-service | security.md: services use `SecurityUtils` |
| gen-no-query-concatenation | security.md: no JPQL/SQL by concatenation or formatting |
| gen-no-message-digest | security.md: hash passwords with `PasswordEncoder` |
| gen-keys-from-randomutil | security.md: activation and reset keys from `RandomUtil` |
| gen-no-loose-value-property | architecture.md: custom properties through `ApplicationProperties` |
| gen-no-manual-threads | architecture.md: `@Async`, never hand-made threads or executors |
| gen-lazy-to-one | persistence.md: associations mapped lazily |
| gen-repository-extends-jpa | persistence.md: repositories extend `JpaRepository` |
| gen-cache-name-constant | persistence.md: cache names from repository constants |
| gen-integration-test-annotation | testing.md: `*IT` classes carry `@IntegrationTest` (or the project's `@AuthenticationIntegrationTest`) |
| gen-no-thread-sleep-in-tests | testing.md: Awaitility, not `Thread.sleep` |
| gen-no-new-top-level-package | architecture.md: no new top-level packages |

### Suggestions layer (`ast-grep/suggestions/`, 28 open hits)

The existing code breaks these, so they are not in `sgconfig.yml` and CI is unchanged.
The feedback loop runs them on every changed line.
Run them by hand with `npx -y -p @ast-grep/cli@0.51.0 ast-grep scan -c sgconfig.suggestions.yml <files>`.
Move a rule to `ast-grep/rules/` once its hits reach 0.

| Rule | Hits | Where (all in JHipster-generated files) |
|---|---|---|
| gen-valid-request-body | 6 | `AccountResource.java:149,163,183`; PATCH endpoints `BankAccountResource.java:110`, `LabelResource.java:108`, `OperationResource.java:115` (JHipster skips `@Valid` on partial updates on purpose) |
| gen-clock-now | 4 | `UserService.java:72,88,159,293` (scope: `service/**` only) |
| gen-no-transactional-in-web-or-repository | 4 | class-level `@Transactional` on `AuthorityResource`, `BankAccountResource`, `LabelResource`, `OperationResource` |
| gen-no-role-literal | 4 | `AuthorityResource.java:50,68,81,95` (`hasAnyAuthority('ROLE_ADMIN')`) |
| gen-paged-list-endpoints | 3 | `AuthorityResource.java:67`, `BankAccountResource.java:146`, `LabelResource.java:142` |
| gen-no-optional-field-or-param | 2 | `OperationRepositoryWithBagRelationships.java:9`, `...Impl.java:25` |
| gen-no-sensitive-log-args | 2 | `UserService.java:57,69` (log the activation and reset key) |
| gen-assertj-only | 2 | `CRLFLogConverterTest.java:4` (8 `assertEquals` calls), `MailServiceIT.java:4` (`assertDoesNotThrow`) |
| gen-no-broad-catch | 1 | `SecurityJwtConfiguration.java:34` |

### Config added

```diff
+ sgconfig.yml
+ ruleDirs: [ast-grep/rules]
+ testConfigs:
+   - testDir: ast-grep/rule-tests
+ sgconfig.suggestions.yml
+ ruleDirs: [ast-grep/rules, ast-grep/suggestions]
+ testConfigs:
+   - testDir: ast-grep/rule-tests
```

The project does not run ast-grep yet.
Proposed CI step, with no build-file change: `npx -y -p @ast-grep/cli@0.51.0 ast-grep test -c sgconfig.suggestions.yml && npx -y -p @ast-grep/cli@0.51.0 ast-grep scan`.

## Frontend: ESLint rules

Main config `eslint.config.ts` over all of `src/main/webapp/app` (307 files): 0 findings.
Each rule was also confirmed to fire through the project's own ESLint on a temporary violating file (files restored).
Custom rule tests (`node --test eslint-rules/*.test.js`): 17 passed, 0 failed.

### Config change (`eslint.config.ts`)

```diff
+import genNoHardcodedTemplateText from './eslint-rules/gen-no-hardcoded-template-text.js';
+import genRouteAuthoritiesNeedGuard from './eslint-rules/gen-route-authorities-need-guard.js';
 ...
+  { plugins: { local: { rules: { 'gen-no-hardcoded-template-text': ..., 'gen-route-authorities-need-guard': ... } } } },
+  { files: ['src/main/webapp/**/*.ts'], ignores: ['src/main/webapp/**/*.spec.ts'],
+    rules: { 'local/gen-route-authorities-need-guard': 'error' } },
+  { files: ['src/main/webapp/app/app.routes.ts', 'src/main/webapp/app/admin/admin.routes.ts', 'src/main/webapp/app/entities/entity.routes.ts'],
+    rules: { 'no-restricted-syntax': ['error', { selector: "Property[key.name='component']", message: 'Lazy-load feature routes ...' }] } },
+  { files: ['src/main/webapp/**/*.spec.ts'],
+    rules: { 'no-restricted-imports': ['error', { paths: [{ name: '@angular/common/http/testing', importNames: ['HttpClientTestingModule'], ... }] }] } },
+  { files: ['src/main/webapp/**/*.html'], rules: { '@angular-eslint/template/no-inline-styles': 'error' } },
   // jhipster-needle-eslint-add-config - JHipster will add additional config here
```

| Rule | Layer | Hits | Doc source |
|---|---|---|---|
| local/gen-route-authorities-need-guard | main | 0 | frontend.md: admin routes use `UserRouteAccessService` with authorities in route data |
| no-restricted-syntax (top-level route files) | main | 0 | frontend.md: lazy-load feature routes |
| no-restricted-imports (`HttpClientTestingModule` in specs) | main | 0 | testing.md: `TestBed` with `provideHttpClientTesting` |
| @angular-eslint/template/no-inline-styles | main | 0 | frontend.md: no inline styles |
| local/gen-no-hardcoded-template-text | suggestions | 45 in 11 files | frontend.md: never hard-code visible text |

### Suggestions layer (`eslint.config.suggestions.ts`)

It spreads `eslint.config.ts` and adds `local/gen-no-hardcoded-template-text` at `error` for `src/main/webapp/**/*.html` (spec inline templates excluded).
The 45 hits are all in generated admin screens plus the home page: `admin/metrics/**` (34 across 8 blocks), `admin/logs/logs.html` (6), `admin/configuration/configuration.html` (3), `admin/health/modal/health-modal.html` (1, "Done"), `home/home.html` (1, "(Jhipster Sample Application)").
The rule checks text nodes only; attribute text such as `placeholder` or `title` is not checked.
`package.json` is unchanged; proposed script: `"lint:suggestions": "eslint -c eslint.config.suggestions.ts"`.
Move the rule into `eslint.config.ts` once its hits reach 0.

## Agent-doc cleanup

Applied as pre-approved: a line was deleted where the rule's message and note carry it, shortened where the rule covers only part of it, and moved to a pointer where the convention shapes code before it is written.

- Always-loaded docs: no change (root `CLAUDE.md` holds no rule lines), 0 tokens removed.
- On-demand docs (`docs/*.md`): 26 lines deleted and 5 shortened, 2,716 characters, about 679 tokens removed (20,938 to 18,222 characters including `CLAUDE.md`).
- New pointer file `src/main/java/CLAUDE.md` (792 characters, about 198 tokens), loaded only when an agent works in `src/main/java`, holding the six design-shaping pointers: gen-clock-now, gen-paged-list-endpoints, gen-no-transactional-in-web-or-repository, gen-no-loose-value-property, gen-no-manual-threads, gen-no-new-top-level-package.
  Their lines were in linked docs an agent reads only when it follows the link, so the pointer is now seen up front where it applies.

Deleted lines: backend.md (field injection, Optional, null collections, Clock, Logger declaration, parameterised logging, broad catch, Pageable), api.md (`@Valid`), architecture.md (`@Value`, threads, top-level packages, the architecture-decision line), persistence.md (lazy associations, cache constants, transactions in services), security.md (PasswordEncoder, RandomUtil keys, authority literals, SecurityContextHolder, query concatenation, logging secrets), testing.md (AssertJ, `Thread.sleep`, `provideHttpClientTesting`), frontend.md (`jhiTranslate` / never hard-code text).

Shortened lines:
- backend.md "DTOs live in `service.dto` and end with `DTO`" to "DTOs live in `service.dto`."
- backend.md "Never log passwords, tokens, activation or reset keys, or full request bodies." to "Never log full request bodies."
- persistence.md "One repository per aggregate root, extending `JpaRepository`." to "One repository per aggregate root."
- security.md `/api/admin/**` line to its URL-level half.
- frontend.md "Bootstrap 5 and the styles in `content/scss`; no inline styles." to its first half.

Kept lines, because the rule covers only part of them:
- backend.md "Never swallow an exception silently; at least log it with context." (the rule catches only empty catch blocks).
- api.md "List endpoints accept a `Pageable` and return ... pagination headers" (headers not checked).
- security.md "Method-level checks use `@PreAuthorize` on resource methods." (checked only for `/api/admin` resources).
- testing.md "Integration tests are annotated with `@IntegrationTest`, which starts the Spring context against an H2 database." (explains what the annotation does).
- frontend.md "Every visible text has a translation key in `src/main/webapp/i18n/en/*.json`." (attribute text not checked) and "Admin routes use `UserRouteAccessService` ..." and "Lazy-load feature routes." (rules scoped to some files only; the lines are already pointer-length).

The honest benefit: the on-demand tokens removed matter little, because those docs are read only when followed and the always-loaded `CLAUDE.md` did not change.
The larger effect is that 33 conventions now fail at the line that breaks them, instead of depending on an agent reading a linked doc, which shows up as fewer fix rounds in the failure log and in review.

## Feedback loop

Installed (pre-approved), private to this checkout: `.claude/codemyrules/` and `.claude/settings.local.json`, both added to `.git/info/exclude`.

- Fast tier, after each edit: ast-grep with `sgconfig.suggestions.yml` on `.java`.
- Full tier, at the end of each turn: ESLint with `eslint.config.suggestions.ts` on `.ts`, `.html`, `.js`, `.mjs`, `.cjs` (no `eslint_d`, so not in the fast tier).
- Not in the loop: Maven Checkstyle and the ArchUnit test (JVM build), which stay in CI.
- Guard asks before edits to: `eslint.config.ts`, `eslint.config.suggestions.ts`, `sgconfig.yml`, `sgconfig.suggestions.yml`, `ast-grep/**`, `eslint-rules/**`, `checkstyle.xml`, `.prettierrc`, `.prettierignore`, `**/TechnicalStructureTest.java`, plus `.claude/codemyrules/` and `.claude/settings.local.json`, and before any new lint-suppression comment.
- Not guarded: lint settings inside `package.json` and `pom.xml`, and any change made through Bash.
- Smoke test: a throwaway `service/CmrProbe.java` calling `Instant.now()` was blocked with `gen-clock-now` (exit 2), then deleted.
  That probe left one line in `.claude/codemyrules/failures.log`; delete the file before reading the log (`rm .claude/codemyrules/failures.log`), I could not remove it without your approval.
- The guard is already active in this session: it stopped the first draft of this report because the draft quoted a suppression comment literally.

## Baseline

`.claude/codemyrules/baseline.json`, written after the cleanup:
- Always-loaded agent docs: 278 tokens, paid by every session.
- On-demand agent docs counted by `measure.mjs`: 0 tokens, because it counts only `CLAUDE.md`/`AGENTS.md`-style files tracked by git; `docs/*.md` are not agent-doc patterns, and `src/main/java/CLAUDE.md` is counted once committed.
- 33 rules, 73 open hits (28 backend, 45 frontend), all in suggestions-layer rules.
- `no-restricted-syntax` and `no-restricted-imports` are keyed by their core rule id; each currently holds a single convention, so their counts are not shared.

## Not built

Contradictions (neither side built; decide which wins):
1. architecture.md "`config` must not depend on `web`" vs `SecurityConfiguration` importing `web.filter.SpaWebFilter`, and `TechnicalStructureTest` allowing Config to access Web.
2. frontend.md "One service per API resource ... using `ApplicationConfigService.getEndpointFor`" vs the code: `getEndpointFor` does not exist; all 6 entity services build `${serverApiUrl}api/...` from `app/config`.
3. frontend.md "fix findings instead of disabling them" vs 10 inline ESLint disable comments for `@typescript-eslint/member-ordering` in generated entity components (config fights the generated code).

Already covered, so not built (their doc lines can be deleted later): layer dependencies in architecture.md (ArchUnit), standalone components, `inject()` and OnPush in frontend.md (`prefer-standalone`, `prefer-inject`, `prefer-on-push-component-change-detection`, on via `angular.configs.tsRecommended`), formatting (Prettier).

Doc-stated but not lintable with syntax rules (need types, data flow, other files, or judgment): one service per aggregate, services return DTOs not entities, no calls to other services' repositories, long-running work out of request transactions, boolean naming, static utility classes, N+1 queries and `@EntityGraph`, cache eviction in the changing service, `@Transactional(readOnly = true)` on read methods, ownership checks, Liquibase changelog rules, `@Version` decisions, `takeUntilDestroyed` cleanup, signals and `computed`, `dayjs` mapping, colour variables, hand-edit markers in generated files, test naming and process lines in workflow.md.
For layer-shaped ones (services return DTOs, repository access only through the owning service) an extra ArchUnit rule in `TechnicalStructureTest` is the native option.

Conventions found only in code (not picked, per your selection):
- Field injection in tests: 53 `@Autowired` fields in 16 test classes (backend.md scopes the rule to `src/main/java`).
- Frontend authority literals: route data uses `['ROLE_ADMIN']` in entity admin routes while `app.routes.ts` uses `Authority.ADMIN`.
- `ROLE_` literal in one test (`AuthorityResourceIT`), outside the backend rule's scope.

General rules: not offered, per your selection rule, so no general-rules pass was counted.
The project runs no Java linter beyond NoHttp Checkstyle; PMD, SpotBugs or Error Prone would cover catch, resource and null-handling families if wanted later.

## Scan log

| Signal | Count | Verdict |
|---|---|---|
| `@Autowired` fields (main / test) | 0 / 53 in 16 files | rule, main scope |
| `Optional` field or parameter | 2 (generated) | suggestions |
| `now()` without clock | 7 main (4 in services) | suggestions, service scope |
| Logger declaration off-pattern | 0 of 18 loggers | rule |
| Log concatenation | 2 literal-only (allowed) | rule |
| Sensitive log arguments | 2 | suggestions |
| Broad / empty catch | 1 / 0 | suggestions / rule |
| `@RequestBody` without `@Valid` | 6 of 18 | suggestions |
| `ROLE_` literals outside constants | 4 main, 1 test | suggestions |
| `@Transactional` in web/repository | 4 | suggestions |
| Unpaged list endpoints | 3 of 6 | suggestions |
| JUnit assertions | 2 files | suggestions |
| `@Value` custom properties, threads, `MessageDigest`, query concat, eager to-one, cache literals, `SecurityContextHolder` in services, DTO suffix, top-level packages, `Thread.sleep` in tests, `*IT` annotation, admin `@PreAuthorize` | 0 each | rules |
| Inline styles, `HttpClientTestingModule`, eager feature routes, unguarded authority routes | 0 each | ESLint main |
| Hard-coded template text | 45 in 11 files | ESLint suggestions |
| Inline ESLint disable comments | 10 member-ordering + 1 cypress | contradiction 3 |

## Design answers given on your behalf

Nobody could answer, so each took the safer side; change any of them and rerun the rule's verify step.
1. Severity `error` for every rule; rules with open hits in the suggestions layer, CI unchanged. Alternative: enable in CI with a baseline of the 73 hits.
2. No autofix on any rule; replacements are in `note` or the message. Alternative: autofix for `gen-assertj-only` imports.
3. `gen-clock-now` scoped to `service/**`, where the doc line sits. Alternative: all of `src/main/java` (adds `AuthenticateController.java:83` and `AbstractAuditingEntity.java:36,44`).
4. `gen-no-field-injection` scoped to `src/main/java` as backend.md states. Alternative: include tests (53 hits).
5. `gen-valid-request-body` flags generated PATCH endpoints too. Alternative: exempt `@PatchMapping`, since partial updates cannot pass full Bean Validation.
6. `gen-no-loose-value-property` allows `jhipster.`, `spring.`, `server.`, `management.`, `logging.`, `info.` placeholders. Alternative: ban every `@Value` (11 hits).
7. `gen-no-hardcoded-template-text` checks text nodes only, needs two letters in a row, and skips `code`, `pre`, `script`, `style` and spec inline templates. Alternative: also check `placeholder`, `title` and `aria-label` attributes.
8. Lazy-route rule limited to `app.routes.ts`, `admin/admin.routes.ts`, `entities/entity.routes.ts`. Alternative: every `*.routes.ts` (account routes use `component:` inside an already lazy child).
9. Design-shaping pointers placed in a new `src/main/java/CLAUDE.md`. Alternative: keep them in `docs/*.md` or in the root `CLAUDE.md` (always loaded, about 198 tokens per session).
