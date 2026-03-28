---
id: command-hforge-update
kind: command
title: Harness Update Command
summary: Use when an agent should preview or apply a non-destructive Harness Forge package refresh while preserving gathered runtime state.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - all
generated: false
---
# Harness Update Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints,
for example `/hforge-update` followed by optional version or safety notes.

## Expected workflow

1. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
2. run `hforge update --root . --dry-run --yes` first when the user wants a preview
3. run `hforge update --root . --yes` or `hforge upgrade --root . --yes` only when the operator wants to apply the refresh
4. summarize preserved runtime state, backup location, and the best post-update validation commands such as `review`, `doctor`, or `audit`

## Failure behavior

- if the workspace is not initialized, recommend `/hforge-init` instead of forcing an update
- do not claim gathered runtime state will be preserved unless the managed update flow is actually used
