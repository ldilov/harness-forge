# Template Validator Bundle

Harness Forge ships the full task and workflow validator bundle inside `scripts/templates/`.

## Included assets

- shell validators in `scripts/templates/shell/`
- PowerShell validators in `scripts/templates/powershell/`
- shared config in `scripts/templates/config/required-sections.json`

## Supported content

- `templates/tasks/*.md`
- `templates/workflows/*.md`

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
