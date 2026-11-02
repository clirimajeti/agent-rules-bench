#!/usr/bin/env bash
# Arm "generated": what codemyrules built on its own for this project (skill-eval run 96a98b7), on top of the
# buried-prose docs it started from: its rules, configs, slimmed docs, pointer file and feedback loop.
set -euo pipefail
bash "$BENCH_STUDY_DIR/arms/prose_buried.sh"
bash "$BENCH_STUDY_DIR/../../skill-eval/apply-output.sh" jhipster
# The loop's ESLint tier runs node_modules/.bin/eslint; installed the way the skill run did (there is no lockfile).
npm install --ignore-scripts --no-package-lock --no-audit --no-fund --loglevel=error > /dev/null
