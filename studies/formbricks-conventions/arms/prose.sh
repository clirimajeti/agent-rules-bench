#!/usr/bin/env bash
# prose: Formbricks as its maintainers ship it; the four conventions are in AGENTS.md and CODING_STANDARDS.md.
set -euo pipefail
for f in AGENTS.md CODING_STANDARDS.md apps/web/AGENTS.md; do [ -f "$f" ] || { echo "missing $f" >&2; exit 1; }; done
