# Java examples guide

These examples are task playbooks, not toy snippets. Use the nearest one as the default plan scaffold.

## How to use an example

1. Select the closest scenario.
2. Copy its touched-file thinking and validation shape.
3. Adjust for the repo's framework and deployment assumptions.
4. Keep the example's anti-pattern checks in your final review.

## Available scenarios

### Spring Boot REST API

- file: `01-spring-boot-rest-api.md`
- use when: Spring MVC or WebFlux edges, request validation, transaction boundaries, and DTO/domain separation.
- always confirm: contracts, validation, tests, and operational impact

### Event consumer service

- file: `02-event-consumer-service.md`
- use when: Kafka or JMS style consumers, retry/dead-letter behavior, idempotency, and schema evolution.
- always confirm: contracts, validation, tests, and operational impact

### Gradle multi-module backend

- file: `03-gradle-multi-module-backend.md`
- use when: Module boundaries, dependency direction, shared test fixtures, and build reproducibility.
- always confirm: contracts, validation, tests, and operational impact

### Library module with strong domain tests

- file: `04-library-module-with-strong-domain-tests.md`
- use when: Pure domain logic, contract-heavy APIs, and tests that cover invariants instead of framework ceremony.
- always confirm: contracts, validation, tests, and operational impact
