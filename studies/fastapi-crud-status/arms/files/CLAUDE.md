# Project notes

Full-stack FastAPI app: a Python backend in `backend/` (FastAPI, SQLModel, PostgreSQL, Alembic, managed with uv) and a React frontend in `frontend/` (Vite, TanStack Router and Query, a generated API client).
It provides user management, login with JWT and a simple items resource, deployed with Docker Compose behind Traefik.
{{LOADED_RULES}}

## Docs

Read the doc that matches the area you change:
- [docs/architecture.md](docs/architecture.md): modules, layers and what may depend on what
- [docs/backend.md](docs/backend.md): routes, dependencies, CRUD layer, models, settings, errors
- [docs/api.md](docs/api.md): endpoints, responses, status codes, pagination
- [docs/database.md](docs/database.md): SQLModel tables, sessions, Alembic migrations
- [docs/security.md](docs/security.md): authentication, permissions, secrets
- [docs/testing.md](docs/testing.md): backend and frontend tests
- [docs/frontend.md](docs/frontend.md): routes, API client, forms, styling
- [docs/workflow.md](docs/workflow.md): local development, commits, reviews, deployment

## Commands

- Backend: `cd backend && uv sync`, then `fastapi dev app/main.py`
- Backend tests: `cd backend && bash scripts/test.sh`
- Frontend: `cd frontend && bun install && bun run dev`
- Regenerate the API client after backend changes: `bash scripts/generate-client.sh`
