# Architecture

The backend is a single FastAPI application in `backend/app`.
The frontend is a single-page app in `frontend/` that talks to the backend only through the generated client.

## Backend modules

- `app/main.py`: creates the FastAPI app, CORS and the router.
- `app/api/main.py`: includes the route modules under `settings.API_V1_STR` (`/api/v1`).
- `app/api/routes/`: one module per resource (`users`, `items`, `login`, `utils`, `private`).
- `app/api/deps.py`: shared dependencies (`SessionDep`, `CurrentUser`, `get_current_active_superuser`).
- `app/crud.py`: functions that read and write the database.
- `app/models.py`: SQLModel tables and the request and response schemas.
- `app/core/config.py`: settings from environment variables (`Settings`).
- `app/core/security.py`: password hashing and token creation.
- `app/core/db.py`: the engine and first-superuser initialisation.
- `app/utils.py`: email rendering and sending, token helpers.
- `app/alembic/`: database migrations.

## Dependency rules

- Routes depend on `deps`, `crud`, `models` and `core`; nothing depends on routes.
- `crud` depends on `models` and `core.security` only.
- `models` depend on nothing in the application except other models.
- `core` must not import from `api`.
- Keep circular imports out: shared types go into `models.py`, shared helpers into `utils.py`.

## Frontend modules

- `src/routes/`: file-based routes (TanStack Router); `_layout` holds the authenticated pages.
- `src/client/`: the generated OpenAPI client; never edit by hand.
- `src/components/`: UI components grouped by feature, plus `ui/` for shared primitives.
- `src/hooks/`: shared hooks such as `useAuth` and `useCustomToast`.

## Configuration

- All configuration comes from environment variables, read once in `Settings`; the root `.env` file is for local development only.
- Do not read environment variables anywhere else; add a field to `Settings`.
- Feature switches are settings with a safe default.

## When in doubt

- Look for an existing example of the same kind of change and follow it.
- Keep new code in the module of the layer it belongs to; do not add new top-level packages without a discussion.
