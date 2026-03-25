Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptPath = $MyInvocation.MyCommand.Path
while ((Get-Item $scriptPath).LinkType) {
  $resolved = (Get-Item $scriptPath).Target
  if (-not [System.IO.Path]::IsPathRooted($resolved)) {
    $resolved = Join-Path (Split-Path -Parent $scriptPath) $resolved
  }
  $scriptPath = $resolved
}

$scriptDir = Split-Path -Parent $scriptPath
$nodeExe = if ($env:NODE_BIN) { $env:NODE_BIN } else { "node" }
$cliPath = Join-Path $scriptDir "dist/cli/index.js"

if (-not (Get-Command $nodeExe -ErrorAction SilentlyContinue)) {
  Write-Error "Harness Forge requires Node.js 22+ to run."
  exit 1
}

if (-not (Test-Path $cliPath)) {
  Write-Error "Harness Forge CLI is not built yet. Run npm run build or install the published package."
  exit 1
}

& $nodeExe $cliPath @args
exit $LASTEXITCODE
