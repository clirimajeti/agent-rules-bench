# codemyrules report

Date: 2026-11-02.
Project: jhipsterSampleApplication (JHipster 9.4.0 monolith).

## Setup found

- Backend: Java 21, Maven, sources in `src/main/java`, tests in `src/test/java`.
  Goes to `backend-pattern-rules`.
- Frontend: Angular 22 in `src/main/webapp`, ESLint 10.10.0 flat config in `eslint.config.ts`, typescript-eslint 8.70.0, angular-eslint 22.5.0, Vitest through `ng test`.
  Goes to `eslint-pattern-rules`.
- Generated code: JHipster owns most of `src/main/java` and `src/main/webapp/app` (`.yo-rc.json`, `.jhipster/`).
  Every open hit below is in JHipster-generated code.
  Fix it in the generator's templates or a blueprint, or by regenerating with other options, because hand edits are lost on the next `jhipster upgrade`.
- Agent docs: root `CLAUDE.md` (always loaded, links and commands only, no convention lines) and `docs/*.md` (on demand, linked from `CLAUDE.md`).
- No decision records.
- Enforcement already in place: ESLint presets (strictTypeChecked, angular tsRecommended, templateRecommended, templateAccessibility), ArchUnit `TechnicalStructureTest` for layers, Checkstyle with only the NoHttp check, modernizer.
- CI (`.github/workflows/github-actions.yml`) runs backend tests, frontend tests and e2e.
  It does not run `npm run lint`.
- ast-grep was not used before.
  It now runs through `npx -y -p @ast-grep/cli@0.51.0 ast-grep`, with no change to `pom.xml` or `package.json`.
- No previous codemyrules run (no baseline), so there is no `measure.mjs report` to compare against.

## Selection

Everything stated in `CLAUDE.md` or `docs/*.md` that a rule can check was picked, as instructed.
General rules and code-only conventions were not picked; they are listed below.
No auto mode was configured, so nothing was built automatically.

## Backend rules (ast-grep, 32 rules)

Files: `sgconfig.yml` (new), `ast-grep/rules/gen-*.yml`, `ast-grep/rule-tests/gen-*-test.yml`, `ast-grep/rule-tests/__snapshots__/`.
Why ast-grep: the project has no own Java rule set, and Checkstyle runs only NoHttp.
ast-grep gives tested rules with folder scoping that also run in the feedback loop.
Tests: `ast-grep test` passes, 32 of 32, with snapshots.
Plain `ast-grep scan` loads `sgconfig.yml` and exits 0 (no error-level hits).

New `sgconfig.yml`:

```diff
+ruleDirs: [ast-grep/rules]
+testConfigs:
+  - testDir: ast-grep/rule-tests
```

### Error level, 0 open hits (20)

| Rule | Doc source | Scope |
|---|---|---|
| gen-no-field-injection | backend.md General | src/main/java |
| gen-logger-declaration | backend.md Logging | src/main/java |
| gen-no-log-concatenation | backend.md Logging | src/main/java |
| gen-no-empty-catch | backend.md Errors | src/main/java |
| gen-no-null-collection-return | backend.md General | src/main/java |
| gen-no-manual-threads | architecture.md, backend.md Concurrency | src/main/java |
| gen-properties-via-application-properties | architecture.md Configuration | src/main/java |
| gen-logging-via-slf4j | architecture.md Cross-cutting | src/main/java |
| gen-specific-service-exceptions | backend.md Services | service/ |
| gen-dto-suffix | backend.md DTOs | service/dto/ |
| gen-no-security-context-in-services | security.md Authorization | service/ |
| gen-admin-resources-preauthorize | security.md Authorization | web/ |
| gen-password-encoder-bean | security.md Authentication | src/main/java minus config/ |
| gen-no-query-concatenation | security.md Input handling | src/main/java |
| gen-not-found-via-response-util | api.md Errors | web/ |
| gen-no-error-string-body | api.md Errors | web/ |
| gen-lazy-associations | persistence.md Entities | domain/ |
| gen-repository-extends-jparepository | persistence.md Repositories | repository/ |
| gen-cache-name-constants | persistence.md Caching | src/main/java |
| gen-no-thread-sleep-in-tests | testing.md Backend | src/test/java |

