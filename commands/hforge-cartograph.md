---
id: command-hforge-cartograph
kind: command
title: Harness Cartograph Command
summary: Use when an agent should build or inspect repo maps, service boundaries, hotspots, and validation gaps before planning or implementation.
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
# Harness Cartograph Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints,
for example `/hforge-cartograph` followed by the repo area, risk, or architecture
question that needs deeper investigation.

## Expected workflow

1. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
2. run `hforge cartograph . --json`
3. when boundary or recommendation context is needed, run `hforge classify-boundaries . --json` and `hforge recommend . --json`
4. summarize dominant languages, likely service boundaries, risk hotspots, validation gaps, and the next best command or skill to use

## Failure behavior

- if the workspace is not initialized, the command may still run through `npx @harness-forge/cli`
- keep repo topology and support claims tied to the generated evidence, not inference alone
