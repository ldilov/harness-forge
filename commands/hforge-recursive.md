---
id: command-hforge-recursive
kind: command
title: Harness Recursive Command
summary: Use when an agent should escalate difficult work into recursive structured-analysis or typed recursive RLM execution with durable session artifacts.
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
4. submit typed recursive action bundles with `hforge recursive execute <sessionId> --file <bundle.json>` or `--stdin` when the task fits Typed RLM
5. submit structured analysis with `hforge recursive run <sessionId> --file <snippet>` or `--stdin` when a bounded snippet is the right tool
6. inspect durable results with `hforge recursive iterations <sessionId> --root . --json`, `hforge recursive subcalls <sessionId> --root . --json`, `hforge recursive cells <sessionId> --root . --json`, `hforge recursive promotions <sessionId> --root . --json`, `hforge recursive meta-ops <sessionId> --root . --json`, `hforge recursive score <sessionId> --root . --json`, and `hforge recursive replay <sessionId> --root . --json`

## Failure behavior

- if the current language is not supported, say so explicitly and fall back to non-recursive investigation
- do not imply recursive-native parity on partial targets; keep support claims aligned with the capability map
- treat Cursor and OpenCode recursive RLM posture as translated shared-runtime support rather than native target parity
