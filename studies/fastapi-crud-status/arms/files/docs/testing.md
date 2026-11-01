# Testing

Every change comes with tests at the level where the behaviour lives.

## Backend

- Tests live in `backend/tests` and run with `bash scripts/test.sh` (pytest with coverage) against a real PostgreSQL database.
- `tests/api/routes/` tests endpoints through the FastAPI `TestClient`; `tests/crud/` tests CRUD functions directly.
- Use the fixtures from `conftest.py`: `client`, `db`, `superuser_token_headers`, `normal_user_token_headers`.
- Create test data with the helpers in `tests/utils/` (`create_random_user`, `create_random_item`, `random_email`).
- Assert on status codes and on the JSON body; check that permissions are enforced for normal users and superusers.
- Each test creates its own data; never depend on data from another test.
- Do not mock the database; mock only external services such as email sending.

## Naming

- Test functions describe the behaviour: `test_read_item_not_enough_permissions`, `test_create_user_existing_email`.
- One behaviour per test.

## Frontend

- End-to-end tests use Playwright in `frontend/tests` and run against the full stack with Docker Compose.
- Use role and label selectors, not CSS classes.
- Each test logs in through the stored auth state set up in `auth.setup.ts`.

## Coverage and quality

- CI runs backend tests with coverage and Playwright tests on every pull request.
- Fix flaky tests when you find them instead of retrying.
