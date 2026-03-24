param(
  [string]$Root = "."
)

$failed = $false
Get-ChildItem -Path (Join-Path $Root "templates") -Recurse -Filter *.md | ForEach-Object {
  $file = $_
  $content = Get-Content $file.FullName -Raw
  [regex]::Matches($content, '\[[^\]]+\]\(([^)]+)\)') | ForEach-Object {
    $match = $_
    $target = $match.Groups[1].Value
    if ($target -match '^(https?:|mailto:|#)') { return }
    $candidate = Join-Path $file.DirectoryName $target
    if (-not (Test-Path $candidate) -and -not (Test-Path (Join-Path $Root $target))) {
      Write-Host "[FAIL] Broken link in $($file.FullName): $target"
      $failed = $true
    }
  }
}

if ($failed) { exit 1 }
Write-Host "Template link validation passed."
