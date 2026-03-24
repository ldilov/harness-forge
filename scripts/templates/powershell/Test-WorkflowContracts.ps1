param(
  [string]$Root = "."
)

$fields = @(
  '**Goal**',
  '**Consumes**',
  '**Produces**',
  '**Exit Criteria**',
  '**Failure Conditions**',
  '**Next Trigger**'
)

$failed = $false
Get-ChildItem -Path (Join-Path $Root "templates/workflows") -Filter *.md | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  foreach ($field in $fields) {
    if ($content -notmatch [regex]::Escape($field)) {
      Write-Host "[FAIL] Missing workflow stage field '$field' in $($_.FullName)"
      $failed = $true
    }
  }
}

if ($failed) { exit 1 }
Write-Host "Workflow contracts look valid."
