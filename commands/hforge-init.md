---
id: command-hforge-init
kind: command
title: Harness Init Command
summary: Use when an agent should initialize its Harness Forge working posture, read the compact agent brief, or bootstrap Harness Forge before deeper analysis or implementation.
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

1. read `.hforge/runtime/agent-brief.md` first when it exists; treat it as the compact session-start orientation surface
2. inspect `.hforge/generated/agent-command-catalog.json`, `AGENTS.md`, `.hforge/agent-manifest.json`, and `.hforge/runtime/index.json` only as needed after the brief
3. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
4. run `hforge status --root . --json` before bootstrapping blindly
5. run `hforge bootstrap --root . --yes` when the repo is not initialized or required target surfaces are missing
6. follow with `hforge refresh --root . --json` so runtime summaries, the command catalog, and the agent brief are current
7. summarize detected targets, support caveats, authoritative surfaces, the chosen command path, and the best next command

## Response posture

- for simple coding tasks, keep Harness Forge acknowledgement to one or two lines
- for complex tasks, apply the automatic complex-task protocol from `.hforge/library/skills/complex-task-protocol/SKILL.md` when thresholds are met; do not require `/hforge-init` as the trigger
- for ambiguous, cross-module, high-risk, or long-context tasks, recommend the relevant `hforge review`, `hforge recommend`, `hforge task`, or `hforge recursive` workflow before broad repository scans
- do not turn the brief into a documentation dump; use it to explain what the agent will trust first

## Failure behavior

- if the repo is not writable, explain the blocker instead of retrying blindly
- if the launcher is unavailable, fall back to `npx @harness-forge/cli`
- if `.hforge/runtime/agent-brief.md` is missing but the workspace is initialized, run or recommend `hforge refresh --root . --json`
- if both the brief and command catalog are missing, use the documented launcher order and explain that the workspace may be from an older Harness Forge version
- do not claim initialization succeeded unless the managed runtime surfaces now exist
