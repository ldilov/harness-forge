# Testing and Quality

## Testing Strategy
- Unit tests for domain logic and transformations.
- Integration tests for persistence, HTTP clients, queues, and framework glue.
- Property or table-driven tests for parsers and edge-case-heavy logic.

## Tooling Defaults
- `pytest`
- `pytest-asyncio` for async code
- `hypothesis` where generative coverage matters
- type checking via `pyright` or `mypy`
- formatting/linting via `ruff`

## Agent Guidance
Before proposing a patch, look for the nearest existing test style and mirror it.
