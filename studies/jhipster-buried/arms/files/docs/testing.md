# Testing

Every change comes with tests at the level where the behaviour lives.

## Backend

- Unit tests (`*Test.java`) run with `./mvnw test`; integration tests (`*IT.java`) run with `./mvnw verify`.
- Integration tests are annotated with `@IntegrationTest`, which starts the Spring context against an H2 database.
- REST resources are tested with `MockMvc` in `<Entity>ResourceIT`, following the generated tests: create test data in the repository, call the endpoint, assert on JSON with `jsonPath`.
- Use `@WithMockUser` to run a test as a user with given authorities.
- Use `@Transactional` on integration tests so each test rolls back.
- Assertions use AssertJ (`assertThat`), not JUnit's `assertEquals`.
- Do not use `Thread.sleep` in tests; use Awaitility for asynchronous behaviour.
- `TechnicalStructureTest` checks the layer rules from [architecture](architecture.md); keep it green.
- Test data builders: use the static `createEntity` methods in the entity tests instead of duplicating setup.

## Naming

- Test methods describe the behaviour: `shouldReturnActivatedUsersOnly`, `deleteLabel_whenNotAdmin_isForbidden`.
- One behaviour per test; several assertions about the same behaviour are fine.

## Frontend

- Components and services have Vitest specs next to them (`*.spec.ts`).
- Use the Angular `TestBed` with `provideHttpClientTesting` for services that call the API.
- End-to-end tests use Cypress in `src/test/javascript/cypress`; run them with `./npmw run e2e` against a running backend.

## Coverage and quality

- Sonar analyses every merge request; new code should not lower coverage.
- Fix flaky tests when you find them instead of retrying the pipeline.

## Test data

- Never use production data in tests.
- Fixed logins (`admin`, `user`) exist in the test database through Liquibase; do not change them.
- Random test values come from the generated helpers or `UUID`; avoid magic values that hide intent.
