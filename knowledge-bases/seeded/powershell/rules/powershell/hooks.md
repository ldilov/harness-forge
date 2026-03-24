---
paths:
  - "**/*.ps1"
  - "**/*.psm1"
  - "**/*.psd1"
extends: ../common/hooks.md
language: powershell
layer: language
---
# PowerShell Hooks

> This file extends [common/hooks.md](../common/hooks.md) with PowerShell-specific hook suggestions.

## Post-edit hooks

- `Invoke-ScriptAnalyzer` on affected files
- Pester tests for nearby modules/scripts
- manifest validation when `.psd1` changes

## Stop hooks

- final script analyzer pass
- optional smoke run for bootstrap/install scripts
- warn on credential handling or remoting changes
