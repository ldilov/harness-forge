# Content Architecture

Harness Forge separates authored summaries from imported seed content.

## Canonical sources

- product-facing docs in `docs/`
- runtime command, agent, and context docs in `commands/`, `agents/`, and `contexts/`
- rule pack entrypoints in `rules/`
- shipped templates and workflows in `templates/`
- imported seed content in `knowledge-bases/seeded/`

## Authored versus imported

- `knowledge-bases/seeded/` preserves the attached starter archives as shipped content
- root docs and catalog summaries are authored translations of that content into the Harness Forge product surface
- imported files are not the same thing as generated files; they remain canonical for seed coverage and package validation

## Generated content rules

- generated files must declare a canonical source
- generated files must never be the only source of truth for a workflow or rule
- release checks fail when generated files drift from their declared source contract

## Packaging rule

If a manifest, template, workflow, or user-facing doc references a file as part of a supported journey, that file must remain inside the published package surface.

## Localization governance

- keep authored English docs as the canonical source unless a manifest explicitly declares another source
- localized or generated variants must point back to the canonical authored file
- seeded language imports stay file-traceable even when higher-level summaries are rewritten
