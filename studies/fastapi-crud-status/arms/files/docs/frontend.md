# Frontend

React with TypeScript, built with Vite, routed with TanStack Router and fed by TanStack Query.

## Structure

- `src/routes/`: file-based routes; `_layout.tsx` guards the authenticated area.
- `src/components/`: feature folders (`Admin`, `Items`, `UserSettings`, `Common`) and `ui/` for shared primitives built on Radix.
- `src/client/`: generated from the backend OpenAPI schema; never edit by hand, regenerate instead.
- `src/hooks/`: `useAuth`, `useCustomToast` and other shared hooks.

## Data fetching

- Call the backend only through the generated services (`ItemsService`, `UsersService`), never with `fetch` directly.
- Wrap reads in `useQuery` with a stable `queryKey`, and writes in `useMutation` that invalidates the affected queries.
- Show backend errors with `handleError`, which reads `detail` from the response.

## Forms

- Forms use React Hook Form with schemas that mirror the backend validation.
- Disable submit buttons while a mutation is pending.

## Styling

- Tailwind utility classes and the shared `ui/` components; no inline styles.
- Support light and dark mode through the theme provider.

## Quality

- Biome formats and lints; run `bun run lint` before pushing.
- Type errors fail the build; do not silence them with `any` or `@ts-ignore`.
