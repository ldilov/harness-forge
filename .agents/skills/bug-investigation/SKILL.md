---
name: bug-investigation
description: Auto-discoverable wrapper for `.hforge/library/skills/bug-investigation/SKILL.md`.
---

# Bug Investigation

## Activation

- trigger for defects, regressions, outages, flaky tests, and incorrect behavior
- trigger when reproduction, containment, root-cause evidence, or recurrence prevention is needed
- do not trigger as the primary workflow for new features; use `double-diamond-feature`

## Use These Surfaces

- `.hforge/library/skills/bug-investigation/SKILL.md`
- `.hforge/generated/agent-command-catalog.json`
- `.hforge/runtime/repo/repo-map.json`
- `.hforge/runtime/findings/risk-signals.json`
- `.hforge/runtime/tasks/<taskId>/` when task artifacts exist

## Operating Rule

Use the canonical skill under `.hforge/library/skills/` for execution. Treat this wrapper as a discovery entrypoint only. Prioritize containment and evidence preservation when user/data/system harm may be ongoing.
