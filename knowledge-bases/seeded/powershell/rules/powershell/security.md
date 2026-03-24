---
paths:
  - "**/*.ps1"
  - "**/*.psm1"
extends: ../common/security.md
language: powershell
layer: language
---
# PowerShell Security

> This file extends [common/security.md](../common/security.md) with PowerShell-specific security guidance.

## Defaults

- Avoid `Invoke-Expression` unless there is a compelling reviewed reason.
- Validate paths, remoting targets, and CLI arguments.
- Redact credentials and tokens from logs.
- Use secure credential flows and managed identities where possible.

## Execution safety

- Support `-WhatIf`/`-Confirm` for destructive operations when appropriate.
- Prefer explicit allowlists over free-form command construction.
