---
id: command-hforge-init
kind: command
title: Harness Init Command
summary: Use when an agent should initialize or bootstrap Harness Forge in the current repository before deeper analysis or implementation.
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
# Harness Init Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints,
for example `/hforge-init` followed by optional target or setup hints.

## Expected workflow

1. inspect `AGENTS.md`, `.hforge/agent-manifest.json`, and `.hforge/runtime/index.json` when present
2. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
3. run `hforge status --root . --json` before bootstrapping blindly
4. run `hforge bootstrap --root . --yes` when the repo is not initialized or required target surfaces are missing
5. follow with `hforge refresh --root . --json` so runtime summaries and indexes are current
6. summarize detected targets, installed surfaces, and the best next command

## Failure behavior

- if the repo is not writable, explain the blocker instead of retrying blindly
- if the launcher is unavailable, fall back to `npx @harness-forge/cli`
- do not claim initialization succeeded unless the managed runtime surfaces now exist
