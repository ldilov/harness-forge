# Implementation Plan: Harness Forge Platform Depth, Intelligence, and Runtime Maturity

**Branch**: `003-platform-enhancements` | **Date**: 2026-03-25 | **Spec**: [spec.md](D:/Workspace/repos/harness-forge/specs/003-platform-enhancements/spec.md)
**Input**: Feature specification from `D:\Workspace\repos\harness-forge\specs\003-platform-enhancements\spec.md`

## Summary

Turn Harness Forge from a well-structured but uneven platform into a deeper,
evidence-driven operating system for agentic engineering. This plan focuses on
five integrated deliverables:

1. deeper language and framework packs that are operationally useful under
   pressure,
2. repo intelligence that explains recommendations with evidence rather than
   guessing from extensions,
3. workload-specialized skills and stateful Speckit orchestration,
4. lifecycle governance through typed hooks, real operating profiles,
   maintenance commands, and compatibility reporting,
5. local-first effectiveness signals and benchmark fixtures that let the
   platform improve from real usage.

The architecture stays within the current TypeScript/Node CLI and manifest-based
package model. The major design choice is to preserve the existing repository
surfaces (`skills/`, `.agents/skills/`, `rules/`, `templates/`, `manifests/`,
`docs/`, `scripts/`) while adding stronger contracts and runtime orchestration
around them instead of replacing them with a new subsystem.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 LTS; Markdown with YAML front matter; JSON manifests and schemas; POSIX shell and PowerShell for automation and validation  
**Primary Dependencies**: Existing CLI/runtime stack in `package.json` (`commander`, `fast-glob`, `yaml`, `zod`, `ajv`) plus built-in filesystem/process tooling and Vitest  
**Storage**: Repository files, local install state, machine-readable manifests, local-first effectiveness records; no external service required  
**Testing**: Vitest contract/integration tests, release-smoke scripts, direct CLI execution, validator scripts, benchmark fixture scenarios  
**Target Platform**: Cross-platform package and repo runtime supporting Codex and Claude Code first, with explicit parity reporting for Cursor and OpenCode  
**Project Type**: CLI + packaged content platform + runtime governance system  
**Performance Goals**: Repo scanning and recommendation should feel local and interactive; lifecycle diagnostics and release gates must remain deterministic enough for CI use  
**Constraints**: Must keep current package architecture coherent; must stay local-first by default; must not overclaim target parity; must keep authored content and generated/runtime state clearly separated  
**Scale/Scope**: Deep structured packs, framework packs, workload skills, intelligence scripts, flow state, compatibility matrix, hook manifests, maintenance commands, benchmark fixtures, observability, and release gates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Specs exist for user value, acceptance scenarios, measurable success criteria,
  and architecture or quality constraints.
- The chosen structure is idiomatic for the target language and framework.
- Tests, contract checks, or equivalent executable verification are defined
  before implementation work starts.
- Module boundaries, contracts, and dependency direction are explicit and keep
  domain logic isolated from transport and infrastructure concerns.
- Observability, documentation, and agent-context impacts are identified for any
  changed behavior, commands, or architecture.
- Any added complexity or abstraction is justified in the Complexity Tracking
  section.

**Gate Result**: PASS

## Project Structure

### Planning Artifacts (this feature)

```text
specs/003-platform-enhancements/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── compatibility-matrix-contract.md
│   ├── flow-state-contract.md
│   ├── hook-manifest-contract.md
│   └── repo-intelligence-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
README.md
AGENTS.md
package.json

docs/
├── agents.md
├── catalog/
│   ├── framework-packs.md
│   ├── language-packs.md
│   ├── frameworks/
│   └── languages/
├── authoring/
│   └── skills.md
├── flow-orchestration.md
├── maintenance-lifecycle.md
├── observability.md
├── profile-guide.md
├── quality-gates.md
└── target-support-matrix.md

manifests/
├── bundles/
├── catalog/
│   ├── compatibility-matrix.json
│   ├── flow-artifacts.json
│   ├── framework-assets.json
│   ├── index.json
│   └── language-assets.json
├── hooks/
│   └── index.json
└── profiles/

schemas/
├── hooks/
│   └── hook.schema.json
└── runtime/
    └── flow-state.schema.json

scripts/
├── ci/
├── intelligence/
├── knowledge/
├── maintenance/
└── runtime/

src/
├── application/
│   ├── flow/
│   ├── recommendations/
│   └── maintenance/
├── cli/
│   └── commands/
├── domain/
│   ├── hooks/
│   ├── intelligence/
│   ├── maintenance/
│   └── profiles/
└── infrastructure/
    ├── diagnostics/
    └── observability/

skills/
.agents/skills/
rules/
templates/workflows/
tests/
└── fixtures/benchmarks/
```

