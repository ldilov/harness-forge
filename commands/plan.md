---
id: command-plan
kind: command
title: Plan Command
summary: Use when a task needs structure, sequencing, risks, and validation checkpoints.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
languages:
  - all
generated: false
---
# Plan Command

## Syntax

Invoke the planning step through the active harness workflow or local command
surface before implementation begins.

## Arguments and options

- choose the active feature or planning target
- include enough context for sequencing, risks, and validation

## Output contract

- clear implementation sequence
- identified dependencies and risks
- explicit validation checkpoints

## Side effects

- may produce or update planning artifacts
- may update shared agent context when the workflow calls for it

## Failure behavior

- stop before code changes when required context is missing
- escalate when the spec and task surface disagree
