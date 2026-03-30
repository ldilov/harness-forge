# Enhanced Skill Import Governance

This document records how the March 2026 enhanced-skills archive was absorbed
into Harness Forge.

## Source pack

- Pack name: `Harness Forge Enhanced Skills Pack`
- Inventory record: `manifests/catalog/enhanced-skill-import-inventory.json`
- Imported focus areas:
  - operational review depth for onboarding, ADRs, APIs, and migrations
  - coordination guidance for worktrees and staged modernization
  - deeper language guidance for TypeScript, .NET, Lua, and JavaScript
- a promoted MADR-focused ADR repository workflow with validation and log generation

## Embedding decisions

| Area | Outcome | Why it matters |
| --- | --- | --- |
| overlapping canonical skills | merge into existing `skills/<skill>/` surfaces | Harness Forge keeps one active canonical skill per responsibility |
| richer supporting references | merge into the owning `references/` pack | deeper heuristics ship without inventing duplicate skill identities |
| imported wrappers | track destination now, align wrapper copy in the discovery phase | discovery drift stays explicit instead of being silently forgotten |
| pack README, validation, and research notes | preserve as maintainer-facing provenance only | pack context remains reviewable without creating a second runtime package |

## Discovery model

- `.agents/skills/<skill>/SKILL.md` is the lightweight discovery layer for agent runtimes
- installed workspaces treat `.hforge/library/skills/<skill>/SKILL.md` as the canonical execution contract
- installed workspaces treat `.hforge/library/skills/<skill>/references/` as the deeper runtime-facing heuristics and templates
- this package source repo still authors those same canonical skill surfaces under `skills/<skill>/` before install remaps them into `.hforge/`
- `RESEARCH-SOURCES.md` and `VALIDATION.md` are project-owned pack-level provenance companions for additional maintainer detail
- this document carries curated research and validation provenance so agents do
  not need to depend on raw imported archive files

## Canonical skill outcomes

The imported archive upgraded these canonical skills directly:

- `skills/repo-onboarding/`
- `skills/architecture-decision-records/`
- `skills/madr-decision-log/`
- `skills/api-contract-review/`
- `skills/db-migration-review/`
- `skills/parallel-worktree-supervisor/`
- `skills/repo-modernization/`
- `skills/typescript-engineering/`
- `skills/dotnet-engineering/`
- `skills/lua-engineering/`
- `skills/javascript-engineering/`

Most of those were merges into existing responsibilities. `javascript-engineering`
stays promoted as a distinct runtime-focused engineering skill rather than a
TypeScript appendix.

Published and local installed workspaces remap those canonical outcomes into
`.hforge/library/skills/` while leaving `.agents/skills/` as the thin visible
discovery layer.

## Provenance summary

The archive stated that it upgraded ten skills, added missing wrappers, and
grounded its guidance in official docs and upstream repositories for:

- ADR patterns and MADR discipline
- OpenAPI, AsyncAPI, JSON Schema, Redocly, Spectral, and Buf
- EF Core, Flyway, Liquibase, Atlas, Prisma, and online migration workflows
- git worktree and stacked-diff review practices
- modernization tooling such as Renovate, OpenRewrite, and upgrade assistants
- .NET, TypeScript, JavaScript, Lua, Neovim, OpenResty, and related tooling

The archive also reported pack-local validation success for:

- `node scripts/ci/validate-skill-depth.mjs`
- `node scripts/ci/validate-no-placeholders.mjs`

It explicitly called out that full repo-wide smoke results in the export
environment still depended on unrelated upstream issues outside the skills-only
bundle. Harness Forge therefore keeps release truth in its own validators.

## Acceptance rules for future imports

- Record every imported skill, wrapper, reference pack, and provenance item in
  the inventory before release.
- Merge overlapping responsibilities into the existing canonical skill instead
  of creating duplicates.
- Promote a new skill only when it owns a distinct runtime responsibility that
  should remain discoverable on its own.
- Keep provenance human-readable and maintainer-facing, never mixed into
  runtime `SKILL.md` entrypoints.
- Treat wrapper alignment, package-surface updates, and validation updates as
  required follow-up work, not optional cleanup.

## MADR skill promotion

`madr-decision-log` stays distinct from `architecture-decision-records`. The existing ADR skill owns decision framing and durable rationale quality. The promoted MADR skill owns file-oriented repository operations such as `docs/decisions/` layout, ADR scaffolding, ADR-LOG generation, validation, numbering, and supersession maintenance.
