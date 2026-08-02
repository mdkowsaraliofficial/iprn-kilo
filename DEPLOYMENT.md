# Deployment Checklist — iprn-online (Windows PowerShell)

Cloudflare Workers + D1 + KV + Queues. The Worker also serves the dashboard (`/dashboard`)
and admin (`/admin`) static assets from `worker/public` (single origin as `/api/v1`).

> All deployment is driven by PowerShell scripts. No bash/sh/cp/mkdir/rm is used by the
> deploy path. Verified locally with `wrangler 4.118.0`: `wrangler deploy --dry-run`
> succeeds (config + bundle + bindings all valid, `exiting now`, no errors).
> The real upload needs `wrangler login` + a created D1 database (see step 1).

## 0. Prerequisites

- Windows PowerShell 5.1+ (or PowerShell 7), Node.js >= 20.
- Wrangler: `npm i -g wrangler` (or rely on `npx wrangler`, used by every script).
- Authenticate once:
  ```powershell
  npx wrangler login
  npx wrangler whoami          # prints your account/email
  ```

## 1. [ACCOUNT] Provision backing resources (one-time per account)

Only **D1 must be pre-created** (wrangler.toml declares it by `database_name` = `iprn_production`).
KV namespaces and Queues are auto-provisioned by Wrangler from the `binding`-only declarations
(no IDs to paste, no manual `kv:namespace create`).

```powershell
npx wrangler d1 create iprn_production
```

Bindings declared in `worker/wrangler.toml` (auto-resolved):
| Binding              | Resource        | Notes                                  |
|-----------------------|-----------------|----------------------------------------|
| `env.DB`              | D1 `iprn_production` | created above (step 1)              |
| `env.CACHE_KV` / `RATE_LIMIT_KV` / `SESSION_KV` | KV | auto-created by Wrangler |
| `env.REWARD_PROCESSING_QUEUE`, `WEBHOOK_DELIVERY_QUEUE`, `ANALYTICS_QUEUE`, `FRAUD_QUEUE` | Queue | auto-created; FRAUD_QUEUE is the webhook DLQ |
| `env.ASSETS`          | Bundled static assets (`worker/public`) |                         |
| `env.APP_NAME`, `env.APP_VERSION` | Environment variables |                       |

No R2 bucket is required (the unused `ASSETS_R2` binding was removed).

## 2. [ACCOUNT] Set the ADMIN_TOKEN secret

```powershell
# Generate a strong value
$tok = (python3 -c "import secrets;print(secrets.token_hex(24))")
$tok | npx wrangler secret put ADMIN_TOKEN
```
Local dev: copy `worker/.dev.vars.example` to `worker/.dev.vars`, fill `ADMIN_TOKEN`, and run `npx wrangler dev` (the file is gitignored).

## 3. [ACCOUNT] Apply D1 migrations (ordered 0001 -> 0030, REMOTE)

```powershell
npm run db:migrate
#   worker/package.json: powershell -ExecutionPolicy Bypass -File scripts/migrate.ps1
#   -> loops migrations/0*.sql (sorted) and runs:
#      npx wrangler d1 execute iprn_production --remote --file <file>
```
Optional re-seed (idempotent; `0030_seed.sql` already runs in step 3):
```powershell
npm run db:seed     # npx wrangler d1 execute iprn_production --remote --file=migrations/0030_seed.sql
```

## 4. Build + stage the dashboard and admin

```powershell
npm run stage:assets
#   -> powershell -ExecutionPolicy Bypass -File worker/scripts/stage-assets.ps1
#   -> builds dashboard + admin, then stages dist into worker/public/{dashboard,admin}
```

## 5. Validate (no upload)

```powershell
Set-Location worker
npx wrangler deploy --dry-run
Set-Location ..
# Must print "exiting now" with no errors and list the bindings above.
```

## 6. Deploy the Worker

```powershell
npm run deploy:production
#   -> scripts/deploy.ps1:  migrate -> stage -> dry-run -> npx wrangler deploy
#
# Or step-by-step:
Set-Location worker
npx wrangler deploy
Set-Location ..
```

## 7. (Optional) Custom domain route

```powershell
npx wrangler route add "api.example.com/*" iprn-worker
```
The apps are served same-origin (`/dashboard`, `/admin`) by the Worker; do not leave a placeholder zone in `wrangler.toml`.

## 8. Verify the deployment

```powershell
curl https://<YOUR_DOMAIN>/api/v1/public/health          # 200 {"status":"ok", ...}
curl https://<YOUR_DOMAIN>/dashboard/                     # served by Worker ASSETS
curl https://<YOUR_DOMAIN>/admin/                         # served by Worker ASSETS
curl https://<YOUR_DOMAIN>/api/v1/admin/stats `
  -H "Authorization: Bearer <ACCESS_JWT>" -H "x-admin-token: <ADMIN_TOKEN>"
```

## 9. Rollback

```powershell
npx wrangler rollback
```

## What was fixed for deployability

- `wrangler.toml`: converted queues to the **v4 object schema** (`queues.producers` / `queues.consumers`, `max_batch_timeout` instead of the rejected `max_batch_wait`); `database_name` lowered to `iprn_production`; removed placeholder `database_id` + KV `id`/`preview_id` (auto-provisioned); removed the unused `ASSETS_R2` (R2) and `EMAIL_QUEUE` bindings; removed `ADMIN_TOKEN` from `[vars]` (now a secret); removed dead `[env.local]`+`[[routes]]` placeholder zone; added `logpush = true`.
- Worker `Env` (config.ts): dropped the unused `ASSETS_R2`/`EMAIL_QUEUE` fields.
- `worker/package.json`: `build`→`npx wrangler deploy --dry-run` (was invalid `--dry-run deploy`); `db:migrate`→runs the ordered migration loop; `db:seed`→`iprn_production --remote`; added `stage:assets`.
- Root `package.json`: `stage:assets` + `deploy:production` invoke the PowerShell scripts.
- Asset serving: the Worker serves `/dashboard` and `/admin` from `worker/public`; this was previously broken (no staging step). `stage-assets.ps1` now builds and stages them before every deploy.

## Verification performed in this sandbox (executed)

- `npm run typecheck --workspaces` → EXIT 0 (api-client, reward-engine, types, validators, worker, dashboard, admin).
- `npm run build:dashboard` / `npm run build:admin` → EXIT 0.
- `wrangler deploy --dry-run` → succeeds; bindings list resolves (D1 `iprn_production`, KV×3, Queues×4, ASSETS, 2 vars); 412.69 KiB uploaded for validation.
- `bash -n`/`Sort` of migration order: 30 files, lexical == execution order.

## Verification NOT possible in this sandbox (requires a Cloudflare account + Windows)

- `npx wrangler deploy` (real upload) — no authenticated session here (`wrangler whoami` → not authenticated).
- PowerShell execution — no `pwsh`/`powershell` runtime here; the `.ps1` scripts are authored to Windows PowerShell 5.1 grammar and verified by review only. Run `powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1` on Windows.
- Runtime D1/Queue behavior, live SSE, webhooks, and end-to-end API calls — need a deployed Worker + Cloudflare account.
