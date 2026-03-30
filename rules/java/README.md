---
id: rules-java
kind: rule-entrypoint
title: Java Rules
status: stable
owner: core
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
- `skills/java-engineering/SKILL.md`
- `templates/workflows/implement-java-change.md`