### Warning level, with open hits (12 rules, 37 hits)

All hits are in JHipster-generated files.

| Rule | Hits | Files | Examples |
|---|---|---|---|
| gen-time-through-clock | 7 | 3 | `domain/AbstractAuditingEntity.java:36`, `service/UserService.java:72`, `web/rest/AuthenticateController.java:83` |
| gen-valid-request-body | 6 | 4 | `web/rest/AccountResource.java:149`, `web/rest/LabelResource.java:108` (PATCH with `@NotNull` only) |
| gen-transactional-in-services | 4 | 4 | `web/rest/LabelResource.java:28`, `web/rest/BankAccountResource.java:28` |
| gen-no-role-literals | 4 | 1 | `web/rest/AuthorityResource.java:50` `@PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")` |
| gen-boolean-method-naming | 4 | 4 | `service/UserService.java:132` `removeNonActivatedUser`, `config/WebConfigurer.java:103` `h2ConsoleIsEnabled` |
| gen-paged-list-endpoints | 3 | 3 | `web/rest/LabelResource.java:142` `getAllLabels()`, `web/rest/AuthorityResource.java:67` |
| gen-no-optional-field-or-param | 2 | 2 | `repository/OperationRepositoryWithBagRelationships.java:9` |
| gen-no-sensitive-logging | 2 | 1 | `service/UserService.java:57` logs the activation key, `:69` the reset key |
| gen-assertj-assertions | 2 | 2 | `config/CRLFLogConverterTest.java:4`, `service/MailServiceIT.java:4` |
| gen-no-broad-catch | 1 | 1 | `config/SecurityJwtConfiguration.java:34` |
| gen-resource-naming | 1 | 1 | `web/rest/AuthenticateController.java:35` |
| gen-scheduled-cron-from-properties | 1 | 1 | `service/UserService.java:290` `@Scheduled(cron = "0 0 1 * * ?")` |

Promotion plan: fix the hits (in the generator templates or as marked hand edits), then switch each rule to `error`.
Until then the feedback loop does not show these 12 rules, because it blocks only on errors.
Their doc lines were kept for that reason.

## Frontend rules (ESLint)

Custom rules live in `eslint-rules/`, with RuleTester tests under `node:test`.
`node --test eslint-rules/*.test.js` passes 34 of 34.
The project's own `eslint .` loads the config and reports the rules.
I checked this on real files and on a temporary probe file in `shared/`, which has been removed.

| Rule | Level | Hits | Doc source | Scope |
|---|---|---|---|---|
| local/gen-http-client-in-services | error | 0 | frontend.md Services and HTTP | `app/**/*.ts` minus `*.service.ts`, `*.spec.ts` |
| local/gen-shared-no-feature-imports | error | 0 | frontend.md Structure | `app/shared/**/*.ts` |
| no-alert (core) | error | 0 | frontend.md Services and HTTP (alerts through AlertService) | `src/main/webapp/**/*.ts` |
| no-restricted-imports: HttpClientTestingModule | error | 0 | testing.md Frontend | `**/*.spec.ts` |
| @angular-eslint/template/no-inline-styles | error | 0 | frontend.md Styling | `app/**/*.html` |
| local/gen-template-translated-text | warn | 45 in 11 files | frontend.md i18n | `app/**/*.html`, spec inline templates excluded |
| @angular-eslint/prefer-signals | warn | 4 in 3 files | frontend.md Components (partial match) | `src/main/webapp/**/*.ts` |

All `gen-template-translated-text` hits are in generated admin screens and `home.html`.
Examples: `admin/logs/logs.html:30` `TRACE`, `admin/metrics/blocks/metrics-system/metrics-system.html:6` `Uptime`, `admin/configuration/configuration.html:8` `Spring configuration`, `home/home.html:7` `(Jhipster Sample Application)`.
The `prefer-signals` hits are signal properties not marked `readonly` in `entities/*/update/*-update.ts` (bank-account, label, operation).

