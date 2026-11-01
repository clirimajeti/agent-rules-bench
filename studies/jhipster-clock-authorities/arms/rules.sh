#!/usr/bin/env bash
# Arm "rules": no prose rules; ast-grep rules plus the codemyrules feedback loop, and a one-line pointer
# for the design-shaping clock rule in the backend folder's CLAUDE.md (the mechanical authorities rule gets none).
set -euo pipefail
CODEMYRULES="${CODEMYRULES:-$HOME/dev_private/tools/skills/codemyrules}"
printf '# Project notes\n' > CLAUDE.md
printf '%s\n' '- Time: inject `java.time.Clock` and call `now(clock)`; never `now()` without a clock (enforced by use-clock-injection).' > src/main/java/CLAUDE.md
mkdir -p .claude/codemyrules/rules
cp "$BENCH_STUDY_DIR"/rules/*.yml .claude/codemyrules/rules/
printf 'ruleDirs: [rules]\n' > .claude/codemyrules/sgconfig.yml
node "$CODEMYRULES/skills/codemyrules/scripts/install.mjs" "$BENCH_COPY" --config "$BENCH_STUDY_DIR/arms/loop.json" --apply > /dev/null
