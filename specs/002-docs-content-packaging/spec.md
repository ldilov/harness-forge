# Feature Specification: Harness Forge Documentation, Knowledge Packs, and Package Surface

**Feature Branch**: `002-docs-content-packaging`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "Create a thorough Harness Forge specification that combines the core product requirements with the documentation review and refactor plan, defines the documentation architecture, metadata contracts, language-pack documentation quality bars, authored-versus-generated boundaries, target-neutral installer documentation, and requires the full task and workflow template script bundle to be shipped in the published package."

## Clarifications

### Session 2026-03-25

- Q: Should the attached seeded knowledge-base archive files be explicitly included in package scope? → A: Yes, every non-directory file in the supplied seeded knowledge-base archive for the in-scope starter languages must be shipped directly or traceably transformed into canonical package paths with no file silently dropped.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand and Start Quickly (Priority: P1)

As a new user evaluating Harness Forge, I want a clear product front door and
target-neutral onboarding path, so I can understand what the product is, how to
install it, what it supports, and how to begin without digging through internal
runtime folders.

**Why this priority**: The product cannot feel complete or trustworthy if users
must reverse-engineer runtime content to discover installation, supported
targets, language coverage, repair paths, or migration guidance.

**Independent Test**: A new user can arrive at the project root, understand the
product purpose within a short read, follow a quickstart path, choose a target,
review install or repair guidance, and find language, command, agent, and
troubleshooting documentation without consulting implementation files.

**Acceptance Scenarios**:

1. **Given** a first-time reader at the project root, **When** they open the
   main documentation entrypoint, **Then** they can understand what Harness
   Forge does, who it is for, what targets it supports, and where to go next.
2. **Given** a user who wants the fastest path to success, **When** they follow
   the quickstart flow, **Then** they can complete the shortest happy path from
   zero to a working install with clear expectations and outcomes.
3. **Given** a user installing, repairing, uninstalling, or rolling back,
   **When** they consult the documentation, **Then** they can find the correct
   path for that operation without reading runtime source files.

---

### User Story 2 - Receive Complete Packaged Runtime Content (Priority: P1)

As a user installing Harness Forge from a published package, local archive, or
offline artifact, I want the shipped package to contain the full set of
required documentation, language knowledge bases, workflow templates, and
template-validation utilities, so the installed product works consistently
without missing files or broken references.

**Why this priority**: A strong content system still fails the user if packaged
artifacts omit required docs, scripts, or seed knowledge. Package completeness
is part of product correctness.

**Independent Test**: A maintainer can inspect a packaged artifact and confirm
that the published package includes the full task and workflow validation script
bundle, required configuration files, the seed language knowledge bases, and
all content referenced by manifests, templates, and docs.

**Acceptance Scenarios**:

1. **Given** a packaged release artifact, **When** a maintainer verifies its
   contents, **Then** every required documentation asset, runtime content asset,
   language seed asset, and workflow-validation asset is present and
   referenceable.
2. **Given** an offline or local-archive installation, **When** the user
   installs the package, **Then** template validation, template indexing, and
   workflow contract checks remain usable without fetching missing files later.
3. **Given** a template or doc that references a packaged validator or seed
   content item, **When** that artifact is installed or reviewed, **Then** the
   reference resolves to shipped content rather than a missing or external-only
   dependency.

---

### User Story 3 - Trust the Knowledge Pack and Documentation System (Priority: P2)

As a maintainer or advanced user, I want language packs, command docs, agent
docs, examples, hooks, and contexts to follow a consistent metadata and content
contract, so the system is discoverable, maintainable, and safe to extend
without uneven quality or documentation drift.

**Why this priority**: Harness Forge is intended to be a comprehensive
knowledgebase and optimizer, so content quality and consistency are core product
value rather than optional polish.

**Independent Test**: A maintainer can inspect any supported language pack,
command doc, agent doc, context, or example and verify that it follows the
shared metadata contract, required content sections, target compatibility
expectations, and canonical authored-source boundaries.

**Acceptance Scenarios**:

1. **Given** any runtime markdown asset, **When** a maintainer reviews its
   metadata and structure, **Then** it follows the shared content contract for
   its type and exposes the information needed for discovery and safe use.
2. **Given** any supported language pack, **When** a user or maintainer reviews
   it, **Then** it includes the baseline language guidance set and clearly
   communicates maturity, intended use, and related examples.
3. **Given** generated content derived from authored sources, **When** a reader
   or maintainer inspects it, **Then** it is clearly marked as generated and
   points back to its canonical source.

---

### User Story 4 - Prevent Documentation and Package Drift Before Release (Priority: P3)

As a release maintainer, I want validation rules that catch missing metadata,
broken links, missing language-pack files, authored/generated drift, and
packaged-file omissions before release, so product docs and shipped runtime
content remain trustworthy as the system grows.

**Why this priority**: Harness Forge aims to outperform the reference project by
being safer to evolve. That requires strong gates for docs, content, and
package-surface integrity.

**Independent Test**: A maintainer can run the validation suite and receive
clear failures whenever required docs are missing, metadata contracts are
broken, language packs are incomplete, generated artifacts drift from their
sources, or required packaged assets are absent.

