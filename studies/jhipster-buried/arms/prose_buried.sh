#!/usr/bin/env bash
# Arm "prose_buried": the two rules are single bullets in the middle of long linked docs
# (clock in docs/backend.md, authorities in docs/security.md), among about 5,000 tokens of other conventions.
set -euo pipefail
bash "$BENCH_STUDY_DIR/arms/docs.sh" keep
