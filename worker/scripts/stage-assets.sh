#!/usr/bin/env bash
# Build the dashboard + admin apps and copy their dist output into
# worker/public so the Worker ([assets] directory = "./public") can serve
# /dashboard and /admin. Run from the repo root:
#   npm run stage:assets   |   bash worker/scripts/stage-assets.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORKER="$(dirname "$HERE")"                    # worker/
ROOT="$(dirname "$WORKER")"                    # repo root
DEST="$WORKER/public"
echo "==> Build dashboard"
npm --prefix "$ROOT" run build:dashboard
echo "==> Build admin"
npm --prefix "$ROOT" run build:admin
echo "==> Stage assets -> $DEST"
mkdir -p "$DEST/dashboard" "$DEST/admin"
rm -rf "$DEST/dashboard"/* "$DEST/admin"/*
cp -r "$ROOT/dashboard/dist/." "$DEST/dashboard/"
cp -r "$ROOT/admin/dist/." "$DEST/admin/"
echo "==> Staged. Contents of $DEST:"
ls -1 "$DEST"