**Acceptance Scenarios**:

1. **Given** a release candidate with a missing required documentation section,
   metadata field, or packaged validator, **When** validation runs, **Then** it
   fails with an actionable explanation of what is missing.
2. **Given** a generated artifact that has drifted from its canonical source,
   **When** validation runs, **Then** the release is blocked until the drift is
   resolved.
3. **Given** updated examples, language packs, or target docs, **When**
   maintainers prepare a release, **Then** the validation system confirms that
   references, package contents, and migration guidance remain consistent.

---

### Edge Cases

- A user installs from a tarball or offline source and expects the workflow
  validation scripts to work even when the network is unavailable.
- A published package includes templates that reference validation scripts or
  config files that were not shipped with the release.
- A language pack exists in seed form but lacks one or more required baseline
  rule files, causing uneven quality across languages.
- Legacy branding or single-target assumptions remain in user-facing docs even
  after target-neutral documentation is expected.
- Authored content and generated artifacts disagree about file locations,
  metadata, or supported targets.
- Examples imply a file layout or target assumption that no longer matches the
  packaged product.
- A command or agent doc is discoverable in the package but too thin to tell
  users when to use it, what it produces, or when to stop.
- A target-specific instruction appears in default docs without clearly being
  scoped to that target.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST provide a clear root documentation front door
  that explains what Harness Forge is, who it serves, what targets it supports,
  and how to begin within a short initial read.
- **FR-002**: The documentation system MUST provide a quickstart path, full
  installation guidance, target guidance, language-pack guidance, command and
  agent indexes, troubleshooting guidance, migration guidance, and pack-authoring
  guidance.
- **FR-003**: Documentation MUST be target-neutral by default and become
  target-specific only where behavior, compatibility, or steps genuinely differ.
- **FR-004**: User-facing docs MUST remove legacy branding and outdated
  single-target assumptions.
- **FR-005**: Runtime markdown content MUST follow a shared metadata contract
  appropriate to its content type, including enough metadata for discovery,
  ownership, compatibility, and authored-versus-generated status.
- **FR-006**: Command documentation MUST define purpose, when to use, syntax,
  arguments or options, examples, output behavior, side effects, failure
  behavior, related content, and target compatibility.
- **FR-007**: Agent documentation MUST define mission, expected inputs,
  workflow, required checks, output contract, stop conditions, escalation rules,
  failure modes, and example invocation.
- **FR-008**: Every supported language pack MUST include the baseline knowledge
  contract covering coding style, patterns, testing, security, and hooks.
- **FR-009**: The initial documentation and knowledge-pack surface MUST treat
  the supplied TypeScript, Java, .NET, Lua, and PowerShell knowledge-base
  archives as priority starter content for first-class language coverage.
- **FR-009A**: Every non-directory file in the supplied TypeScript, Java, .NET,
  Lua, and PowerShell knowledge-base archives MUST be accounted for in release
  scope by one of two approved outcomes only: shipped directly in the published
  package, or transformed into a documented canonical Harness Forge path with
  traceable provenance and no silent omission.
- **FR-009B**: The seeded knowledge-base archive coverage MUST include archive
  metadata files, overview docs, review checklists, framework notes, examples,
  shared baseline rule files, language-specific rule files, and legacy-seed
  content where present for the starter languages in scope.
- **FR-010**: The system MUST clearly distinguish canonical authored content
  from generated artifacts and MUST identify generated outputs as generated,
  non-authoritative, and traceable back to their source.
- **FR-011**: The product MUST provide documentation for install, repair,
  uninstall, rollback, offline install, and partial-install recovery behaviors.
- **FR-012**: The product MUST provide scenario-based examples covering both
  individual and team use cases, including polyglot, security-heavy, platform,
  data, game-development, Windows automation, and service-oriented scenarios.
- **FR-013**: The published package MUST include the full task and workflow
  template script bundle supplied in the archive, including all shell
  validators, all PowerShell validators, the required configuration file, and
  the bundle README.
- **FR-014**: The published package MUST keep the shipped task and workflow
  validation bundle directly usable by installed templates, workflows, and
  documentation without requiring a separate download.
- **FR-015**: Templates, workflows, and related docs MUST reference packaged
  validators and indexing utilities in a way that remains valid after publish
  and install.
- **FR-016**: The package surface MUST include all files referenced by
  manifests, templates, docs, examples, and target mappings that are required
  for supported user journeys.
- **FR-016A**: The package surface MUST preserve any required hidden or
  target-scoped content areas for supported harnesses, along with root-level
  compatibility guidance files needed by those harnesses.
- **FR-017**: Validation rules MUST detect missing metadata, broken links,
  missing packaged files, incomplete language packs, and authored-versus-generated
  drift before release.
- **FR-017A**: Validation rules MUST detect any seeded knowledge-base archive
  file that lacks a shipped destination or explicit canonical transformation
  mapping before release.
- **FR-018**: The release process MUST fail if required packaged assets are
  absent from the publish artifact, including hidden or target-scoped content.