**Structure Decision**: Keep the single-project TypeScript CLI/runtime layout,
but treat the platform as five cooperating slices:

- **Content depth slice**: language packs, framework packs, rules, workflows,
  and skills
- **Intelligence slice**: repo scanning, framework detection, evidence-backed
  recommendations
- **Flow slice**: stateful Speckit orchestration and artifact lineage
- **Governance slice**: profiles, hooks, compatibility, lifecycle commands, and
  release gates
- **Evidence slice**: local observability and benchmark fixtures

This avoids a rewrite while making dependency boundaries explicit.

## Architecture Overview

### 1. Content Depth Model

- Structured language packs become governed content bundles with required docs,
  examples, skills, and at least one language-specific workflow.
- Framework packs extend language packs rather than replacing them.
- Canonical published skills live under `skills/`; auto-discoverable wrappers
  remain under `.agents/skills/`.
- Root `rules/common/` stays the shared baseline, with language and framework
  rules layered on top.

### 2. Repo Intelligence Pipeline

- `scripts/intelligence/scan-repo.mjs` gathers raw repo signals.
- `scripts/intelligence/detect-frameworks.mjs` converts raw signals into
  framework and workload evidence.
- `scripts/intelligence/score-recommendations.mjs` ranks bundles, profiles,
  skills, and validations with confidence and explanation output.
- Application-layer recommendation services expose the same intelligence through
  the CLI and runtime diagnostics.

### 3. Flow Orchestration Model

- Flow state is stored in a small local runtime document under `.specify/state/`
  and validated by a formal schema.
- Each generated artifact can be linked back to a feature flow and stage.
- `flow status` reports current stage, last artifact, blockers, and next action
  without requiring manual reconstruction.

### 4. Governance Runtime

- Hooks become manifest-driven runtime policies with explicit support per
  target, lifecycle stage, failure semantics, and observability fields.
- Profiles become real operating modes that alter bundles, skill emphasis,
  validation strictness, and review depth.
- Compatibility becomes a generated, machine-readable matrix instead of a loose
  documentation promise.

### 5. Evidence and Maintenance

- Local-first observability records bundle use, skill use, hook execution,
  validation failures, and recommendation acceptance without external transport.
- Maintenance commands reuse the same inventories and install-state concepts as
  the current runtime to provide inspection, drift review, repair, and pruning.
- Benchmark fixtures provide regression evidence for recommendation quality and
  operational-skill behavior.

## Phase 0: Research Focus

- Decide the content depth bar for first-class structured packs and framework
  packs.
- Decide the evidence model for repo scanning and recommendation confidence.
- Decide the minimum authoring contract for operational and workload skills.
- Decide the local storage and lifecycle of flow state and effectiveness
  signals.
- Decide the compatibility and parity model for Codex, Claude Code, Cursor, and
  OpenCode.
- Decide which release gates should block on content shallowness versus pure
  structural inconsistency.

## Phase 1: Design Focus

- Define entities for packs, skills, repo intelligence, flow state, hook
  manifests, compatibility entries, maintenance state, and effectiveness
  signals.
- Define contracts for repo intelligence output, flow state, hook manifests,
  and compatibility matrix output.
- Define a quickstart that validates deep content, recommendations, flow
  recovery, and lifecycle diagnostics on realistic fixtures rather than only
  path existence.

## Post-Design Constitution Check

**Expected Result**: PASS. The design strengthens behavior through explicit
contracts, observable validation, and reversible runtime slices instead of
adding implicit magic or target-specific sprawl.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Multiple new runtime slices | The feature spans content, intelligence, orchestration, governance, and evidence | A single monolithic subsystem would blur boundaries and make validation harder |
| Local-first observability storage | Needed to prove effectiveness and diagnose failures | No observability would leave optimization driven by intuition only |
| Compatibility matrix generation | Needed to keep support claims honest as surfaces grow | Purely narrative docs would drift and become unreliable |
