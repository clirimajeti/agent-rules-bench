# Frontend

The client is an Angular application in `src/main/webapp/app`, built with the Angular CLI and served by Spring Boot in production.

## Structure

- `core`: singletons used everywhere (auth, interceptors, config, request helpers).
- `shared`: reusable components, pipes and directives without business logic.
- `entities`: the generated CRUD screens, one folder per entity.
- `admin`: the administration screens (user management, metrics, health, logs, configuration).
- `account`: login, registration, settings, password.
- Feature code stays in its folder; move code to `shared` only when a second feature needs it.

## Components

- Use standalone components and the `inject()` function.
- Prefer signals for local state and `computed` for derived values.
- Keep templates simple; move logic into the component class or a pure function.
- Use the `OnPush` change detection strategy for new components.
- Subscriptions are cleaned up with `takeUntilDestroyed`.

## Services and HTTP

- One service per API resource, in the feature folder, using `ApplicationConfigService.getEndpointFor`.
- Map server dates with `dayjs` in the service, as the generated services do.
- Handle errors centrally through the error handler interceptor; show alerts with `AlertService`.

## i18n

- Every visible text has a translation key in `src/main/webapp/i18n/en/*.json`.
- Use the `jhiTranslate` directive or the `translate` pipe; never hard-code text.

## Styling

- Bootstrap 5 and the styles in `content/scss`; no inline styles.
- Use the existing spacing and colour variables; do not add new colours without design approval.

## Routing and access

- Admin routes use `UserRouteAccessService` with the admin authority in the route data.
- Lazy-load feature routes.

## Quality

- ESLint and Prettier run on commit through lint-staged; fix findings instead of disabling them.
- Do not add a new npm dependency for something Angular or the existing libraries already do.
