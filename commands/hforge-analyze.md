---
id: command-hforge-analyze
kind: command
title: Harness Analyze Command
summary: Use when an agent should inspect the installed Harness Forge runtime before planning, coding, or making support claims.
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
# Harness Analyze Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints,
for example `/hforge-analyze` followed by the active task, goal, or repo
question.

## Arguments and options

- include the current task, feature, bug, or investigation objective
- include the workspace root when the runtime is not already scoped to the repo
- prefer installed runtime inspection before implementation or support claims

## Expected workflow

1. inspect `AGENTS.md`, `.hforge/agent-manifest.json`, and `.hforge/generated/agent-command-catalog.json`
2. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
3. run the most relevant repo-intelligence and health commands, typically `status`, `commands`, `recommend`, and `review`
4. read `.hforge/runtime/repo/repo-map.json`, `.hforge/runtime/repo/recommendations.json`, and any task or recursive runtime surfaces that apply
5. summarize what the installed Harness Forge runtime says before editing files

## Output contract

- active Harness Forge surfaces called out explicitly
- command resolution path stated explicitly
- relevant runtime artifacts and recommendation evidence summarized
- clear next step suggested: implement, create task artifacts, write a decision record, or escalate into recursive mode

## Side effects

- may run read-oriented CLI commands such as `status`, `commands`, `recommend`, `review`, `task`, or `recursive capabilities`
- should remain diagnostic-first unless the operator explicitly asks for task artifacts, decisions, or recursive runs

## Failure behavior

- if the workspace is not initialized, say so and recommend `npx @harness-forge/cli` or `hforge init`
- if bare `hforge` is unavailable, fall back to the workspace launcher or `npx @harness-forge/cli`
- do not claim support or runtime state that is not present in the installed surfaces
