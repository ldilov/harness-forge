---
id: rules-common
kind: rule
title: Common Rules
summary: Shared engineering baseline promoted from the seeded language packs.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - all
generated: false
---
# Common Rules

These files are the canonical authored shared baseline for Harness Forge rule
surfaces.

## Included guidance

- `rules/common/agents.md`
- `rules/common/coding-style.md`
- `rules/common/development-workflow.md`
- `rules/common/git-workflow.md`
- `rules/common/hooks.md`
- `rules/common/patterns.md`
- `rules/common/performance.md`
- `rules/common/security.md`
- `rules/common/testing.md`

## Canonical ownership

`rules/common/` is the single authored runtime-rule source for shared
behavioral guidance. Matching files under
`knowledge-bases/seeded/*/rules/common/` remain packaged for provenance and
install compatibility, but they are derived archive surfaces rather than a
second authored truth.
