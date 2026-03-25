---
name: api-contract-review
description: Review request, response, and compatibility contracts for API changes.
---

# API Contract Review

## Trigger Signals

- the task changes HTTP, RPC, or integration contracts

## Inspect First

- route definitions, schemas, handlers, and client-facing docs

## Workflow

1. identify changed request and response contracts
2. check compatibility and validation behavior
3. call out breaking or risky changes
4. summarize remediation or approval needs

## Output Contract

- changed contract summary
- compatibility risks
- required follow-up actions

## Failure Modes

- the actual runtime contract is undocumented

## Escalation

- escalate when a breaking API change lacks coordination or migration guidance
