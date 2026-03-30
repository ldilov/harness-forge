# Java framework and ecosystem guide

Use this file to choose the right pattern before changing code. Do not read it as generic background material; treat it as a decision guide.

## Spring Boot

Use for conventional service backends with autoconfiguration, metrics, and mature integration libraries. Avoid letting framework annotations leak deep into core domain code.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Gradle multi-module

Use when you need clear dependency direction, reusable conventions, and build cache support. Keep module responsibilities obvious and small.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Testing stack

Use JUnit 5 for modern test lifecycle and extension points. Add Testcontainers for real integration seams instead of mocking infrastructure too aggressively.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Messaging services

Design consumers around idempotency, backpressure, poison-message handling, and schema compatibility.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Source index

- Spring Boot reference: https://docs.spring.io/spring-boot/reference/index.html
- Spring Boot documentation overview: https://docs.spring.io/spring-boot/documentation.html
- JUnit 5 user guide: https://docs.junit.org/5.13.1/user-guide/index.html
- Gradle user manual: https://docs.gradle.org/current/userguide/userguide.html
