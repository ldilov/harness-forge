# Quickstart: Validate Platform Depth, Intelligence, and Runtime Maturity

## Purpose

This quickstart verifies that the enhancement wave produces deeper content,
evidence-backed recommendations, recoverable flow orchestration, and lifecycle
diagnostics instead of only structural scaffolding.

## Prerequisites

- Repository checkout available locally
- Node.js and npm available
- PowerShell available for validator and runtime script execution

## 1. Confirm deep language and framework surfaces exist

Inspect the promoted operational surfaces:

- `docs/catalog/languages/`
- `skills/`
- `.agents/skills/`
- `rules/common/`
- `rules/<language>/`
- `templates/workflows/implement-*-change.md`
- `docs/catalog/framework-packs.md`

Expected result:

- first-class languages expose substantive guidance, not placeholder-grade docs
- language skills define activation, loading order, outputs, validation, and
  escalation
- framework packs are discoverable as first-class surfaces

## 2. Run repo intelligence against benchmark fixtures

Example commands:

```bash
node scripts/intelligence/scan-repo.mjs tests/fixtures/benchmarks/typescript-web-app --json
node scripts/intelligence/detect-frameworks.mjs tests/fixtures/benchmarks/typescript-web-app --json
node scripts/intelligence/score-recommendations.mjs tests/fixtures/benchmarks/typescript-web-app --json
node dist/cli/index.js recommend tests/fixtures/benchmarks/typescript-web-app --json
```

Expected result:

- the system identifies language, framework, build, and test signals
- recommendation output includes confidence and evidence
- framework-aware repos are not treated as generic language-only repos

## 3. Validate workload-skill depth

Inspect or invoke upgraded and new skills:

- `skills/repo-onboarding/`
- `skills/security-scan/`
- `skills/release-readiness/`
- `skills/incident-triage/`
- `skills/performance-profiling/`
- `skills/repo-modernization/`

Expected result:

- each skill exposes trigger conditions, repo inspection order, output
  contract, and failure handling
- supporting references exist for non-trivial skills

## 4. Confirm Speckit flow recovery works

Example commands:

```bash
node scripts/runtime/flow-status.mjs --json
node dist/cli/index.js flow status --json
```

Expected result:

- the current feature, stage, latest artifact, blockers, and next action are
  visible
- artifact lineage can be traced from spec to plan to tasks and beyond

## 5. Validate runtime governance and maintenance

Example commands:

```bash
node dist/cli/index.js doctor --json
node dist/cli/index.js audit --json
node dist/cli/index.js diff-install --json
node dist/cli/index.js prune --json
```

Expected result:

- stale or missing runtime surfaces are diagnosed clearly
- compatibility and support limitations are visible
- recommended repairs and prune candidates are actionable

## 6. Run release and governance checks

Example commands:

```bash
npm run build
npm run validate:release
node scripts/ci/generate-compatibility-matrix.mjs
node scripts/ci/validate-skill-depth.mjs
node scripts/ci/validate-no-placeholders.mjs
node scripts/ci/validate-framework-coverage.mjs
```

Expected result:

- release validation passes
- compatibility output is generated
- shallow or placeholder-grade content is rejected

## 7. Inspect local-first effectiveness signals

Example commands:

```bash
node scripts/runtime/report-effectiveness.mjs --json
```

Expected result:

- local signals show bundle use, skill use, hook runs, validation failures, and
  recommendation acceptance trends when observability is enabled
- no external service is required to inspect value and failure patterns

## Ready State

This feature is ready when:

- language and framework packs are operationally deep
- recommendations are evidence-backed
- workload skills produce deterministic artifacts
- flow status is recoverable
- lifecycle and compatibility diagnostics are actionable
- release gates block shallow or misleading surfaces
