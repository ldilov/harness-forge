[CmdletBinding()]
param([switch]$Json)

$result = & "$PSScriptRoot/check-prerequisites.ps1" -Json -RequireTasks:$false
if ($Json) {
  $result
  exit 0
}

$result | ConvertFrom-Json | Format-List
