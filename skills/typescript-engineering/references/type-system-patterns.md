# Type System Patterns

## Goals
- Make illegal states hard to represent.
- Use discriminated unions for state machines and request/result variants.
- Prefer precise domain types at boundaries instead of pervasive `string` and `any`.

## Rules
- `unknown` at trust boundaries; narrow before use.
- Avoid `as` casts when a type guard or better modeling is possible.
- Encode nullability intentionally.
- Separate transport DTOs from domain models when the distinction matters.
