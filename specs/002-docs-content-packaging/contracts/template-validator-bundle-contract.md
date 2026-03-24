# Contract: Template Validator Bundle

## Purpose

Define the shipped task/workflow validator bundle that must remain intact in the
repo and published package.

## Required shell scripts

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/shell/check-template-links.sh`
- `scripts/templates/shell/list-missing-template-sections.sh`
- `scripts/templates/shell/generate-template-index.sh`
- `scripts/templates/shell/verify-workflow-contracts.sh`

## Required PowerShell scripts

- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/powershell/Check-TemplateLinks.ps1`
- `scripts/templates/powershell/Get-MissingTemplateSections.ps1`
- `scripts/templates/powershell/New-TemplateIndex.ps1`
- `scripts/templates/powershell/Test-WorkflowContracts.ps1`

## Required config and docs

- `scripts/templates/config/required-sections.json`
- packaged documentation or README describing bundle purpose and expected layout

## Expected content layout

- `templates/tasks/*.md`
- `templates/workflows/*.md`

## Behavioral guarantees

- validators must be runnable directly against the repo root
- templates and docs must only reference shipped validator paths
- bundle completeness validation must fail if any required script or config file
  is absent
