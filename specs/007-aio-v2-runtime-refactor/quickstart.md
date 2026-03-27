# Quickstart: Validate Harness Forge AIO v2 Runtime Refactor

## Purpose

Verify that the v2 refactor turns Harness Forge into a hidden `.hforge/` AI
layer with thin visible bridges, local-first lifecycle behavior, hidden task
packs and working memory, and export-driven sharing.

## Prerequisites

- A current checkout of `D:/Workspace/repos/harness-forge`
- The v2 containment refactor implemented in install flows, target adapters,
  manifests, docs, hidden runtime surfaces, and validation paths
- Node.js and npm installed for the repo’s validation commands
- Any target-facing runtime surfaces required by the chosen implementation

## Validation Steps

### 1. Review root cleanliness

- Inspect the root directory of a representative installed product repo.
- Confirm the repo root does not expose bulky canonical `skills/`, `rules/`,
  or `knowledge-bases/` directories as part of the normal product-code view.
- Verify that any visible Harness Forge files are thin discovery bridges or
  target-native entrypoints only.

### 2. Review the hidden AI layer

- Inspect `.hforge/` and confirm it acts as the authoritative AI layer.
- Verify that hidden canonical content is separated into durable library,
  runtime, task, cache, export, state, and generated surfaces.
- Confirm the hidden layer explains which artifacts are canonical, derived, or
  cache-like.

### 3. Review bridge behavior and support honesty

- Inspect `AGENTS.md`, target-native files, and any wrapper discovery surfaces.
- Verify that bridges route into `.hforge/` instead of pointing to visible root
  canonical content.
- Confirm that partial, translated, or documentation-only target behavior is
  labeled explicitly.

### 4. Review hidden repo intelligence and freshness behavior

- Inspect representative hidden runtime artifacts such as repo map, support
  summary, scan summary, and risk findings.
- Verify that generated knowledge includes evidence, confidence, freshness, and
  review state.
- Confirm that refresh behavior can distinguish what remains current from what
  must be marked stale.

### 5. Review hidden task-pack and working-memory behavior

- Create or inspect a representative hidden task pack.
- Verify it includes requested outcome, requirements, impacted modules, risks,
  acceptance criteria, and test implications.
- Inspect hidden working-memory artifacts and confirm they stay concise while
  exposing objective, plan, facts, open questions, failures, and next step.

### 6. Review local-first lifecycle behavior

- Inspect version-control expectations for the hidden AI layer.
- Confirm `.hforge/` is treated as local operational content by default unless
  the operator intentionally shares selected surfaces.
- Verify that bridges and exports can be shared without redefining the full
  hidden runtime as product code.

### 7. Review export and handoff behavior

- Generate or inspect a representative export bundle.
- Verify that it contains the essential task, risk, and outcome context needed
  for review or handoff.
- Confirm that the export remains traceable back to the hidden authoritative
  layer and is not mistaken for the canonical runtime itself.

### 8. Run validation

Run the repo guardrails selected by implementation:

```powershell
npm run validate:catalog
npm run validate:runtime-consistency
npm run validate:doc-command-alignment
npx vitest run
npm run validate:release
```

## Ready State

The feature is ready when:

- `.hforge/` is clearly the authoritative hidden AI layer.
- Visible root and target-native surfaces act only as thin bridges.
- Canonical AI-only content is no longer mistaken for product source.
- Task packs and working-memory artifacts behave as hidden, useful, distinct
  surfaces.
- The default lifecycle is local-first, while exports and bridges remain usable
  for intentional collaboration.
- Validation protects the hidden-layer boundary from silent drift.
