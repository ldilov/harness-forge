---
id: command-hforge-recursive
kind: command
title: Harness Recursive Command
summary: Use when an agent should escalate difficult work into recursive structured-analysis with durable session and run artifacts.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
languages:
  - all
generated: false
---
# Harness Recursive Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints,
for example `/hforge-recursive` followed by the investigation goal, task id, or
the specific recursive structured-analysis step you want to run.

## Expected workflow

1. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
2. run `hforge recursive capabilities --root . --json` before claiming language support
3. create or inspect a session with `hforge recursive plan ... --root . --json` or `hforge recursive inspect <sessionId> --root . --json`
4. submit structured analysis with `hforge recursive run <sessionId> --file <snippet>` or `--stdin`
5. inspect durable results with `hforge recursive runs <sessionId> --root . --json` and `hforge recursive inspect-run <sessionId> <runId> --root . --json`

## Failure behavior

- if the current language is not supported, say so explicitly and fall back to non-recursive investigation
- do not imply recursive-native parity on partial targets; keep support claims aligned with the capability map
