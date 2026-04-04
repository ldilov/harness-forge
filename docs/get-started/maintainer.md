# Maintainer Guide

This guide is for maintainers who need release confidence, catalog coherence,
and clear runtime truth for packaged installs.

## Primary Checks

- `npm run build`
- `npm test`
- `npm run validate:generated-sync`
- `npm run validate:doc-command-alignment`
- `npm run validate:release`

## Runtime Surfaces To Inspect

- `.hforge/runtime/index.json`
- `.hforge/generated/agent-command-catalog.json`
- `.hforge/runtime/provenance/index.json`
- `.hforge/runtime/provenance/update-action-plan.json`
- `.hforge/manifests/installed-packs.json`

## Maintainer Habits

- Keep support claims honest across docs, manifests, and command output.
- Treat generated runtime truth as a release surface, not incidental output.
- Prefer additive pack evolution over silent widening of the default runtime.

## Runtime Export Profiles

Use profile-driven exports to control runtime footprint:

- `runtime-minimal` for first-hop orientation only
- `runtime-standard` for balanced operation
- `maintainer-full` for full provenance and authoring scope
- `kb-lean` for retrieval-optimized exports

Validate with:

```powershell
npm run validate:runtime-gates
hforge export --profile kb-lean --root . --json
```
