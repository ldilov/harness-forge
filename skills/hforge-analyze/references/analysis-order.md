# Analysis order

Use this order to keep analysis deterministic and low-noise.

1. `hforge status --root . --json`
2. `.hforge/agent-manifest.json`
3. `.hforge/runtime/index.json`
4. `.hforge/runtime/repo/repo-map.json`
5. `.hforge/runtime/repo/recommendations.json`
6. `.hforge/runtime/repo/instruction-plan.json`
7. `.hforge/runtime/findings/risk-signals.json`
8. `.hforge/runtime/findings/validation-gaps.json`
9. `.hforge/runtime/decisions/index.json`
10. `hforge review --root . --json` when runtime health or stale tasks matter
11. `hforge refresh --root . --json` only when the existing runtime is missing or stale
