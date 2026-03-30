---
name: madr-decision-log
description: auto-discoverable wrapper for `.hforge/library/skills/madr-decision-log/SKILL.md`.
---

# MADR Decision Log

## Activation

- trigger when a team needs to create, review, normalize, validate, or maintain markdown ADR files using MADR conventions
- trigger when `docs/decisions/`, ADR numbering, ADR-LOG generation, or supersession handling should become part of the repo workflow

## Use These Surfaces

- `.hforge/library/skills/madr-decision-log/SKILL.md`
- `.hforge/library/skills/madr-decision-log/references/`
- `.hforge/library/skills/madr-decision-log/scripts/`
- `.hforge/library/docs/authoring/enhanced-skill-import.md`
- `RESEARCH-SOURCES.md`
- `VALIDATION.md`

## Operating Rule

Use the canonical MADR skill under `.hforge/library/skills/` for the actual workflow. This wrapper exists so agent runtimes can discover the decision-log workflow quickly and then load the deeper project-owned guidance.
