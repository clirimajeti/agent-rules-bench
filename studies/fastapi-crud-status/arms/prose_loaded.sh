#!/usr/bin/env bash
# Arm "prose_loaded": the two rules in the always-loaded CLAUDE.md; the linked docs without them.
set -euo pipefail
bash "$BENCH_STUDY_DIR/arms/docs.sh" loaded
