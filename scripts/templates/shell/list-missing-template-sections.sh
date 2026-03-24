#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
CONFIG="$ROOT/scripts/templates/config/required-sections.json"
FAIL=0

for file in "$ROOT"/templates/tasks/*.md "$ROOT"/templates/workflows/*.md; do
  [ -f "$file" ] || continue
  kind="task-template"
  case "$file" in
    *"/workflows/"*) kind="workflow-template" ;;
  esac

  python - "$CONFIG" "$kind" "$file" <<'PY'
import json, sys, pathlib
config = pathlib.Path(sys.argv[1])
kind = sys.argv[2]
file = pathlib.Path(sys.argv[3])
required = json.loads(config.read_text(encoding="utf-8"))[kind]
content = file.read_text(encoding="utf-8")
missing = [section for section in required if section not in content]
if missing:
    print(f"[FAIL] {file}: missing sections -> {', '.join(missing)}")
    sys.exit(1)
PY
  if [ $? -ne 0 ]; then
    FAIL=1
  fi
done

if [ "$FAIL" -ne 0 ]; then
  exit 1
fi

echo "All required template sections are present."
