---
name: hforge-analyze
description: repository analysis, runtime fact refresh, evidence-backed notes, and decision capture using harness forge surfaces. use when the user asks to analyze the repo, understand what matters next, gather findings, inspect risks, or turn architecture-significant changes into durable decision records.
---

# HForge Analyze

## Trigger Signals

- the user asks for repo analysis, understanding, onboarding, or a summary of what matters next
- the repo already has Harness Forge runtime artifacts that should be reused instead of rediscovered
- there are risks, validation gaps, stale findings, or architecture-significant changes to capture
- the next safe step depends on understanding repo shape, runtime findings, or decision coverage

## Inspect First

- `AGENTS.md`
- `.hforge/agent-manifest.json`
- `.hforge/runtime/index.json`
- `.hforge/runtime/repo/repo-map.json`
- `.hforge/runtime/repo/recommendations.json`
- `.hforge/runtime/repo/instruction-plan.json`
- `.hforge/runtime/findings/risk-signals.json`
- `.hforge/runtime/findings/validation-gaps.json`
- `.hforge/runtime/decisions/index.json`

## Workflow

1. confirm the workspace is initialized with `hforge status --root . --json`
2. if runtime artifacts are missing, initialize first with `hforge bootstrap --root . --yes`
3. if runtime artifacts are stale, run `hforge refresh --root . --json`
4. run `hforge review --root . --json` when runtime health, decision coverage, or stale task artifacts matter
5. summarize repo shape, dominant implementation surfaces, risks, validation gaps, and next actions using the existing runtime as the primary source of truth
6. when the analysis reveals architecture-significant work, create or update a durable ASR or ADR under `.hforge/runtime/decisions/`

## References

- `skills/hforge-analyze/references/analysis-order.md`
- `skills/hforge-analyze/references/output-contract.md`
- `skills/hforge-analyze/references/decision-promotion.md`
