#!/usr/bin/env bash
# Arm "prose_buried": the rules inside the project's own long docs (docs/api-layer.md, docs/state-management.md).
set -euo pipefail
bash "$BENCH_STUDY_DIR/arms/docs.sh" buried
