---
id: semiformal-core-contract
kind: task-template
title: Semi-formal Core Contract
summary: Universal contract for evidence-backed agentic reasoning across engineering tasks.
category: reasoning
status: stable
version: 1
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - any
supported_targets:
  - codex
  - claude-code
  - cursor
  - opencode
supported_languages:
  - any
owner: core
generated: false
---

# Semi-formal Core Contract

## Purpose

Provide the minimum universal structure required for an agent or engineer to make a meaningful claim about repository behavior without drifting into unsupported intuition.

## When to Use

Use this contract whenever you are about to:

- explain how a code path behaves
- claim a change is safe
- compare two implementations
- answer a repo question that depends on semantics
- localize a bug
- justify a review recommendation

## Non-negotiable constraints

- every conclusion must be reconstructable from the document
- every material claim must cite evidence
- every evidence item must identify where it came from
- unresolved assumptions must remain visible
- the opposite answer must be considered before finalizing
- "confidence" may not replace evidence

## Required outputs

1. premises
2. evidence ledger
3. claims derived from evidence
4. alternative hypothesis check
5. formal conclusion
6. unresolved assumptions / blind spots

## Working template

### 1. Task statement

- task:
- requested decision or answer:
- repository / module / subsystem in scope:
- out of scope:

### 2. Definitions

- D1:
- D2:
- D3:

Only define terms that matter to the final conclusion.

### 3. Premises

State only premises that are supported by the task, repository facts, or explicit assumptions.

- P1:
- P2:
- P3:
- P4:

For each premise, tag it as one of:

- `[repo-fact]`
- `[task-fact]`
- `[assumption]`
- `[external-semantics]`

### 4. Evidence ledger

For every evidence item, cite the source and say why it matters.

- E1:
  - source:
  - type: file | test | config | schema | doc | tool observation
  - location:
  - observation:
  - relevance:
- E2:
  - source:
  - type:
  - location:
  - observation:
  - relevance:

### 5. Claim construction

Each claim must point back to both premises and evidence.

- C1:
  - claim:
  - supports answer to:
  - derived from premises:
  - derived from evidence:
  - uncertainty remaining:
- C2:
  - claim:
  - supports answer to:
  - derived from premises:
  - derived from evidence:
  - uncertainty remaining:

### 6. Trace or dependency path

If behavior depends on execution, lifecycle, or wiring, trace it explicitly.

- entry point:
- path:
- significant branch points:
- hidden indirections:
- sinks / externally visible effects:

### 7. Alternative hypothesis check

If the opposite answer were true:

- what would we expect to find?
- what did we search for?
- what did we actually find?
- conclusion on alternative: refuted | partially supported | still plausible

### 8. Unresolved assumptions and blind spots

- A1:
- A2:
- A3:

Mark anything you could not inspect directly.

### 9. Formal conclusion

- conclusion statement:
- what is directly supported:
- what remains assumed:
- decision:
- confidence:
- evidence completeness: low | medium | high

## Review checklist

- Are the premises concrete?
- Are the evidence items specific?
- Do the claims actually derive from the evidence?
- Was the opposite answer checked?
- Could another engineer replay the reasoning from this artifact?

## Failure conditions

This contract is incomplete if:

- the conclusion introduces a new idea not established above
- evidence is generic or location-free
- the alternative hypothesis was skipped on a consequential question
- confidence is high but evidence completeness is low and unacknowledged

## Inputs

- Task or decision to be made
- Repository, module, or subsystem in scope
- Initial premises

## Optional Inputs

- Known test results
- Related exploration logs
- Prior certificates or ledgers

## Constraints

- Every conclusion must be reconstructable from the document
- Every material claim must cite evidence
- Every evidence item must identify where it came from
- Unresolved assumptions must remain visible
- The opposite answer must be considered before finalizing
- Confidence may not replace evidence

## Expected Outputs

- Premises, evidence ledger, claims, alternative hypothesis check, formal conclusion, and unresolved assumptions

## Acceptance Criteria

- Premises are concrete
- Evidence items are specific
- Claims derive from evidence
- Opposite answer was checked
- Another engineer could replay the reasoning from this artifact

## Quality Gates

- Evidence completeness is stated
- Alternative hypothesis is not skipped on consequential questions
- Conclusion does not introduce new ideas not established above

## Suggested Workflow

1. Define task statement and scope
2. Establish definitions
3. State premises with tags
4. Build evidence ledger
5. Construct claims from premises and evidence
6. Trace dependency paths if needed
7. Check alternative hypothesis
8. Document unresolved assumptions
9. Write formal conclusion

## Related Commands

_No specific CLI commands required._

## Related Agents

- Code reviewer agent

## Examples

_Refer to the working template sections above for field-level examples._
