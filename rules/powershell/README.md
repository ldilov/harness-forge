---
id: rules-powershell
kind: rule-entrypoint
title: PowerShell Rules
summary: Entry point for the seeded PowerShell baseline and language-specific rule set.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - powershell
generated: false
---
# PowerShell Rules

## Apply Order

1. start with `rules/common/`
2. layer `rules/powershell/` for script ergonomics, safety, and Windows automation guidance
3. consult `knowledge-bases/seeded/powershell/rules/powershell/` when the seeded pack has deeper runtime or host-specific cues

## Focus Areas

- script safety, destructive-operation handling, and operator ergonomics
- testing, validation, and cross-shell compatibility
- Windows automation, module boundaries, and runtime-host behavior

## Related Pack Assets

- `rules/common/`
- `rules/powershell/`
- `knowledge-bases/seeded/powershell/rules/powershell/`
- `skills/powershell-engineering/SKILL.md`
- `templates/workflows/implement-powershell-change.md`
