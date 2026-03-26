# Event And Async Contracts

## Review points

- topic or channel name stability
- message key or partitioning semantics
- delivery guarantees that affect idempotency or ordering assumptions
- schema evolution rules for consumers that may lag behind producers
- replay and dead-letter behavior when validation tightens

## Good async contract hygiene

- keep envelope metadata stable
- version payloads explicitly when semantics change
- document whether consumers should ignore unknown fields
- state ordering, duplication, and retry expectations clearly
