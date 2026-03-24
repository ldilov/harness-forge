# Seeded Knowledge Bases

Harness Forge ships the attached starter language knowledge archives as first-class product content.

## Included packs

- `typescript/`
- `java/`
- `dotnet/`
- `lua/`
- `powershell/`

## What each pack contains

- `README.md` and `knowledge-base.json` metadata
- `docs/` for overview, review checklist, examples guide, and framework notes
- `examples/` with scenario-driven starter references
- `rules/common/` with shared baseline guidance
- `rules/<language>/` with language-specific style, patterns, testing, security, and hook guidance
- `legacy-seed/` where the original archive carried forward earlier seed content

## How Harness Forge uses them

- The package publishes the packs directly under `knowledge-bases/seeded/`
- language bundle manifests reference these paths so installs can copy them into supported targets
- catalog docs summarize the packs and link back to the canonical seeded files
- release validation checks every non-directory file from the source archive is still shipped or explicitly mapped

## Maintainer notes

- Treat files in this directory as canonical imported seed content unless a manifest explicitly marks a transformed destination
- prefer authoring new summaries and cross-pack docs outside this folder
- update `manifests/catalog/seeded-knowledge-files.json` whenever seeded coverage changes
