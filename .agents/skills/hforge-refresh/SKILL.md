---
name: "hforge-refresh"
description: "Refresh Harness Forge runtime summaries and generated state after install changes, content updates, or stale repo-intelligence artifacts."
compatibility: "Requires a repository where Harness Forge runtime artifacts already exist or can be bootstrapped."
metadata:
  author: "harness-forge"
  source: "skills/hforge-refresh/SKILL.md"
---

## User Input

```text
$ARGUMENTS
```

You must consider the user input before proceeding.

## Goal

Regenerate the shared runtime summaries and report what changed.

## Execution

1. Treat the text after `/hforge-refresh` as optional focus notes.
2. Run `hforge refresh --root . --json`.
3. Run `hforge status --root . --json` after refresh when install-state confirmation matters.
4. Summarize refreshed runtime artifacts, any missing prerequisites, and the best next command.
5. If refresh fails because the repo is not initialized, recommend `/hforge-init` as the next step.
