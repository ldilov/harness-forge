---
paths:
  - "**/*.cs"
  - "**/*.csproj"
  - "**/*.sln"
  - "**/Directory.Build.*"
extends: ../common/coding-style.md
language: dotnet
layer: language
---
# .NET Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with .NET-specific guidance.

## Design defaults

- Enable nullable reference types and treat nullability warnings as actionable design feedback.
- Prefer small, focused types and explicit access modifiers.
- Use `record`/`record struct` for immutable value-like models and `class` for entities or lifecycle-heavy types.
- Keep domain logic out of controllers, endpoints, and EF Core entity configuration.

## API boundaries

- Public methods SHOULD expose explicit parameter and return types.
- Async public APIs SHOULD accept `CancellationToken`.
- Avoid `dynamic` in application code; prefer generic constraints, interfaces, or explicit DTOs.

## Project layout

- Separate `src/` and `tests/`.
- Group by feature or bounded context rather than by technical layer when practical.
- Keep one primary type per file.

## Preferred idioms

- Use guard clauses for invalid inputs.
- Use immutable DTOs and `with` expressions for updates.
- Use dependency injection at composition roots, not deep inside domain code.
