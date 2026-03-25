#!/usr/bin/env bash
set -euo pipefail
if [ -x hooks/shared/pre-change-quality-gate.sh ]; then exec hooks/shared/pre-change-quality-gate.sh; fi
echo "[hforge] pre-tool-use"
