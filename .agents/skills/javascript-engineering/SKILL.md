---
name: javascript-engineering
description: Auto-discoverable wrapper for `skills/javascript-engineering/SKILL.md`.
origin: Harness Forge
---

# JavaScript Engineering

## Activation

- trigger when `.js`, `.jsx`, `.cjs`, or `.mjs` files dominate the task
- trigger when the repo is Node.js or browser JavaScript without a TypeScript-first path

## Use These Surfaces

- `skills/javascript-engineering/SKILL.md`
- `skills/javascript-engineering/references/`
- `docs/authoring/enhanced-skill-import.md` for import provenance and the added browser, bundler, and package-contract context
- `RESEARCH-SOURCES.md` for the pack-level research summary
- `VALIDATION.md` for the pack-level validation notes
- `rules/common/`

## Expected Output

- a JavaScript-specific implementation and validation path grounded in the canonical skill

## Operating Rule

This wrapper is the discovery layer only. Load the canonical JavaScript skill
from `skills/javascript-engineering/` and use the provenance doc only when you
need maintainer-facing context behind the imported upgrades.
