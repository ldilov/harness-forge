---
name: observability-setup
description: Define local-first logging, metrics, and diagnostic signals for a runtime surface.
---

# Observability Setup

## Trigger Signals

- the task needs better local diagnostics or effectiveness tracking

## Inspect First

- runtime entrypoints, existing logs, metrics, and failure reporting surfaces

## Workflow

1. identify the signals worth recording
2. choose low-risk local-first storage
3. define summary and reporting needs
4. recommend the smallest useful setup

## Output Contract

- signal inventory
- storage approach
- reporting approach

## Failure Modes

- the task lacks a clear runtime boundary to instrument

## Escalation

- escalate when observability requirements imply privacy or performance tradeoffs
