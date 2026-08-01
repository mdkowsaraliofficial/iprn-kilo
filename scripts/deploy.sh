#!/usr/bin/env bash
# Full production deploy for iprn-online.
# Prereqs (one-time, run by hand in Cloudflare):
#   - `npx wrangler login`  (authenticated; `npx wrangler whoami` prints a name)
#   - D1 / KV / R2 resources created and their IDs pasted into worker/wrangler.toml
#   - `npx wrangler secret put ADMIN_TOKEN` set (used by auth impersonation + admin panel)
# Run from repo root:  npm run deploy:production   |   bash scripts/deploy.sh
set -euo pipefail
echo "==> 1/4 D1 migrations (worker/migrations/0*.sql in order)"
npm run db:migrate
echo "==> 2/4 Build apps + stage static assets into worker/public"
npm run stage:assets
echo "==> 3/4 Worker bundle validation (dry run)"
( cd worker && npx wrangler deploy --dry-run )
echo "==> 4/4 Deploy Worker (bundle + assets + bindings)"
( cd worker && npx wrangler deploy )
echo "==> Production deploy complete."
