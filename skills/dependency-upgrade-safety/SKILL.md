---
name: dependency-upgrade-safety
description: Review and stage dependency upgrades with compatibility and rollback awareness.
---

# Dependency Upgrade Safety

## Trigger Signals

- the task upgrades packages, libraries, SDKs, or frameworks

## Inspect First

- dependency manifests, lockfiles, changelogs, and affected entrypoints

## Workflow

1. identify changed packages and affected surfaces
2. evaluate compatibility and migration risk
3. define validation and rollback expectations
4. summarize upgrade safety status

## Output Contract

- upgrade impact summary
- compatibility risks
- validation plan
- rollback note

## Failure Modes

- release notes or migration notes are missing

## Escalation

- escalate when the upgrade changes a critical runtime contract
