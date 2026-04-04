# Pack Author Guide

This guide is for contributors defining or evolving installable runtime packs,
profiles, and their managed surfaces.

## Authoring Rules

- Keep pack ownership explicit through bundle manifests and runtime manifests.
- Prefer small, composable packs over one large catch-all bundle.
- Document which managed roots a pack owns and which targets it meaningfully supports.

## Important Files

- `manifests/bundles/*.json`
- `manifests/profiles/*.json`
- `manifests/catalog/package-surface.json`
- `manifests/catalog/flow-artifacts.json`
- `schemas/runtime/*.schema.json`

## Validation Expectations

- Add or update contract coverage when pack behavior or runtime truth changes.
- Verify new managed surfaces appear in provenance and materialization output.
- Update role guides when a pack changes operator-facing workflows.
