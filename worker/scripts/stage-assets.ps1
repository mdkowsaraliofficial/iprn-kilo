<#
.SYNOPSIS
  Builds the dashboard + admin apps and stages their dist output into
  worker/public so the Worker ([assets] directory = "./public") can serve
  /dashboard and /admin over the same origin as /api/v1.
.DESCRIPTION
  Invoked by `npm run stage:assets` which runs:
    powershell -ExecutionPolicy Bypass -File worker/scripts/stage-assets.ps1
#>
[CmdletBinding()]
param()
$ErrorActionPreference = "Stop"

$ScriptDir = $PSScriptRoot                       # .../worker/scripts
$WorkerDir = Split-Path -Parent $ScriptDir       # .../worker
$RootDir   = Split-Path -Parent $WorkerDir       # repo root
$PublicDir = Join-Path $WorkerDir "public"

Write-Host "==> Build dashboard"
Push-Location $RootDir
& npm run build:dashboard
if ($LASTEXITCODE -ne 0) { throw "dashboard build failed" }
Pop-Location

Write-Host "==> Build admin"
Push-Location $RootDir
& npm run build:admin
if ($LASTEXITCODE -ne 0) { throw "admin build failed" }
Pop-Location

Write-Host "==> Stage assets -> $PublicDir"
$destDashboard = Join-Path $PublicDir "dashboard"
$destAdmin     = Join-Path $PublicDir "admin"
if (Test-Path $destDashboard) { Remove-Item -Recurse -Force $destDashboard }
if (Test-Path $destAdmin)     { Remove-Item -Recurse -Force $destAdmin }
New-Item -ItemType Directory -Path $destDashboard -Force | Out-Null
New-Item -ItemType Directory -Path $destAdmin     -Force | Out-Null

Get-ChildItem -Path (Join-Path $RootDir "dashboard/dist") -Force |
  Copy-Item -Destination $destDashboard -Recurse -Force
Get-ChildItem -Path (Join-Path $RootDir "admin/dist") -Force |
  Copy-Item -Destination $destAdmin -Recurse -Force

Write-Host "==> Staged contents of $PublicDir:"
Get-ChildItem -Path $PublicDir -Name
