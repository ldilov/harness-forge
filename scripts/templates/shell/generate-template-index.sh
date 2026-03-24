#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
OUT="${2:-$ROOT/docs/templates/index.md}"

mkdir -p "$(dirname "$OUT")"
{
  echo "# Template Index"
  echo
  find "$ROOT/templates" -type f -name '*.md' | sort | while IFS= read -r file; do
    rel="${file#$ROOT/}"
    echo "- \`$rel\`"
  done
} > "$OUT"

echo "Wrote template index to $OUT"
