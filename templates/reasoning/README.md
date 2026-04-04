---
id: reasoning-readme
kind: task-template
title: Reasoning Template Bridges
summary: Bridge layer overview for semiformal reasoning artifacts linking discovery to canonical templates.
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

# Reasoning Template Bridges

This directory is the visible bridge layer for semiformal reasoning artifacts.

## Bridge policy

- Discover here
- Execute from canonical templates in `.hforge/templates/reasoning/`
- Keep bridge files synchronized with canonical surfaces

## Available bridges

- `contracts/`
- `logs/`
- `ledgers/`
- `certificates/`
- `workflows/`

## Escalation rule

If more than one plausible explanation remains, escalate to a heavier certificate.

## Purpose

Provide the visible bridge layer for semiformal reasoning artifacts, linking discovery to canonical templates.

## When to Use

Use as the entry point for discovering available reasoning templates and understanding bridge policy.

## Inputs

- Task or question requiring semiformal reasoning

## Optional Inputs

_None._

## Constraints

- Bridge files must be synchronized with canonical surfaces in `.hforge/templates/reasoning/`
- Execute from canonical templates, discover from bridges

## Expected Outputs

- Navigation to the appropriate reasoning artifact template

## Acceptance Criteria

- User can locate the correct template for their reasoning task

## Quality Gates

- All bridge subdirectories are listed and accessible

## Suggested Workflow

1. Review available bridges (contracts, logs, ledgers, certificates, workflows)
2. Select the appropriate template for the task
3. Execute from the canonical template location

## Related Commands

_No specific CLI commands required._

## Related Agents

- Code reviewer agent

## Examples

_Refer to the available bridges list above._
