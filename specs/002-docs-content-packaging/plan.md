# Implementation Plan: Harness Forge Documentation, Knowledge Packs, and Package Surface

**Branch**: `002-docs-content-packaging` | **Date**: 2026-03-25 | **Spec**: [spec.md](D:/Workspace/repos/harness-forge/specs/002-docs-content-packaging/spec.md)
**Input**: Feature specification from `D:\Workspace\repos\harness-forge\specs\002-docs-content-packaging\spec.md`

## Summary

Turn Harness Forge from a runtime scaffold with some seeded docs and validator
scripts into a concrete, shippable content system. The plan centers on three
real deliverables already visible in the repo and supplied archives:

1. a product-facing documentation front door and operating guide set,
2. first-class seeded knowledge packs with real docs, rules, and examples
   instead of empty placeholders,
3. a package-surface contract that guarantees the shipped validator bundle and
   referenced content survive publish/install intact.

The implementation will use the current TypeScript/Node packaging runtime,
existing manifest catalog, existing `scripts/templates/` validator bundle, and
seed archives for TypeScript, Java, .NET, Lua, and PowerShell as concrete
inputs. The main design choice is to treat authored markdown and manifest files
as canonical sources, while making generated artifacts and localized docs
explicitly traceable derivatives.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 LTS; Markdown + YAML front matter; JSON manifests; POSIX shell and PowerShell for validation utilities  
**Primary Dependencies**: Existing CLI/runtime stack in `package.json` (`commander`, `fast-glob`, `yaml`, `zod`, `ajv`) plus built-in filesystem/process tooling  
**Storage**: Repository files and published package contents; no database required  
**Testing**: Existing Vitest-based TypeScript tests, direct shell/PowerShell validator execution, package-surface verification scripts, manifest validation scripts  
**Target Platform**: Cross-platform repository and package artifact supporting Codex, Claude Code, Cursor, and OpenCode-style target surfaces where documented  
**Project Type**: CLI + packaged content catalog + documentation system  
**Performance Goals**: Documentation and package validation complete fast enough for local pre-release checks; package-surface checks remain deterministic for CI use  
**Constraints**: Must remain offline-installable; must preserve agent-neutral guidance; must ship the full validator bundle from `task-workflow-template-scripts.zip`; must convert supplied seeded knowledge into real project content rather than placeholder folders  
**Scale/Scope**: Product front door, docs architecture, content contracts, validator bundle packaging, seeded language-pack documentation for TypeScript/Java/.NET/Lua/PowerShell, package-surface enforcement, authored/generated boundary rules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Specs exist for user value, acceptance scenarios, measurable success criteria,
  and architecture or quality constraints.
- The chosen structure is idiomatic for the target language and framework.
- Tests, contract checks, or equivalent executable verification are defined before
  implementation work starts.
- Module boundaries, contracts, and dependency direction are explicit and keep
  domain logic isolated from transport and infrastructure concerns.
- Observability, documentation, and agent-context impacts are identified for any
  changed behavior, commands, or architecture.
- Any added complexity or abstraction is justified in the Complexity Tracking
  section.

**Gate Result**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/002-docs-content-packaging/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── content-metadata-contract.md
│   ├── language-pack-contract.md
│   ├── package-surface-contract.md
│   └── template-validator-bundle-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
README.md
AGENTS.md
package.json

docs/
├── install/
│   └── targets.md
├── migration/
│   └── reference-project.md
├── templates/
│   └── authoring.md
├── catalog/
│   ├── language-packs.md
│   ├── frameworks/
│   │   ├── laravel.md
│   │   └── nextjs.md
│   └── languages/
│       ├── cpp.md
│       ├── dotnet.md
│       ├── go.md
│       ├── java.md
│       ├── kotlin.md
│       ├── lua.md
│       ├── perl.md
│       ├── php.md
│       ├── powershell.md
│       ├── python.md
│       ├── rust.md
│       ├── shell.md
│       ├── swift.md
│       └── typescript.md
├── agents.md
├── commands.md
├── content-architecture.md
├── generated-artifacts.md
├── hooks.md
├── installation.md
├── languages.md
├── manifests.md
├── pack-authoring.md
├── quickstart.md
├── troubleshooting.md
└── versioning-and-migration.md

rules/
├── cpp/README.md
├── dotnet/README.md
├── golang/README.md
├── java/README.md
├── kotlin/README.md
├── lua/README.md
├── perl/README.md
├── php/README.md
├── powershell/README.md
├── python/README.md
├── rust/README.md
├── shell/README.md
├── swift/README.md
└── typescript/README.md

