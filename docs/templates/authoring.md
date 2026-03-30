# Template Authoring Guide

Author task and workflow templates in Markdown with YAML front matter.

- keep required metadata fields present
- keep required sections in order
- reference shipped validator scripts when a validation step is required
- prefer paths under `scripts/templates/` and never point to private local-only
  validators
- validate with both shell and PowerShell scripts when cross-platform support
  matters

## Universal design rule

Every reusable template should help the operator answer these seven questions:

1. what is changing?
2. why is it changing?
3. what must remain true?
4. what could break?
5. how will we know it works?
6. how do we roll it back?
7. what should future engineers remember?

Use those questions as the stable skeleton for technology-agnostic templates.
They keep prompt prefixes reusable, make reviews easier, and prevent important
correctness or rollback details from hiding inside free-form prose.

## Recommended universal templates

- `templates/tasks/change-brief.md`
- `templates/tasks/correctness-contract.md`
- `templates/tasks/verification-matrix.md`
- `templates/tasks/release-gate-report.md`
- `templates/tasks/bug-repro-card.md`
- `templates/tasks/research-to-implementation-brief.md`
- `templates/tasks/migration-plan.md`
- `templates/workflows/implement-change.md`

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
