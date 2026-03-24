# Implementation Plan: Harness Forge Agentic AI Platform

**Branch**: `001-agentic-kb-optimizer` | **Date**: 2026-03-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-agentic-kb-optimizer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build Harness Forge as a TypeScript-based CLI and packaged asset platform that
installs target-compatible guidance for Codex and Claude Code, manages modular
language and capability packs, and introduces first-class task and workflow
templates backed by shell and PowerShell validators. The implementation centers
on a manifest-driven catalog, target adapters, install planning plus state
tracking, assistant-discoverable usage guidance, and a verification suite that
proves packaging completeness, cross-platform bootstrap behavior, template
integrity, and safe upgrade or repair flows.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 LTS; POSIX shell and PowerShell 7+ for bootstrap and validation scripts  
**Primary Dependencies**: Commander-style CLI parser, Zod, YAML front matter parser, AJV JSON Schema validation, fast-glob, execa, tar/fs utilities, Vitest, Pester  
**Storage**: Filesystem manifests, packaged Markdown and JSON assets, repo-local install state in `.hforge/state/*.json`, backup snapshots on disk  
**Testing**: Vitest unit and integration tests, CLI smoke tests, tarball install smoke tests, shell self-tests, Pester validation for PowerShell paths  
**Target Platform**: Windows, macOS, and Linux developer workspaces; Codex and Claude Code day-one targets with extensible adapters for future targets  
**Project Type**: Single-package Node CLI plus packaged asset catalog, bootstrap scripts, and validation utilities  
**Performance Goals**: Common dry-run plan in under 2 seconds, baseline install and summary in under 10 seconds, full catalog validation in under 30 seconds on a typical developer machine  
**Constraints**: Offline-capable install from local tarball, non-destructive defaults, target-neutral repository guidance, manifest-path completeness enforcement, user-managed file preservation by default  
**Scale/Scope**: 14+ language packs, 4 target adapters, 20+ starter task or workflow templates, migration support from the supplied reference package

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: The spec defines user value, acceptance scenarios, measurable success
  criteria, edge cases, and architecture or quality constraints.
- PASS: The implementation uses an idiomatic TypeScript CLI core while keeping
  shell and PowerShell as first-class script surfaces rather than forcing one
  runtime model onto every concern.
- PASS: Verification is defined up front through manifest validation, CLI smoke
  tests, tarball install tests, target compatibility checks, and template
  validators.
- PASS: The design separates catalog content, planning and apply logic, target
  adapters, migration, template systems, and validation tooling into explicit
  modules with stable contracts.
- PASS: Observability, documentation, and agent-context updates are part of the
  planned deliverables, including Codex and Claude Code guidance.
- PASS: Added complexity is justified only where it preserves modular packs,
  cross-target compatibility, or safe install and repair behavior.

**Post-Design Re-check**: PASS. `research.md`, `data-model.md`, `contracts/`,
`quickstart.md`, and the agent-context update all preserve the constitution's
requirements for spec-led delivery, language-native engineering, test-first
verification, modular boundaries, and agent-neutral operations.

## Project Structure

### Documentation (this feature)

```text
specs/001-agentic-kb-optimizer/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── cli/
├── application/
│   ├── planning/
│   ├── install/
│   ├── validation/
│   ├── migration/
│   └── recommendations/
├── domain/
│   ├── manifests/
│   ├── targets/
│   ├── templates/
│   ├── state/
│   └── operations/
├── infrastructure/
│   ├── filesystem/
│   ├── packaging/
│   ├── bootstrap/
│   └── diagnostics/
└── shared/

agents/
commands/
contexts/
docs/
examples/
hooks/
manifests/
├── bundles/
├── profiles/
├── targets/
└── migrations/

mcp/
profiles/
rules/
schemas/
├── manifests/
└── templates/

skills/
targets/
├── codex/
├── claude-code/
├── cursor/
└── opencode/

templates/
├── tasks/
└── workflows/

scripts/
├── bootstrap/
├── ci/
├── templates/
│   ├── shell/
│   └── powershell/
├── cli/
└── scaffolds/

tests/
├── smoke/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: Choose a single TypeScript CLI package with a layered
runtime in `src/` and installable product assets kept in top-level catalog
directories (`agents/`, `commands/`, `rules/`, `skills/`, `templates/`,
`targets/`, `manifests/`). This keeps the application engine modular while also
preserving one-to-one traceability between manifest entries and packaged files,
which is essential for install planning, tarball completeness validation,
migration, and assistant-target compatibility.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The current design does not require constitution exceptions. |