templates/
├── tasks/
│   ├── fix-bug.md
│   └── implement-feature.md
└── workflows/
    ├── research-plan-implement-validate.md
    └── triage-reproduce-fix-verify.md

scripts/
├── ci/
│   ├── release-smoke.mjs
│   ├── validate-pack-dependencies.mjs
│   └── validate-packed-install-surface.mjs
└── templates/
    ├── config/
    │   └── required-sections.json
    ├── powershell/
    │   ├── Check-TemplateFrontmatter.ps1
    │   ├── Check-TemplateLinks.ps1
    │   ├── Get-MissingTemplateSections.ps1
    │   ├── New-TemplateIndex.ps1
    │   └── Test-WorkflowContracts.ps1
    └── shell/
        ├── check-template-frontmatter.sh
        ├── check-template-links.sh
        ├── generate-template-index.sh
        ├── list-missing-template-sections.sh
        └── verify-workflow-contracts.sh

manifests/
├── bundles/
│   ├── core.json
│   ├── frameworks.json
│   ├── languages-seeded.json
│   └── languages-v1.json
├── catalog/
│   ├── index.json
│   └── language-assets.json
├── profiles/
│   └── core.json
└── targets/
    └── core.json

src/
├── application/
├── cli/
├── domain/
├── infrastructure/
└── shared/

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: Keep the single-project TypeScript CLI/runtime layout,
but treat `docs/`, `rules/`, `templates/`, `scripts/templates/`, and
`manifests/` as first-class product surface. This feature is content-heavy, so
the main implementation work is not new executable modules alone; it is the
promotion of real seeded knowledge and validation assets into governed,
packaged, documented product content.

## Content Inventory To Materialize

### Seeded language knowledge that must become real project content

- TypeScript knowledge base:
  `rules/common`, `rules/typescript`, `docs/overview.md`,
  `docs/review-checklist.md`, `docs/examples-guide.md`,
  `docs/frameworks.md`, and four scenario examples
- Java knowledge base:
  `rules/common`, `rules/java`, language docs, review checklist, and
  service/backend scenario examples
- .NET knowledge base:
  starter rules, docs, examples, and user-facing `.NET` framing
- Lua knowledge base:
  Neovim, OpenResty, LÖVE, and embedded automation examples with first-class
  Lua rules
- PowerShell knowledge base:
  Windows automation, modules, remoting, CI/admin automation, and secure
  scripting examples

### Validator bundle that must ship intact

- Shell:
  `check-template-frontmatter.sh`, `check-template-links.sh`,
  `list-missing-template-sections.sh`, `generate-template-index.sh`,
  `verify-workflow-contracts.sh`
- PowerShell:
  `Check-TemplateFrontmatter.ps1`, `Check-TemplateLinks.ps1`,
  `Get-MissingTemplateSections.ps1`, `New-TemplateIndex.ps1`,
  `Test-WorkflowContracts.ps1`
- Config:
  `required-sections.json`
- Support doc:
  bundle README content and usage guidance

### Product docs to add or upgrade with concrete knowledge

- Root `README.md` as front door
- `docs/quickstart.md`
- `docs/installation.md`
- `docs/targets.md`
- `docs/languages.md`
- `docs/commands.md`
- `docs/agents.md`
- `docs/hooks.md`
- `docs/manifests.md`
- `docs/content-architecture.md`
- `docs/generated-artifacts.md`
- `docs/troubleshooting.md`
- `docs/versioning-and-migration.md`
- `docs/pack-authoring.md`
- `rules/README.md` with language matrix and maturity model
- scenario examples upgraded from target-specific legacy assumptions

## Phase 0: Research Focus

- Decide canonical authored-versus-generated boundaries for docs, schemas, and
  derived indexes.
- Decide metadata contract per runtime content type.
- Decide how seeded language archive content maps into current repo paths.
- Decide how the validator bundle README and config are represented in the
  package surface and docs.
- Decide how to govern localized docs if they are introduced later.

## Phase 1: Design Focus

- Define the content asset model and package-surface model.
- Define concrete contracts for metadata, language-pack completeness, validator
  bundle completeness, and package-surface validation.
- Produce a quickstart that exercises real docs, validators, manifests, and
  package checks rather than placeholder folder existence.

## Post-Design Constitution Check

**Expected Result**: PASS. The design uses explicit content contracts, real
seeded assets, and executable validation instead of relying on conventions or
manual review alone.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
