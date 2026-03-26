# Style And Linting

## OpenAPI and AsyncAPI

Use machine-readable specs as the first review surface, not just handwritten docs. OpenAPI is the standard description format for HTTP APIs, and AsyncAPI plays the same role for asynchronous APIs.

## Linting surfaces

- Spectral is a strong general-purpose linter for OpenAPI, AsyncAPI, and related JSON or YAML rulesets
- Redocly CLI is useful when the repo wants linting tied closely to OpenAPI quality, docs, or governance rules
- JSON Schema should be reviewed for both validation intent and how generators or clients interpret optionality and nullability

## Review rule

Lint passes are necessary but not sufficient. Always reason about examples, generated clients, and consumer migration cost.
