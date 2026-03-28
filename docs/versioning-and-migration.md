# Versioning and Migration

Harness Forge versions both its runtime code and its shipped content surface.

## Runtime version surfaces

- `package.json` provides the published package version
- `.hforge/state/install-state.json` records the installed package version and runtime schema version
- `.hforge/runtime/index.json` records the runtime schema version and generated package version
- `hforge status --root <repo>` surfaces both values to operators

## What changes must be treated carefully

- bundle manifest IDs and paths
- root compatibility files like `AGENTS.md`
- seeded knowledge-pack paths under `knowledge-bases/seeded/`
- validator bundle paths referenced by templates and docs

## Migration guidance

- use the reference-project guide before renaming or relocating shipped content
- preserve canonical seeded paths unless a manifest declares a transformed
  destination
- refresh the runtime with `hforge refresh --root <repo>` after layout changes
- run `npm run validate:release` after any package-surface change
