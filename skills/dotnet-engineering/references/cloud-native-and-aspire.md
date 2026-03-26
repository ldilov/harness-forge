# Cloud Native And Aspire

## When Aspire is present

Look for AppHost, service-defaults, shared telemetry wiring, or distributed-application bootstrap code. Keep orchestration and local dev topology in those surfaces instead of scattering environment-specific behavior across services.

## Service defaults

A repo with shared service defaults usually wants consistent health checks, telemetry, service discovery, and resilience behavior. Reuse that wiring before introducing service-local copies.

## Distributed changes

When a change spans multiple services:

- note the exact service-to-service contract that changed
- update local orchestration, configuration, and health expectations together
- make rollout order explicit when one service depends on another schema or endpoint change

## Non-Aspire cloud-native surfaces

Even without Aspire, carry the same discipline forward: configuration by environment, explicit health and readiness checks, structured logs, and a clear local-dev story.
