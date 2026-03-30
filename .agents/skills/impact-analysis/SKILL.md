---
name: impact-analysis
description: auto-discoverable wrapper for `.hforge/library/skills/impact-analysis/SKILL.md`.
---

# Impact Analysis

## Activation

- trigger when a change, diff, migration, dependency upgrade, rollout, hotfix, refactor, or incident remediation needs blast-radius analysis
- trigger when the task should separate scope, risk, and confidence instead of collapsing them into one vague severity judgment

## Use These Surfaces

- `.hforge/library/skills/impact-analysis/SKILL.md`
- `.hforge/library/skills/impact-analysis/references/`
- `.hforge/library/skills/impact-analysis/scripts/`
- `.hforge/library/skills/impact-analysis/assets/`

## Operating Rule

Use the canonical impact-analysis skill under `.hforge/library/skills/` for the actual workflow, scoring model, and reporting structure. This wrapper exists so agent runtimes can discover the skill quickly and then load the deeper project-owned guidance only when needed.
