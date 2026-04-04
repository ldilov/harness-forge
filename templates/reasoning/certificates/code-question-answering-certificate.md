---
id: code-question-answering-certificate
kind: task-template
title: Code Question Answering Certificate
summary: Semi-formal certificate for answering repository questions with verified implementation evidence.
category: reasoning
status: stable
version: 1
source_alignment: appendix-d
supported_targets:
  - codex
  - claude-code
supported_languages:
  - any
owner: core
generated: false
---

# Code Question Answering Certificate

Use this when a question asks what the code *actually* does, whether two API paths differ, whether a check is needed, or whether a semantic property holds.

## Required rule

The answer must be backed by:

- function trace table
- data flow analysis
- semantic properties with evidence
- alternative hypothesis check

## Certificate

### 1. Question and scope

- question:
- repository:
- files initially in scope:
- symbols in scope:
- what would count as a decisive answer?:

### 2. Function trace table

Use `templates/ledgers/function-trace-table.md`.

Paste the completed table here or link it.

### 3. Data flow analysis

Use `templates/ledgers/data-flow-and-semantic-properties.md`.

Paste the completed ledger here or link it.

### 4. Semantic properties

List repository or framework facts that the answer depends on.

- Property 1:
  - evidence:
  - impact:
- Property 2:
  - evidence:
  - impact:
- Property 3:
  - evidence:
  - impact:

### 5. Direct answer construction

- A1:
  - sub-question:
  - answer:
  - evidence:
  - uncertainty:
- A2:
  - sub-question:
  - answer:
  - evidence:
  - uncertainty:

### 6. Alternative hypothesis check

If the opposite answer were true, what evidence should exist?

- searched for:
- found:
- conclusion:
  - refuted | supported | unresolved

### 7. Edge case check

Only include edge cases the code path or question materially depends on.

- edge case:
- why it matters:
- evidence:
- impact on final answer:

### 8. Final answer

Wrap the final answer in the same spirit as the paper: explicit, evidence-backed, and bounded.

<answer>
[Final answer with explicit evidence, narrow wording, and any remaining assumptions.]
</answer>

### 9. Quality notes

- confidence:
- evidence completeness:
- unresolved blind spots:
- did downstream code paths get checked?:
- did naming intuition have to be overridden by source evidence?:

## Review checklist

- Did the reasoning inspect actual implementations?
- Did the data-flow section identify creation and mutation sites?
- Were semantic properties evidenced rather than assumed?
- Was the opposite answer checked?
- Would another engineer reading only this certificate trust the answer more than a plain explanation?

## Purpose

Provide a structured, evidence-backed certificate for answering repository questions with verified implementation evidence.

## When to Use

Use when a question asks what the code actually does, whether two API paths differ, whether a check is needed, or whether a semantic property holds.

## Inputs

- Question to answer
- Repository and files in scope
- Symbols in scope

## Optional Inputs

- Known passing or failing tests
- Related exploration logs

## Constraints

- The answer must be backed by function trace table, data flow analysis, semantic properties with evidence, and alternative hypothesis check
- Naming intuition must be overridden by source evidence

## Expected Outputs

- Completed code question answering certificate
- Final answer with explicit evidence, narrow wording, and remaining assumptions

## Acceptance Criteria

- Reasoning inspected actual implementations
- Data-flow section identified creation and mutation sites
- Semantic properties are evidenced rather than assumed
- Opposite answer was checked

## Quality Gates

- Evidence completeness is stated
- Unresolved blind spots are documented
- Downstream code paths are checked

## Suggested Workflow

1. Define the question and scope
2. Build function trace table
3. Perform data flow analysis
4. Document semantic properties
5. Construct direct answers with evidence
6. Check alternative hypothesis
7. Review edge cases
8. Write final answer

## Related Commands

_No specific CLI commands required._

## Related Agents

- Code reviewer agent

## Examples

_Refer to the certificate template sections above for field-level examples._
