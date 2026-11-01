#!/usr/bin/env bash
# Arm "prose_linked": the rules are prose in a linked file the agent only reads if it follows the link.
set -euo pipefail
mkdir -p docs
printf '# Project notes\n\nBackend coding conventions are in [docs/conventions.md](docs/conventions.md).\n' > CLAUDE.md
{ printf '# Backend conventions\n\n'; cat "$BENCH_STUDY_DIR/arms/conventions.md"; } > docs/conventions.md
