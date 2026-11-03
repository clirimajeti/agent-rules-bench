#!/usr/bin/env bash
# verify steps for fastapi-crud-status, run in the clean checkout (BENCH_CHECKOUT): setup | typecheck | tests.
# Dependencies live in a shared venv without the app itself, so only the checkout's own code is imported.
# The database is a Postgres container on port 55432 with the template's own .env password, recreated per run.
set -euo pipefail
VENV="${BENCH_VERIFY_VENV:-$HOME/.cache/agent-rules-bench/verify-deps/fastapi-venv}"
PORT=55432
cd "$BENCH_CHECKOUT"
case "$1" in
  setup)
    if [ ! -x "$VENV/bin/pytest" ]; then
      python3 -m venv "$VENV"
      "$VENV/bin/pip" -q install ./backend pytest mypy
    fi
    "$VENV/bin/pip" -q uninstall -y app 2>/dev/null || true
    PW=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2-)
    if ! docker exec bench-pg pg_isready -q -U postgres 2>/dev/null; then
      docker rm -f bench-pg >/dev/null 2>&1 || true
      docker run -d --name bench-pg -e POSTGRES_PASSWORD="$PW" -p $PORT:5432 postgres:18 >/dev/null
      for _ in $(seq 1 30); do docker exec bench-pg pg_isready -q -U postgres && break; sleep 2; done
    fi
    docker exec bench-pg psql -q -U postgres -c 'DROP DATABASE IF EXISTS app WITH (FORCE)' -c 'CREATE DATABASE app'
    sed -i '' -E "s#^(DATABASE_URL=.*@localhost:)5432/#\1$PORT/#" .env
    cd backend && PYTHONPATH=. "$VENV/bin/python" -m alembic upgrade head ;;
  typecheck) cd backend && PYTHONPATH=. "$VENV/bin/python" -m mypy app ;;
  tests) cd backend && FASTAPI_ENV=development "$VENV/bin/python" -m pytest -q -p no:cacheprovider tests/ ;;
  *) echo "unknown step $1" >&2; exit 2 ;;
esac
