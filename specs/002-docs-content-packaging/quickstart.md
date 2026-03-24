# Quickstart: Validate Real Documentation and Knowledge Content

## Purpose

This quickstart verifies that Harness Forge ships real documentation, seeded
knowledge content, and the full task/workflow validator bundle instead of empty
folders or incomplete package artifacts.

## Prerequisites

- Repository checkout available locally
- Node.js and npm available for package-surface and manifest validation
- PowerShell available for direct validator execution

## 1. Confirm the product front door exists

Open the root documentation and verify that it acts as a real entrypoint:

- `README.md`
- `docs/install/targets.md`
- `docs/catalog/language-packs.md`
- `docs/migration/reference-project.md`
- `docs/templates/authoring.md`

Expected result:

- a new reader can identify what Harness Forge is
- at least one clear next step exists for install, language selection, or
  template/workflow usage

## 2. Confirm seeded language knowledge is real

Inspect the current first-class seeded language surfaces:

- `docs/catalog/languages/typescript.md`
- `docs/catalog/languages/java.md`
- `docs/catalog/languages/dotnet.md`
- `docs/catalog/languages/lua.md`
- `docs/catalog/languages/powershell.md`
- matching `rules/*/README.md` entries

Expected result:

- each seeded language has real authored content, not just a directory shell
- manifest references in `manifests/catalog/language-assets.json` resolve to
  shipped files

## 3. Confirm the validator bundle is complete

Verify that the full task/workflow script bundle is present:

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/shell/check-template-links.sh`
- `scripts/templates/shell/list-missing-template-sections.sh`
- `scripts/templates/shell/generate-template-index.sh`
- `scripts/templates/shell/verify-workflow-contracts.sh`
- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/powershell/Check-TemplateLinks.ps1`
- `scripts/templates/powershell/Get-MissingTemplateSections.ps1`
- `scripts/templates/powershell/New-TemplateIndex.ps1`
- `scripts/templates/powershell/Test-WorkflowContracts.ps1`
- `scripts/templates/config/required-sections.json`

Expected result:

- every script exists
- the shared config file exists
- templates can continue to reference these paths after publish/install

## 4. Run the shipped PowerShell validators

```powershell
pwsh ./scripts/templates/powershell/Check-TemplateFrontmatter.ps1 -Root .
pwsh ./scripts/templates/powershell/Check-TemplateLinks.ps1 -Root .
pwsh ./scripts/templates/powershell/Get-MissingTemplateSections.ps1 -Root .
pwsh ./scripts/templates/powershell/Test-WorkflowContracts.ps1 -Root .
```

Expected result:

- front matter validation passes
- link validation passes
- required-section validation passes
- workflow contract validation passes

## 5. Validate package and manifest surface

Run the release-surface checks:

```bash
npm run validate:catalog
npm run validate:seeded-coverage
npm run validate:package-surface
npm run validate:release
```

Expected result:

- manifest dependencies resolve
- every non-directory seeded archive file is covered
- manifest paths resolve to real files
- the package-surface validator reports no missing shipped assets
- the combined release smoke passes

## 6. Verify template/workflow content is concrete

Inspect shipped templates:

- `templates/tasks/implement-feature.md`
- `templates/tasks/fix-bug.md`
- `templates/workflows/research-plan-implement-validate.md`
- `templates/workflows/triage-reproduce-fix-verify.md`

Expected result:

- each template includes required metadata and sections
- workflows define concrete stages, handoff contracts, and exit conditions
- validators and supporting docs are referenced through shipped paths

## 7. Release readiness check

The feature is ready when:

- product docs form a coherent front door
- seeded language packs expose real knowledge
- validators and config ship intact
- manifest/package checks pass
- there are no “empty folder only” language or template surfaces for seeded
  content in scope
