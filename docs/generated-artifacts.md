# Generated Artifacts

Harness Forge allows generated derivative files, but only when provenance is
explicit and recoverable.

## Required provenance

- mark generated markdown with `generated: true`
- include `canonical_source` in metadata
- keep the canonical authored or imported source in the repository

## Current generated or derived surfaces

- `manifests/catalog/compatibility-matrix.json` is generated from targets,
  profiles, hooks, workflows, skills, languages, and framework metadata
- `manifests/catalog/seeded-knowledge-files.json` is generated from the seeded
  archive mapping
- `.specify/state/flow-state.json` is runtime state, not an authored source

## Artifact lineage rules

- every flow record should point back to `spec.md`, `plan.md`, `contracts/`,
  and `tasks.md` when they exist
- generated compatibility and knowledge reports must remain traceable to the
  authored manifests they summarize
- release validation should fail when a generated artifact points to a missing
  source

## Issue-export convention

When implementation tasks are exported to issues:

- keep the originating feature id in the issue body or metadata
- preserve task ids from `tasks.md`
- include the current flow stage and the next recommended action
- keep the export reproducible from the canonical task list

## Drift policy

- generated derivatives must be reproducible from canonical sources
- authored summaries must not be silently overwritten by import or generation
- runtime state can be refreshed, but authored docs and manifests require
  explicit review
