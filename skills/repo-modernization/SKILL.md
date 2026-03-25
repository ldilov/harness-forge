---
name: repo-modernization
description: Stage legacy cleanup and modernization without losing the current operating path.
---

# Repo Modernization

## Trigger Signals

- the repo is legacy, inconsistent, or missing dependable workflows

## Inspect First

- build and test entrypoints, dependency age, layout drift, and high-risk hotspots

## Workflow

1. identify the biggest sources of drag or risk
2. define the safest modernization sequence
3. separate quick wins from high-risk refactors
4. summarize the staged plan

## Output Contract

- modernization opportunities
- staged sequence
- risks and prerequisites

## Failure Modes

- the repo lacks enough validation to support modernization safely

## Escalation

- escalate when the required modernization would break support or release commitments
