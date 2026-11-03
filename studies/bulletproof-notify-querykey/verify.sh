#!/usr/bin/env bash
# verify steps for bulletproof-notify-querykey, run in the clean checkout (BENCH_CHECKOUT): setup | typecheck | tests.
# node_modules and .env are kept between runs (verify.keep), so dependencies install once.
set -euo pipefail
cd "$BENCH_CHECKOUT/apps/react-vite"
case "$1" in
  setup)
    [ -d node_modules ] || yarn install --frozen-lockfile --ignore-scripts --silent
    cp .env.example .env ;;
  typecheck) node_modules/.bin/tsc --project tsconfig.json --noEmit ;;
  tests) node_modules/.bin/vitest run ;;
  *) echo "unknown step $1" >&2; exit 2 ;;
esac
