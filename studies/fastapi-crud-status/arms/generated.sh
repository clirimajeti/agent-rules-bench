#!/usr/bin/env bash
# Arm "generated": what codemyrules built on its own for this project (skill-eval run 96a98b7), on top of the
# buried-prose docs it started from: its rules, configs, slimmed docs and feedback loop.
set -euo pipefail
bash "$BENCH_STUDY_DIR/arms/prose_buried.sh"
bash "$BENCH_STUDY_DIR/../../skill-eval/apply-output.sh" fastapi
# The loop's Ruff tier runs through uv, which is not installed on the bench machine, and checks neither study rule
# (both are ast-grep rules in the fast tier), so it is left out instead of failing on every turn.
node -e '
const f = ".claude/codemyrules/loop.json", c = JSON.parse(require("fs").readFileSync(f, "utf8"));
c.linters = c.linters.filter((l) => l.command[0] !== "uv");
require("fs").writeFileSync(f, JSON.stringify(c, null, 2) + "\n");'
