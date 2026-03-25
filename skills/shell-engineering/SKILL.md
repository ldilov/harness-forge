---
name: shell-engineering
description: shell engineering guidance for structured Harness Forge language packs.
---

# Shell Engineering

Use this skill when the repository is primarily shell automation or when the task touches shell scripts.

## Activation

- shell scripts dominate the task or repository
- the work touches automation, bootstrap, CI, or operational workflows

## Load Order

- `rules/common/`
- `rules/shell/`
- `knowledge-bases/structured/shell/docs/`
- `knowledge-bases/structured/shell/examples/`

## Execution Contract

1. inspect execution context, portability, and failure handling assumptions
2. select the common and shell-specific rules for the change
3. implement with explicit quoting, safety, and destructive-operation boundaries
4. verify with the safest repo script path and the structured checklist

## Outputs

- touched-script summary
- implementation summary
- validation result or blocker note

## Validation

- run the script in dry-run or non-destructive mode when possible
- consult `knowledge-bases/structured/shell/docs/review-checklist.md`

## Escalation

- escalate when portability or destructive operations make the risk non-local
- escalate when shell compatibility cannot be confirmed safely
