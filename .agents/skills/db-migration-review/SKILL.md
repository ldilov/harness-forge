---
name: db-migration-review
description: Auto-discoverable wrapper for `.hforge/library/skills/db-migration-review/SKILL.md`.
---

# DB Migration Review

## Activation

- trigger when migrations, schema diffs, indexes, constraints, backfills, or ORM-driven schema changes are in scope
- trigger when rollout safety, compatibility windows, reversibility, or lock risk matter

## Use These Surfaces

- `.hforge/library/skills/db-migration-review/SKILL.md`
- `.hforge/library/skills/db-migration-review/references/`
- `.hforge/library/docs/authoring/enhanced-skill-import.md` for import provenance and the research summary behind the migration-risk guidance
- `RESEARCH-SOURCES.md` for the pack-level research summary
- `VALIDATION.md` for the pack-level validation notes

## Operating Rule

Use the canonical `.hforge/library/skills/db-migration-review/` workflow for the actual review. This wrapper only exposes the project-owned skill and its references to agent discovery.
