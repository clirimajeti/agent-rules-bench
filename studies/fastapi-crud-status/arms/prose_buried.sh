#!/usr/bin/env bash
# Arm "prose_buried": each rule is one bullet in the middle of a long linked doc.
set -euo pipefail
bash "$BENCH_STUDY_DIR/arms/docs.sh" buried