- **FR-019**: The documentation system MUST explain pack maturity and coverage
  so users can tell which language packs are baseline-ready, which are evolving,
  and where stronger framework-specific guidance exists.
- **FR-020**: The rules and language-pack documentation MUST explain how new
  languages, packs, adapters, and related docs can be added without breaking
  existing content contracts.
- **FR-021**: The product MUST provide indexes or catalog views for commands,
  agents, languages, hooks, manifests, and content architecture so users do not
  need to browse runtime folders manually.
- **FR-022**: The documentation and package design MUST support maintainable
  migration from reference-project concepts to Harness Forge concepts by making
  renamed, generalized, or target-neutralized content understandable.
- **FR-023**: The documentation and packaged content MUST help coding
  assistants discover when task templates, workflow templates, language packs,
  or guidance assets should be used, even when a user does not name them
  explicitly.
- **FR-024**: The packaged artifact MUST preserve the validator configuration
  contract required for template required-section checks and workflow contract
  verification.
- **FR-025**: If localized or translated documentation is shipped, each
  localized document set MUST clearly identify its canonical source and remain
  within the same documentation contract and drift-detection model as the
  primary documentation set.

### Key Entities *(include if feature involves data)*

- **Documentation Front Door**: The product-facing entry surface that explains
  value, installation paths, supported targets, and navigation into deeper
  product documentation.
- **Runtime Content Asset**: A packaged authored item such as an agent doc,
  command doc, context, rule, hook, example, template, or workflow that users
  and assistants consume directly.
- **Language Knowledge Pack**: A bundled unit of language-specific guidance,
  rules, examples, and supporting docs that follows the shared language-pack
  contract.
- **Validation Script Bundle**: The packaged collection of shell and
  PowerShell-based task/workflow validation utilities, their configuration, and
  supporting documentation.
- **Generated Artifact**: A non-canonical output derived from authored content
  that must clearly declare provenance and regeneration expectations.
- **Package Surface**: The complete set of files guaranteed to exist in a
  published or offline-installable Harness Forge artifact.
- **Content Contract**: The required metadata fields, sections, compatibility
  markers, and authored/generated rules for a given content type.

## Quality & Architecture Constraints *(mandatory)*

- **QC-001**: The specification MUST preserve a clear separation between
  product-facing documentation, runtime content, generated artifacts, and
  packaged validation utilities.
- **QC-002**: The design MUST keep authored content contracts explicit by
  content type and language pack, rather than relying on implicit conventions or
  folder names alone.
- **QC-003**: Automated verification required for this feature includes
  front-matter validation, required-section validation, broken-link detection,
  workflow-contract validation, language-pack completeness checks,
  authored-versus-generated drift checks, and package-surface validation.
- **QC-004**: Release hardening MUST include package-surface verification for
  the full task/workflow script bundle and all required seed language knowledge
  content derived from the supplied archives.
- **QC-004A**: Seeded knowledge coverage verification MUST operate at the
  individual file level for the in-scope attached language archives, not only at
  the folder or manifest-entry level.
- **QC-005**: Documentation and runtime content changes MUST update shared
  assistant guidance where discovery, usage expectations, or recommended
  workflows change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new reader can identify the product purpose, supported targets,
  and correct next documentation step from the root documentation surface in
  under 2 minutes.
- **SC-002**: Release validation catches 100% of intentionally removed required
  template-validator bundle files before publication.
- **SC-003**: Every first-class shipped language pack in scope for this feature
  exposes the baseline required guidance set and passes completeness checks
  before release.
- **SC-003A**: Release validation reports 100% coverage for all non-directory
  files in the supplied starter language archives for TypeScript, Java, .NET,
  Lua, and PowerShell, with each file either shipped or traceably transformed.
- **SC-004**: Published package validation confirms that all task/workflow
  validators, their configuration assets, and their supporting documentation are
  present and referenceable in every release candidate.
- **SC-005**: A maintainer can determine whether any runtime markdown artifact
  is authored or generated, who owns it, and what targets or languages it
  applies to from the content metadata alone.
- **SC-006**: Documentation validation blocks release whenever legacy branding,
  broken target assumptions, or missing required operational sections remain in
  user-facing docs for supported content types.

## Assumptions

- The existing install/runtime feature work remains the baseline product
  context, and this specification focuses on the documentation, content
  contracts, packaged knowledge assets, and release-surface guarantees layered
  on top of it.
- The supplied reference project is treated as evidence for real-world product
  needs, including hidden target-specific package surfaces, root compatibility
  guidance files, target-scoped examples, and multilingual documentation.
- The supplied task and workflow template script archive represents canonical
  required content for the packaged validation bundle rather than optional
  example material.
- The supplied language knowledge-base archive is treated as authoritative seed
  input for first-class starter language coverage where matching languages are
  present.
- Additional languages may remain in scope for the broader product, but this
  feature prioritizes the seeded languages plus the documented language-pack
  contract and coverage system.
- Target-specific documentation remains necessary in some places, but the
  preferred default is target-neutral structure with clear adapter-specific
  sections only where behavior differs.
