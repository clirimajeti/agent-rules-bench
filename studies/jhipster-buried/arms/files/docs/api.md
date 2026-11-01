# REST API conventions

All REST resources live in `web.rest` and are served under `/api`.
Admin-only resources are served under `/api/admin`.

## Resources

- Name resources after the plural noun (`/api/bank-accounts`, `/api/operations`), in kebab-case.
- One resource class per aggregate, named `<Entity>Resource`.
- Resources are thin: they validate input, call one service method and build the response.
- Annotate request bodies with `@Valid` so Bean Validation runs before the service is called.
- Return `ResponseEntity` with an explicit status; `201 Created` with a `Location` header for creates.
- Use `@PathVariable` names that match the URL template exactly.

## Paging and sorting

- List endpoints accept a `Pageable` and return the page content with pagination headers from `PaginationUtil.generatePaginationHttpHeaders`.
- Sort parameters are validated against an allow-list of properties, as `UserResource` does with `ALLOWED_ORDERED_PROPERTIES`.
- Default page size is 20; do not change it per endpoint.

## Headers and alerts

- Create, update and delete responses carry alert headers from `HeaderUtil` so the UI can show a translated toast.
- The application name for alert headers comes from `jhipster.clientApp.name`.
- Do not add custom headers without documenting them here.

## Errors

- Use the problem details from `ExceptionTranslator`; never return error strings in the body.
- `404 Not Found` uses `ResponseUtil.wrapOrNotFound`.
- Validation errors return `400` with field errors; do not build them by hand.

## Versioning and compatibility

- The API is consumed only by the bundled Angular client, so breaking changes are allowed when client and server change together in one merge request.
- Remove unused endpoints instead of keeping them for compatibility.
- Keep the OpenAPI description accurate; springdoc generates it from annotations, so add `@Operation` summaries only where the method name is not enough.

## Logging

- Each resource method logs its call at debug level with the main parameters, as the generated resources do.
- Do not log request bodies that may contain personal data.

## Naming of query endpoints

- Filtering on a list endpoint uses query parameters, not new paths.
- A dedicated path is fine for a named report or view that is not a plain filter (for example `/api/admin/users/authorities`).
- Keep date ranges in query parameters as ISO-8601 dates or instants.
