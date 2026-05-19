param(
  [string]$Event = "task.started",
  [string]$Goal = "",
  [string]$Files = "",
  [string]$Command = "",
  [string]$Log = "",
  [switch]$Execute,
  [switch]$Json
)

$Hforge = if ($env:HFORGE_BIN) { $env:HFORGE_BIN } else { "hforge" }

function New-Rec([string]$CommandText, [string]$Reason, [bool]$AutoExecutable = $true) {
  [PSCustomObject]@{
    command = $CommandText
    reason = $Reason
    autoExecutable = $AutoExecutable
  }
}

$recs = @()

switch ($Event) {
  "task.started" {
    $recs += New-Rec "$Hforge graph build --if-stale" "Keep project graph fresh."
    $recs += New-Rec "$Hforge context compile --goal `"$Goal`"" "Produce focused task context."
  }
  "task.context_needed" {
    $recs += New-Rec "$Hforge context compile --goal `"$Goal`"" "Agent requested focused context."
  }
  { $_ -in @("files.pre_edit", "files.changed") } {
    $recs += New-Rec "$Hforge impact --files `"$Files`" --json" "Estimate change impact."
  }
  { $_ -in @("command.failed", "tests.failed") } {
    $recs += New-Rec "$Hforge impact --files `"$Files`" --json" "Link failure to impacted modules."
  }
  { $_ -in @("pr.prep", "task.completed") } {
    $recs += New-Rec "$Hforge impact --changed --json" "Summarize changed-file impact."
  }
  Default {
    $recs += New-Rec "$Hforge context compile --goal `"$Goal`"" "Fallback context." $false
  }
}

$diagnostics = @()
if ($Execute) {
  $diagnostics += "this helper never executes commands; run 'hforge agent hook --execute' for in-process diagnostic execution"
}

$result = [PSCustomObject]@{
  event = $Event
  mode = "dry-run"
  recommendedCommands = $recs
  executedCommands = @()
  diagnostics = $diagnostics
  nextAction = "review the plan, then call 'hforge agent hook' for execution and audit"
}

if ($Json) {
  $result | ConvertTo-Json -Depth 8
} else {
  Write-Host "Event: $Event"
  Write-Host "Mode: dry-run"
  Write-Host "Recommended commands:"
  foreach ($rec in $recs) {
    Write-Host "- $($rec.command)"
    Write-Host "  reason: $($rec.reason)"
  }
}
