---
id: data-flow-and-semantic-properties
kind: task-template
title: Data Flow and Semantic Properties Ledger
summary: Track where key values come from, where they change, and what semantic facts the answer depends on.
category: reasoning
status: stable
version: 1
---

# Data Flow and Semantic Properties Ledger

## Data flow analysis

Copy per key variable, field, flag, map, or state container.

### Variable / State Item: `[name]`

- created at:
- initialized with:
- modified at:
- never modified?:
- read at:
- affects:
- edge conditions:
- evidence locations:

## Semantic properties

These are repository-specific or language/framework-specific facts the answer depends on.

### Property S1

- property:
- evidence:
- impact on reasoning:
- certainty:
  - verified in source
  - inferred from source
  - external semantics only

### Property S2

- property:
- evidence:
- impact on reasoning:
- certainty:

## Alternative semantic check

If the opposite semantic assumption were true:

- what would exist in the source?
- what did we inspect?
- what did we find?
- result: refuted | supported | unresolved

## Completion check

This ledger is incomplete if:

- state mutation is asserted without listing write sites
- a semantic fact has no evidence
- lifecycle or configuration state is ignored
- the alternative semantic assumption was never checked
