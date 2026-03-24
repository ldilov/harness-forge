# Quickstart: Harness Forge Agentic AI Platform

## Purpose

This quickstart describes how to validate the planned v1 experience once the
feature is implemented. It covers the minimum install path for Codex and Claude
Code, adding language packs, and validating shipped task and workflow
templates.

## Prerequisites

- Node.js 22 LTS or newer installed
- A writable repository or workspace root
- One supported assistant target available:
  - Codex
  - Claude Code
- Bash or PowerShell available for direct validator execution

## 1. Initialize the workspace

```bash
npx @harness-forge/cli init --root .
```

Expected result:

- `.hforge/` local state directory is initialized
- the CLI confirms available targets and starter profiles

## 2. Preview a Codex install

```bash
npx @harness-forge/cli install \
  --target codex \
  --profile developer \
  --lang typescript \
  --lang lua \
  --with templates-core \
  --with workflow-quality \
  --dry-run
```

Expected result:

- the CLI prints a human-readable plan
- selected bundles, warnings, and target mappings are visible
- no files are written during preview

## 3. Apply the Codex install

```bash
npx @harness-forge/cli install \
  --target codex \
  --profile developer \
  --lang typescript \
  --lang lua \
  --with templates-core \
  --with workflow-quality \
  --yes
```

Expected result:

- Codex-compatible guidance is installed
- usage instructions explain how to discover packs, templates, and workflows
- `.hforge/state/install-state.json` records the applied state

## 4. Apply the same flow for Claude Code

```bash
npx @harness-forge/cli install \
  --target claude-code \
  --profile developer \
  --lang powershell \
  --with templates-core \
  --with workflow-quality \
  --yes
```

Expected result:

- Claude Code-compatible guidance is installed without breaking the baseline
  catalog model
- post-install messaging explains Claude Code usage and validation paths

## 5. Inspect and validate the template catalog

```bash
npx @harness-forge/cli template list
npx @harness-forge/cli template validate
npx @harness-forge/cli workflow show research-plan-implement-validate
```

Expected result:

- starter task and workflow templates are listed by stable id
- validation reports missing front matter, missing sections, or broken links if
  present
- workflow output shows stages, handoffs, and approval points

## 6. Run the shipped validators directly

### Shell

```bash
./scripts/templates/shell/check-template-frontmatter.sh .
./scripts/templates/shell/check-template-links.sh .
./scripts/templates/shell/list-missing-template-sections.sh .
./scripts/templates/shell/verify-workflow-contracts.sh .
```

### PowerShell

```powershell
pwsh ./scripts/templates/powershell/Check-TemplateFrontmatter.ps1 -Root .
pwsh ./scripts/templates/powershell/Check-TemplateLinks.ps1 -Root .
pwsh ./scripts/templates/powershell/Get-MissingTemplateSections.ps1 -Root .
pwsh ./scripts/templates/powershell/Test-WorkflowContracts.ps1 -Root .
```

Expected result:

- both shell families validate the same template catalog successfully
- failures are actionable and point to exact template files

## 7. Verify repair and uninstall flows

```bash
npx @harness-forge/cli status
npx @harness-forge/cli doctor
npx @harness-forge/cli repair --dry-run
npx @harness-forge/cli uninstall --dry-run
```

Expected result:

- current install state is visible
- drift or missing content is reported clearly
- repair and uninstall can be previewed safely before apply
