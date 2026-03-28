---
name: recursive-structured-analysis
description: Auto-discoverable wrapper for `.hforge/library/skills/recursive-structured-analysis/SKILL.md`.
---

# Recursive Structured Analysis

## Activation

- trigger when a recursive session needs one bounded structured investigation
- trigger when the operator or agent should inspect recursive capability truth
  before assuming a language-specific recursive analysis path exists

## Use These Surfaces

- `.hforge/library/skills/recursive-structured-analysis/SKILL.md`
- `.hforge/runtime/recursive/language-capabilities.json`
- `.hforge/runtime/recursive/sessions/<sessionId>/execution-policy.json`
- `.hforge/generated/agent-command-catalog.json`

## Operating Rule

Use the canonical skill under `.hforge/library/skills/` for execution. Treat
this wrapper as a discovery entrypoint only, and check the recursive language
capability map before describing recursive structured analysis as available
for a specific language or execution mode.
