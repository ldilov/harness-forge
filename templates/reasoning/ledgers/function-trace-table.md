---
id: function-trace-table
kind: task-template
title: Function Trace Table
summary: Verified function and method behavior ledger for code-grounded answers.
category: reasoning
status: stable
version: 1
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
