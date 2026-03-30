# .NET examples guide

These examples are task playbooks, not toy snippets. Use the nearest one as the default plan scaffold.

## How to use an example

1. Select the closest scenario.
2. Copy its touched-file thinking and validation shape.
3. Adjust for the repo's framework and deployment assumptions.
4. Keep the example's anti-pattern checks in your final review.

## Available scenarios

### ASP.NET Core HTTP API

- file: `01-aspnet-core-crud-api.md`
- use when: Minimal API or controller-based endpoints, validation, persistence seams, OpenAPI, and cancellation propagation.
- always confirm: contracts, validation, tests, and operational impact

### Background worker with queue processing

- file: `02-background-worker-with-queue-processing.md`
- use when: Hosted services, channel/queue consumption, idempotency, retry boundaries, and observability.
- always confirm: contracts, validation, tests, and operational impact

### Shared domain library

- file: `03-shared-domain-library.md`
- use when: Domain models, value objects, boundary-safe serialization, and testable business logic without framework leakage.
- always confirm: contracts, validation, tests, and operational impact

### CLI automation tool

- file: `04-cli-automation-tool.md`
- use when: System.CommandLine or simple entrypoints, configuration, failure modes, and script-safe output contracts.
- always confirm: contracts, validation, tests, and operational impact
