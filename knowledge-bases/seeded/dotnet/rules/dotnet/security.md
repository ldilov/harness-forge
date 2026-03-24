---
paths:
  - "**/*.cs"
  - "**/appsettings*.json"
extends: ../common/security.md
language: dotnet
layer: language
---
# .NET Security

> This file extends [common/security.md](../common/security.md) with .NET-specific security guidance.

## Secrets

- Never store real credentials in `appsettings*.json`.
- Use environment variables, user secrets for local development, and managed secret stores in deployed environments.

## APIs

- Validate DTOs before business logic.
- Use built-in authentication/authorization handlers rather than custom token parsing.
- Never log raw tokens or unredacted PII.

## Data access

- Use parameterized queries always.
- Review dynamic sorting and filtering carefully.
- Prefer least-privilege database accounts and scoped credentials.
