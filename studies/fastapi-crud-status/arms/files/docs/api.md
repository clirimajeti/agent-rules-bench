# API conventions

All endpoints live under `/api/v1` and are documented automatically at `/docs`.
The frontend uses the client generated from the OpenAPI schema, so the schema is part of the contract.

## Endpoints

- Resource paths are plural nouns in kebab-case (`/items`, `/users`); actions on the current user live under `/users/me`.
- `GET` lists support `skip` and `limit` query parameters with a default limit of 100.
- `POST` creates and returns the created object; `PUT` and `PATCH` update and return the updated object.
- `DELETE` returns a `Message` with a short confirmation.
- Path parameters for identifiers are typed `uuid.UUID`, so invalid ids return 422 automatically.
- Give every endpoint a clear function name; it becomes the operation id and the method name in the generated client.

## Responses

- Every endpoint declares `response_model`.
- Lists return `{ "data": [...], "count": n }`, where `count` is the total number of matching rows, not the page size.
- Do not return bare lists or dictionaries.
- Optional fields are `None`, not missing.

## Status codes and errors

- `404` when the object does not exist or is not visible to the current user, `403` when it exists but the user may not change it, `400` for business-rule violations such as a duplicate email.
- Validation errors (422) come from FastAPI and Pydantic; do not build them by hand.
{{RULE_STATUS}}
- Errors use `HTTPException(detail=...)`; the frontend reads `detail` and shows it to the user.
- Keep the same error text for the same situation across endpoints.

## Pagination and filtering

- Filtering uses query parameters with explicit types and defaults.
- Do not return unbounded result sets; respect `limit` everywhere.
- Ordering is deterministic: order by creation time or id, newest first unless the endpoint says otherwise.

## Compatibility

- The API is consumed only by the bundled frontend, so breaking changes are allowed when backend and frontend change in one merge request.
- After any change to endpoints or schemas, regenerate the client with `scripts/generate-client.sh` and commit the result.

## Documentation

- Add a docstring to endpoints whose behaviour is not obvious from the name; FastAPI shows it in `/docs`.
- Mark endpoints that exist only for development with `include_in_schema=False` or the `private` router.
