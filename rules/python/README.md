---
id: rules-python
kind: rule
title: Python Rules
summary: Entry point for the structured Python baseline and language-specific rule set.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - python
generated: false
---
# Python Rules

## Apply Order

1. start with `rules/common/`
2. layer `rules/python/` for Pythonic typing, packaging, and test strategy guidance
3. consult `knowledge-bases/structured/python/docs/` and `knowledge-bases/structured/python/examples/` before deviating from the promoted patterns

## Focus Areas

- typing, module boundaries, and dependency management
- test strategy, validation, and framework-safe changes
- automation, API, and data-workflow constraints when they affect design

## Related Pack Assets

- `rules/common/`
- `rules/python/`
- `knowledge-bases/structured/python/docs/`
- `knowledge-bases/structured/python/examples/`
- `skills/python-engineering/SKILL.md`
