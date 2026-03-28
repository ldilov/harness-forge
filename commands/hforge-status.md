---
id: command-hforge-status
kind: command
title: Harness Status Command
summary: Use when an agent should inspect the current Harness Forge workspace state before acting.
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
# Harness Status Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints,
for example `/hforge-status` followed by optional focus notes.

## Expected workflow

1. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
2. run `hforge status --root . --json`
3. inspect `.hforge/runtime/index.json`, `.hforge/agent-manifest.json`, and installed target bridges when they exist
4. summarize installed targets, visibility mode, important runtime surfaces, and the best next command

## Failure behavior

- if the workspace is not initialized, recommend `/hforge-init`
- if the launcher is unavailable, fall back to `npx @harness-forge/cli`
