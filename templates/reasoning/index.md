---
id: reasoning-index
kind: task-template
title: Semiformal Reasoning Bridges Index
summary: Index for locating the smallest reasoning artifact that preserves evidence discipline.
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

# Semiformal Reasoning Bridges

Use this index to locate the smallest artifact that still preserves evidence discipline.

## Start Points

- Universal reasoning contract: `contracts/semiformal-core-contract.md`
- Investigation working record: `logs/semiformal-exploration-log.md`
- Behavior tracing ledgers: `ledgers/`
- Task-specific certificates: `certificates/`
- Merge and investigation workflows: `workflows/`
- Governance interfaces: `contracts/reasoning-artifact-interface.md`, `contracts/pre-merge-decision-interface.md`

## Routing by Task

- Patch comparison -> `certificates/patch-equivalence-certificate.md`
- Fault localization -> `certificates/fault-localization-certificate.md`
- Code semantics answer -> `certificates/code-question-answering-certificate.md`
- Change safety review -> `certificates/change-safety-certificate.md`

Canonical source: `.hforge/templates/reasoning/`

## Purpose

Serve as the index for locating the smallest reasoning artifact that preserves evidence discipline.

## When to Use

Use when starting a semiformal reasoning task to find the appropriate template by task type.

## Inputs

- Task type or question category

## Optional Inputs

_None._

## Constraints

- Route to the smallest artifact that still preserves evidence discipline

## Expected Outputs

- Navigation to the correct template for the task

## Acceptance Criteria

- User can route from task type to the correct template

## Quality Gates

- All template paths are valid and accessible

## Suggested Workflow

1. Identify the task type (patch comparison, fault localization, code semantics, change safety, general investigation)
2. Follow the routing table to the appropriate template
3. Begin work using the selected template

## Related Commands

_No specific CLI commands required._

## Related Agents

- Code reviewer agent

## Examples

_Refer to the routing table above for task-to-template mapping._
