#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
TEMPLATE_DIR="$ROOT/templates"
FAIL=0

if [ ! -d "$TEMPLATE_DIR" ]; then
  echo "Template directory not found: $TEMPLATE_DIR" >&2
  exit 2
fi

find "$TEMPLATE_DIR" -type f -name '*.md' | sort | while IFS= read -r file; do
  first_line="$(head -n 1 "$file" || true)"
  if [ "$first_line" != "---" ]; then
    echo "[FAIL] Missing front matter start: $file"
    FAIL=1
    continue
  fi

  if ! awk 'NR>1 && /^---$/ { found=1; exit } END { exit found ? 0 : 1 }' "$file"; then
    echo "[FAIL] Missing front matter end: $file"
    FAIL=1
    continue
  fi

  for field in id kind title status version supported_targets supported_languages owner generated; do
    if ! sed -n '/^---$/,/^---$/p' "$file" | grep -Eq "^[[:space:]]*$field:"; then
      echo "[FAIL] Missing front matter field '$field': $file"
      FAIL=1
    fi
  done
done

if [ "$FAIL" -ne 0 ]; then
  exit 1
fi

echo "Front matter validation passed."