Config change in `eslint.config.ts`.
That file is JHipster-generated, so the new block is marked as hand-written, as `docs/architecture.md` asks:

```diff
+// Hand-written: project convention rules from docs/, keep when regenerating with JHipster.
+import genHttpClientInServices from './eslint-rules/gen-http-client-in-services.js';
+import genSharedNoFeatureImports from './eslint-rules/gen-shared-no-feature-imports.js';
+import genTemplateTranslatedText from './eslint-rules/gen-template-translated-text.js';
 ...
+  { plugins: { local: { rules: { 'gen-http-client-in-services': ..., 'gen-shared-no-feature-imports': ..., 'gen-template-translated-text': ... } } } },
+  { files: ['src/main/webapp/**/*.ts'], rules: { 'no-alert': 'error', '@angular-eslint/prefer-signals': 'warn' } },
+  { files: ['src/main/webapp/app/**/*.ts'], ignores: ['**/*.service.ts', '**/*.spec.ts'], rules: { 'local/gen-http-client-in-services': 'error' } },
+  { files: ['src/main/webapp/app/shared/**/*.ts'], rules: { 'local/gen-shared-no-feature-imports': 'error' } },
+  { files: ['src/main/webapp/**/*.spec.ts'], rules: { 'no-restricted-imports': ['error', { paths: [{ name: '@angular/common/http/testing', importNames: ['HttpClientTestingModule'], ... }] }] } },
+  { files: ['src/main/webapp/app/**/*.html'], ignores: ['**/*.spec.ts/**'], rules: { '@angular-eslint/template/no-inline-styles': 'error', 'local/gen-template-translated-text': 'warn' } },
   // jhipster-needle-eslint-add-config - JHipster will add additional config here
```

`package.json` is byte-identical.
`npm run lint` already failed before this run, with 388 `prettier/prettier` errors and 1 `no-useless-assignment` in `.claude/skills/**/*.mjs` (the installed skill scripts).
This run adds no errors, only the 49 warnings above.

## Installs

- Node dependencies: `npm install --ignore-scripts --no-package-lock`.
  The repo has no lockfile, `package.json` pins exact versions, and `node_modules/` is git-ignored.
- ast-grep needs no install: `npx -y -p @ast-grep/cli@0.51.0 ast-grep`.
- Suggested CI step (not added): `npx -y -p @ast-grep/cli@0.51.0 ast-grep test && npx -y -p @ast-grep/cli@0.51.0 ast-grep scan`, plus `node --test eslint-rules/*.test.js` and `npm run lint`.
  CI does not run ESLint today, so without that step these rules only show up locally and in the feedback loop.

## Agent-doc cleanup

I only touched lines enforced by an `error`-level rule built in this run.
Lines for `warning` rules stay, because the loop does not show warnings.
All touched lines are on demand (`docs/*.md`).
Root `CLAUDE.md` holds no convention lines.
No pointers were moved into folder `CLAUDE.md` files; shortened lines stay where they were.

Deleted (14):
- `docs/api.md`: "`404 Not Found` uses `ResponseUtil.wrapOrNotFound`."
- `docs/backend.md` (6): constructor injection / no field injection, no `null` from collection methods, `private static final Logger LOG`, parameterised log messages, never swallow an exception, Spring-managed executor.
- `docs/persistence.md` (2): map associations lazily, cache name constants.
- `docs/security.md` (3): `PasswordEncoder` bean, `SecurityUtils` instead of `SecurityContextHolder` in services, no JPQL/SQL string concatenation.
- `docs/testing.md` (2): no `Thread.sleep` (use Awaitility), `TestBed` with `provideHttpClientTesting`.

