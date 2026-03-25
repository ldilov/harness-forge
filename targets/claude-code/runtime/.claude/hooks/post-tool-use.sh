#!/usr/bin/env bash
set -euo pipefail
if [ -x hooks/shared/post-change-summary.sh ]; then exec hooks/shared/post-change-summary.sh; fi
echo "[hforge] post-tool-use"
