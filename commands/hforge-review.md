---
id: command-hforge-review
kind: command
title: Harness Review Command
summary: Use when an agent should review runtime health, drift, decision coverage, and stale task artifacts in an installed Harness Forge workspace.
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
# Harness Review Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints,
for example `/hforge-review` followed by optional review focus notes.

## Expected workflow

1. inspect `.hforge/runtime/index.json`, `.hforge/runtime/decisions/`, and `.hforge/runtime/tasks/` first when present
2. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
3. run `hforge review --root . --json`
4. run `hforge doctor --root . --json` when managed surfaces look incomplete or drifted
5. run `hforge audit --root . --json` when packaged-surface integrity is in doubt
6. summarize blockers, warnings, stale runtime artifacts, and the single best next remediation step

## Failure behavior

- if the workspace is not initialized, say so explicitly and recommend `/hforge-init`
- do not mutate runtime state unless the operator asks for a fix
