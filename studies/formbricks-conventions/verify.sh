#!/usr/bin/env bash
# verify steps for formbricks-conventions, run in the clean checkout (BENCH_CHECKOUT): setup | typecheck | tests.
# Every step runs in a node:24-bookworm container that sees only the checkout: no home folder, no SSH, cloud or
# npm credentials, no GitHub token. Install uses the frozen lockfile with scripts off. Dependencies, the .env,
# the generated Prisma client and the package builds are kept between runs (verify.keep), so they build once.
set -euo pipefail
IMAGE="${FORMBRICKS_IMAGE:-node:24-bookworm}"
in_container() {
  docker run --rm -v "$BENCH_CHECKOUT":/repo -w /repo -e CI=1 -e TURBO_TELEMETRY_DISABLED=1 -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    "$IMAGE" bash -c "corepack enable >/dev/null && $1"
}
case "$1" in
  setup)
    in_container '
      [ -d node_modules ] || pnpm install --frozen-lockfile --ignore-scripts
      [ -f .env ] || { pnpm dev:setup >/dev/null && sed -i "s|REDIS_URL=.*|REDIS_URL=|" .env; }
      [ -d packages/database/generated ] || (cd packages/database && pnpm generate)
      pnpm exec turbo run build --filter="@formbricks/web^..." --output-logs=errors-only' ;;
  # typegen validates the env and needs a REDIS_URL (any value; nothing connects); the tests keep the CI .env's empty one
  typecheck) in_container 'cd apps/web && REDIS_URL=redis://localhost:6379 pnpm typecheck' ;;
  # Only the tests related to the files the run changed. Vitest's JSON report decides (verify-tests.mjs): a failing
  # test file that also fails on the unchanged commit (baseline-failing-tests.txt) does not count. The file list
  # goes in as a file, since Next.js paths hold shell characters such as "(app)" and "[workspaceId]".
  tests)
    (cd "$BENCH_CHECKOUT" && { git diff --name-only HEAD; git ls-files --others --exclude-standard; } | grep -E '^apps/web/.*\.(ts|tsx)$' | sed 's|^apps/web/||' | sort -u) > "$BENCH_CHECKOUT/.verify-files.txt" || true
    [ -s "$BENCH_CHECKOUT/.verify-files.txt" ] || { echo "no changed web files"; exit 0; }
    cp "$BENCH_STUDY_DIR/baseline-failing-tests.txt" "$BENCH_CHECKOUT/.verify-baseline.txt"
    cp "$BENCH_STUDY_DIR/verify-tests.mjs" "$BENCH_CHECKOUT/.verify-tests.mjs"
    in_container 'cd apps/web && mapfile -t F < /repo/.verify-files.txt && rm -f /repo/.verify-vitest.json && { pnpm exec dotenv -e ../../.env -- vitest related --run --passWithNoTests --reporter=default --reporter=json --outputFile=/repo/.verify-vitest.json "${F[@]}" || true; } && node /repo/.verify-tests.mjs /repo/.verify-vitest.json /repo/.verify-baseline.txt' ;;
  *) echo "unknown step $1" >&2; exit 2 ;;
esac
