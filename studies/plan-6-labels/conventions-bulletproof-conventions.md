# Conventions: bulletproof-conventions

## no-cross-feature-imports

A feature never imports from another feature; compose features in `src/app` instead.

## shared-not-from-features

Shared code (`components`, `hooks`, `lib`, `types`, `utils`, `config`) never imports from `features` or `app`.

## features-not-from-app

Features never import from `src/app`; the app imports features, not the other way around.

## notifications-in-mutation-hook

Success notifications (`useNotifications`) are shown inside the mutation hook in the feature's `api/` folder, in `onSuccess`; components and routes never call `useNotifications`.

## query-key-from-options

Query keys come from the feature's query options (for example `getUsersQueryOptions().queryKey`) wherever a key is needed, such as `invalidateQueries`; literal key arrays are written only inside `queryOptions(...)`.

## data-hooks-in-api

Components and routes never call `useQuery`, `useMutation` or `useQueryClient` directly; they use the hooks exported from the feature's `api/` files.

## api-client-in-api-folder

Only a feature's `api/` files (and `src/lib`) use the API client `@/lib/api-client`; components, routes and hooks call the feature's request hooks.

## no-direct-http

All HTTP requests go through `api` from `@/lib/api-client`; never call `fetch` or import `axios` anywhere else.

## use-query-spreads-options

A query hook passes its feature's query options to `useQuery` by spreading them: `useQuery({ ...getUsersQueryOptions(), ...queryConfig })`.

## query-options-named

Query options are built with `queryOptions(...)` in an exported function named `get<Thing>QueryOptions`, such as `getUsersQueryOptions`.

## mutation-hook-config

A mutation hook takes `{ mutationConfig }` as its options, like `useUpdateDiscussion({ mutationConfig } = {})`, and passes it on to `useMutation`.

## input-types-from-zod

Request input types are inferred from their zod schema (`type UpdateUserInput = z.infer<typeof updateUserInputSchema>`), never written out by hand.

## schemas-in-api

Zod validation schemas live in the feature's `api/` file next to the request they validate; components and routes import them and never build schemas themselves.

## entity-types-in-types-api

API entity types (`User`, `Comment`, `Discussion`, `Team`, `Meta`, `Entity`) are declared only in `src/types/api.ts` and imported from `@/types/api`.

## roles-from-enum

Roles are written as `ROLES.ADMIN` and `ROLES.USER` from `@/lib/authorization`, never as the strings `'ADMIN'` or `'USER'`.

## role-checks-through-authorization

Role checks go through `<Authorization allowedRoles={[...]}>` or `useAuthorization().checkAccess`; never compare `user.role` yourself.

## ownership-through-policies

Ownership checks (is this the current user's comment, team, ...) are policies in `POLICIES` in `@/lib/authorization`, used through `<Authorization policyCheck={...}>`; components never compare ids themselves.

## ui-button

Buttons are the `Button` component from `@/components/ui/button`; never a raw `<button>` element in features or routes.

## ui-form-controls

Forms and fields are the components from `@/components/ui/form` (`Form`, `FormDrawer`, `Input`, `Select`, `Textarea`, `Switch`); never raw `<form>`, `<input>`, `<select>` or `<textarea>` elements in features or routes.

## form-through-ui-form

Features and routes never import `react-hook-form` or `@hookform/resolvers` directly; `Form` from `@/components/ui/form` wraps them.

## icons-lucide

Icons come from `lucide-react` only.

## no-inline-style

Styling is Tailwind classes in `className`; never a `style` prop.

## classnames-with-cn

Conditional or combined class names go through `cn(...)` from `@/utils/cn`; never template strings or `+` in `className`, and never `clsx` or `classnames` directly.

## no-console

No `console` calls in application code.

## dates-through-format

Dates are shown with `formatDate` from `@/utils/format`; never `toLocaleDateString`/`toLocaleString` or a date library in features, routes or components.

## env-from-config

Environment values come from `env` in `@/config/env`; outside `src/config` only the build flags `import.meta.env.DEV`, `PROD` and `MODE` are read directly.

## paths-from-config

Links and navigation use `paths` from `@/config/paths` (`paths.app.users.getHref()`); never a hard-coded URL path such as `"/app/users"`.

## navigate-with-router

Navigation goes through React Router (`Link`, `useNavigate`); never `window.location`.

## no-any

No `any` in application code; use the API types from `@/types/api`, `unknown`, or a precise type.

## no-non-null-assertion

No non-null assertions (`value!`); handle the missing case, as the existing code does with `if (!user.data) return null`.

## types-not-interfaces

Object types are declared with `type`, never `interface`.

## named-exports

Features and shared code use named exports only; default exports are for route modules in `src/app/routes`.

## route-default-export

A route module default-exports a component named `<Name>Route`, such as `ProfileRoute`.

## imports-up-one-level

Relative imports go up at most one folder (`../api/get-users`); anything further away is imported through `@/`.

## no-barrels-in-features

Features have no barrel files: no `index.ts` and no `export * from` in `src/features`; import each file directly.

## kebab-case-files

File and folder names are kebab-case (`update-user-role.ts`, `users-list.tsx`), tests and stories included.

## tests-in-tests-folder

Test files are named `*.test.ts(x)` and live in a `__tests__` folder next to the code they test.

## mocks-network-delay

Every mock API handler in `src/testing/mocks/handlers` starts with `await networkDelay();`.

## mocks-persist-db

A mock API handler that creates, updates or deletes records calls `await persistDb('<model>')` after the change.

## mocks-try-catch

A mock API handler wraps its work in `try { ... } catch (error) { ... }` and answers errors with `HttpResponse.json({ message }, { status: 500 })`.
