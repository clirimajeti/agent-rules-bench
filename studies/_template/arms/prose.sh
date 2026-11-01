#!/usr/bin/env bash
# Runs inside the fresh copy of the "prose" arm. State the rule as prose where this arm says it lives,
# for example appended to the always-loaded AGENTS.md:
set -euo pipefail
printf '\n- <the rule, as one sentence>\n' >> AGENTS.md
