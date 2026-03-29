#!/usr/bin/env python3
"""Inspect likely high-value context surfaces for token-efficient agent work."""

from __future__ import annotations

import json
import sys
from pathlib import Path


SURFACES = [
    ("AGENTS.md", "guidance", 3, 3, 3, 1),
    ("CLAUDE.md", "guidance", 3, 3, 2, 1),
    (".hforge/agent-manifest.json", "runtime", 3, 3, 3, 1),
    (".hforge/generated/agent-command-catalog.json", "runtime", 3, 3, 3, 1),
    (".hforge/runtime/index.json", "runtime", 3, 3, 2, 1),
    (".hforge/runtime/repo/repo-map.json", "runtime", 3, 2, 3, 1),
    (".hforge/runtime/repo/recommendations.json", "runtime", 3, 2, 3, 1),
    (".hforge/runtime/repo/instruction-plan.json", "runtime", 3, 2, 2, 1),
    ("README.md", "docs", 2, 2, 1, 2),
    (".specify/spec.md", "workflow", 2, 2, 3, 2),
    (".specify/plan.md", "workflow", 2, 2, 3, 2),
    (".specify/tasks.md", "workflow", 2, 2, 3, 2),
]


def score(authority: int, freshness: int, reuse_value: int, token_cost: int) -> int:
    return authority + freshness + reuse_value - token_cost


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd().resolve()
    found = []
    missing = []

    for relative_path, category, authority, freshness, reuse_value, token_cost in SURFACES:
        absolute_path = root / relative_path
        entry = {
            "path": relative_path,
            "category": category,
            "score": score(authority, freshness, reuse_value, token_cost),
            "authority": authority,
            "freshness": freshness,
            "reuseValue": reuse_value,
            "tokenCost": token_cost,
        }
        if absolute_path.exists():
            entry["sizeBytes"] = absolute_path.stat().st_size
            found.append(entry)
        else:
            missing.append(entry)

    found.sort(key=lambda item: (-item["score"], item["path"]))
    missing.sort(key=lambda item: (-item["score"], item["path"]))

    result = {
        "workspaceRoot": str(root),
        "recommendedKeepLoaded": found[:6],
        "recommendedFallbackReads": found[6:10],
        "missingButUseful": missing[:6],
    }
    json.dump(result, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
