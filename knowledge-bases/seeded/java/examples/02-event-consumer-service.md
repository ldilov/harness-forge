# Event consumer service

## When to use

Use this playbook when the task is primarily about: Kafka or JMS style consumers, retry/dead-letter behavior, idempotency, and schema evolution.

## First questions

- What file or endpoint defines the public contract?
- What input enters from outside the process or package?
- What runtime assumptions could invalidate a purely local refactor?
- What is the cheapest end-to-end verification path?

## Typical file touch pattern

- entrypoint or adapter
- domain/service module
- contract/schema/DTO/model file
- tests close to the changed seam
- docs or examples if behavior changed

## Recommended sequence

1. Read `docs/overview.md` and `docs/frameworks.md`.
2. Inspect the closest public boundary first.
3. Add or tighten validation at ingress.
4. Keep implementation logic isolated from transport or host-specific glue.
5. Add verification that proves the contract, not only internals.

## Anti-patterns

- patching multiple boundaries at once without a migration note
- widening public outputs accidentally
- assuming defaults from tooling or frameworks instead of reading config
- trusting generated or inferred contracts without runtime confirmation

## Validation path
- compile
- unit tests
- slice/integration tests
- migration/config checks
- boot run/smoke

## Handoff note

Summarize what contract changed, what did not change, how it was validated, and any follow-up risk.
