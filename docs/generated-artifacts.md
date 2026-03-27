# Generated Artifacts

Harness Forge allows generated derivative files, but only when provenance is
explicit and recoverable.

## Required provenance

- mark generated markdown with `generated: true`
- include `canonical_source` in metadata
- keep the canonical authored or imported source in the repository

## Hidden AI layer families

- `.hforge/library/skills/` is the canonical hidden installed skill library
- `.hforge/library/rules/` is the canonical hidden installed rules surface
- `.hforge/library/knowledge/` is the canonical hidden installed knowledge-pack surface
- `.hforge/templates/` is the canonical hidden installed task and workflow template surface
- `.hforge/runtime/` remains the generated shared runtime and repo-intelligence layer
- `.hforge/state/` and `.hforge/generated/` remain install and helper state surfaces

## Current generated or derived surfaces

- `manifests/catalog/compatibility-matrix.json` is generated from targets,
  profiles, hooks, workflows, skills, languages, and framework metadata
- `manifests/catalog/seeded-knowledge-files.json` is generated from the seeded
  archive mapping
- `manifests/catalog/engineering-assistant-import-inventory.json` is authored
  governance data for the engineering-assistant port, not a generated artifact
- `docs/authoring/engineering-assistant-port.md` is curated provenance for the
  engineering-assistant import, not a runtime skill entrypoint
- `manifests/catalog/enhanced-skill-import-inventory.json` is authored
  governance data for imported skill packs, not a generated artifact
- `docs/authoring/enhanced-skill-import.md` is curated provenance for imported
  skill packs, not a runtime skill entrypoint
- `.hforge/runtime/index.json` is generated workspace runtime state that
  records the shared runtime surfaces, installed targets, and target bridges selected for an
  installed workspace
- `.hforge/runtime/README.md` is generated workspace documentation that
  explains how installed discovery bridges route into the shared runtime
- `.hforge/runtime/repo/repo-map.json` is generated baseline repo cartography
  for the installed workspace runtime
- `.hforge/runtime/repo/recommendations.json` is generated recommendation output
  derived from repo intelligence
- `.hforge/runtime/repo/target-support.json` is generated target support
  summary for the installed workspace runtime
- `.hforge/runtime/repo/instruction-plan.json` is generated target-aware
  instruction planning output for installed runtimes
- `.hforge/runtime/repo/scan-summary.json` is generated stack and validation
  signal output from the runtime scan
- `.hforge/runtime/findings/validation-gaps.json` is generated validation-gap
  output for the installed workspace runtime
- `.hforge/runtime/findings/risk-signals.json` is generated risk-signal output
  for the installed workspace runtime
- `.specify/state/flow-state.json` is runtime state, not an authored source

## Artifact lineage rules

- every flow record should point back to `spec.md`, `plan.md`, `contracts/`,
  and `tasks.md` when they exist
- generated compatibility and knowledge reports must remain traceable to the
  authored manifests they summarize
- generated shared-runtime state must remain traceable to install planning,
  target adapter metadata, and workspace-selected bundles
- generated shared-runtime baseline artifacts must remain traceable to
  recommendation, scan, cartography, and instruction-synthesis inputs
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
