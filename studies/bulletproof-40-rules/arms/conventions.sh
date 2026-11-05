#!/usr/bin/env bash
# All arms of bulletproof-40-rules, from plugin/conventions.mjs, the one list of the 40 conventions:
#   none:  the short CLAUDE.md of bulletproof-notify-querykey (links AGENTS.md and docs/), nothing else
#   prose: plus the 40 prose lines in the always-loaded file (CLAUDE.md for Claude Code, AGENTS.md for pi and Codex)
#   rules: plus the 40 lint rules with the codemyrules feedback loop, and one pointer line per design-shaping
#          convention in src/features/CLAUDE.md, as codemyrules installs it
set -euo pipefail
MODE="$1"
CODEMYRULES="${CODEMYRULES:-$HOME/dev_private/tools/skills/codemyrules}"
LIST="$BENCH_STUDY_DIR/plugin/conventions.mjs"
lines() { node --input-type=module -e "const { conventions } = await import(process.argv[1]); for (const c of conventions) if (process.argv[2] === 'prose' || c.pointer) console.log('- ' + (process.argv[2] === 'prose' ? c.prose : c.pointer));" "$LIST" "$1"; }
bash "$BENCH_STUDY_DIR/../bulletproof-notify-querykey/arms/docs.sh" none
# a study with a context.md (business context, no conventions) puts it in the always-loaded file of every arm
LOADED_FILE=CLAUDE.md; [ "${BENCH_AGENT:-claude}" = claude ] || LOADED_FILE=AGENTS.md
if [ -f "$BENCH_STUDY_DIR/context.md" ]; then cat "$BENCH_STUDY_DIR/context.md" >> "$LOADED_FILE"; fi
if [ "$MODE" = prose ]; then
  { printf '\n## Conventions\n\n'; lines prose; } >> "$LOADED_FILE"
  [ "$(grep -c '^## Conventions' "$LOADED_FILE")" = 1 ] || { echo "prose lines missing" >&2; exit 1; }
fi
if [ "$MODE" = rules ]; then
  lines pointer > apps/react-vite/src/features/CLAUDE.md
  D=.claude/codemyrules
  mkdir -p $D/plugin
  cp "$BENCH_STUDY_DIR/eslint.config.mjs" $D/eslint.config.mjs
  cp "$BENCH_STUDY_DIR/plugin/index.js" "$BENCH_STUDY_DIR/plugin/conventions.mjs" $D/plugin/
  ln -s "$BENCH_STUDY_DIR/node_modules" $D/node_modules # ESLint and the parser, installed once in the study folder
  node "$CODEMYRULES/skills/codemyrules/scripts/install.mjs" "$BENCH_COPY" --config "$BENCH_STUDY_DIR/arms/loop.json" --apply > /dev/null
fi
