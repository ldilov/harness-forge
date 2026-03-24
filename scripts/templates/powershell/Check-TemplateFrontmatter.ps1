param(
  [string]$Root = "."
)

$TemplateDir = Join-Path $Root "templates"
if (-not (Test-Path $TemplateDir)) {
  Write-Error "Template directory not found: $TemplateDir"
  exit 2
}

$requiredCommonFields = @(
  'id','kind','title','status','version',
  'supported_targets','supported_languages','owner','generated'
)

$requiredTaskFields = @('category','recommended_agents','recommended_commands')
$requiredWorkflowFields = @('mode','default_agents')

$failed = $false
Get-ChildItem -Path $TemplateDir -Recurse -Filter *.md | Sort-Object FullName | ForEach-Object {
  $file = $_
  $content = Get-Content -Path $file.FullName
  if ($content.Count -lt 3 -or $content[0] -ne '---') {
    Write-Host "[FAIL] Missing front matter start: $($file.FullName)"
    $failed = $true
    return
  }

  $closing = ($content | Select-Object -Skip 1 | Select-String '^---$' | Select-Object -First 1)
  if (-not $closing) {
    Write-Host "[FAIL] Missing front matter end: $($file.FullName)"
    $failed = $true
    return
  }

  $requiredFields = @($requiredCommonFields)
  if ($file.FullName -like "*\templates\tasks\*") {
    $requiredFields += $requiredTaskFields
  } elseif ($file.FullName -like "*\templates\workflows\*") {
    $requiredFields += $requiredWorkflowFields
  }

  foreach ($field in $requiredFields) {
    $pattern = '^\s*' + [regex]::Escape($field) + ':'
    if (-not ($content | Select-String $pattern -Quiet)) {
      Write-Host "[FAIL] Missing front matter field '$field': $($file.FullName)"
      $failed = $true
    }
  }
}

if ($failed) { exit 1 }
Write-Host "Front matter validation passed."
