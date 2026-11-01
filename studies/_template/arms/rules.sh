#!/usr/bin/env bash
# Runs inside the fresh copy of the "rules" arm: add the rule, an optional one-line pointer, and the feedback loop.
# Set the three values below for your study.
set -euo pipefail
CODEMYRULES="${CODEMYRULES:?set CODEMYRULES to your codemyrules checkout}"
POINTER_DIR="src/main/java"                       # folder whose CLAUDE.md gets the pointer
POINTER="- Time: inject java.time.Clock and call now(clock); never now() without a clock (enforced by example-no-now-without-clock)."
mkdir -p .claude/codemyrules/rules && cp "$BENCH_STUDY_DIR"/rules/*.yml .claude/codemyrules/rules/
printf 'ruleDirs: [rules]\n' > .claude/codemyrules/sgconfig.yml
printf '%s\n' "$POINTER" >> "$POINTER_DIR/CLAUDE.md"
node "$CODEMYRULES/skills/codemyrules/scripts/install.mjs" "$BENCH_COPY" --config "$BENCH_STUDY_DIR/arms/loop.json" --apply
