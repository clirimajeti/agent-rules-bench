# Security

## Authentication

- Login uses OAuth2 password flow at `/login/access-token` and returns a JWT signed with `settings.SECRET_KEY`.
- Tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES`; do not extend lifetimes in code.
- The current user comes from the `CurrentUser` dependency; never decode tokens in a route.
- Passwords are hashed with the functions in `core/security.py`; never hash or compare passwords by hand.
- Password reset tokens are created and verified with the helpers in `utils.py`.

## Authorization

- Superuser-only endpoints use the `get_current_active_superuser` dependency.
- A normal user may read and change only their own objects; check `owner_id == current_user.id` unless the user is a superuser.
- Return 404 rather than 403 when revealing that an object exists would leak information.
- Keep permission checks next to the data they protect; do not rely on the frontend hiding a button.

## Input handling

- Validate input with Pydantic schemas; constrain lengths and formats there.
- Never build SQL or shell commands from user input.
- Escape user content in emails; the Jinja templates escape by default.

## Secrets

- Secrets come from environment variables; `.env` contains only local development values marked `changethis`.
- The app refuses to start in production with default secrets; keep that check.
- Never log secrets, tokens or password reset links.

## Transport and CORS

- CORS origins come from `BACKEND_CORS_ORIGINS` and `FRONTEND_HOST`; do not allow `*`.
- Traefik terminates TLS in deployment; the app itself never serves plain HTTP publicly.

## Dependencies

- Dependabot keeps dependencies current; do not pin around a security update without a note in the merge request.
