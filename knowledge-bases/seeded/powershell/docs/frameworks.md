# PowerShell framework and ecosystem guide

Use this file to choose the right pattern before changing code. Do not read it as generic background material; treat it as a decision guide.

## Core PowerShell 7.5

Prefer PowerShell 7.x for cross-platform work. It installs side-by-side with Windows PowerShell 5.1 and uses `pwsh` as the entry command.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Modules

Keep public command surfaces narrow, use approved verbs, and separate internal helpers from exported functions.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Pester

Use `.Tests.ps1` naming or a mirrored `tests/` tree, and validate behavior through objects and error records instead of string-matching console output.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Automation

Treat CI and administrative scripts as products: stable parameters, predictable exit codes, and zero secret echoing.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Source index

- PowerShell docs home: https://learn.microsoft.com/en-us/powershell/
- What is new in PowerShell 7.5: https://learn.microsoft.com/en-us/powershell/scripting/whats-new/what-s-new-in-powershell-75?view=powershell-7.5
- Install PowerShell on Windows: https://learn.microsoft.com/en-us/powershell/scripting/install/install-powershell-on-windows?view=powershell-7.5
- Pester installation: https://pester.dev/docs/introduction/installation
- Pester file placement and naming: https://pester.dev/docs/usage/file-placement-and-naming
