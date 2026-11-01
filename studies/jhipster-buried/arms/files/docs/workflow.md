# Workflow

## Branches and commits

- Branch from `main` with a short descriptive name (`feature/label-colours`, `fix/login-redirect`).
- Commit messages are in English, imperative mood, with a subject under 72 characters.
- Keep commits focused; formatting-only changes go into their own commit.

## Merge requests

- A merge request covers one change and describes what changed and why.
- The pipeline must be green: backend tests, frontend tests, Sonar and the dependency scan.
- At least one review approval before merging; the author merges.
- Screenshots for visible UI changes.

## Before you push

- Run `./mvnw verify` for backend changes and `./npmw test` for frontend changes.
- Run `./npmw run lint` and fix findings.
- Update the docs in `docs/` when a convention changes.

## Releases

- Releases are tagged from `main` with semantic versions.
- The changelog is generated from merge request titles; write titles for readers.
- Database migrations must work on the previous release's schema without manual steps.

## Upgrading JHipster

- JHipster upgrades are done with `jhipster upgrade` on a dedicated branch.
- Resolve conflicts in generated files in favour of the new version, then reapply the marked hand-written changes.
