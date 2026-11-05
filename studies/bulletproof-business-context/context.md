
## Product

Bulletproof is a discussion board for small teams.
A team is a company department, a club or a project group; its members start discussions, comment on them, and keep the conversation in one place instead of in chat threads that scroll away.
The product is sold per team, so everything a user sees is scoped to their own team: they never see another team's members, discussions or comments.
The web app in `apps/react-vite` is the product the team works on now; the two Next.js apps in `apps/` are older ports kept for reference and get no new features.

## Users and roles

- Every user belongs to exactly one team and has one of two roles: admin or user.
- Whoever registers with a new team name creates that team and becomes its admin.
- Whoever registers with the id of an existing team joins it as a user.
- There is no invitation flow yet; admins share the team id by hand, which support hears about often.
- A team can have several admins once an admin promotes someone, but today the only way to change a role is directly in the data.
- Users cannot leave a team or move to another one; support deletes the account and the person registers again.

What each role may do:

| action | user | admin |
|---|---|---|
| read the team's discussions and comments | yes | yes |
| comment on a discussion | yes | yes |
| delete a comment | own comments only | any comment in the team |
| create, edit and delete discussions | no | yes |
| see the team's member list (Users page) | no | yes |
| delete a member of the team | no | yes |
| edit own profile (name, email, bio) | yes | yes |

The server enforces every one of these rules; the app hides what a user may not do so they never hit an error for it.

## Domain

- **Team**: name, description, creation date.
  The name is shown in the app header area and on the profile page; it does not have to be unique across the product, only recognisable to its members.
- **User**: first and last name, email (unique across the product, used to sign in), password, bio, role, team, creation date.
  The full name is shown everywhere a person appears; the email is shown only on the Users page and the user's own profile.
- **Discussion**: title, body, author, team, creation date.
  The body is Markdown and is rendered sanitised, since members paste content from other tools.
  Discussions are listed newest first, ten per page.
- **Comment**: body, author, discussion, creation date.
  Comment bodies are Markdown too.
  Comments are listed oldest first under their discussion, ten per page, with a "load more" button.
- Deleting a discussion deletes its comments.
  Deleting a user keeps their discussions and comments, shown with the author missing.
- Dates are shown as day, month and year with the time; there is no time-zone setting, so they are shown in the browser's time zone.

## Screens

- Landing page at `/`, with a "Get started" button that goes to the app or to sign-in.
- Sign-in and registration at `/auth/login` and `/auth/register`; registration asks whether to join an existing team or create a new one.
  Both keep a `redirectTo` parameter, so a user sent to sign-in comes back to the page they wanted.
- Dashboard at `/app`: a welcome with the user's name and role, and a list of what that role can do.
- Discussions at `/app/discussions`: the paginated list, with create, edit and delete for admins.
- One discussion at `/app/discussions/:discussionId`: the discussion, its comments and the comment box.
- Users at `/app/users`, admins only: the team's members with their role and join date, and a delete button.
- Profile at `/app/profile`: the user's own details with an edit drawer.
- The side navigation shows Dashboard, Discussions and, for admins, Users.

## Sessions

- Signing in sets a session cookie; the app asks `/auth/me` on load to find out who is signed in.
- When the API answers 401 the app sends the user to sign-in and brings them back afterwards.
- Every failed request shows an error toast with the server's message.

## API and mock data

- The production API is a separate service owned by the platform team; its base URL is `VITE_APP_API_URL`.
- During development and in tests the app talks to a mock API instead (MSW), turned on by `VITE_APP_ENABLE_API_MOCKING=true` in `.env`.
  The mock API is the contract we hand to the platform team: a new endpoint is added to the mock first, the platform team builds it from that.
- The mock keeps its data in an in-memory database with the four models above (`src/testing/mocks/db.ts`).
  In the browser it is saved to `localStorage` under `msw-db`; the stand-alone mock server (`yarn run-mock-server`) saves it to `mocked-db.json`.
  To start from an empty database, clear that key or delete that file.
- Endpoints today: `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`; `/discussions` (list, one, create, update, delete); `/comments` (list by discussion, create, delete); `/users` (list, update own profile, delete); `/teams` (list, used by registration); `/healthcheck`.

## Commands

Run everything from `apps/react-vite`:

```bash
yarn install            # dependencies
cp .env.example .env    # mock API on by default
yarn dev                # app on http://localhost:3000
yarn run-mock-server    # mock API as a stand-alone server, for e2e tests
yarn test               # unit and integration tests (Vitest)
yarn test-e2e           # end-to-end tests (Playwright, needs the mock server)
yarn lint               # ESLint
yarn check-types        # TypeScript
yarn build              # production build in dist/
yarn storybook          # component catalogue on port 6006
yarn generate           # plop generator for a new component
```

- The end-to-end tests sign in once in `e2e/tests/auth.setup.ts` and reuse the saved session from `e2e/.auth/user.json`.
- Storybook stories exist for the shared UI components only.

## Environments and releases

- Pull requests get a preview deployment; `main` deploys to production on Netlify after the checks pass.
- The checks are lint, type check, unit tests and the end-to-end smoke test.
- There is no staging environment; product reviews features on the preview deployment.
- Feature flags do not exist yet; unfinished work stays on its branch.

## Working on this repository

- Branch from `main`, one branch per change, and open a pull request; nobody pushes to `main` directly.
- Commit messages say what changed and why, in the imperative ("Add comment editing"), without ticket prefixes.
- A pull request describes the change for the reviewer and lists anything it leaves out.
- New behaviour comes with a test: an integration test, or an end-to-end test for a whole user journey.
- Keep a pull request to one feature; refactors go in their own.

## Known issues and gotchas

- The discussions integration test is flaky under load and usually passes on a rerun.
- The mock database in `localStorage` survives reloads: after a change to the mock models, clear `msw-db` or the app shows old data.
- A user who joins a team with a wrong id gets "The team you are trying to join does not exist!"; support asks for the id again.
- The Users page shows all members on one page; the largest team has about 200 members, which is still fine.
- The app has no dark mode; design has asked to keep it that way until the brand colours are reviewed.

## Roadmap

These are planned, in this order; none of them is started:

- Editing one's own comments, with an "edited" mark.
- Admins changing a member's role from the Users page.
- Renaming a team, for admins.
- A Teams page for admins of several teams, and creating new teams.
- Invitations by email instead of sharing the team id.
- Notifications by email for new comments on a discussion one started.
