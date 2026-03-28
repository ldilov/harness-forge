---
id: command-hforge-decide
kind: command
title: Harness Decide Command
summary: Use when an agent should capture an architecture-significant choice as a durable ASR or ADR inside the Harness Forge runtime.
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
# Harness Decide Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints,
for example `/hforge-decide` followed by the decision topic or scope.

## Expected workflow

1. inspect `.hforge/runtime/decisions/index.json`, relevant task-runtime artifacts, and runtime findings first
2. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
3. choose ASR when the direction is still being evaluated and ADR when the decision is stable enough to guide later work
4. write or update the durable record under `.hforge/runtime/decisions/`
5. summarize the decision statement, rationale, constraints, consequences, and related runtime evidence

## Failure behavior

- if the decision is still too vague, say so and list the missing evidence
- if the new record would contradict an accepted ADR, call that out explicitly before writing