Shortened (7):
- `docs/api.md`: "Use the problem details from `ExceptionTranslator`." (dropped "never return error strings in the body").
- `docs/architecture.md` (3): dropped "never as loose `@Value` strings", "Logging goes through SLF4J" and "never create threads by hand".
- `docs/backend.md`: "DTOs live in `service.dto`." (the suffix is now enforced).
- `docs/frontend.md`: "Bootstrap 5 and the styles in `content/scss`." (inline styles are now enforced).
- `docs/persistence.md`: "One repository per aggregate root." (`JpaRepository` is now enforced).

Kept because a warning-level rule covers them:
- `api.md`: `<Entity>Resource`, `@Valid`, `Pageable`.
- `architecture.md`: `@Scheduled` cron.
- `backend.md`: Optional, boolean names, specific exceptions, Clock, sensitive logging, broad catch, unbounded lists.
- `frontend.md`: signals, i18n.
- `persistence.md`: transactions in services.
- `security.md`: role constants, the admin method-level check (kept for its reason), no secrets in logs.
- `testing.md`: AssertJ.

Doc tokens removed (characters / 4): 0 always-loaded, about 360 on-demand (1442 characters; `docs/*.md` went from 19826 to 18384 characters).
That saving is small and on-demand only, so it does not reduce what every session pays.
The real benefit is fewer fix rounds.
An agent that breaks one of these conventions is told at the edit, with the fix in the message, instead of in review.

## Feedback loop

Installed, private to you: `.claude/settings.local.json` and `.claude/codemyrules/`, both added to `.git/info/exclude`.

- Fast tier, after each edit: ast-grep (`.java`) through `npx -y -p @ast-grep/cli@0.51.0 ast-grep scan --json=compact`.
- Full tier, at the end of each turn: ESLint (`.ts`, `.html`, `.js`, `.mjs`, `.cjs`) through `node_modules/.bin/eslint --format json`.
  The project has no `eslint_d`, so ESLint is not in the fast tier.
- Guard (asks before the edit): ignore comments, plus edits to `eslint.config.ts`, `sgconfig.yml`, `ast-grep/**`, `eslint-rules/**`, `checkstyle.xml`, `src/test/java/**/TechnicalStructureTest.java`, `.claude/codemyrules/` and `.claude/settings.local.json`.
- Not guarded: lint settings inside `package.json` and `pom.xml`, left out to avoid a prompt on every dependency edit.
- Not in the loop: Checkstyle, modernizer and ArchUnit, because they need a JVM build.
  They stay in Maven and CI.
- Smoke test: the fast hook blocked a temporary `service/ZzProbe.java` containing `System.out.println`, reporting `gen-logging-via-slf4j` (exit 2).
  The probe file and its log entries were removed.
- The guard already fired once in this session: it stopped the first draft of this report because the text contained the literal suppression-comment keyword.

## Baseline

`.claude/codemyrules/baseline.json`, written 2026-11-02.
- Always-loaded doc tokens: 278 per session (root `CLAUDE.md`).
- On-demand doc tokens as recorded: 0.
  `measure.mjs` counts only imported or folder-level docs, and `docs/*.md` are plain links.
  Their real size is about 4596 tokens after the cleanup.
- Rules: 39 rule ids (32 ast-grep, 3 custom ESLint, 4 ESLint config entries), with 86 open hits, all at warning level (37 ast-grep, 45 template text, 4 prefer-signals).
- `no-restricted-imports` has a single entry (HttpClientTestingModule), so no other convention shares its count.

A later run of this skill prints the comparison with `measure.mjs report`.
If a rule fails often in `failures.log`, give it a one-line pointer where the agent works (a folder `CLAUDE.md`).

## Contradictions (not built, need a decision)

1. `docs/frontend.md:24` says services use `ApplicationConfigService.getEndpointFor`.
   All 6 API services build URLs from the `serverApiUrl` constant instead, and no file uses `getEndpointFor`.
   Options: update the doc to match the code, or enforce the doc.
