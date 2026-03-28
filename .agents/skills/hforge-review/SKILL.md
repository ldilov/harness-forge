---
name: "hforge-review"
description: "Review Harness Forge runtime health, decision coverage, drift, stale task artifacts, and managed-surface integrity for the current repository."
compatibility: "Requires an initialized Harness Forge workspace for full value."
metadata:
  author: "harness-forge"
  source: "skills/hforge-review/SKILL.md"
---

## User Input

```text
$ARGUMENTS
```

You must consider the user input before proceeding.

## Goal

Produce a runtime-health review instead of a generic repo summary.

## Execution

1. Treat the text after `/hforge-review` as optional review emphasis.
2. Run `hforge review --root . --json` first.
3. If the review suggests installation drift or missing managed surfaces, run `hforge doctor --root . --json`.
4. If package-surface integrity is in doubt, run `hforge audit --root . --json`.
5. Summarize blockers, warnings, stale artifacts, decision gaps, and the highest-value cleanup steps.
6. Do not mutate runtime state unless the user asks for a follow-up fix.
