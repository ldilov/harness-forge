---
name: release-readiness
description: Release-prep workflow for validation, documentation alignment, package surface, and handoff quality.
---

# Release Readiness

## Trigger Signals

- a package, feature, or release candidate is close to handoff
- the task needs a go or no-go recommendation with evidence

## Inspect First

- validation scripts and package manifests
- changed docs, commands, and install or upgrade surfaces
- compatibility, migration, and support notes

## Workflow

1. collect the intended release surface and the current validation evidence
2. verify docs, commands, package paths, and upgrade guidance align
3. identify blockers, warnings, and missing follow-up work
4. produce a release report with a go or no-go recommendation

## Output Contract

- release decision
- blocking issues
- warnings
- validation evidence summary

## Failure Modes

- release scope is unclear
- required validation surfaces are missing or untrusted

## Escalation

- escalate when a release-blocking validation gap remains unresolved
- escalate when docs or package surfaces contradict runtime behavior

## References

- `skills/release-readiness/references/release-report-template.md`
