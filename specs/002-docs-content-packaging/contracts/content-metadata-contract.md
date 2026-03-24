# Contract: Content Metadata

## Purpose

Define the shared metadata contract for authored runtime markdown and
product-facing documentation content.

## Base fields required for runtime markdown

- `id`
- `kind`
- `title`
- `summary`
- `status`
- `owner`
- `applies_to`
- `languages`
- `generated`

## Additional requirements by content kind

### `command`

- must describe syntax
- must describe arguments or options
- must describe output contract
- must describe side effects
- must describe failure behavior

### `agent`

- must describe mission
- must describe inputs expected
- must describe workflow or process
- must describe output contract
- must describe stop conditions
- must describe escalation rules

### `rule`

- must identify language or layer
- must declare whether it extends shared baseline guidance

### `example`

- must describe scenario
- must identify targets
- must identify languages or stacks illustrated

### `task-template` / `workflow-template`

- must satisfy the template and workflow validator bundle contract

## Generated content rules

- `generated: true` requires a canonical source reference
- generated content must not be the only source of truth
- generated content must be validated for drift against its source

## Discovery guarantees

- metadata alone must be enough to determine ownership, compatibility, and
  whether the content is authored or generated
- content must not rely on directory name alone to express compatibility or
  lifecycle
