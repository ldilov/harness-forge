param(
  [string]$Root = "."
)

$config = Get-Content (Join-Path $Root "scripts/templates/config/required-sections.json") -Raw | ConvertFrom-Json
$failed = $false

Get-ChildItem -Path (Join-Path $Root "templates") -Recurse -Filter *.md | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  $normalizedPath = $_.FullName -replace '\\', '/'
  $kind = if ($normalizedPath -like "*/workflows/*") { 'workflow-template' } else { 'task-template' }
  foreach ($section in $config.$kind) {
    if ($content -notmatch [regex]::Escape($section)) {
      Write-Host "[FAIL] Missing section '$section' in $($_.FullName)"
      $failed = $true
    }
  }
}

if ($failed) { exit 1 }
Write-Host "All required template sections are present."
