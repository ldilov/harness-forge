---
id: language-pack-powershell
kind: language-pack
title: PowerShell Language Pack
summary: Seeded PowerShell pack for Windows automation, modules, and pwsh tooling.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - powershell
generated: false
maturity: seeded
targets:
  - codex
  - claude-code
  - cursor
  - opencode
---
# PowerShell Language Pack

## Best fit

Use this pack for Windows automation, cross-platform pwsh tools, script
modules, remoting, and admin automation.

## What ships

- `knowledge-bases/seeded/powershell/docs/overview.md`
- `knowledge-bases/seeded/powershell/docs/review-checklist.md`
- `knowledge-bases/seeded/powershell/docs/frameworks.md`
- `knowledge-bases/seeded/powershell/examples/`
- `knowledge-bases/seeded/powershell/rules/common/`
- `knowledge-bases/seeded/powershell/rules/powershell/`

## Recommended tooling

- PowerShell 7+
- PSScriptAnalyzer
- Pester
- platyPS
- PSResourceGet

## Common pitfalls

- weak parameter validation
- implicit globals
- `Invoke-Expression` misuse
- credential leakage

## Example scenarios

- script module
- CI or admin automation
- remote fleet maintenance
- developer bootstrap utility
