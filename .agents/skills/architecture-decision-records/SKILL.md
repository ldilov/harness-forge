---
name: architecture-decision-records
description: Auto-discoverable wrapper for `skills/architecture-decision-records/SKILL.md`.
---

# Architecture Decision Records

## Activation

- trigger when a package, architecture, workflow, runtime, or support decision should stay reviewable later
- trigger when multiple credible options exist and the trade-off needs durable rationale

## Use These Surfaces

- `skills/architecture-decision-records/SKILL.md`
- `skills/architecture-decision-records/references/`
- `docs/authoring/enhanced-skill-import.md` for the import research and validation provenance behind the richer ADR guidance
- `RESEARCH-SOURCES.md` for the pack-level research summary
- `VALIDATION.md` for the pack-level validation notes

## Operating Rule

Use the canonical ADR skill under `skills/` for the actual workflow. This wrapper exists so agents can discover the flow quickly and then load the deeper project-owned guidance.
