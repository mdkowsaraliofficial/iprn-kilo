<#
.SYNOPSIS
  Applies every worker/migrations/0*.sql file (sorted by name) to the D1
  database `iprn_production` on the REMOTE Cloudflare account (not local).
.DESCRIPTION
  Invoked by `npm run db:migrate` (worker) which runs:
    powershell -ExecutionPolicy Bypass -File scripts/migrate.ps1
  Migration filenames are zero-padded (0001_, 0001b_, 0001c_, 0002_ ...) so
  lexical sort == execution order. Each file is idempotent.
.NOTES
  Requires `wrangler` on PATH and an already-created D1 database named
  `iprn_production` (created once via `npx wrangler d1 create iprn_production`).
#>
[CmdletBinding()]
param(
    [Parameter()][string]$DatabaseName = "iprn_production"
)
$ErrorActionPreference = "Stop"

$ScriptDir = $PSScriptRoot                       # .../worker/scripts
$WorkerDir = Split-Path -Parent $ScriptDir       # .../worker
Set-Location $WorkerDir

Write-Host "==> Applying migrations to D1 '$DatabaseName' (remote)"
$migrationsDir = Join-Path $WorkerDir "migrations"
$files = Get-ChildItem -Path $migrationsDir -Filter "0*.sql" |
         Sort-Object -Property Name
if (-not $files) { throw "No migration files found in $migrationsDir" }

foreach ($f in $files) {
    Write-Host "==> Applying $($f.Name) -> $DatabaseName"
    & npx wrangler d1 execute $DatabaseName --remote --file $f.FullName
    if ($LASTEXITCODE -ne 0) { throw "Migration step failed: $($f.Name)" }
}
Write-Host "==> Migrations complete: $($files.Count) file(s) applied to $DatabaseName."
