#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_BIN="${NODE_BIN:-node}"

if ! command -v "$NODE_BIN" >/dev/null 2>&1; then
  echo "Harness Forge requires Node.js 22+ to run." >&2
  exit 1
fi

exec "$NODE_BIN" "$SCRIPT_DIR/dist/cli/index.js" "$@"
