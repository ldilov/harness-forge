---
id: command-hforge-refresh
kind: command
title: Harness Refresh Command
summary: Use when an agent should regenerate Harness Forge runtime summaries and repo-intelligence artifacts after install or content changes.
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
# Harness Refresh Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints,
for example `/hforge-refresh` with optional notes about what changed.

## Expected workflow

1. inspect `.hforge/runtime/index.json`, `.hforge/runtime/repo/`, and `.hforge/generated/agent-command-catalog.json` first when present
2. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
3. run `hforge refresh --root . --json`
4. run `hforge status --root . --json` when install-state confirmation matters
5. summarize which runtime artifacts were regenerated and what to inspect next

## Failure behavior

- if the repo is not initialized, recommend `/hforge-init`
- do not pretend refresh repaired drift that still needs `doctor`, `audit`, or a maintainer fix
