---
id: command-hforge-recommend
kind: command
title: Harness Recommend Command
summary: Use when an agent should run repo-intelligence and recommendation flows before setup, architecture, or implementation work.
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
# Harness Recommend Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints,
for example `/hforge-recommend` followed by the active repo question or focus area.

## Expected workflow

1. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
2. run `hforge recommend . --json`
3. when the task needs deeper shape analysis, run `hforge cartograph . --json` and `hforge classify-boundaries . --json`
4. summarize dominant languages, frameworks, risks, validation gaps, and the most relevant recommended bundles, skills, or profiles

## Failure behavior

- if the workspace is not initialized, the command may still run from `npx @harness-forge/cli`
- keep support claims tied to recommendation evidence, not assumptions
