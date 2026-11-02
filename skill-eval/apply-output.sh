#!/usr/bin/env bash
# Puts what a codemyrules run produced onto a study copy that is already in its buried-prose state:
# the tracked changes (rules, configs, slimmed docs, pointers) and the git-excluded loop files and settings.
# Usage, from a study arm's setup: bash apply-output.sh <target>   (jhipster, fastapi or bulletproof)
# SKILL_EVAL_RESULTS picks the run (default: the one with the suggestions layer).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
out="${SKILL_EVAL_RESULTS:-$here/results-96a98b7}/$1"
[ -f "$out/changes.patch" ] || { echo "apply-output: no $out/changes.patch" >&2; exit 1; }
git apply --whitespace=nowarn --exclude=codemyrules-report.md "$out/changes.patch"
mkdir -p .claude
cp -R "$out/claude/." .claude/
rm -f .claude/codemyrules/failures.log .claude/codemyrules/turn-*.txt # leftovers of the run's own smoke tests
printf '%s\n' .claude/codemyrules/ .claude/settings.local.json >> "$(git rev-parse --git-path info/exclude)"
# Warm the npx cache, so the first fast-tier check of a session does not time out on the download.
if grep -q '@ast-grep/cli' .claude/codemyrules/loop.json; then
  ver="$(grep -o '@ast-grep/cli@[0-9.]*' .claude/codemyrules/loop.json | head -1)"
  npx -y -p "$ver" ast-grep --version > /dev/null
fi
