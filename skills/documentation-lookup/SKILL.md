---
name: documentation-lookup
description: Find the right docs, templates, and catalog entries inside Harness Forge before improvising.
---

# Documentation Lookup

## Trigger Signals

- the task needs the canonical docs surface before implementation
- there are multiple possible rules, frameworks, or templates and guessing would be risky

## Inspect First

- `docs/catalog/`
- `rules/`
- `skills/`
- `templates/workflows/`

## Workflow

1. identify the dominant language, framework, or workflow intent
2. find the most specific canonical doc surfaces
3. summarize the minimum required guidance and unresolved gaps
4. point the caller to the exact files to load next

## Output Contract

- recommended doc paths
- why those paths match the task
- unresolved gaps or ambiguity notes

## Failure Modes

- multiple docs surfaces conflict materially
- no specific framework or language match exists

## Escalation

- escalate when the canonical docs disagree with shipped runtime behavior
- escalate when the missing docs would make implementation unsafe

## References

- `skills/documentation-lookup/references/source-priority.md`
