---
name: double-diamond-feature
description: Auto-discoverable wrapper for `.hforge/library/skills/double-diamond-feature/SKILL.md`.
---

# Double Diamond Feature Development

## Activation

- trigger for meaningful feature work before coding
- trigger for ambiguous user-facing, API, workflow, or architecture-significant changes
- do not trigger for bugs, regressions, outages, or flaky tests; use `bug-investigation`

## Use These Surfaces

- `.hforge/library/skills/double-diamond-feature/SKILL.md`
- `.hforge/generated/agent-command-catalog.json`
- `.hforge/runtime/repo/repo-map.json`
- `.hforge/runtime/repo/recommendations.json`
- `.hforge/runtime/tasks/<taskId>/` when task artifacts exist

## Operating Rule

Use the canonical skill under `.hforge/library/skills/` for execution. Treat this wrapper as a discovery entrypoint only. Keep the workflow lightweight unless risk or ambiguity requires Standard or Deep mode.
