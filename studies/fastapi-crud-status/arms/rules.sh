#!/usr/bin/env bash
# Arm "rules": the docs without the two rules; ast-grep rules plus the codemyrules feedback loop,
# and a one-line pointer for the design-shaping DB rule in backend/app/CLAUDE.md (the status rule gets none).
set -euo pipefail
CODEMYRULES="${CODEMYRULES:-$HOME/dev_private/tools/skills/codemyrules}"
bash "$BENCH_STUDY_DIR/arms/docs.sh" none
printf '%s\n' '- Database access goes through functions in `app/crud.py`; route handlers never call session methods (enforced by db-access-in-crud).' > backend/app/CLAUDE.md
mkdir -p .claude/codemyrules/rules
cp "$BENCH_STUDY_DIR"/rules/*.yml .claude/codemyrules/rules/
printf 'ruleDirs: [rules]\n' > .claude/codemyrules/sgconfig.yml
node "$CODEMYRULES/skills/codemyrules/scripts/install.mjs" "$BENCH_COPY" --config "$BENCH_STUDY_DIR/arms/loop.json" --apply > /dev/null
