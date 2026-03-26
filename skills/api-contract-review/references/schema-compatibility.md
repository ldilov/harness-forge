# Schema Compatibility

## Usually additive

- new optional fields
- new endpoints or operations
- new enum values only when consumers are documented to tolerate unknown values
- broader examples that still validate against the old schema

## Often breaking

- making a field required
- removing fields, enum values, or response variants
- changing field types, formats, or nullability semantics
- changing validation in a way that rejects previously valid input
- reusing a field name while changing its meaning

## Rule of thumb

Compatibility is about consumer behavior, not just shape compatibility. A response can validate and still be breaking if its semantics or defaults changed in a way existing clients do not expect.
