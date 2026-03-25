# Contract: Observability and Eval Output

## Purpose

Define the local-first event, summary, and report contract for measuring
recommendation quality, drift, and benchmark health.

## Required Event Fields

- `eventId`
- `eventType`
- `recordedAt`
- `workspaceId`
- `target`
- `result`

## Optional Event Fields

- `featureId`
- `durationMs`
- `confidence`
- `inputs`
- `outputs`
- `artifacts[]`
- `evidence[]`
- `tags[]`

## Required Summary Outputs

- recommendation acceptance metrics
- benchmark pass rates by target or fixture
- flow recovery metrics
- hook failure metrics
- instruction-synthesis acceptance metrics
- drift findings

## Behavioral Rules

- raw events must remain append-safe and locally inspectable
- summaries must be reproducible from raw events
- reports must remain useful without external dashboards
- sensitive workspaces must be able to inspect or remove local observability
  artifacts directly

## Validation Rules

- event types must belong to the approved taxonomy
- summary metrics must be derivable from existing raw events
- benchmark fixtures must be able to assert expected event families or summary
  deltas
