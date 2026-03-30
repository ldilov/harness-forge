# .NET implementation overview

## Why this pack exists

This file is meant to be execution guidance, not a placeholder catalog entry. An agent should load it when .NET is the dominant language and use it to choose the correct example, framework notes, and review checklist before editing code.

## Current posture

Current ASP.NET Core guidance recommends Minimal APIs for new projects and emphasizes built-in validation, DI-first parameter binding, and observable production defaults.

## Default operating model

1. Map entrypoints, package or module boundaries, and deployment/runtime assumptions first.
2. Identify trust boundaries: HTTP, CLI, config, files, queues, database rows, environment variables, editor APIs, or host callbacks.
3. Pick the closest matching example scenario from `examples/`.
4. Apply the language rule set plus the common security/testing rules.
5. Verify through the repo's real build and runtime path, not only static analysis.

## What good changes look like

- contracts are explicit
- runtime validation exists where static analysis cannot protect you
- tests cover the changed seam
- logs and errors help operators debug safely
- public behavior changes are called out

## What weak changes look like

- broad refactors with no contract explanation
- framework glue and domain logic mixed together
- hidden global or process-wide state
- missing validation at the boundary
- no mention of rollback, migration, or compatibility

## Scenario routing
- `01-aspnet-core-crud-api.md` — **ASP.NET Core HTTP API**. Minimal API or controller-based endpoints, validation, persistence seams, OpenAPI, and cancellation propagation.
- `02-background-worker-with-queue-processing.md` — **Background worker with queue processing**. Hosted services, channel/queue consumption, idempotency, retry boundaries, and observability.
- `03-shared-domain-library.md` — **Shared domain library**. Domain models, value objects, boundary-safe serialization, and testable business logic without framework leakage.
- `04-cli-automation-tool.md` — **CLI automation tool**. System.CommandLine or simple entrypoints, configuration, failure modes, and script-safe output contracts.

## Required final pass

Before finalizing, walk the language review checklist and confirm the change is safe across correctness, boundary validation, testing, operations, and compatibility.
