# Contract: Package Surface

## Purpose

Define what must be present in the published Harness Forge package for this
feature to be considered complete.

## Required package surface classes

- root product docs
- runtime content assets
- language-pack docs and rules
- templates and workflows
- validator bundle scripts and config
- manifests used for install and catalog resolution
- hidden or target-scoped surfaces required for supported harnesses

## Required guarantees

- any file referenced by manifests, templates, workflows, or user-facing docs
  must exist in the published artifact if it is required for a supported user
  journey
- hidden target-specific package areas must be validated alongside visible
  top-level package content
- root compatibility files required by supported harnesses must be preserved

## Failure conditions

- missing validator script
- missing validator config
- missing required seeded language asset
- missing root compatibility guidance file
- missing hidden target-specific content declared as required

## Validation sources

- package manifest `files` surface
- install manifests and catalog indexes
- template/workflow references
- documentation references
