# Skill Composition

Use this reference when engineering-assistant is orchestrating work across more
specialized skills or knowledge packs.

## Goal

Route the implementation details to the most specific skill available while
keeping engineering-assistant responsible for consistency, interfaces, and the
delivery plan.

## Routing rules

- if a domain clearly matches an existing specialist skill, use that skill as the primary executor for the subtask
- if multiple skills could apply, choose the most specific one instead of stacking broad generalists
- keep engineering-assistant responsible for:
  - plan framing
  - architectural consistency
  - integration boundaries
  - project-memory and change-discipline expectations

## Delegation pattern

1. summarize the subtask in a few concrete bullets
2. route the task to the specialist skill or knowledge pack
3. integrate the result back into the broader architecture and delivery plan

## Example

User request: build a UI-heavy WoW addon workflow with architecture and rollout guidance.

- route addon-specific implementation details to the WoW addon skill
- keep engineering-assistant responsible for architecture choices, workflow coordination, and tracked decision records
