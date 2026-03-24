---
paths:
  - "**/*.ps1"
  - "**/*.psm1"
extends: ../common/patterns.md
language: powershell
layer: language
---
# PowerShell Patterns

> This file extends [common/patterns.md](../common/patterns.md) with PowerShell-specific patterns.

## Recommended patterns

- advanced functions for reusable operations
- script modules for cohesive command groups
- small wrappers around external CLIs that normalize output into objects
- explicit diagnostic/result objects for automation pipelines

## Cross-platform note

- Keep PowerShell 7+ as the default unless a Windows-only dependency is truly required.
- Call out Windows PowerShell compatibility separately when necessary.
