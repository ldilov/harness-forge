---
paths:
  - "**/*.ps1"
  - "**/*.psm1"
extends: ../common/testing.md
language: powershell
layer: language
---
# PowerShell Testing

> This file extends [common/testing.md](../common/testing.md) with PowerShell-specific testing guidance.

## Defaults

- Use Pester for tests.
- Test parameter validation, object output shape, error behavior, and idempotent automation flows.
- Mock external commands and remoting boundaries carefully.

## Coverage priorities

- bootstrap scripts
- install/repair/uninstall paths
- admin automation with safety switches
- module public command behavior
