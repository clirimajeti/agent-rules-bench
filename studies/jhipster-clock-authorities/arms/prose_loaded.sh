#!/usr/bin/env bash
# Arm "prose_loaded": the same rules as prose in the always-loaded CLAUDE.md.
set -euo pipefail
{ printf '# Project notes\n\n## Backend conventions\n\n'; cat "$BENCH_STUDY_DIR/arms/conventions.md"; } > CLAUDE.md
