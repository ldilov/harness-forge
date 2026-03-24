param(
  [string]$Root = ".",
  [string]$OutPath = ""
)

if (-not $OutPath) {
  $OutPath = Join-Path $Root "docs/templates/index.md"
}

$lines = @("# Template Index", "")
Get-ChildItem -Path (Join-Path $Root "templates") -Recurse -Filter *.md | Sort-Object FullName | ForEach-Object {
  $rel = $_.FullName.Replace("$Root\", "")
  $lines += "- `$rel`"
}

$dir = Split-Path -Parent $OutPath
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
Set-Content -Path $OutPath -Value $lines -Encoding utf8
Write-Host "Wrote template index to $OutPath"
