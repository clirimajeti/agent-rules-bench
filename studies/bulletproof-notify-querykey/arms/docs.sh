#!/usr/bin/env bash
# Shared by all arms. Writes the same CLAUDE.md (pointing to the project's own AGENTS.md and docs/),
# and places the two rules according to the mode:
#   buried: the notification rule as a bullet mid-list in docs/api-layer.md, the query-key rule as a
#           sentence in the server-cache section of docs/state-management.md (the project's real docs)
#   loaded: both rules in the always-loaded file (CLAUDE.md for Claude Code, AGENTS.md for pi and Codex)
#   none:   neither
set -euo pipefail
NOTIFY='- For mutations, the success notification (`useNotifications`) is shown inside the mutation hook in the feature'"'"'s `api/` folder, in `onSuccess`; feature components never call `useNotifications` themselves.'
QUERYKEY='Query keys come from the feature'"'"'s query options (for example `getUsersQueryOptions().queryKey`) wherever a key is needed, such as `invalidateQueries`; write literal key arrays only inside `queryOptions(...)`.'
LOADED=''
[ "$1" = loaded ] && LOADED=$'\n## Rules\n\n'"$NOTIFY"$'\n- '"$QUERYKEY"$'\n'
export NOTIFY QUERYKEY LOADED
cat > CLAUDE.md <<'MD'
# Project notes

The app to work on is `apps/react-vite` (React, Vite, TanStack Query, Zod, Tailwind); leave the Next.js apps alone.
Read [AGENTS.md](AGENTS.md) for the project overview, structure and conventions.
Detailed guides are in `docs/`: [project structure](docs/project-structure.md), [project standards](docs/project-standards.md), [API layer](docs/api-layer.md), [state management](docs/state-management.md), [components and styling](docs/components-and-styling.md), [error handling](docs/error-handling.md), [testing](docs/testing.md), [security](docs/security.md), [performance](docs/performance.md).
MD
# The always-loaded file is the one the agent loads by itself: CLAUDE.md for Claude Code, AGENTS.md for the
# others (pi and Codex read AGENTS.md and skip a CLAUDE.md in the same folder; tested).
if [ "${BENCH_AGENT:-claude}" = claude ]; then printf '%s' "$LOADED" >> CLAUDE.md; else printf '%s' "$LOADED" >> AGENTS.md; fi
if [ "$1" = buried ]; then
  awk '{print} /^- A fetcher function that calls an endpoint/{print ENVIRON["NOTIFY"]}' docs/api-layer.md > docs/api-layer.md.new && mv docs/api-layer.md.new docs/api-layer.md
  awk '{print} /^- \[RTK\]\(https:\/\/redux-toolkit.js.org\/rtk-query\)/{print ""; print ENVIRON["QUERYKEY"]}' docs/state-management.md > docs/state-management.md.new && mv docs/state-management.md.new docs/state-management.md
  grep -qF 'never call `useNotifications`' docs/api-layer.md && grep -qF 'write literal key arrays' docs/state-management.md || { echo "rule placement failed" >&2; exit 1; }
fi
