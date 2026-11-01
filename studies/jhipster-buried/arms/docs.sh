#!/usr/bin/env bash
# Shared by both arms: copies the realistic doc set (CLAUDE.md plus 8 linked docs, about 5,000 tokens).
# Usage: docs.sh keep|drop. "keep" puts each rule into its placeholder line, mid-list in backend.md and security.md;
# "drop" removes the placeholder lines, so the docs are identical except for the two rules.
set -euo pipefail
FILES="$BENCH_STUDY_DIR/arms/files"
CLOCK='- Time: inject `java.time.Clock` and call `Instant.now(clock)` (or the matching `now(clock)`); never call `now()` without a clock.'
AUTH='- Authorities: use the constants in `AuthoritiesConstants` (for example `AuthoritiesConstants.ADMIN`), never string literals like `"ROLE_ADMIN"`.'
mkdir -p docs
cp "$FILES/CLAUDE.md" CLAUDE.md
for f in "$FILES"/docs/*.md; do
  out="docs/$(basename "$f")"
  if [ "$1" = keep ]; then
    awk -v c="$CLOCK" -v a="$AUTH" '$0=="{{RULE_CLOCK}}"{print c;next} $0=="{{RULE_AUTHORITIES}}"{print a;next} {print}' "$f" > "$out"
  else
    grep -v '^{{RULE_' "$f" > "$out"
  fi
done
