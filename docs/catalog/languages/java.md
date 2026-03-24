---
id: language-pack-java
kind: language-pack
title: Java Language Pack
summary: Seeded Java pack for Spring Boot, libraries, and service backends.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - java
generated: false
maturity: seeded
targets:
  - codex
  - claude-code
  - cursor
  - opencode
---
# Java Language Pack

## Best fit

Use this pack for Spring Boot APIs, message-driven services, libraries, and
test-heavy enterprise backends.

## What ships

- `knowledge-bases/seeded/java/docs/overview.md`
- `knowledge-bases/seeded/java/docs/review-checklist.md`
- `knowledge-bases/seeded/java/docs/frameworks.md`
- `knowledge-bases/seeded/java/examples/`
- `knowledge-bases/seeded/java/rules/common/`
- `knowledge-bases/seeded/java/rules/java/`

## Recommended tooling

- JDK
- Gradle
- Maven
- JUnit 5
- AssertJ
- Testcontainers

## Common pitfalls

- field injection
- framework leakage into domain logic
- overly generic exceptions
- hidden query inefficiency

## Example scenarios

- Spring Boot REST API
- event consumer service
- Gradle multi-module backend
- library module with strong domain tests
