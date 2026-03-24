# Migration from the Reference Project

Harness Forge treats migration as an explicit planning step. The migration
scanner detects reference-project footprints and suggests equivalent bundles
without silently overwriting unmanaged content.

## What Harness Forge preserves

- root compatibility guidance through `AGENTS.md`
- hidden agent surfaces such as `.agents/skills/`
- shipped workflow validators under `scripts/templates/`
- seeded language knowledge under `knowledge-bases/seeded/`

## What improves over the reference project

- file-level coverage for imported seed archives
- package-surface validation for hidden target content
- clearer split between imported seed content and authored product docs
