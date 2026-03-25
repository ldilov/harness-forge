# Observability

Observability in Harness Forge is local-first and diagnostic. It is meant to
help operators understand whether recommendations, maintenance commands, and
flow recovery are actually working without sending data to an external service.

## Signals worth tracking

- bundle use
- skill use
- hook runs
- validation failures
- recommendation acceptance
- target mix
- flow recovery checks
- maintenance command usage

## Runtime surfaces

- `.hforge/observability/effectiveness-signals.json`
- `node scripts/runtime/report-effectiveness.mjs --json`
- `node dist/cli/index.js recommend <repo> --json`
- `node dist/cli/index.js flow status --json`

## Design constraints

- no external service is required
- payloads must stay actionable without backend aggregation
- privacy-sensitive workspaces should be able to inspect or remove local signal
  files directly

## What a healthy signal stream looks like

- recommendation runs record accepted or rejected outcomes
- `doctor` and `audit` runs leave a visible trace
- flow recovery records the active feature and stage
- signal summaries can be inspected locally before release or handoff
