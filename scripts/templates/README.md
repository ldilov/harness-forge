# Template Validator Bundle

Harness Forge ships the full task and workflow validator bundle inside
`scripts/templates/`.

## Included assets

- shell validators in `scripts/templates/shell/`
- PowerShell validators in `scripts/templates/powershell/`
- shared config in `scripts/templates/config/required-sections.json`

## Supported content

- `templates/tasks/*.md`
- `templates/workflows/*.md`

## Universal template families

Harness Forge also ships technology-agnostic templates built around seven core
questions that every change should answer:

1. what is changing?
2. why is it changing?
3. what must remain true?
4. what could break?
5. how will we know it works?
6. how do we roll it back?
7. what should future engineers remember?

Recommended starting points:

- `templates/tasks/change-brief.md`
- `templates/tasks/correctness-contract.md`
- `templates/tasks/verification-matrix.md`
- `templates/tasks/release-gate-report.md`
- `templates/tasks/bug-repro-card.md`
- `templates/tasks/research-to-implementation-brief.md`
- `templates/tasks/migration-plan.md`
- `templates/workflows/implement-change.md`

## Usage

### PowerShell

```powershell
pwsh ./scripts/templates/powershell/Check-TemplateFrontmatter.ps1 -Root .
pwsh ./scripts/templates/powershell/Check-TemplateLinks.ps1 -Root .
pwsh ./scripts/templates/powershell/Get-MissingTemplateSections.ps1 -Root .
pwsh ./scripts/templates/powershell/Test-WorkflowContracts.ps1 -Root .
```

### POSIX shell

```bash
./scripts/templates/shell/check-template-frontmatter.sh .
./scripts/templates/shell/check-template-links.sh .
./scripts/templates/shell/list-missing-template-sections.sh .
./scripts/templates/shell/verify-workflow-contracts.sh .
```

## Packaging expectations

- these files are part of the published package surface
- template docs and workflows must only reference these shipped paths
- bundle completeness is enforced by release validation
