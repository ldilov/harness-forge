---
id: command-hforge-commands
kind: command
title: Harness Commands Command
summary: Use when an agent should inspect the shipped Harness Forge command catalog before inventing an execution path.
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
# Harness Commands Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints,
for example `/hforge-commands`.

## Expected workflow

1. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
2. run `hforge commands --json`
3. prefer the agent-safe variants and the markdown command entrypoints from the generated catalog before inventing commands
4. summarize the best command or trigger for the task at hand

## Failure behavior

- if the command catalog is missing, recommend `hforge refresh --root . --json`
- if the workspace is not initialized, recommend `/hforge-init`
