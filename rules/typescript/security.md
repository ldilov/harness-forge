---
paths:
  - "**/*.ts"
  - "**/*.tsx"
extends: ../common/security.md
language: typescript
layer: language
---
# TypeScript Security

> This file extends [common/security.md](../common/security.md) with TypeScript-specific security guidance.

## Node and web defaults

- Never trust request bodies, query strings, cookies, headers, or local storage values.
- Use env validation at startup.
- Sanitize or escape untrusted HTML.
- Treat SSR/server actions as privileged code paths.

## Secrets

- No hardcoded secrets.
- Redact tokens and credentials from logs, traces, and test snapshots.