2. `docs/frontend.md:20` says subscriptions are cleaned up with `takeUntilDestroyed`, but only 1 of 36 subscribing files uses it.
   Most subscriptions are one-shot HTTP calls that complete on their own.
   Telling them apart needs type information, so no syntax rule can enforce this fairly.
3. `docs/frontend.md:45` says to fix ESLint findings instead of disabling them, but there are 13 ESLint disable comments.
   10 of them are for `@typescript-eslint/member-ordering` in generated entity components.
   Options: relax `member-ordering` for those files, or fix the generated code.
4. `docs/backend.md:13` asks for boolean fields named as questions, but the generated `User.activated` field is not.
   Only the method half was built.

## Documented conventions not built

- These need types or other files; ArchUnit tests (already a dependency) are the better tool:
  services return DTOs and entities do not leave the service layer; do not call other services' repositories; one service per aggregate; `Optional` as the lookup return type; repositories return `Optional`, `Page` or `List`.
- Not syntax-checkable, or about process:
  - API design: kebab-case plural resource paths, `@PathVariable` names, `201` with `Location`, `HeaderUtil` alert headers, sort allow-lists, default page size, a debug log per resource method, filtering through query parameters.
  - Persistence: Liquibase changelog naming and registration (XML), native SQL portability, `@EntityGraph` for list views, `equals`/`hashCode` on the id, `Long` ids (JHipster's `Authority` uses a `String` key by design).
  - Security: `RandomUtil` keys, ownership checks, CORS and headers, token lifetimes.
  - Tests: `@IntegrationTest`, `@WithMockUser`, `createEntity` helpers, test naming, specs next to components.
  - Frontend: dayjs date mapping, lazy-loaded routes (all already lazy at the top level), the admin route guard (one site), keeping templates simple, colours.
- Already covered by existing config (notes only): standalone components (`@angular-eslint/prefer-standalone`), `inject()` (`@angular-eslint/prefer-inject`), OnPush (`@angular-eslint/prefer-on-push-component-change-detection`; Angular 22 also defaults to OnPush), `no-console`, layer dependencies (`TechnicalStructureTest`).

## Code-only conventions (not picked, as instructed)

- Angular API services build `resourceUrl` from `serverApiUrl` (6 of 6) and wrap ids in `encodeURIComponent` (10 of 10).

## General rules not picked

Frontend, counted on `src/main/webapp/app/**/*.ts` without changing the config:
- `max-lines-per-function` 50: 64 hits in 43 files.
- `@typescript-eslint/no-floating-promises`: 28 hits in 17 files (switched off in `eslint.config.ts`).
- `max-params` 3: 5 hits in 5 files.
- `@angular-eslint/no-uncalled-signals`: 2 hits in 1 file.
- `complexity` 10: 1 hit.
- 0 hits: `max-depth` 4, `no-nested-ternary`, `no-else-return`, `max-lines` 400, `@typescript-eslint/switch-exhaustiveness-check`, `array-callback-return`, `no-implied-eval`, `no-new-func`, `no-script-url`, `@typescript-eslint/no-unused-vars` (switched off).
- These need a plugin the project lacks: `@vitest/eslint-plugin` for `no-focused-tests`, `no-disabled-tests` and `expect-expect`, and `eslint-plugin-sonarjs` for commented-out code.

Backend: the project runs no Java linter that can check general limits such as method length, parameter count or complexity.
Checkstyle is configured, but only with NoHttp.
Adding Checkstyle modules (`MethodLength`, `ParameterNumber`, `CyclomaticComplexity`) or PMD would cover them; I did not count them.

## Scan log

| Signal | Good | Bad | Verdict |
|---|---|---|---|
| `@Autowired` on fields, main | constructor injection everywhere | 0 (2 on setters) | built, error |
| `now()` without clock | 0 `now(clock)` | 7 | built, warning |
| `ROLE_` literals, main | AuthoritiesConstants | 4 in AuthorityResource | built, warning |
| `SecurityContextHolder` in services | SecurityUtils | 0 | built, error |
| `@Value` with an `application.` key | - | 0 (8 `@Value` for jhipster/spring keys) | built, error |
| threads by hand | `@Async` | 0 | built, error |
| broad catch | - | 1 | built, warning |
| empty catch | - | 0 | built, error |
| Logger declaration | 18 | 0 | built, error |
| log concatenation with a value | - | 0 (2 literal-only joins allowed) | built, error |
| Optional field or parameter | - | 2 | built, warning |
| `@Transactional` in web/repository | services | 4 | built, warning |
| `@RequestBody` without `@Valid` | 12 | 6 | built, warning |
| `@Scheduled` literal cron | - | 1 | built, warning |
| unpaged list GET endpoints | 3 | 3 | built, warning |
| JUnit assertions | AssertJ | 2 files | built, warning |
| `Thread.sleep` in tests | - | 0 | built, error |
| eager associations | 5 lazy | 0 | built, error |
| ESLint disable comments | - | 13 (10 member-ordering) | contradiction |
| `takeUntilDestroyed` | 1 file | 35 subscribing files | not built, needs types |
| `getEndpointFor` | 0 | 6 services use `serverApiUrl` | contradiction |
| `HttpClient` outside services | 18 in services and specs | 0 | built, error |
| hard-coded template text | 45 templates with `jhiTranslate` | 45 hits in 11 files | built, warn |
| inline styles in app templates | - | 0 (9 in static `index.html`, out of scope) | config, error |

## Design answers given on your behalf

Nobody could answer during the run.
These are my recommendations, each with the alternative.

1. Severity: `error` for rules with no open hits, and `warning` for the 14 with hits (12 ast-grep, template text, prefer-signals).
   Alternative: `error` everywhere, with a baseline or after fixing the generated code.
2. No autofixes anywhere; the replacements are in the notes and messages.
   Alternative: `fix` for `gen-assertj-assertions` imports or `gen-lazy-associations`.
3. `gen-no-role-literals` covers `src/main/java` only, so `@WithMockUser(authorities = { "ROLE_ADMIN" })` in `AuthorityResourceIT` is not flagged.
   Alternative: include `src/test/java`.
4. `gen-time-through-clock` flags only zero-argument `now()` and `currentTimeMillis()`, so `now(ZoneId)` is not caught.
   Alternative: flag every `now(...)` whose argument is not named `clock`.
5. `gen-valid-request-body` flags the generated PATCH endpoints that use `@NotNull` only (partial updates skip full validation by design).
   Alternative: exempt `@PatchMapping` methods.
6. `gen-boolean-method-naming` checks methods only, against an allow-list of question prefixes (`is`, `has`, `can`, `should`, `contains`, `matches`, `equals`, `exists`, `supports` and similar).
   Alternative: drop the rule as too heuristic, or extend it to fields.
7. `gen-no-sensitive-logging` flags logger arguments whose text ends in password, secret, token, credential or key.
   Alternative: a wider list (for example `otp`, `pin`).
8. `gen-template-translated-text` checks Angular templates under `app/` only, skips inline templates in specs, and leaves static `index.html` and `404.html` out.
   Alternative: include the static pages.
9. `@angular-eslint/prefer-signals` stands in for "Prefer signals for local state".
   It checks decorator inputs and queries and `readonly` signals, not all local state.
   Alternative: do not enable it.
10. Doc lines for warning-level rules were kept, and no pointer was moved into a folder `CLAUDE.md` (for example `src/main/java/CLAUDE.md` or `src/main/webapp/CLAUDE.md`).
    Alternative: move the design-shaping lines (Clock, transactions in services, paged list endpoints, i18n keys) into folder `CLAUDE.md` files, so they load when the agent works there.
11. `gen-transactional-in-services` flags the generated CRUD resources that use repositories directly.
    `docs/architecture.md` allows that dependency, but `docs/persistence.md` forbids transactions outside services.
    Alternative: exempt generated CRUD resources, or regenerate entities with `service: serviceClass` in the JDL.
