---
name: pr-triage-and-summary
description: Turn a change set into a concise implementation and risk summary.
---

# PR Triage And Summary

## Trigger Signals

- the task needs a concise reviewable summary of a large diff

## Inspect First

- changed files, tests, docs, and validation evidence

## Workflow

1. identify the main change areas
2. summarize risks and missing validation
3. compress the diff into reviewable outcomes
4. emit a short handoff summary

## Output Contract

- change summary
- validation summary
- open risks or questions

## Failure Modes

- the diff is too large to summarize safely without slicing it first

## Escalation

- escalate when the change mixes unrelated scopes or lacks validation evidence
