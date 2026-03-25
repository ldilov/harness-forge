#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="$0"
while [ -L "$SCRIPT_PATH" ]; do
    link_dir="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
    SCRIPT_PATH="$(readlink "$SCRIPT_PATH")"
    [[ "$SCRIPT_PATH" != /* ]] && SCRIPT_PATH="$link_dir/$SCRIPT_PATH"
done
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
NODE_BIN="${NODE_BIN:-node}"
CLI_PATH="$SCRIPT_DIR/dist/cli/index.js"

if ! command -v "$NODE_BIN" >/dev/null 2>&1; then
  echo "Harness Forge requires Node.js 22+ to run." >&2
  exit 1
fi

if [ ! -f "$CLI_PATH" ]; then
  echo "Harness Forge CLI is not built yet. Run npm run build or install the published package." >&2
  exit 1
fi

exec "$NODE_BIN" "$CLI_PATH" "$@"
