---
id: rules-dotnet
kind: rule
title: .NET Rules
summary: Entry point for the seeded .NET baseline and language-specific rule set.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - dotnet
generated: false
---
# .NET Rules

## Apply Order

1. start with `rules/common/`
2. layer `rules/dotnet/` for solution layout, hosting, dependency injection, and testing guidance
3. consult `knowledge-bases/seeded/dotnet/rules/dotnet/` when the seeded pack has deeper examples or framework cues

## Focus Areas

- solution structure, dependency flow, and public contract safety
- ASP.NET Core, worker, and library validation paths
- runtime configuration, security, and packaging expectations

## Related Pack Assets

- `rules/common/`
- `rules/dotnet/`
- `knowledge-bases/seeded/dotnet/rules/dotnet/`
- `templates/workflows/implement-dotnet-change.md`
- `templates/workflows/implement-dotnet-change.md`
