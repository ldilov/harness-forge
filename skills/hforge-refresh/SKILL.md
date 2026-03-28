---
name: hforge-refresh
description: refresh shared runtime summaries and generated harness forge artifacts after install changes, repo changes, or stale analysis state. use when the runtime is present but outdated, incomplete, or no longer trustworthy.
---

# HForge Refresh

## Trigger Signals

- runtime summaries are stale after installs or content changes
- repo-intelligence artifacts no longer match the current repository state
- the user explicitly asks to refresh the project-owned runtime
- a later review or analysis should not rely on outdated runtime state

## Inspect First

- `.hforge/runtime/index.json`
- `.hforge/generated/agent-command-catalog.json`
- `.hforge/runtime/repo/`

## Workflow

1. run `hforge refresh --root . --json`
2. follow with `hforge status --root . --json` when install-state confirmation matters
3. summarize regenerated artifacts, remaining gaps, and the best next action

## Output Contract

- confirmation that refresh ran or why it could not
- refreshed runtime artifacts and any remaining missing prerequisites
- the next command to run, usually `/hforge-analyze` or `/hforge-review`

## Validation Path

- `hforge refresh --root . --json`
- `hforge status --root . --json`

## Failure Modes

- the repo is not initialized
- required runtime files or launchers are missing
- refresh cannot reconcile the current install state

## Escalation

- escalate when refresh cannot complete without a fresh bootstrap
- escalate when runtime summaries regenerate but still disagree with the repo

## References

- `skills/hforge-refresh/references/refresh-order.md`
- `skills/hforge-refresh/references/output-contract.md`
