---
name: perl-engineering
description: perl engineering guidance for structured Harness Forge language packs.
---

# Perl Engineering

Use this skill when the repository is primarily Perl or when the task touches `.pl`, `.pm`, or legacy automation built in Perl.

## Activation

- Perl dominates the task or repository
- the work touches legacy automation, modules, or compatibility-sensitive code

## Load Order

- `rules/common/`
- `rules/perl/`
- `knowledge-bases/structured/perl/docs/`
- `knowledge-bases/structured/perl/examples/`

## Execution Contract

1. inspect module boundaries, runtime expectations, and compatibility constraints
2. select the common and Perl-specific rules for the change
3. implement with explicit package, testing, and risk decisions
4. verify with the repo Perl validation path and the structured checklist

## Outputs

- touched-module summary
- implementation summary
- validation result or blocker note

## Validation

- run the repo Perl test path when available
- consult `knowledge-bases/structured/perl/docs/review-checklist.md`

## Escalation

- escalate when runtime version compatibility or legacy coupling is unclear
- escalate when the change affects broad automation behavior
