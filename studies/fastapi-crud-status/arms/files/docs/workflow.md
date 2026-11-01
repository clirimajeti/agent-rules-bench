# Workflow

## Local development

- Run the stack with `docker compose watch`, or backend and frontend separately as described in `development.md`.
- Backend dependencies are managed with uv; add them with `uv add` so `uv.lock` stays in sync.
- Pre-commit hooks run Ruff and Biome; install them with `uv run prek install`.

## Branches and commits

- Branch from `master` with a short descriptive name.
- Commit messages in English, imperative mood, subject under 72 characters.
- Keep formatting-only changes in their own commit.

## Pull requests

- One change per pull request, with a description of what changed and why.
- CI must be green: backend tests, Playwright tests, linting and the generated-client check.
- At least one approval before merging.

## Deployment

- Deployment uses Docker Compose with Traefik, configured by environment variables; see `deployment.md`.
- Database migrations run automatically on startup through the prestart script.
- Releases are tagged from `master`; release notes are written for users.
