---
id: language-pack-dotnet
kind: language-pack
title: .NET Language Pack
summary: Seeded .NET pack for ASP.NET Core, worker, CLI, and library repos.
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
maturity: seeded
targets:
  - codex
  - claude-code
  - cursor
  - opencode
---
# .NET Language Pack

## Best fit

Use this pack for backend services, APIs, worker processes, libraries, and CLI
automation built on the modern .NET SDK.

## What ships

- `knowledge-bases/seeded/dotnet/docs/overview.md`
- `knowledge-bases/seeded/dotnet/docs/review-checklist.md`
- `knowledge-bases/seeded/dotnet/docs/frameworks.md`
- `knowledge-bases/seeded/dotnet/examples/`
- `knowledge-bases/seeded/dotnet/rules/common/`
- `knowledge-bases/seeded/dotnet/rules/dotnet/`

## Recommended tooling

- dotnet SDK
- dotnet format
- xUnit
- FluentAssertions
- Testcontainers

## Common pitfalls

- sync-over-async
- missing `CancellationToken` flow
- static mutable state
- secrets leaking through config defaults

## Example scenarios

- ASP.NET Core CRUD API
- background worker with queue processing
- shared domain library
- CLI automation tool
