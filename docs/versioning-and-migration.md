# Versioning and Migration

Harness Forge versions both its runtime code and its shipped content surface.

## What changes must be treated carefully

- bundle manifest IDs and paths
- root compatibility files like `AGENTS.md`
- seeded knowledge-pack paths under `knowledge-bases/seeded/`
- validator bundle paths referenced by templates and docs

## Migration guidance

- use the reference-project guide before renaming or relocating shipped content
- preserve canonical seeded paths unless a manifest declares a transformed
  destination
- run `npm run validate:release` after any package-surface change
