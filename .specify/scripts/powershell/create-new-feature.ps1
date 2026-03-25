[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Name,
  [string]$Id = $(Get-Date -Format 'yyyyMMdd-HHmm')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$safe = ($Name.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
$featureRel = ".specify/features/$Id-$safe"
$featureDir = Join-Path (Get-Location) $featureRel
New-Item -ItemType Directory -Force -Path $featureDir | Out-Null

foreach ($file in @("spec.md", "plan.md", "tasks.md")) {
  $path = Join-Path $featureDir $file
  if (-not (Test-Path $path)) { New-Item -ItemType File -Path $path | Out-Null }
}

$stateDir = Join-Path (Get-Location) ".specify/state"
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
Set-Content -Path (Join-Path $stateDir "active-feature.txt") -Value $featureRel -Encoding UTF8
Write-Output $featureDir
