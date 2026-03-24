# Data Model: Harness Forge Documentation, Knowledge Packs, and Package Surface

## 1. ContentAsset

### Purpose

Represents any authored runtime or documentation file that users, assistants, or
maintainers consume directly.

### Fields

- `id`: stable logical identifier
- `kind`: content type such as `command`, `agent`, `rule`, `context`,
  `example`, `task-template`, `workflow-template`, `doc-page`
- `title`: user-facing title
- `summary`: short purpose statement
- `owner`: accountable maintainer group
- `status`: lifecycle state such as draft, stable, beta, deprecated
- `appliesTo`: supported targets or `any`
- `languages`: supported languages or `any`
- `generated`: whether the file is generated
- `canonicalSource`: source path or identifier if generated or localized
- `filePath`: repository path

### Relationships

- May belong to one `LanguagePack`
- May be referenced by one or more `PackageSurfaceEntry`
- May be validated by one or more `ValidationScript`

### Validation Rules

- Must expose required metadata for its `kind`
- Must not claim generated status without a canonical source
- Must resolve all internal references to existing packaged assets

## 2. LanguagePack

### Purpose

Represents a first-class language knowledge bundle, including rules, docs,
examples, and maturity information.

### Fields

- `id`: stable pack identifier, for example `typescript`, `java`, `dotnet`,
  `lua`, `powershell`
- `displayName`: user-facing pack name
- `maturity`: baseline-ready, evolving, beta, or equivalent maturity level
- `seeded`: whether the pack is derived from a supplied archive
- `rulePaths`: paths to required rule files
- `docPaths`: paths to language-specific docs
- `examplePaths`: paths to scenario examples
- `reviewArtifacts`: review checklist and related quality assets
- `frameworkCoverage`: supported framework notes

### Relationships

- Owns multiple `ContentAsset` records
- Is indexed by `ManifestEntry` and `PackageSurfaceEntry`

### Validation Rules

- Must contain the baseline required guidance set:
  coding style, patterns, testing, security, hooks
- Must declare maturity
- Must not be considered first-class if required assets are absent

## 3. ValidationScriptBundle

### Purpose

Represents the shipped task and workflow template validator package.

### Fields

- `id`: stable bundle identifier
- `shellScripts`: list of POSIX validator script paths
- `powershellScripts`: list of PowerShell validator script paths
- `configPaths`: supporting config files such as required sections
- `docPaths`: bundle README and usage docs
- `requiredLayout`: expected templates path model

### Relationships

- Validates `ContentAsset` records of kinds `task-template` and
  `workflow-template`
- Is included in multiple `PackageSurfaceEntry` records

### Validation Rules

- All listed files must exist in the repo and published package
- Config references must resolve
- Templates and docs must reference only shipped validator paths

## 4. GeneratedArtifact

### Purpose

Represents any non-canonical generated output derived from authored content.

### Fields

- `id`: stable artifact identifier
- `artifactPath`: generated file path
- `sourcePaths`: canonical authored inputs
- `generatedMarker`: provenance marker text or metadata
- `regenerationTrigger`: human-readable generation step

### Relationships

- Depends on one or more `ContentAsset` sources

### Validation Rules

- Must clearly identify canonical source
- Must be considered invalid when source and artifact drift

## 5. PackageSurfaceEntry

### Purpose

Represents a file or directory guaranteed to exist in the published package for
supported user journeys.

### Fields

- `path`: package-relative path
- `surfaceType`: root-doc, runtime-content, hidden-target-surface,
  validator-bundle, manifest, example, generated-output
- `requiredFor`: user journey or validation reason
- `visibility`: visible or hidden
- `targetScope`: global or target-specific
- `sourceOfTruth`: manifest, content contract, packaging rule, or seed input

### Relationships

- May correspond to a `ContentAsset`, `LanguagePack`, `ValidationScriptBundle`,
  or `GeneratedArtifact`

### Validation Rules

- Must be included in publish artifacts when marked required
- Hidden entries must be validated alongside visible ones

## 6. LocalizationSet

### Purpose

Represents a translated or localized documentation collection derived from a
canonical source language.

### Fields

- `locale`: language-region identifier
- `sourceLocale`: canonical authoring locale
- `rootPath`: localized docs root
- `sourceMappings`: mapping to canonical docs
- `status`: active, partial, deprecated

### Relationships

- Contains localized `ContentAsset` variants
- Depends on canonical `ContentAsset` records

### Validation Rules

- Must identify canonical source
- Must not be treated as authoritative over canonical docs
- Must remain within the same metadata and drift-detection contract
