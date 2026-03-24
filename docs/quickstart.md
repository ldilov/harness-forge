# Quickstart

Use this path when you want to prove the package, seeded knowledge, and
validator surface are all working.

## 1. Build the runtime

```bash
npm install
npm run build
```

## 2. Inspect the catalog

```bash
node dist/cli/index.js catalog --json
```

Confirm the seeded language bundles and workflow-quality capability are present.

## 3. Preview an install that uses a seeded pack

```bash
node dist/cli/index.js add --target codex --lang typescript --with workflow-quality --dry-run
```

The dry-run should include:

- `knowledge-bases/seeded/typescript`
- `rules/typescript/README.md`
- `docs/catalog/languages/typescript.md`
- validator bundle assets from `scripts/templates/`

## 4. Validate the docs and package surface

```bash
npm run validate:release
```

## 5. Run the shipped PowerShell validators directly

```powershell
pwsh ./scripts/templates/powershell/Check-TemplateFrontmatter.ps1 -Root .
pwsh ./scripts/templates/powershell/Check-TemplateLinks.ps1 -Root .
pwsh ./scripts/templates/powershell/Get-MissingTemplateSections.ps1 -Root .
pwsh ./scripts/templates/powershell/Test-WorkflowContracts.ps1 -Root .
```

## 6. Inspect the real seeded content

Open any of the following:

- `knowledge-bases/seeded/typescript/docs/overview.md`
- `knowledge-bases/seeded/java/examples/01-spring-boot-rest-api.md`
- `knowledge-bases/seeded/dotnet/rules/dotnet/patterns.md`
- `knowledge-bases/seeded/lua/docs/frameworks.md`
- `knowledge-bases/seeded/powershell/docs/review-checklist.md`
