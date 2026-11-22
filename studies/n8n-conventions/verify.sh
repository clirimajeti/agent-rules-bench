#!/usr/bin/env bash
# verify steps for n8n-conventions, run in the clean checkout (BENCH_CHECKOUT): setup | typecheck | tests.
# Every step runs in a node:24-bookworm container that sees only the checkout: no home folder, no SSH, cloud or
# npm credentials, no GitHub token. Install uses the frozen lockfile with scripts off. Dependencies and the builds
# of the workspace packages that cli and nodes-base need are kept between runs (verify.keep), so they build once.
# The tasks change two packages: packages/cli (package "n8n") and packages/nodes-base ("n8n-nodes-base").
set -euo pipefail
IMAGE="${N8N_IMAGE:-node:24-bookworm}"
in_container() {
  # pnpm's store lives in the checkout (kept between runs), since each container is removed after its step
  docker run --rm -v "$BENCH_CHECKOUT":/repo -w /repo -e CI=1 -e TURBO_TELEMETRY_DISABLED=1 -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 -e npm_config_store_dir=/repo/.pnpm-store \
    -e NODE_OPTIONS=--max-old-space-size=16384 "$IMAGE" bash -c "corepack enable >/dev/null && $1"
}
# the packages this run changed, as "<folder> <package name>" lines
changed() {
  (cd "$BENCH_CHECKOUT" && { git diff --name-only HEAD; git ls-files --others --exclude-standard; }) |
    sed -nE 's#^packages/(cli|nodes-base)/.*\.ts$#\1#p' | sort -u |
    sed -e 's#^cli$#cli n8n#' -e 's#^nodes-base$#nodes-base n8n-nodes-base#'
}
case "$1" in
  setup)
    # Builds what the changed package needs, with the agent's changes to other packages (api-types, db), but not
    # the changed package itself: code of the agent's in it that does not compile must fail the typecheck step of
    # that run, not the setup, whose failure stops the whole verify. n8n (cli) depends on n8n-nodes-base, so a run
    # that changed nodes-base builds only what nodes-base needs; no run changed both packages.
    case "$(changed | awk '{print $2}' | tr '\n' ' ')" in
      "n8n-nodes-base ") filters='--filter="n8n-nodes-base^..."' ;;
      *) filters='--filter="n8n^..." --filter="n8n-nodes-base^..."' ;;
    esac
    rm -f "$BENCH_CHECKOUT/.verify-build-failed"
    in_container '
      # always: quick when node_modules is complete, and it repairs anything missing
      pnpm install --frozen-lockfile --ignore-scripts
      # the one native module the build and the cli tests need; only its own install script runs
      # (from the root: a filtered `pnpm --filter n8n rebuild` pruned the other packages)
      node -e "require(require.resolve(\"sqlite3\", { paths: [\"packages/cli\"] }))" 2>/dev/null || pnpm rebuild sqlite3'
    # A build failure in a run that changed other built packages (T1, T2: api-types, db) is the agent's code that
    # does not compile: it fails the typecheck step of that run. Any other build failure stops the verify, as before.
    in_container 'pnpm exec turbo run build '"$filters"' --output-logs=errors-only' && exit 0
    other=$(cd "$BENCH_CHECKOUT" && { git diff --name-only HEAD; git ls-files --others --exclude-standard; } | grep -E '^packages/' | grep -vE '^packages/(cli|nodes-base)/' || true)
    [ -n "$other" ] || exit 1
    printf 'the build of the packages that %s needs failed; the run changed:\n%s\n' "$(changed | awk '{print $2}' | tr '\n' ' ')" "$other" > "$BENCH_CHECKOUT/.verify-build-failed"
    echo "build failed in a package the run changed; the typecheck step fails" ;;
  typecheck)
    if [ -f "$BENCH_CHECKOUT/.verify-build-failed" ]; then cat "$BENCH_CHECKOUT/.verify-build-failed"; exit 1; fi
    changed | while read -r dir name; do echo "typecheck $name"; in_container "pnpm --filter $name typecheck"; done ;;
  # The module folder whose tests verify runs, for each changed file (paths from the package root, on stdin):
  # cli: src/modules/<module>, nodes-base: nodes/<node>, any other file: its own folder.
  dirs)
    sed -E -e 's#^(src/modules/[^/]+)/.*#\1#;t' -e 's#^(nodes/[^/]+)/.*#\1#;t' -e 's#/[^/]*$##' | awk '!seen[$0]++' ;;
  # All tests in the module folders of the files the run changed, per package (`vitest related` pulled in most of
  # the cli suite: 20 minutes and more per run). Vitest's JSON report decides (verify-tests.mjs): a failing test
  # file that also fails on the unchanged commit does not count.
  tests)
    cp "$BENCH_STUDY_DIR/baseline-failing-tests.txt" "$BENCH_CHECKOUT/.verify-baseline.txt"
    cp "$BENCH_STUDY_DIR/verify-tests.mjs" "$BENCH_CHECKOUT/.verify-tests.mjs"
    status=0
    while read -r dir name; do
      (cd "$BENCH_CHECKOUT" && { git diff --name-only HEAD; git ls-files --others --exclude-standard; } | grep -E "^packages/$dir/.*\.ts$" | sed "s#^packages/$dir/##" | sort -u | bash "$0" dirs) > "$BENCH_CHECKOUT/.verify-files.txt"
      echo "tests $name: $(tr '\n' ' ' < "$BENCH_CHECKOUT/.verify-files.txt")"
      in_container "cd packages/$dir && mapfile -t F < /repo/.verify-files.txt && rm -f /repo/.verify-vitest.json && { N8N_LOG_LEVEL=silent DB_TYPE=sqlite pnpm exec vitest run --passWithNoTests --hookTimeout=120000 --testTimeout=60000 --reporter=default --reporter=json --outputFile=/repo/.verify-vitest.json \"\${F[@]}\" || true; } && node /repo/.verify-tests.mjs /repo/.verify-vitest.json /repo/.verify-baseline.txt" || status=1
    done < <(changed)
    [ -n "$(changed)" ] || echo "no changed cli or nodes-base files"
    exit $status ;;
  *) echo "unknown step $1" >&2; exit 2 ;;
esac
