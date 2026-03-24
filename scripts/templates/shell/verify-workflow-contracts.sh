#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
FAIL=0

for file in "$ROOT"/templates/workflows/*.md; do
  [ -f "$file" ] || continue
  for field in "**Goal**" "**Consumes**" "**Produces**" "**Exit Criteria**" "**Failure Conditions**" "**Next Trigger**"; do
    if ! grep -qF "$field" "$file"; then
      echo "[FAIL] Missing workflow stage field '$field' in $file"
      FAIL=1
    fi
  done
done

if [ "$FAIL" -ne 0 ]; then
  exit 1
fi

echo "Workflow contracts look valid."
