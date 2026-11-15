#!/usr/bin/env bash
# verify steps for bulletproof-conventions, run in the clean checkout (BENCH_CHECKOUT): setup | typecheck | tests.
# Every step runs in a node:24-bookworm container that sees only the checkout (no home folder, no credentials).
# Install uses the frozen lockfile with scripts off; node_modules and .env are kept between runs (verify.keep).
set -euo pipefail
IMAGE="${BULLETPROOF_IMAGE:-node:24-bookworm}"
in_container() {
  docker run --rm -v "$BENCH_CHECKOUT":/repo -w /repo/apps/react-vite -e CI=1 "$IMAGE" bash -c "$1"
}
case "$1" in
  setup) in_container '[ -d node_modules ] || yarn install --frozen-lockfile --ignore-scripts --silent; cp .env.example .env' ;;
  typecheck) in_container 'node_modules/.bin/tsc --project tsconfig.json --noEmit' ;;
  tests) in_container 'node_modules/.bin/vitest run' ;;
  *) echo "unknown step $1" >&2; exit 2 ;;
esac
