#!/usr/bin/env bash
# Arm "rules": no rule prose; the ESLint rules (built-in no-restricted-imports + a custom rule) with the
# codemyrules feedback loop, and a one-line pointer for the design-shaping notification rule.
set -euo pipefail
CODEMYRULES="${CODEMYRULES:-$HOME/dev_private/tools/skills/codemyrules}"
bash "$BENCH_STUDY_DIR/arms/docs.sh" none
printf '%s\n' '- Success notifications go in the mutation hook in `api/`, not in components (enforced by no-restricted-imports).' > apps/react-vite/src/features/CLAUDE.md
D=.claude/codemyrules
mkdir -p $D/plugin
cp "$BENCH_STUDY_DIR/eslint.config.mjs" $D/eslint.config.mjs
cp "$BENCH_STUDY_DIR/plugin/index.js" $D/plugin/index.js
ln -s "$BENCH_STUDY_DIR/node_modules" $D/node_modules # ESLint and the parser, installed once in the study folder
node "$CODEMYRULES/skills/codemyrules/scripts/install.mjs" "$BENCH_COPY" --config "$BENCH_STUDY_DIR/arms/loop.json" --apply > /dev/null
