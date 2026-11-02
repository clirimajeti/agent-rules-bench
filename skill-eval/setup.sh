#!/usr/bin/env bash
# Starting point for a skill run: the study's buried-prose state (the two rules stated in the project's docs),
# plus the three skills copied into the project so a headless session can invoke them.
set -euo pipefail
SKILLS="${SKILLS_DIR:-$HOME/dev_private/tools/skills}"
bash "$BENCH_STUDY_DIR/arms/prose_buried.sh"
mkdir -p .claude/skills
for s in codemyrules eslint-pattern-rules backend-pattern-rules; do
  rm -rf ".claude/skills/$s"
  cp -R "$SKILLS/$s/skills/$s" ".claude/skills/$s"
  find ".claude/skills/$s" -name node_modules -prune -exec rm -rf {} +
  printf '%s %s\n' "$s" "$(git -C "$SKILLS/$s" rev-parse --short HEAD)" >> .claude/skills/VERSIONS
done
