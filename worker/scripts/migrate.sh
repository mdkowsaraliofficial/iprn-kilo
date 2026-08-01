#!/usr/bin/env bash
# Apply every worker/migrations/0*.sql file (sorted by name = execution order)
# to a D1 database. Idempotent per-file (CREATE TABLE IF NOT EXISTS / INSERT OR IGNORE).
#
# Usage (from repo root):
#   npm run db:migrate                       # -> IPRN_PRODUCTION
#   DB_NAME=IPRN_PRODUCTION bash worker/scripts/migrate.sh
#   cd worker && bash scripts/migrate.sh     # also works
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORKER="$(dirname "$HERE")"                  # worker/
cd "$WORKER"
DB_NAME="${DB_NAME:-IPRN_PRODUCTION}"
shopt -s nullglob
files=( migrations/0*.sql )
if [ "${#files[@]}" -eq 0 ]; then
  echo "No migration files found in $WORKER/migrations" >&2
  exit 1
fi
for f in "${files[@]}"; do
  echo "==> Applying $f -> $DB_NAME"
  npx wrangler d1 execute "$DB_NAME" --file="$f"
done
echo "==> Migrations complete: applied ${#files[@]} file(s) to $DB_NAME."
