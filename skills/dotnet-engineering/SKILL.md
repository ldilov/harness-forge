---
name: dotnet-engineering
description: .NET and C# engineering guidance seeded from the Harness Forge knowledge base.
origin: Harness Forge
---

# .NET Engineering

Use this skill when the repo contains `.cs`, `.csproj`, or `.sln` files, or
when a task involves ASP.NET Core, workers, libraries, or .NET CLI tooling.

## Primary rule sources

- `rules/common/coding-style.md`
- `rules/common/patterns.md`
- `rules/common/testing.md`
- `rules/common/security.md`
- `rules/common/hooks.md`
- `rules/dotnet/coding-style.md`
- `rules/dotnet/patterns.md`
- `rules/dotnet/testing.md`
- `rules/dotnet/security.md`
- `rules/dotnet/hooks.md`

## Seeded references

- `knowledge-bases/seeded/dotnet/docs/overview.md`
- `knowledge-bases/seeded/dotnet/docs/review-checklist.md`
- `knowledge-bases/seeded/dotnet/docs/frameworks.md`
- `knowledge-bases/seeded/dotnet/examples/`

## Assistant expectations

- prefer explicit layering, strong typing, and dependency injection discipline
- use the seeded examples as templates for service and worker structure
- apply security and testing guidance before implementation is complete
- keep automation and CLI behavior compatible with Windows and cross-platform use
