---
id: data-flow-and-semantic-properties
kind: task-template
title: Data Flow and Semantic Properties Ledger
summary: Track where key values come from, where they change, and what semantic facts the answer depends on.
category: reasoning
status: stable
version: 1
supported_targets:
  - codex
  - claude-code
supported_languages:
  - any
owner: core
generated: false
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

## Purpose

Track where key values come from, where they change, and what semantic facts the answer depends on.

## When to Use

Use when the answer depends on data flow through variables, fields, flags, maps, or state containers, and when semantic properties of the repository or framework matter.

## Inputs

- Key variables, fields, flags, or state containers to trace
- Repository or framework context

## Optional Inputs

- Related function trace tables
- Known configuration or lifecycle state

## Constraints

- State mutation must list write sites
- Every semantic fact must have evidence
- Lifecycle or configuration state must not be ignored
- Alternative semantic assumption must be checked

## Expected Outputs

- Completed data flow analysis per key variable
- Documented semantic properties with evidence
- Alternative semantic check result

## Acceptance Criteria

- All key variables are traced from creation through modification to read sites
- Semantic properties cite evidence, not assumptions
- Completion check passes

## Quality Gates

- No asserted mutations without listed write sites
- No semantic facts without evidence
- Alternative semantic check is present

## Suggested Workflow

1. Identify key variables and state items
2. Trace each from creation through modifications to reads
3. Document semantic properties with evidence
4. Perform alternative semantic check
5. Run completion check

## Related Commands

_No specific CLI commands required._

## Related Agents

- Code reviewer agent

## Examples

_Refer to the ledger template sections above for field-level examples._
