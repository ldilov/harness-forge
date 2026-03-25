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

These files are the promoted shared baseline used by the seeded language packs.

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

## Canonical seed source

The promoted common rules are copied from the seeded archives under
`knowledge-bases/seeded/*/rules/common/` so assistants can consume them from a
stable top-level path while the original source remains packaged and traceable.
