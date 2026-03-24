---
paths:
  - "**/*.cs"
  - "**/*.csproj"
  - "**/*.sln"
extends: ../common/hooks.md
language: dotnet
layer: language
---
# .NET Hooks

> This file extends [common/hooks.md](../common/hooks.md) with .NET-specific hook suggestions.

## Post-edit hooks

- `dotnet format` for edited projects or solutions.
- `dotnet build` for affected project graphs.
- `dotnet test --no-build` for nearby test projects when behavior changes.

## Stop hooks

- final `dotnet build`
- warn on modified `appsettings*.json`
- optional dependency audit for package changes
