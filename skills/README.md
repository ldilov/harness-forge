# Skills

Harness Forge ships four major skill families.

## Discovery model

- `.agents/skills/` wrappers are the lightweight discovery layer for supported agent runtimes
- `skills/` directories are the canonical execution layer
- `references/` directories hold deeper runtime-facing guidance
- `docs/authoring/enhanced-skill-import.md` preserves maintainer-facing provenance for imported upgrades

## Seeded language skills

- `skills/typescript-engineering/`
- `skills/lua-engineering/`
- `skills/powershell-engineering/`

## Structured language skills

- `skills/python-engineering/`
- `skills/php-engineering/`
- `skills/perl-engineering/`
- `skills/shell-engineering/`

Several of these language skills now also ship supplemental `references/`
packs so agents can pull repo-exploration, debugging, output-template, and
ecosystem heuristics without leaving the project package.

The March 2026 enhanced-skills import also deepened the TypeScript, Lua,
and JavaScript packs with additional runtime-boundary, packaging, onboarding,
and modernization guidance sourced into project-owned `references/` directories.

## Workflow orchestration skills

- `skills/speckit-analyze/`
- `skills/speckit-checklist/`
- `skills/speckit-clarify/`
- `skills/speckit-constitution/`
- `skills/speckit-implement/`
- `skills/speckit-plan/`
- `skills/speckit-specify/`
- `skills/speckit-tasks/`
- `skills/speckit-taskstoissues/`

## Operational helper skills

- `skills/engineering-assistant/`
- `skills/repo-onboarding/`
- `skills/documentation-lookup/`
- `skills/security-scan/`
- `skills/release-readiness/`
- `skills/architecture-decision-records/`
- `skills/token-budget-optimizer/`
- `skills/madr-decision-log/`

## Workload-specialized skills

`madr-decision-log` complements `architecture-decision-records`: the ADR skill focuses on decision quality and durable rationale, while the MADR skill owns file-oriented repository workflows such as `docs/decisions/`, ADR indexing, validation, and supersession maintenance.

- `skills/incident-triage/`
- `skills/dependency-upgrade-safety/`
- `skills/impact-analysis/`
- `skills/performance-profiling/`
- `skills/test-strategy-and-coverage/`
- `skills/api-contract-review/`
- `skills/db-migration-review/`
- `skills/pr-triage-and-summary/`
- `skills/observability-setup/`
- `skills/parallel-worktree-supervisor/`
- `skills/repo-modernization/`
- `skills/cloud-architect/`

`impact-analysis` complements those workload-specific skills by giving them a
shared way to reason about blast radius, risk, confidence, validation, and
rollback planning.

## Supplemental engineering reference skills

- `skills/javascript-engineering/`

## Depth expectations

Operational and workload skills should expose:

- trigger signals
- the repo surfaces to inspect first
- a stable output contract
- clear failure modes
- escalation behavior

Imported upgrades should also keep an auditable inventory record and preserve
maintainer-facing provenance instead of shipping duplicate skill identities.

Single-skill ports such as `engineering-assistant` should preserve the same
discipline through `manifests/catalog/engineering-assistant-import-inventory.json`
and `docs/authoring/engineering-assistant-port.md`.

Context-compaction ports such as `token-budget-optimizer` should preserve the
same discipline through
`manifests/catalog/token-budget-optimizer-import-inventory.json` and
`docs/authoring/token-budget-optimizer-port.md`.
