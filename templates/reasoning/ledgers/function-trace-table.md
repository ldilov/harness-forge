---
id: function-trace-table
kind: task-template
title: Function Trace Table
summary: Verified function and method behavior ledger for code-grounded answers.
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

# Function Trace Table

Use this whenever the answer depends on actual implementation behavior, not naming.

## Instructions

- include only functions you actually inspected
- write verified behavior, not guessed behavior
- include line locations
- note hidden semantics, overloads, shadowing, dynamic dispatch, or registration indirection

## Template

| Function / Method | File:Line | Inputs / Parameter Types | Return Type | Verified Behavior | Why It Matters | Notes / Hidden Semantics |
|---|---|---|---|---|---|---|
| `[symbol]` | `[file:line]` | `[types or values]` | `[type]` | `[actual behavior]` | `[link to question or claim]` | `[shadowing / lifecycle / side effect / dispatch]` |
| `[symbol]` | `[file:line]` | `[types or values]` | `[type]` | `[actual behavior]` | `[link to question or claim]` | `[notes]` |

## Completion check

The table is incomplete if:

- a decisive function is missing
- behavior is described in vague terms
- a helper is listed but the downstream effect is not traced
- the table ignores name shadowing, wrapper calls, or lifecycle wiring

## Purpose

Provide a verified function and method behavior ledger for code-grounded answers.

## When to Use

Use whenever the answer depends on actual implementation behavior, not naming intuition.

## Inputs

- Functions or methods to trace
- Source files with line locations

## Optional Inputs

- Related data flow ledgers
- Known hidden semantics or indirection points

## Constraints

- Include only functions actually inspected
- Write verified behavior, not guessed behavior
- Include line locations
- Note hidden semantics, overloads, shadowing, dynamic dispatch, or registration indirection

## Expected Outputs

- Completed function trace table with verified behavior per function
- Completion check result

## Acceptance Criteria

- No decisive function is missing
- Behavior is described in specific terms
- Downstream effects are traced for all listed helpers
- Name shadowing, wrapper calls, and lifecycle wiring are accounted for

## Quality Gates

- All entries include file and line locations
- Verified behavior column contains specific observations, not vague descriptions

## Suggested Workflow

1. Identify decisive functions for the question or claim
2. Inspect each function in source
3. Record inputs, return types, and verified behavior
4. Note hidden semantics
5. Run completion check

## Related Commands

_No specific CLI commands required._

## Related Agents

- Code reviewer agent

## Examples

_Refer to the table template above for field-level examples._
