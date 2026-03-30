# .NET framework and ecosystem guide

Use this file to choose the right pattern before changing code. Do not read it as generic background material; treat it as a decision guide.

## ASP.NET Core

Prefer Minimal APIs for new API-heavy services unless controller conventions or filters materially simplify the repo. Flow `CancellationToken` through every async I/O path.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Worker Services

Use for queue consumers, scheduled jobs, polling services, and stream processors. Design for idempotency, bounded concurrency, and graceful shutdown.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Libraries

Keep domain/policy code framework-free. Make serialization, configuration, and transport adapters live at the edge.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## CLI automation

Use for operational tooling where logs, exit codes, and deterministic error messages matter as much as business logic.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Source index

- ASP.NET Core overview: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/choose-aspnet-framework?view=aspnetcore-9.0
- Minimal APIs quick reference: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis?view=aspnetcore-9.0
- APIs overview: https://learn.microsoft.com/en-ie/aspnet/core/fundamentals/minimal-apis/overview?view=aspnetcore-9.0
