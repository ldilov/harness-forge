#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
FAIL=0

while IFS= read -r file; do
  while IFS= read -r link; do
    target="$(printf '%s' "$link" | sed -E 's/.*\(([^)]+)\)/\1/')"
    case "$target" in
      http*|mailto:*|'#'*) continue ;;
    esac
    dir="$(dirname "$file")"
    if [ ! -e "$dir/$target" ] && [ ! -e "$ROOT/$target" ]; then
      echo "[FAIL] Broken link in $file -> $target"
      FAIL=1
    fi
  done < <(grep -o '\[[^]]*\]([^)]*)' "$file" || true)
done < <(find "$ROOT/templates" -type f -name '*.md' | sort)

if [ "$FAIL" -ne 0 ]; then
  exit 1
fi

echo "Template link validation passed."
