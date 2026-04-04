---
name: hforge-recursive-investigate
description: recursive investigation orchestration using harness forge. use when the task is hard, ambiguous, cross-module, or likely to benefit from Typed RLM, bounded subcalls, durable iterations, and replayable recursive artifacts instead of chat-only reasoning.
---

# HForge Recursive Investigate

## Trigger Signals

- the root cause is unclear and needs staged evidence gathering
- the task crosses multiple modules, services, or ownership boundaries
- the prompt is getting expensive and would benefit from compact root frames and durable artifacts
- the work needs Typed RLM, bounded code cells, proposal artifacts, or replayable investigation state
- a normal one-pass repo scan is likely to lose context or miss intermediate findings

Do not use this for straightforward single-file edits where ordinary repo inspection is enough.

## Inspect First

- `AGENTS.md`
- `.hforge/agent-manifest.json`
- `.hforge/generated/agent-command-catalog.json`
- `.hforge/runtime/index.json`
- `.hforge/runtime/recursive/language-capabilities.json`
- `.hforge/runtime/recursive/runtime-inventory.json`
- `.hforge/runtime/recursive/escalation-heuristics.json`
- `.hforge/runtime/recursive/sessions/`
- `commands/hforge-recursive-investigate.md`

## Workflow

1. confirm the workspace is initialized with `hforge status --root . --json`
2. if runtime artifacts are missing, initialize first with `hforge bootstrap --root . --yes`
3. inspect recursive support with `hforge recursive capabilities --root . --json`
4. inspect host-runtime posture with `hforge recursive runtimes --root . --json`
5. provision Python or PowerShell explicitly with `hforge recursive provision-runtime <python|powershell> --root . --json` only when a workspace-managed alias is helpful
6. create a durable session with `hforge recursive plan "<objective>" --task-id <taskId> --root . --json`
7. prefer `hforge recursive execute` with a typed bundle before using freeform structured-analysis snippets
8. use `hforge recursive run` only for one bounded fallback step when Typed RLM is not the right fit
9. inspect `iterations`, `subcalls`, `cells`, `promotions`, `meta-ops`, `score`, and `replay` to summarize the work from durable artifacts
10. stay honest about support posture, especially for Cursor and OpenCode where recursive support is translated rather than native

## Output Contract

A good recursive-investigate result should include:

- the reason recursive mode was chosen
- the session id and the posture discovered from recursive capabilities and runtime inventory
- whether the agent used Typed RLM, bounded structured analysis, or both
- the most relevant iteration, scorecard, replay, or proposal artifacts
- the next recommended action based on the durable evidence
