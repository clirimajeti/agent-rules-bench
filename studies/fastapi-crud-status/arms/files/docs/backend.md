# Backend conventions

These rules apply to the application code in `backend/app`.
Tests in `backend/tests` follow [testing](testing.md).
Formatting and import order are enforced by Ruff; types are checked by mypy. This file covers what the tools do not.

## General

- Python 3.10+ syntax: `X | None` instead of `Optional[X]`, built-in generics (`list[str]`).
- Type every function signature; avoid `Any` except where FastAPI or SQLModel force it.
- Keep functions small and named after what they do; prefer early returns over nested conditions.
- Use keyword-only arguments (`*`) for functions with more than two parameters, as `crud.py` does.
- No mutable default arguments.
- Use `uuid.UUID` for identifiers in signatures, not strings.

## Routes

- One router per resource module, created with `APIRouter(prefix=..., tags=[...])`.
- Declare `response_model` on every endpoint so the OpenAPI schema and the generated client stay accurate.
- Use the shared dependencies from `deps.py` (`SessionDep`, `CurrentUser`) instead of creating sessions or decoding tokens in a route.
- Superuser-only endpoints use `dependencies=[Depends(get_current_active_superuser)]`.
{{RULE_DB}}
- Keep route handlers short: validate the request, check permissions, call the layer below, return the response model.
- Do not put business rules in route handlers when a second endpoint could need them; move them next to the data access.

## CRUD layer

- Functions in `crud.py` take the session as a keyword argument (`*, session: Session`) and return models or `None`.
- Name them after the operation and the entity: `create_item`, `get_user_by_email`, `update_user`.
- A function commits its own change and refreshes the object it returns.
- Keep query logic in one place: if two places need the same query, they call the same function.

## Models and schemas

- Table models extend the `...Base` schema and set `table=True`.
- Request schemas (`...Create`, `...Update`) and response schemas (`...Public`) are separate classes; never return a table model that contains secrets such as `hashed_password`.
- List responses use a wrapper with `data` and `count` (`ItemsPublic`, `UsersPublic`).
- String fields declare `max_length` matching the database column.
- Timestamps use `get_datetime_utc()` so every stored time is timezone-aware UTC.

## Settings

- Read settings through `from app.core.config import settings`.
- New settings get a type, a safe default where possible, and a line in `.env` for local development.
- Secrets have no default and fail at startup if missing in production.

## Errors

- Raise `HTTPException` with a short, user-facing `detail`; the frontend shows it in a toast.
- Use the same wording for the same situation across endpoints (`"Item not found"`, `"Not enough permissions"`).
- Never leak internal details (SQL, stack traces, other users' data) in error messages.
- Do not catch broad exceptions in routes; let unexpected errors become a 500 and be logged.

## Logging

- Use the standard `logging` module with a module-level logger; never `print`.
- Log state changes worth keeping at info level, problems at warning level, and errors with the exception.
- Never log passwords, tokens or full request bodies.
