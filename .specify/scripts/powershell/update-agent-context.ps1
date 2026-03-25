[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$Summary)

$stateDir = Join-Path (Get-Location) ".specify/state"
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
Set-Content -Path (Join-Path $stateDir "agent-context.md") -Value $Summary -Encoding UTF8
