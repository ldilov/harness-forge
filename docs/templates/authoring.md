# Template Authoring Guide

Author task and workflow templates in Markdown with YAML front matter.

- keep required metadata fields present
- keep required sections in order
- reference shipped validator scripts when a validation step is required
- prefer paths under `scripts/templates/` and never point to private local-only
  validators
- validate with both shell and PowerShell scripts when cross-platform support
  matters

## Shipped validator bundle

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/shell/check-template-links.sh`
- `scripts/templates/shell/list-missing-template-sections.sh`
- `scripts/templates/shell/verify-workflow-contracts.sh`
- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/powershell/Check-TemplateLinks.ps1`
- `scripts/templates/powershell/Get-MissingTemplateSections.ps1`
- `scripts/templates/powershell/Test-WorkflowContracts.ps1`
- `scripts/templates/config/required-sections.json`
