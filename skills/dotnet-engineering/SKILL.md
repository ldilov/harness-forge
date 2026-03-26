---
name: dotnet-engineering
description: .net and c# engineering guidance seeded from the harness forge knowledge base. use when the repo or task is dominated by .cs, .csproj, .sln, asp.net core, ef core, worker services, cli tooling, test projects, or modern distributed .net surfaces such as aspire.
origin: Harness Forge
---

# .NET Engineering

Use this skill when the repository or task is clearly .NET-first and the best next move depends on understanding project layout, dependency injection, hosting, data access, or the package and test graph.

## Activation

- the task touches `.cs`, `.csproj`, `.sln`, `Directory.Build.props`, `global.json`, or `Directory.Packages.props`
- the repo is an ASP.NET Core app, worker service, library pack, CLI, test harness, or Aspire-oriented distributed app
- runtime behavior depends on DI lifetimes, configuration binding, logging, background execution, or EF Core

## Load Order

- `rules/common/README.md`
- `rules/common/coding-style.md`
- `rules/common/patterns.md`
- `rules/common/testing.md`
- `rules/common/security.md`
- `rules/dotnet/README.md`
- `rules/dotnet/coding-style.md`
- `rules/dotnet/patterns.md`
- `rules/dotnet/testing.md`
- `rules/dotnet/security.md`
- `templates/workflows/implement-dotnet-change.md`
- `knowledge-bases/seeded/dotnet/docs/overview.md`
- `knowledge-bases/seeded/dotnet/docs/frameworks.md`
- `knowledge-bases/seeded/dotnet/docs/review-checklist.md`
- `knowledge-bases/seeded/dotnet/examples/`
- `skills/dotnet-engineering/references/`

## Execution Contract

1. map the solution graph before editing code: startup project, shared libraries, test projects, migration surfaces, and deployment entrypoints
2. determine the composition root and preserve local boundaries instead of inventing new layers
3. prefer constructor injection, explicit options binding and validation, and cancellation-aware async flows
4. keep transport concerns at the edge and domain behavior in reusable services, handlers, or application modules
5. when persistence changes, inspect the generated migration or SQL, mixed-version compatibility window, and rollback or forward-fix path
6. when hosting changes, verify logging, health, configuration, and observability assumptions at the same time as the code change

## Outputs

- touched-file plan grouped by project or layer
- implementation summary with the exact runtime seam that changed
- validation path with build, test, or smoke commands
- migration or rollout note when data access, hosting, or package boundaries changed

## Validation

- use the repo's preferred .NET entrypoints first; otherwise fall back to targeted `dotnet build`, `dotnet test`, or solution-level validation
- inspect `global.json`, central package management, analyzers, and nullable settings before changing code style or package versions
- add or update integration coverage when behavior crosses middleware, serialization, configuration, auth, or background execution boundaries
- inspect EF Core migrations and prefer reviewed SQL scripts for production-oriented schema changes
- consult `knowledge-bases/seeded/dotnet/docs/review-checklist.md` before finalizing a patch or design note

## Escalation

- escalate when target framework, trimming, native interop, or publish constraints are unclear
- escalate when DI lifetimes, async behavior, or transaction boundaries cannot be inferred from repository evidence
- escalate when a migration, worker, or distributed-app change lacks rollout and observability coverage

## Supplemental Engineering References

- `skills/dotnet-engineering/references/repo-exploration.md`
- `skills/dotnet-engineering/references/output-templates.md`
- `skills/dotnet-engineering/references/agent-patterns.md`
- `skills/dotnet-engineering/references/debugging-playbook.md`
- `skills/dotnet-engineering/references/architecture-and-di.md`
- `skills/dotnet-engineering/references/aspnet-and-efcore.md`
- `skills/dotnet-engineering/references/testing-and-performance.md`
- `skills/dotnet-engineering/references/cloud-native-and-aspire.md`
- `skills/dotnet-engineering/references/examples.md`
