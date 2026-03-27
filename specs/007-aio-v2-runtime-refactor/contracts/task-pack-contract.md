# Contract: Hidden Task Packs

## Purpose

Define the minimum shape and guarantees for task-specific context bundles stored
inside the hidden AI layer.

## Required Guarantees

- Task packs are the primary output for active work rather than unstructured
  visible root-level note collections.
- Every active task pack includes requested outcome, clarified requirements,
  impacted modules, risks, acceptance criteria, and test implications.
- Structured requirements and implementation notes remain individually
  identifiable and reviewable.
- Task packs are stored inside the hidden layer and remain exportable for
  review or handoff without exposing the full canonical runtime.

## Validation Expectations

- Task-pack checks fail when required sections disappear or become ambiguous.
- Requirement and note checks fail when items lose identifiers, evidence, or
  acceptance criteria.
- Export validation fails when a portable task output omits essential context
  promised by the hidden runtime model.
