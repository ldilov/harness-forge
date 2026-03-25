---
name: python-engineering
description: python engineering guidance for structured Harness Forge language packs.
---

# Python Engineering

Use this skill when the repository is primarily Python or when the task touches `.py`, `pyproject.toml`, or `requirements.txt`.

## Activation

- Python files dominate the task or repository
- the work touches packaging, services, automation, or framework code

## Load Order

- `rules/common/`
- `rules/python/`
- `knowledge-bases/structured/python/docs/`
- `knowledge-bases/structured/python/examples/`
- `skills/python-engineering/references/`

## Execution Contract

1. orient on module boundaries, entrypoints, and the active framework
2. select the Python and common rule files that constrain the change
3. implement with explicit typing, validation, and dependency choices
4. verify with the repo test path and the structured review checklist

## Outputs

- touched-file plan
- implementation summary
- validation result or blocker note

## Validation

- run the repo's Python verification path when available
- consult `knowledge-bases/structured/python/docs/review-checklist.md`
- use the supplemental reference pack when the task needs ecosystem, async, or debugging heuristics not covered in the structured pack

## Supplemental Engineering References

- `skills/python-engineering/references/repo-exploration.md`
- `skills/python-engineering/references/output-templates.md`
- `skills/python-engineering/references/agent-patterns.md`
- `skills/python-engineering/references/debugging-playbook.md`
- `skills/python-engineering/references/ecosystem-guide.md`
- `skills/python-engineering/references/async-and-concurrency.md`
- `skills/python-engineering/references/testing-and-quality.md`
- `skills/python-engineering/references/examples.md`

## Escalation

- escalate when a framework pattern is missing from the structured pack
- escalate when deployment, dependency, or typing constraints conflict with the repo
