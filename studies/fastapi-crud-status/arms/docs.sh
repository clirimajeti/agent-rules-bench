#!/usr/bin/env bash
# Shared by all arms: copies CLAUDE.md plus 8 linked docs (about 4,000 tokens) into the copy.
# Usage: docs.sh buried|loaded|none
#   buried: each rule is one bullet mid-list (DB rule in docs/backend.md, status rule in docs/api.md)
#   loaded: the two rules in CLAUDE.md, the docs without them
#   none:   neither; the docs are otherwise identical in every arm
set -euo pipefail
FILES="$BENCH_STUDY_DIR/arms/files"
DB='- Database access goes through functions in `app/crud.py`; route handlers in `app/api/routes` never call `session.exec`, `session.get`, `session.add`, `session.delete` or `session.commit` themselves. Add a crud function when none fits.'
STATUS='- Status codes come from `from fastapi import status` (for example `status.HTTP_404_NOT_FOUND`), never integer literals like `status_code=404`.'
LOADED=''
[ "$1" = loaded ] && LOADED=$'\n## Backend rules\n\n'"$DB"$'\n'"$STATUS"$'\n'
mkdir -p docs
export LOADED DB STATUS # passed through ENVIRON: awk -v cannot take multi-line values
awk '$0=="{{LOADED_RULES}}"{printf "%s", ENVIRON["LOADED"]; next} {print}' "$FILES/CLAUDE.md" > CLAUDE.md
for f in "$FILES"/docs/*.md; do
  out="docs/$(basename "$f")"
  if [ "$1" = buried ]; then
    awk '$0=="{{RULE_DB}}"{print ENVIRON["DB"];next} $0=="{{RULE_STATUS}}"{print ENVIRON["STATUS"];next} {print}' "$f" > "$out"
  else
    grep -v '^{{RULE_' "$f" > "$out"
  fi
done
