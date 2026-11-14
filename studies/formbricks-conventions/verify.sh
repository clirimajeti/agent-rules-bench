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
  # Only the tests related to the files the run changed. Vitest's JSON report decides: a failing test file that
  # also fails on the unchanged commit (baseline-failing-tests.txt) does not count.
  tests)
    files=$(cd "$BENCH_CHECKOUT" && { git diff --name-only HEAD; git ls-files --others --exclude-standard; } | grep -E '^apps/web/.*\.(ts|tsx)$' | sed 's|^apps/web/||' | sort -u | tr '\n' ' ')
    [ -n "$files" ] || { echo "no changed web files"; exit 0; }
    cp "$BENCH_STUDY_DIR/baseline-failing-tests.txt" "$BENCH_CHECKOUT/.verify-baseline.txt"
    in_container "cd apps/web && { pnpm exec dotenv -e ../../.env -- vitest related --run --passWithNoTests --reporter=default --reporter=json --outputFile=/repo/.verify-vitest.json $files || true; } && node -e '
      const fs = require(\"fs\");
      const base = new Set(fs.readFileSync(\"/repo/.verify-baseline.txt\", \"utf8\").split(\"\\n\").filter(Boolean));
      const r = JSON.parse(fs.readFileSync(\"/repo/.verify-vitest.json\", \"utf8\"));
      const failed = r.testResults.filter((t) => t.status !== \"passed\").map((t) => t.name.split(\"/apps/web/\")[1]);
      const fresh = failed.filter((f) => !base.has(f));
      console.log(\"related test files: \" + r.testResults.length + \", failing: \" + failed.length + \", outside the baseline: \" + fresh.length);
      for (const f of fresh) console.log(\"  \" + f);
      process.exit(fresh.length ? 1 : 0);'" ;;
  *) echo "unknown step $1" >&2; exit 2 ;;
esac
