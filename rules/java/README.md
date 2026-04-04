---
id: rules-java
kind: rule
title: Java Rules
summary: Entry point for the seeded Java baseline and language-specific rule set.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - java
generated: false
---
# Java Rules

## Apply Order

1. start with `rules/common/`
2. layer `rules/java/` for package layout, API, testing, and runtime behavior guidance
3. consult `knowledge-bases/seeded/java/rules/java/` when the seeded pack has deeper framework or review cues

## Focus Areas

- package boundaries, API shape, and build-safe changes
- testing, dependency management, and runtime configuration
- service and library concerns when framework behavior matters

## Related Pack Assets

- `rules/common/`
- `rules/java/`
- `knowledge-bases/seeded/java/rules/java/`
- `templates/workflows/implement-java-change.md`
- `templates/workflows/implement-java-change.md`
