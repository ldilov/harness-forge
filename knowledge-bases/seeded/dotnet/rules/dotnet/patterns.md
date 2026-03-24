---
paths:
  - "**/*.cs"
extends: ../common/patterns.md
language: dotnet
layer: language
---
# .NET Patterns

> This file extends [common/patterns.md](../common/patterns.md) with .NET-specific patterns.

## Recommended architecture

- Use feature-oriented folders for APIs and application services.
- Keep controllers/minimal endpoints thin.
- Put validation at the edge.
- Keep EF Core concerns out of domain types when the domain should remain persistence-agnostic.

## Common patterns

- Request/handler or service-based application flow for non-trivial APIs.
- Options pattern for configuration.
- Repository only when it adds real value beyond the ORM/query layer.
- Background workers for scheduled or queue-driven processes.

## API response pattern

```csharp
public sealed record ApiResponse<T>(bool Success, T? Data = default, string? Error = null, object? Meta = null);
```
