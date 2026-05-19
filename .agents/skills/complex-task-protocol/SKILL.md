---
name: complex-task-protocol
description: Auto-discoverable wrapper for `.hforge/library/skills/complex-task-protocol/SKILL.md`.
---

# Complex Task Protocol

## Activation

- trigger when a task is multi-step, risky, cross-module, orchestration-heavy, or likely to need verification and recovery discipline
- trigger when the task may benefit from a small number of bounded subagents for independent sidecar work
- trigger when reusable learning may need to be captured after complex work

## Use These Surfaces

- `.hforge/library/skills/complex-task-protocol/SKILL.md`
- `.hforge/runtime/agent-brief.md`
- `.hforge/generated/agent-command-catalog.json`
- `.hforge/runtime/recursive/language-capabilities.json`

## Operating Rule

Use the canonical skill under `.hforge/library/skills/` for execution. Treat this wrapper as a discovery entrypoint only. Activate the protocol by task complexity thresholds rather than by requiring a slash command.
