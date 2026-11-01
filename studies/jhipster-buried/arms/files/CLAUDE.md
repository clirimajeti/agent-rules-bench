# Project notes

jhipsterSampleApplication is a JHipster 9 monolith: a Spring Boot 3 backend (Java 21, Maven) and an Angular frontend in `src/main/webapp`.
It manages bank accounts, operations and labels for users with JWT authentication.

## Docs

Read the doc that matches the area you change:
- [docs/architecture.md](docs/architecture.md): layers, packages and what may depend on what
- [docs/backend.md](docs/backend.md): services, transactions, DTOs, mapping, logging, errors
- [docs/api.md](docs/api.md): REST resources, paging, headers, error responses
- [docs/persistence.md](docs/persistence.md): entities, repositories, Liquibase, caching
- [docs/security.md](docs/security.md): authentication, authorization, secrets
- [docs/testing.md](docs/testing.md): unit, integration and architecture tests
- [docs/frontend.md](docs/frontend.md): Angular structure, state, i18n, styling
- [docs/workflow.md](docs/workflow.md): branches, commits, reviews, release

## Commands

- Backend dev server: `./mvnw`
- Frontend dev server: `./npmw start`
- Backend tests: `./mvnw verify`
- Frontend tests: `./npmw test`
