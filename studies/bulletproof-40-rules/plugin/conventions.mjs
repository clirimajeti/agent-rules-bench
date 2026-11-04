// The conventions of this study, one entry each: the prose line (the prose arm's CLAUDE.md line, the lint
// message and the review's words are all this one text), the files it covers, its check, and examples that
// the tests run. `pointer` marks a design-shaping rule: the rules arm gets that line in src/features/CLAUDE.md,
// as codemyrules installs it. Globs are relative to the copy root.

const SRC = '**/src';
const ts = (dirs) => dirs.map((d) => `${SRC}/${d}/**/*.{ts,tsx}`);
const FEAT = ts(['features']);
const COMP = ts(['features/*/components']);
const API = ts(['features/*/api']);
const APP = ts(['app']);
const ROUTES = ts(['app/routes']);
const UI = ts(['components']);
const SHARED = ts(['components', 'hooks', 'lib', 'types', 'utils', 'config']);
const ALL = ts(['.']).map((g) => g.replace('/./', '/'));
const MOCKS = [`${SRC}/testing/mocks/handlers/**/*.ts`];
export const TESTS = ['**/__tests__/**', '**/*.test.{ts,tsx}', '**/*.stories.tsx', `${SRC}/testing/**`];

// f: a file path under apps/react-vite/src, for the examples
const f = (p) => `apps/react-vite/src/${p}`;

