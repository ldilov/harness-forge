Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeExe = if ($env:NODE_BIN) { $env:NODE_BIN } else { "node" }

if (-not (Get-Command $nodeExe -ErrorAction SilentlyContinue)) {
  Write-Error "Harness Forge requires Node.js 22+ to run."
  exit 1
}

& $nodeExe (Join-Path $scriptDir "dist/cli/index.js") @args
exit $LASTEXITCODE
