# Deployment Checklist — iprn-online

Cloudflare Workers + D1 + KV + Queues + (dashboard + admin) static assets served from the Worker.

> Status in this sandbox: `wrangler deploy --dry-run` validates the config, bundle, and staged assets with no errors. The **real upload** requires Cloudflare authentication + real resource IDs, which cannot be produced without `wrangler login` against a real account — those steps are marked **[ACCOUNT]**.

## 0. Prerequisites

- Node.js >= 20
- Wrangler: `npm i -g wrangler` (or use `npx wrangler`)
- A Cloudflare account you can authenticate to:
  ```bash
  npx wrangler login
  npx wrangler whoami          # must print your account name
  ```

## 1. [ACCOUNT] Provision backing resources (one-time per account)

Queues are auto-created on first deploy — no command needed. D1 and KV must be created first and their IDs pasted into `worker/wrangler.toml`.

```bash
# 1x — D1 database (replace the placeholder database_id in wrangler.toml)
npx wrangler d1 create IPRN_PRODUCTION

# 3x — KV namespaces (CACHE_KV, RATE_LIMIT_KV, SESSION_KV)
# Each returns an `id` + `preview_id`; paste them into wrangler.toml under the matching binding.
npx wrangler kv:namespace create CACHE_KV
npx wrangler kv:namespace create RATE_LIMIT_KV
npx wrangler kv:namespace create SESSION_KV
```

Resulting bindings (already declared in `worker/wrangler.toml`):

| Binding                  | Resource        | Note                                  |
|--------------------------|-----------------|---------------------------------------|
| `env.DB`                 | D1 `IPRN_PRODUCTION` | created step 1 |
| `env.CACHE_KV`           | KV              |                                       |
| `env.RATE_LIMIT_KV`      | KV              |                                       |
| `env.SESSION_KV`         | KV              |                                       |
| `env.REWARD_PROCESSING_QUEUE` | Queue       | auto-created, has a consumer          |
| `env.WEBHOOK_DELIVERY_QUEUE`  | Queue       | auto-created, consumer + DLQ=FRAUD    |
| `env.ANALYTICS_QUEUE`         | Queue       | auto-created, has a consumer          |
| `env.FRAUD_QUEUE`             | Queue       | auto-created, DLQ target only         |
| `env.ASSETS`             | Bundled static assets | serves `/dashboard` and `/admin` |
| `env.APP_NAME` / `env.APP_VERSION` | var | non-secret config                  |

(`ADMIN_TOKEN` is a secret, not a var — step 2.)

## 2. [ACCOUNT] Set Worker secrets

```bash
# Generate a strong value, then store it as a Worker secret (never in [vars]).
ADMIN_TOKEN_VALUE="$(python3 -c 'import secrets;print(secrets.token_hex(24))')"
echo "$ADMIN_TOKEN_VALUE" | npx wrangler secret put ADMIN_TOKEN
```

Local dev only — create `worker/.dev.vars` (gitignored) from the template:
```bash
cp worker/.dev.vars.example worker/.dev.vars   # set ADMIN_TOKEN=dev-admin-token-change-me
```

## 3. [ACCOUNT] Apply D1 migrations (in order 0001 -> 0030)

```bash
npm run db:migrate
#   = worker/scripts/migrate.sh  ->  npx wrangler d1 execute IPRN_PRODUCTION --file=migrations/0*.sql (sorted)
```
Optional seed (already included as `0030_seed.sql`; safe to run again — seed is `INSERT OR IGNORE`):
```bash
npm run db:seed
```

## 4. Build + stage the dashboard and admin into the Worker assets

```bash
npm run stage:assets
#   = builds dashboard + admin, then copies dashboard/dist -> worker/public/dashboard
#     and admin/dist -> worker/public/admin (served by [assets] directory = "./public")
```

## 5. Deploy the Worker

```bash
# One-shot orchestration (migrate -> stage -> validate -> deploy):
npm run deploy:production
#   = bash scripts/deploy.sh

# ...or step-by-step:
npm run db:migrate
npm run stage:assets
( cd worker && npx wrangler deploy --dry-run )   # validates bundle + bindings, uploads nothing
( cd worker && npx wrangler deploy )             # production upload (412.7 KiB incl. assets)
```

## 6. Wire a custom domain (optional, for a vanity API origin)

```bash
npx wrangler route add "api.example.com/*" iprn-worker
# Dashboard is served same-origin at /dashboard, admin at /admin.
```

## 7. Verify the deployment

```bash
curl -s https://<YOUR_DOMAIN>/api/v1/public/health
# expect: 200 {"status":"ok",...}

curl -s https://<YOUR_DOMAIN>/dashboard/ | head -5   # served by Worker ASSETS
curl -s https://<YOUR_DOMAIN>/admin/    | head -5   # served by Worker ASSETS
```
Admin actions also require the access token of an admin user (seeded `admin-user-001`) or the `x-admin-token` secret:
```bash
curl -s https://<YOUR_DOMAIN>/api/v1/admin/stats \
  -H "Authorization: Bearer <ACCESS_TOKEN>" -H "x-admin-token: <ADMIN_TOKEN_VALUE>"
```

## 8. Rollback

```bash
npx wrangler rollback                       # previous deployment
npx wrangler d1 time-travel list ...        # D1 point-in-time restore (if enabled)
```

## Known caveats (not blockers)

- `cors` is configured as `origin: ["*"]` with `credentials: true` (worker `index.ts`). This is fine same-origin (the Worker serves the apps at `/dashboard` and `/admin`). For a **cross-origin** custom API domain, restrict `origin` to the real dashboard/admin origins.
- Bundles exceed 500 KB (dashboard ~1.0 MB, admin ~798 KB minified) — add Vite `manualChunks` code-splitting if bundle-size matters.
- `npm run test` (worker) currently fails (`vitest run` finds no test files) — baseline; not a deploy blocker. Add tests to enable it.
- OpenAPI spec: not generated (no OpenAPI route/Swagger UI in the worker). The authoritative route table is in the admin UI at `/admin/#/api-docs` (mirrored in `admin/src/pages/ApiDocsPage.tsx`).
- `compatibility_date = "2025-01-01"`; bump to a current date if you need newer runtime APIs / `nodejs_compat` defaults.

Generated resources created/edited for deployability:
- `worker/scripts/migrate.sh` — ordered D1 migration applier.
- `worker/scripts/stage-assets.sh` — build + stage `dashboard`/`admin` dist into `worker/public`.
- `scripts/deploy.sh` — `npm run deploy:production`.
- `worker/.dev.vars.example` — local dev secret template.
- `worker/wrangler.toml` — v4 `[[queues.producers]]`/`consumers` schema, `logpush`, secrets moved to `wrangler secret`, removed unused `ASSETS_R2`/`EMAIL_QUEUE` bindings and placeholder route/env.
- `package.json` (root + worker) + `.gitignore` — deploy scripts, correct DB name, asset staging, secrets gitignored.
