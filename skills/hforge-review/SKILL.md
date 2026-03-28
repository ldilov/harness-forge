---
name: hforge-review
description: runtime health review for harness forge workspaces. use when the user wants drift checks, decision coverage, stale task review, managed-surface integrity, or a clear pass-fail summary of the current runtime state.
---

# HForge Review

## Trigger Signals

- the user asks whether the current Harness Forge setup is healthy
- runtime drift, stale task artifacts, or missing managed surfaces are suspected
- a handoff, release, or package refresh needs a concise review first
- decision coverage and runtime governance need to be checked before moving on

## Inspect First

- `.hforge/runtime/index.json`
- `.hforge/runtime/decisions/index.json`
- `.hforge/runtime/tasks/`
- `.hforge/generated/agent-command-catalog.json`
- `.hforge/agent-manifest.json`

## Workflow

1. run `hforge review --root . --json`
2. if installation drift is suspected, run `hforge doctor --root . --json`
3. if package-surface integrity is suspected, run `hforge audit --root . --json`
4. summarize blockers, warnings, stale runtime artifacts, decision gaps, and the best cleanup order

## Output Contract

- runtime health summary with blocker, warning, and cleanup sections
- decision-coverage and stale-task callouts when relevant
- the next remediation command to run

## Validation Path

- `hforge review --root . --json`
- `hforge doctor --root . --json`
- `hforge audit --root . --json`

## Failure Modes

- the workspace is not initialized
- review signals are incomplete because runtime summaries are stale
- doctor or audit cannot read the current install state

## Escalation

- escalate when install drift risks losing managed state
- escalate when audit shows package-surface mismatches that need a maintainer fix
- escalate when runtime findings and source-of-truth manifests disagree

## References

- `skills/hforge-review/references/review-order.md`
- `skills/hforge-review/references/output-contract.md`
