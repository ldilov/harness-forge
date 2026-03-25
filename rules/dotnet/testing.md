---
paths:
  - "**/*.cs"
  - "**/*.csproj"
extends: ../common/testing.md
language: dotnet
layer: language
---
# .NET Testing

> This file extends [common/testing.md](../common/testing.md) with .NET-specific testing guidance.

## Defaults

- Prefer xUnit for tests.
- Prefer FluentAssertions for assertions.
- Use Testcontainers for integration tests that need real infrastructure.
- Test API behavior over HTTP for ASP.NET Core rather than bypassing middleware.

## Coverage priorities

- domain logic
- validation
- auth and authorization behavior
- serialization boundaries
- database query behavior that can fail silently

## Naming

- Name tests by behavior, not implementation.
- Keep Arrange/Act/Assert visible.
