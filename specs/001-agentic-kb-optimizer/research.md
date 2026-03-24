# Research: Harness Forge Agentic AI Platform

## Decision 1: Use a TypeScript Node CLI as the product runtime

- **Decision**: Build Harness Forge as a TypeScript CLI compiled for Node.js 22
  LTS, with shell and PowerShell scripts kept as first-class bootstrap and
  validation surfaces.
- **Rationale**: The supplied reference project and product requirements both
  center on npm distribution, cross-platform bootstrap entrypoints, and packaged
  repository assets. TypeScript provides strong fit for catalog parsing,
  manifest validation, install planning, and JSON or Markdown-heavy workflows.
- **Alternatives considered**:
  - Python CLI: rejected because npm-based installation, tarball packaging, and
    JavaScript ecosystem ergonomics are central to the target experience.
  - Bash or PowerShell only: rejected because the platform needs richer
    cross-platform planning, catalog parsing, and structured validation logic
    than shell runtimes should own.

## Decision 2: Make packs, targets, and workflows explicit catalog objects

- **Decision**: Model installable bundles, profiles, target adapters, templates,
  and migrations as explicit catalog entities backed by manifests and schemas.
- **Rationale**: The biggest weakness in the supplied reference package is the
  hidden coupling caused by monolithic modules and implicit packaging. Explicit
  catalog objects make installs inspectable, testable, and safe to evolve.
- **Alternatives considered**:
  - Keep a broad but mostly implicit directory map: rejected because it hides
    dependencies, conflicts, and packaging gaps.
  - Resolve content through one mega-module: rejected because it blocks atomic
    language packs and precise upgrades.

## Decision 3: Keep Markdown with YAML front matter as the canonical template format

- **Decision**: Author task templates and workflow templates in Markdown with
  YAML front matter, and validate them with bundled shell and PowerShell
  utilities plus higher-level CLI validation commands.
- **Rationale**: The attached task and workflow requirements and starter script
  bundle are already optimized for Markdown-first authoring. This keeps content
  easy for humans and assistants to read while still allowing structured
  validation and future machine projections.
- **Alternatives considered**:
  - Custom JSON or YAML-only templates: rejected because they are harder for
    contributors to read and less friendly for assistant usage.
  - Free-form Markdown with no metadata: rejected because the product needs
    deterministic validation, discovery, and compatibility checks.

## Decision 4: Store install state and backups locally in the workspace

- **Decision**: Track installs in `.hforge/state/` with a machine-readable state
  file, plan hash, and backup metadata, while writing file backups to a dedicated
  snapshot location.
- **Rationale**: Safe repair, uninstall, restore, and migration depend on a
  trustworthy local record of what Harness Forge changed. Repo-local state also
  supports offline workflows and transparent debugging.
- **Alternatives considered**:
  - No persistent install state: rejected because uninstall and repair would be
    fragile and destructive.
  - Global machine state only: rejected because repository-scoped installs are a
    first-order use case and must remain portable.

## Decision 5: Use target adapters for Codex and Claude Code from day one

- **Decision**: Create formal target adapters for `codex` and `claude-code`
  with explicit install roots, merge rules, capability matrices, and
  post-install guidance generation.
- **Rationale**: The user requirement is explicit that installation must be
  fully compatible and functional in both Codex and Claude Code. Formal adapters
  prevent vendor-specific assumptions from leaking into the broader catalog.
- **Alternatives considered**:
  - Shared target logic with small conditionals: rejected because capability
    drift and path differences will become brittle quickly.
  - One target at launch with later parity: rejected because day-one dual-target
    compatibility is a core product promise.

## Decision 6: Seed initial language packs from the supplied knowledge-base archives

- **Decision**: Use the attached TypeScript, Java, .NET, Lua, and PowerShell
  knowledge-base archives as priority starter packs, then extend the same pack
  contract to the remaining required v1 languages.
- **Rationale**: These archives already contain rules, examples, docs, and
  review-oriented material that match the platform's desired content structure.
  They accelerate delivery while still fitting the new atomic pack model.
- **Alternatives considered**:
  - Rewrite all language content from scratch: rejected because it would discard
    useful seed material and slow initial delivery.
  - Copy the reference package unchanged: rejected because the new platform must
    improve structure, consistency, and compatibility.

## Decision 7: Ship layered verification, not a single validator

- **Decision**: Combine schema validation, unit tests, CLI integration tests,
  tarball smoke tests, shell and PowerShell self-tests, and template catalog
  validators as the verification strategy.
- **Rationale**: The product spans runtime code, packaged assets, bootstrap
  scripts, migration logic, and assistant-facing content. No single validator is
  sufficient to catch all breakage classes.
- **Alternatives considered**:
  - Runtime unit tests only: rejected because packaging and cross-shell failures
    would escape.
  - Manual smoke testing only: rejected because repeatability is central to the
    platform's value proposition.

## Decision 8: Treat template validation scripts as both shipped utilities and CLI-backed capabilities

- **Decision**: Preserve the starter shell and PowerShell scripts from the
  supplied template bundle under `scripts/templates/`, and expose their behavior
  through stable CLI commands such as `hforge template validate`.
- **Rationale**: Users asked specifically that workflows reference the provided
  scripts. Keeping them as first-class shipped assets satisfies that request,
  while the CLI offers a friendlier entrypoint for everyday use.
- **Alternatives considered**:
  - Hide validation logic behind the CLI only: rejected because it breaks the
    requirement to reference the supplied scripts directly.
  - Ship scripts without CLI wrappers: rejected because discovery and consistent
    user experience would suffer.

## Decision 9: Include a migration assistant from the reference package in v1

- **Decision**: Provide a footprint scanner and migration planner that maps the
  supplied reference project's components, profiles, and installed files into
  Harness Forge bundle selections and warnings.
- **Rationale**: Migration lowers adoption friction and makes the new product a
  credible successor rather than a disconnected rewrite.
- **Alternatives considered**:
  - No migration path in v1: rejected because it would strand users of the
    existing package.
  - One-shot automatic conversion: rejected because visibility and backup safety
    are more important than aggressive automation.
