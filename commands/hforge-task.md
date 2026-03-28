---
id: command-hforge-task
kind: command
title: Harness Task Command
summary: Use when an agent should inspect Harness Forge task-runtime folders, task packs, and linked artifacts for the current work item.
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
# Harness Task Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints,
for example `/hforge-task` followed by a task id or the current task description.

## Expected workflow

1. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
2. run `hforge task list --root . --json`
3. if a task id is known, run `hforge task inspect <taskId> --root . --json`
4. when task-pack detail matters, run `hforge pack inspect <taskId> --root . --json`
5. summarize the most relevant task-runtime artifacts and the next recommended action

## Failure behavior

- if no task folders exist, say so explicitly instead of implying the runtime is broken
- if the workspace is not initialized, recommend `/hforge-init`
