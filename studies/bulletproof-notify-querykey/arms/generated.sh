#!/usr/bin/env bash
# Arm "generated": what codemyrules built on its own for this project (skill-eval run 96a98b7), on top of the
# buried-prose docs it started from: its rules, configs, slimmed AGENTS.md and feedback loop.
set -euo pipefail
bash "$BENCH_STUDY_DIR/arms/prose_buried.sh"
bash "$BENCH_STUDY_DIR/../../skill-eval/apply-output.sh" bulletproof
# The loop runs the app's own ESLint, with the local-rules plugin the skill added; installed as the skill run did.
(cd apps/react-vite && yarn install --frozen-lockfile --ignore-scripts --ignore-engines --silent > /dev/null)
