---
paths:
  - "**/*.ps1"
  - "**/*.psm1"
  - "**/*.psd1"
extends: ../common/coding-style.md
language: powershell
layer: language
---
# PowerShell Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with PowerShell-specific guidance.

## Defaults

- Prefer advanced functions with `[CmdletBinding()]` for reusable automation.
- Design around the object pipeline, not text scraping, when the source supports objects.
- Use approved verbs and clear noun names.
- Avoid implicit global state; keep script/module scope disciplined.

## Parameters

- Validate parameters explicitly.
- Provide pipeline support only when it makes the function clearer and safer.
- Prefer structured objects over stringly typed parameter bundles.
