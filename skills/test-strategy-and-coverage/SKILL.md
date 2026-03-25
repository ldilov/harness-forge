---
name: test-strategy-and-coverage
description: Define right-sized test layers and coverage priorities for a change.
---

# Test Strategy And Coverage

## Trigger Signals

- the task adds or changes behavior and the right test depth is unclear

## Inspect First

- changed files, existing test layers, and validation commands

## Workflow

1. map the behavioral risk of the change
2. choose the minimum test layers that cover that risk
3. identify critical missing cases
4. summarize the coverage strategy

## Output Contract

- recommended test layers
- critical cases to cover
- explicit gaps or acceptable deferrals

## Failure Modes

- no executable validation surface exists

## Escalation

- escalate when a risky change has no trustworthy test path