export const conventions = [
  // Architecture
  {
    id: 'no-cross-feature-imports', files: FEAT,
    prose: 'A feature never imports from another feature; compose features in `src/app` instead.',
    pointer: 'Features never import from each other; compose them in `src/app` (enforced by lint).',
    check: { kind: 'cross-feature' },
    valid: [{ filename: f('features/users/components/a.tsx'), code: "import { useUsers } from '../api/get-users';\nimport { Button } from '@/components/ui/button';" }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: "import { useTeams } from '@/features/teams/api/get-teams';" }, { filename: f('features/users/components/a.tsx'), code: "import { x } from '../../teams/api/get-teams';" }],
  },
  {
    id: 'shared-not-from-features', files: SHARED,
    prose: 'Shared code (`components`, `hooks`, `lib`, `types`, `utils`, `config`) never imports from `features` or `app`.',
    check: { kind: 'import', resolved: '^(features|app)/' },
    valid: [{ filename: f('components/ui/a.tsx'), code: "import { cn } from '@/utils/cn';" }],
    invalid: [{ filename: f('lib/a.ts'), code: "import { useUsers } from '@/features/users/api/get-users';" }],
  },
  {
    id: 'features-not-from-app', files: FEAT,
    prose: 'Features never import from `src/app`; the app imports features, not the other way around.',
    check: { kind: 'import', resolved: '^app/' },
    valid: [{ filename: f('features/users/components/a.tsx'), code: "import { paths } from '@/config/paths';" }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: "import { x } from '@/app/router';" }],
  },
  {
    id: 'notifications-in-mutation-hook', files: [...COMP, ...ROUTES],
    prose: 'Success notifications (`useNotifications`) are shown inside the mutation hook in the feature\'s `api/` folder, in `onSuccess`; components and routes never call `useNotifications`.',
    pointer: 'Success notifications go in the mutation hook in `api/`, not in components (enforced by lint).',
    check: { kind: 'import', resolved: '^components/ui/notifications', importNames: ['useNotifications'] },
    valid: [{ filename: f('features/users/api/a.ts'), code: "import { useNotifications } from '@/components/ui/notifications';" }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: "import { useNotifications } from '@/components/ui/notifications';" }],
  },
  {
    id: 'query-key-from-options', files: ALL,
    prose: 'Query keys come from the feature\'s query options (for example `getUsersQueryOptions().queryKey`) wherever a key is needed, such as `invalidateQueries`; literal key arrays are written only inside `queryOptions(...)`.',
    check: { kind: 'query-key' },
    valid: [{ filename: f('features/users/api/a.ts'), code: "queryClient.invalidateQueries({ queryKey: getUsersQueryOptions().queryKey });\nconst o = queryOptions({ queryKey: ['users'] });" }],
    invalid: [{ filename: f('features/users/api/a.ts'), code: "queryClient.invalidateQueries({ queryKey: ['users'] });" }],
  },
  {
    id: 'data-hooks-in-api', files: [...COMP, ...ROUTES, ...UI],
    prose: 'Components and routes never call `useQuery`, `useMutation` or `useQueryClient` directly; they use the hooks exported from the feature\'s `api/` files.',
    pointer: 'Components use the query and mutation hooks from the feature\'s `api/` files, never TanStack Query directly (enforced by lint).',
    check: { kind: 'import', module: '^@tanstack/react-query$', importNames: ['useQuery', 'useMutation', 'useInfiniteQuery', 'useQueryClient', 'useSuspenseQuery'] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: "import { useUsers } from '../api/get-users';" }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: "import { useMutation } from '@tanstack/react-query';" }],
  },
  {
    id: 'api-client-in-api-folder', files: [...COMP, ...ROUTES, ...ts(['components', 'hooks'])],
    prose: 'Only a feature\'s `api/` files (and `src/lib`) use the API client `@/lib/api-client`; components, routes and hooks call the feature\'s request hooks.',
    pointer: 'Requests go through the feature\'s `api/` files; components never import `@/lib/api-client` (enforced by lint).',
    check: { kind: 'import', resolved: '^lib/api-client' },
    valid: [{ filename: f('features/users/api/a.ts'), code: "import { api } from '@/lib/api-client';" }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: "import { api } from '@/lib/api-client';" }],
  },
  {
    id: 'no-direct-http', files: ALL, ignores: [`${SRC}/lib/api-client.ts`],
    prose: 'All HTTP requests go through `api` from `@/lib/api-client`; never call `fetch` or import `axios` anywhere else.',
    check: { kind: 'syntax', selectors: ["CallExpression[callee.name='fetch']", "ImportDeclaration[source.value='axios']"] },
    valid: [{ filename: f('features/users/api/a.ts'), code: "api.get('/users');" }],
    invalid: [{ filename: f('features/users/api/a.ts'), code: "fetch('/api/users');" }, { filename: f('features/users/api/a.ts'), code: "import axios from 'axios';" }],
  },
  // API layer
  {
    id: 'use-query-spreads-options', files: API,
    prose: 'A query hook passes its feature\'s query options to `useQuery` by spreading them: `useQuery({ ...getUsersQueryOptions(), ...queryConfig })`.',
    check: { kind: 'spread-options' },
    valid: [{ filename: f('features/users/api/a.ts'), code: 'useQuery({ ...getUsersQueryOptions(), ...queryConfig });' }],
    invalid: [{ filename: f('features/users/api/a.ts'), code: "useQuery({ queryKey: ['users'], queryFn: getUsers });" }],
  },
  {
    id: 'query-options-named', files: API,
    prose: 'Query options are built with `queryOptions(...)` in an exported function named `get<Thing>QueryOptions`, such as `getUsersQueryOptions`.',
    check: { kind: 'query-options-named' },
    valid: [{ filename: f('features/users/api/a.ts'), code: "export const getUsersQueryOptions = () => {\n  return queryOptions({ queryKey: ['users'], queryFn: getUsers });\n};" }],
    invalid: [{ filename: f('features/users/api/a.ts'), code: "const options = queryOptions({ queryKey: ['users'], queryFn: getUsers });" }, { filename: f('features/users/api/a.ts'), code: "export const usersOptions = () => queryOptions({ queryKey: ['users'] });" }],
  },
  {
    id: 'mutation-hook-config', files: API,
    prose: 'A mutation hook takes `{ mutationConfig }` as its options, like `useUpdateDiscussion({ mutationConfig } = {})`, and passes it on to `useMutation`.',
    check: { kind: 'hook-option', call: 'useMutation', param: 'mutationConfig' },
    valid: [{ filename: f('features/users/api/a.ts'), code: 'export const useDeleteUser = ({ mutationConfig }: Options = {}) => useMutation({ ...mutationConfig, mutationFn: deleteUser });' }],
    invalid: [{ filename: f('features/users/api/a.ts'), code: 'export const useDeleteUser = () => useMutation({ mutationFn: deleteUser });' }],
  },
  {
    id: 'input-types-from-zod', files: API,
    prose: 'Request input types are inferred from their zod schema (`type UpdateUserInput = z.infer<typeof updateUserInputSchema>`), never written out by hand.',
    check: { kind: 'syntax', selectors: ['TSTypeAliasDeclaration[id.name=/Input$/] > TSTypeLiteral', 'TSInterfaceDeclaration[id.name=/Input$/]'] },
    valid: [{ filename: f('features/users/api/a.ts'), code: 'type UpdateUserInput = z.infer<typeof updateUserInputSchema>;' }],
    invalid: [{ filename: f('features/users/api/a.ts'), code: 'type UpdateUserInput = { role: string };' }],
  },
  {
    id: 'schemas-in-api', files: [...COMP, ...ROUTES],
    prose: 'Zod validation schemas live in the feature\'s `api/` file next to the request they validate; components and routes import them and never build schemas themselves.',
    pointer: 'Zod schemas live in the feature\'s `api/` files; components import them (enforced by lint).',
    check: { kind: 'syntax', selectors: ["CallExpression[callee.object.name='z']", "CallExpression[callee.object.callee.object.name='z']"] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: "import { updateUserInputSchema } from '../api/update-user';" }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: "const schema = z.object({ role: z.string() });" }],
  },
  {
    id: 'entity-types-in-types-api', files: ALL, ignores: [`${SRC}/types/api.ts`],
    prose: 'API entity types (`User`, `Comment`, `Discussion`, `Team`, `Meta`, `Entity`) are declared only in `src/types/api.ts` and imported from `@/types/api`.',
    check: { kind: 'syntax', selectors: [':matches(TSTypeAliasDeclaration, TSInterfaceDeclaration)[id.name=/^(User|Comment|Discussion|Team|Meta|Entity|BaseEntity)$/]'] },
    valid: [{ filename: f('features/users/api/a.ts'), code: "import { User } from '@/types/api';\ntype UsersResponse = { data: User[] };" }],
    invalid: [{ filename: f('features/users/api/a.ts'), code: 'type User = { id: string };' }],
  },
  // Authorization
  {
    id: 'roles-from-enum', files: [...FEAT, ...APP, ...UI],
    prose: 'Roles are written as `ROLES.ADMIN` and `ROLES.USER` from `@/lib/authorization`, never as the strings `\'ADMIN\'` or `\'USER\'`.',
    check: { kind: 'syntax', selectors: ['Literal[value=/^(ADMIN|USER)$/]'] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: 'const allowed = [ROLES.ADMIN];' }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: "const allowed = ['ADMIN'];" }],
  },
  {
    id: 'role-checks-through-authorization', files: [...FEAT, ...ROUTES],
    prose: 'Role checks go through `<Authorization allowedRoles={[...]}>` or `useAuthorization().checkAccess`; never compare `user.role` yourself.',
    pointer: 'Check roles with `<Authorization>` or `useAuthorization`, never by comparing `user.role` (enforced by lint).',
    check: { kind: 'member-comparison', property: 'role' },
    valid: [{ filename: f('features/users/components/a.tsx'), code: 'const ok = checkAccess({ allowedRoles: [ROLES.ADMIN] });' }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: 'const ok = user.data?.role === ROLES.ADMIN;' }],
  },
  {
    id: 'ownership-through-policies', files: [...FEAT, ...ROUTES],
    prose: 'Ownership checks (is this the current user\'s comment, team, ...) are policies in `POLICIES` in `@/lib/authorization`, used through `<Authorization policyCheck={...}>`; components never compare ids themselves.',
    pointer: 'Ownership checks are `POLICIES` in `@/lib/authorization`, used via `<Authorization policyCheck>`; never compare ids in components (enforced by lint).',
    check: { kind: 'member-comparison', property: 'id', both: true },
    valid: [{ filename: f('features/comments/components/a.tsx'), code: "const canDelete = POLICIES['comment:delete'](user, comment);\nif (user.id === id) {}" }],
    invalid: [{ filename: f('features/comments/components/a.tsx'), code: 'const mine = comment.author?.id === user.data?.id;' }],
  },
  // UI
  {
    id: 'ui-button', files: [...FEAT, ...APP],
    prose: 'Buttons are the `Button` component from `@/components/ui/button`; never a raw `<button>` element in features or routes.',
    check: { kind: 'syntax', selectors: ["JSXOpeningElement[name.name='button']"] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: 'const a = <Button size="sm">Save</Button>;' }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: 'const a = <button>Save</button>;' }],
  },
  {
    id: 'ui-form-controls', files: [...FEAT, ...APP],
    prose: 'Forms and fields are the components from `@/components/ui/form` (`Form`, `FormDrawer`, `Input`, `Select`, `Textarea`, `Switch`); never raw `<form>`, `<input>`, `<select>` or `<textarea>` elements in features or routes.',
    pointer: 'Forms and fields come from `@/components/ui/form` (`Form`, `Input`, `Select`, ...), never raw `<form>`/`<select>` (enforced by lint).',
    check: { kind: 'syntax', selectors: ['JSXOpeningElement[name.name=/^(form|input|select|textarea)$/]'] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: 'const a = <Select options={options} registration={register(\'role\')} />;' }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: 'const a = <select onChange={change}><option>ADMIN</option></select>;' }],
  },
  {
    id: 'form-through-ui-form', files: [...FEAT, ...APP],
    prose: 'Features and routes never import `react-hook-form` or `@hookform/resolvers` directly; `Form` from `@/components/ui/form` wraps them.',
    check: { kind: 'import', module: '^(react-hook-form|@hookform/resolvers)' },
    valid: [{ filename: f('features/users/components/a.tsx'), code: "import { Form } from '@/components/ui/form';" }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: "import { useForm } from 'react-hook-form';" }],
  },
  {
    id: 'icons-lucide', files: [...FEAT, ...APP],
    prose: 'Icons come from `lucide-react` only.',
    check: { kind: 'import', module: '^(react-icons|@heroicons/|@radix-ui/react-icons|@fortawesome/|@mui/icons-material)' },
    valid: [{ filename: f('features/users/components/a.tsx'), code: "import { Pen } from 'lucide-react';" }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: "import { FaPen } from 'react-icons/fa';" }],
  },
  {
    id: 'no-inline-style', files: [...FEAT, ...APP],
    prose: 'Styling is Tailwind classes in `className`; never a `style` prop.',
    check: { kind: 'syntax', selectors: ["JSXAttribute[name.name='style']"] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: 'const a = <div className="mt-4" />;' }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: 'const a = <div style={{ marginTop: 16 }} />;' }],
  },
  {
    id: 'classnames-with-cn', files: [...FEAT, ...APP, ...UI],
    prose: 'Conditional or combined class names go through `cn(...)` from `@/utils/cn`; never template strings or `+` in `className`, and never `clsx` or `classnames` directly.',
    check: { kind: 'syntax', selectors: ["JSXAttribute[name.name='className'] > JSXExpressionContainer > :matches(TemplateLiteral, BinaryExpression)", 'ImportDeclaration[source.value=/^(clsx|classnames)$/]'] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: "const a = <div className={cn('p-2', active && 'bg-gray-100')} />;" }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: 'const a = <div className={`p-2 ${active ? "bg-gray-100" : ""}`} />;' }],
  },
  {
    id: 'no-console', files: ALL,
    prose: 'No `console` calls in application code.',
    check: { kind: 'syntax', selectors: ["MemberExpression[object.name='console']"] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: 'logger.info("x");' }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: 'console.log("x");' }],
  },
  {
    id: 'dates-through-format', files: [...FEAT, ...APP, ...UI],
    prose: 'Dates are shown with `formatDate` from `@/utils/format`; never `toLocaleDateString`/`toLocaleString` or a date library in features, routes or components.',
    check: { kind: 'syntax', selectors: ['CallExpression[callee.property.name=/^toLocale(Date|Time)?String$/]', 'ImportDeclaration[source.value=/^(dayjs|date-fns|moment)/]'] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: 'const a = formatDate(createdAt);' }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: 'const a = new Date(createdAt).toLocaleDateString();' }],
  },
  // Configuration and routing
  {
    id: 'env-from-config', files: ALL, ignores: [`${SRC}/config/**`],
    prose: 'Environment values come from `env` in `@/config/env`; outside `src/config` only the build flags `import.meta.env.DEV`, `PROD` and `MODE` are read directly.',
    check: { kind: 'syntax', selectors: ["MemberExpression[object.type='MetaProperty'][property.name='env']"], allowParentProperty: ['DEV', 'PROD', 'MODE'] },
    valid: [{ filename: f('features/users/api/a.ts'), code: 'const url = env.API_URL;' }, { filename: f('app/provider.tsx'), code: 'const dev = import.meta.env.DEV;' }],
    invalid: [{ filename: f('features/users/api/a.ts'), code: 'const url = import.meta.env.VITE_APP_API_URL;' }],
  },
  {
    id: 'paths-from-config', files: [...FEAT, ...APP, ...UI],
    prose: 'Links and navigation use `paths` from `@/config/paths` (`paths.app.users.getHref()`); never a hard-coded URL path such as `"/app/users"`.',
    check: { kind: 'syntax', selectors: ['JSXAttribute[name.name=/^(to|href)$/] > Literal[value=/^\\//]', 'JSXAttribute[name.name=/^(to|href)$/] > JSXExpressionContainer > :matches(Literal[value=/^\\//], TemplateLiteral[quasis.0.value.raw=/^\\//])', "CallExpression[callee.name='navigate'] > :matches(Literal[value=/^\\//], TemplateLiteral[quasis.0.value.raw=/^\\//])"] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: 'const a = <Link to={paths.app.users.getHref()}>Users</Link>;' }, { filename: f('app/routes/auth/login.tsx'), code: 'navigate(`${redirectTo ? redirectTo : paths.app.dashboard.getHref()}`);' }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: 'const a = <Link to="/app/users">Users</Link>;' }, { filename: f('features/users/components/a.tsx'), code: "navigate('/app/users');" }, { filename: f('features/users/components/a.tsx'), code: 'navigate(`/app/users/${id}`);' }],
  },
  {
    id: 'navigate-with-router', files: [...FEAT, ...APP],
    prose: 'Navigation goes through React Router (`Link`, `useNavigate`); never `window.location`.',
    check: { kind: 'syntax', selectors: ["MemberExpression[object.name='window'][property.name='location']"] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: 'navigate(paths.app.users.getHref());' }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: "window.location.href = '/app';" }],
  },
  // TypeScript
  {
    id: 'no-any', files: [...FEAT, ...ROUTES],
    prose: 'No `any` in application code; use the API types from `@/types/api`, `unknown`, or a precise type.',
    check: { kind: 'syntax', selectors: ['TSAnyKeyword'] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: 'const a = (u: User) => u.id;' }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: 'const a = (u: any) => u.id;' }],
  },
  {
    id: 'no-non-null-assertion', files: [...FEAT, ...APP],
    prose: 'No non-null assertions (`value!`); handle the missing case, as the existing code does with `if (!user.data) return null`.',
    check: { kind: 'syntax', selectors: ['TSNonNullExpression'] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: 'if (!user.data) return null;' }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: 'const id = user.data!.id;' }],
  },
  {
    id: 'types-not-interfaces', files: ALL,
    prose: 'Object types are declared with `type`, never `interface`.',
    check: { kind: 'syntax', selectors: ['TSInterfaceDeclaration'] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: 'type RowProps = { id: string };' }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: 'interface RowProps { id: string }' }],
  },
  // Modules and files
  {
    id: 'named-exports', files: [...FEAT, ...ts(['components', 'hooks', 'lib', 'utils'])],
    prose: 'Features and shared code use named exports only; default exports are for route modules in `src/app/routes`.',
    check: { kind: 'syntax', selectors: ['ExportDefaultDeclaration'] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: 'export const UsersList = () => null;' }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: 'const UsersList = () => null;\nexport default UsersList;' }],
  },
  {
    id: 'route-default-export', files: ROUTES,
    prose: 'A route module default-exports a component named `<Name>Route`, such as `ProfileRoute`.',
    check: { kind: 'syntax', selectors: ['ExportDefaultDeclaration > :not(Identifier[name=/Route$/])'] },
    valid: [{ filename: f('app/routes/app/teams.tsx'), code: 'const TeamsRoute = () => null;\nexport default TeamsRoute;' }],
    invalid: [{ filename: f('app/routes/app/teams.tsx'), code: 'export default function Teams() { return null; }' }, { filename: f('app/routes/app/teams.tsx'), code: 'const Teams = () => null;\nexport default Teams;' }],
  },
  {
    id: 'imports-up-one-level', files: ALL,
    prose: 'Relative imports go up at most one folder (`../api/get-users`); anything further away is imported through `@/`.',
    check: { kind: 'syntax', selectors: ['ImportDeclaration[source.value=/^\\.\\.\\/\\.\\.\\//]', 'ExportNamedDeclaration[source.value=/^\\.\\.\\/\\.\\.\\//]', 'ImportExpression[source.value=/^\\.\\.\\/\\.\\.\\//]'] },
    valid: [{ filename: f('features/users/components/a.tsx'), code: "import { useUsers } from '../api/get-users';" }],
    invalid: [{ filename: f('features/users/components/a.tsx'), code: "import { cn } from '../../../utils/cn';" }],
  },
  {
    id: 'no-barrels-in-features', files: FEAT,
    prose: 'Features have no barrel files: no `index.ts` and no `export * from` in `src/features`; import each file directly.',
    check: { kind: 'filename', forbid: '/index\\.tsx?$', selectors: ['ExportAllDeclaration'] },
    valid: [{ filename: f('features/users/api/get-users.ts'), code: 'export const getUsers = () => null;' }],
    invalid: [{ filename: f('features/users/index.ts'), code: 'export const a = 1;' }, { filename: f('features/users/api/a.ts'), code: "export * from './get-users';" }],
  },
  {
    id: 'kebab-case-files', files: ALL,
    prose: 'File and folder names are kebab-case (`update-user-role.ts`, `users-list.tsx`), tests and stories included.',
    check: { kind: 'filename', require: '^[a-z0-9]+(-[a-z0-9]+)*(\\.(test|stories|d))?\\.tsx?$', folders: '^([a-z0-9]+(-[a-z0-9]+)*|__tests__|__mocks__)$' },
    valid: [{ filename: f('features/users/api/update-user-role.ts'), code: 'export const a = 1;' }, { filename: f('features/users/components/__tests__/users-list.test.tsx'), code: 'export const a = 1;' }],
    invalid: [{ filename: f('features/users/api/updateUserRole.ts'), code: 'export const a = 1;' }, { filename: f('features/userRoles/api/a.ts'), code: 'export const a = 1;' }],
  },
  {
    id: 'tests-in-tests-folder', files: ALL,
    prose: 'Test files are named `*.test.ts(x)` and live in a `__tests__` folder next to the code they test.',
    check: { kind: 'filename', testsFolder: '__tests__' },
    valid: [{ filename: f('features/users/components/__tests__/users-list.test.tsx'), code: 'export const a = 1;' }],
    invalid: [{ filename: f('features/users/components/users-list.test.tsx'), code: 'export const a = 1;' }],
  },
  // Mock API (MSW)
  {
    id: 'mocks-network-delay', files: MOCKS,
    prose: 'Every mock API handler in `src/testing/mocks/handlers` starts with `await networkDelay();`.',
    check: { kind: 'mock-handler', first: 'networkDelay' },
    valid: [{ filename: f('testing/mocks/handlers/teams.ts'), code: "http.get('/teams', async () => {\n  await networkDelay();\n  return HttpResponse.json({});\n});" }],
    invalid: [{ filename: f('testing/mocks/handlers/teams.ts'), code: "http.get('/teams', async () => {\n  return HttpResponse.json({});\n});" }],
  },
  {
    id: 'mocks-persist-db', files: MOCKS,
    prose: 'A mock API handler that creates, updates or deletes records calls `await persistDb(\'<model>\')` after the change.',
    check: { kind: 'mock-handler', persist: true },
    valid: [{ filename: f('testing/mocks/handlers/teams.ts'), code: "http.post('/teams', async () => {\n  await networkDelay();\n  db.team.create({});\n  await persistDb('team');\n});" }],
    invalid: [{ filename: f('testing/mocks/handlers/teams.ts'), code: "http.post('/teams', async () => {\n  await networkDelay();\n  db.team.create({});\n});" }],
  },
  {
    id: 'mocks-try-catch', files: MOCKS, ignores: [`${SRC}/testing/mocks/handlers/index.ts`],
    prose: 'A mock API handler wraps its work in `try { ... } catch (error) { ... }` and answers errors with `HttpResponse.json({ message }, { status: 500 })`.',
    check: { kind: 'mock-handler', tryBlock: true },
    valid: [{ filename: f('testing/mocks/handlers/teams.ts'), code: "http.get('/teams', async () => {\n  await networkDelay();\n  try { return x; } catch (error) { return y; }\n});" }],
    invalid: [{ filename: f('testing/mocks/handlers/teams.ts'), code: "http.get('/teams', async () => {\n  await networkDelay();\n  return x;\n});" }],
  },

];

export const ruleId = (c) => `local/${c.id}`;
// The review's words for each rule, read by the harness for the fix prompt (study.json fix.ruleText).
export const ruleText = Object.fromEntries(conventions.map((c) => [ruleId(c), c.prose]));
