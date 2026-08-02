<#
.SYNOPSIS
  Full production deploy for iprn-online (Windows PowerShell).
.DESCRIPTION
  Sequence:
    1. Apply D1 migrations (worker/migrations/0*.sql in order) to iprn_production.
    2. Build the dashboard + admin apps and stage them into worker/public.
    3. Validate the Worker bundle + bindings (wrangler deploy --dry-run).
    4. Deploy the Worker (bundle + staged assets + bindings).
  Run from the repo root:
    powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1
    (or) npm run deploy:production
.NOTES
  Prerequisites (run once by hand):
    - `npx wrangler login` (authenticated).
    - D1 database `iprn_production` created: `npx wrangler d1 create iprn_production`.
      KV namespaces auto-provision on deploy (no manual step).
      Queues auto-provision on deploy (no manual step).
    - Secret set:  echo "<value>" | npx wrangler secret put ADMIN_TOKEN
  Local dev secrets go in worker/.dev.vars (gitignored).
#>
[CmdletBinding()]
param()
$ErrorActionPreference = "Stop"

$ScriptDir = $PSScriptRoot                       # .../scripts
$RootDir   = Split-Path -Parent $ScriptDir       # repo root
$WorkerDir = Join-Path $RootDir "worker"

Write-Host "==> 1/4 D1 migrations (worker/migrations/0*.sql in order)"
& powershell -NoProfile -ExecutionPolicy Bypass -File "$WorkerDir\scripts\migrate.ps1"
if ($LASTEXITCODE) { throw "D1 migrations failed" }

Write-Host "==> 2/4 Build apps + stage static assets into worker/public"
& powershell -NoProfile -ExecutionPolicy Bypass -File "$WorkerDir\scripts\stage-assets.ps1"
if ($LASTEXITCODE) { throw "asset staging failed" }

Write-Host "==> 3/4 Worker bundle validation (dry run)"
Push-Location $WorkerDir
& npx wrangler deploy --dry-run
if ($LASTEXITCODE) { Pop-Location; throw "wrangler deploy --dry-run failed" }
Pop-Location

Write-Host "==> 4/4 Deploy Worker (bundle + assets + bindings)"
Push-Location $WorkerDir
& npx wrangler deploy
if ($LASTEXITCODE) { Pop-Location; throw "wrangler deploy failed" }
Pop-Location

Write-Host "==> Production deploy complete."
