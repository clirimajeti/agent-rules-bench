# Conventions: formbricks-conventions

## no-new-server-actions

Server actions are legacy — do not add new ones. New backend work belongs in an `/api/v3` route consumed from the client with TanStack Query, with server data living in the query cache rather than mirrored into `useState` or Jotai. The existing server actions wrap service calls and return `{ data }` or `{ error }` consistently; keep that contract when changing them.

## readonly-props

React component props use `Readonly<>`.

## shared-date-formatting

All user-facing dates and times must use shared formatting helpers instead of ad hoc `date-fns`, `Intl`, or `toLocale*` calls in components.

## en-us-locale-only

**Only ever add or edit strings in `en-US.json`.** Never hand-write, translate, or edit the other (non-English) locale files yourself — those are machine-generated from en-US by Lingo.dev.
