# HTTP Contract Checklist

## Requests

- method and route stability
- required vs optional fields
- null vs absent semantics
- header requirements and auth expectations
- pagination, filtering, and sorting conventions

## Responses

- status code meanings
- error shape consistency
- enum and discriminator behavior
- date, time, and numeric encoding
- default values and omitted fields

## Behavior semantics

- idempotency for safe retry scenarios
- partial update semantics for PATCH-like operations
- backward-compatible additions vs required-field changes
- whether new validation rejects payloads that used to succeed
