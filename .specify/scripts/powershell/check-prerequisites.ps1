[CmdletBinding()]
param(
  [switch]$Json,
  [switch]$RequireTasks,
  [switch]$IncludeTasks
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Get-Location
$stateDir = Join-Path $repoRoot ".specify/state"
$activeFeatureFile = Join-Path $stateDir "active-feature.txt"
$featureDir = $null

if (Test-Path $activeFeatureFile) {
  $featureRel = (Get-Content $activeFeatureFile -Raw).Trim()
  if ($featureRel) { $featureDir = Join-Path $repoRoot $featureRel }
}

if (-not $featureDir) {
  $featuresRoot = Join-Path $repoRoot ".specify/features"
  if (Test-Path $featuresRoot) {
    $candidate = Get-ChildItem $featuresRoot -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($candidate) { $featureDir = $candidate.FullName }
  }
}

if (-not $featureDir) { throw "No active feature found under .specify/features/." }

$docs = @()
foreach ($name in @("spec.md", "plan.md", "tasks.md", "research.md", "data-model.md", "quickstart.md")) {
  $candidate = Join-Path $featureDir $name
  if (Test-Path $candidate) { $docs += $candidate }
}

if ($RequireTasks -and -not (Test-Path (Join-Path $featureDir "tasks.md"))) {
  throw "tasks.md is required but was not found in $featureDir"
}

$result = [ordered]@{
  FEATURE_DIR = $featureDir
  SPEC_FILE = (Join-Path $featureDir "spec.md")
  PLAN_FILE = (Join-Path $featureDir "plan.md")
  TASKS_FILE = (Join-Path $featureDir "tasks.md")
  AVAILABLE_DOCS = $docs
}

if ($Json) {
  $result | ConvertTo-Json -Depth 5
  exit 0
}

$result
