# Runtime Validation And Boundaries

## Boundaries that need runtime checks

- HTTP requests and responses
- message or event payloads
- environment variables and config files
- persistence reads where historical data may violate current assumptions
- third-party SDK responses and browser APIs

## Validation rules

- validate as close to the boundary as possible
- translate into trusted internal types after validation
- preserve the original payload or error context when debugging matters
- do not treat compile-time types as evidence that runtime data is safe

## Contract evolution

When changing a shared schema, identify whether consumers can coexist across versions. Additive changes are usually safer than required-field, enum, or semantics changes.
