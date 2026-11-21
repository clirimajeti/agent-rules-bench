#!/usr/bin/env bash
# prose: n8n as its maintainers ship it. Claude Code reads the root AGENTS.md (CLAUDE.md is @AGENTS.md) and the
# frontend and nodes-base AGENTS.md through their own CLAUDE.md imports. This script only checks that.
set -euo pipefail
for d in . packages/frontend packages/nodes-base; do
  [ -f "$d/AGENTS.md" ] || { echo "missing $d/AGENTS.md" >&2; exit 1; }
  [ "$(cat "$d/CLAUDE.md" 2>/dev/null)" = "@AGENTS.md" ] || { echo "$d/CLAUDE.md does not import AGENTS.md" >&2; exit 1; }
done
