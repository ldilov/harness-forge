---
name: api-contract-review
description: review request, response, event, and schema contracts for compatibility and consumer safety. use when http, openapi, asyncapi, protobuf, json schema, generated clients, or external integration behavior changes.
---

# API Contract Review

## Trigger Signals

- the task changes HTTP routes, request or response shapes, headers, auth semantics, examples, or client SDKs
- the repo edits OpenAPI, AsyncAPI, Protobuf, JSON Schema, or generated contract code
- a versioning, deprecation, or compatibility question exists across providers and consumers

## Inspect First

- source-of-truth specs and the runtime handlers that implement them
- schema validators, generated clients, examples, docs, and error-shape helpers
- versioning and deprecation notes, auth requirements, and pagination or idempotency behavior
- consumer code, integration tests, and release notes when a public contract changed

## Workflow

1. identify the canonical contract surface and compare it to the implementation
2. classify the change by protocol: HTTP, event, schema-only, or wire-level
3. evaluate backward compatibility for required fields, enums, defaults, errors, and behavior semantics
4. verify examples, validation rules, and generated artifacts stay in sync
5. emit a consumer-centered review with specific remediation or rollout guidance

## Output Contract

- changed contract summary grouped by endpoint, message, or schema
- compatibility verdict with the precise breaking edges called out
- consumer impact notes covering clients, codegen, docs, and deployment sequencing
- follow-up actions for linting, versioning, deprecation, migration guides, or tests

## Failure Modes

- the runtime contract diverges from the checked-in spec and the source of truth is unclear
- examples, docs, or generated clients are stale enough that contract behavior cannot be trusted
- behavior semantics changed without any schema diff to explain it

## Escalation

- escalate when a breaking change lacks versioning, deprecation, or migration guidance
- escalate when error semantics, auth requirements, or event-delivery guarantees change silently
- escalate when wire compatibility for protobuf or event consumers is uncertain

## References

- `skills/api-contract-review/references/http-contract-checklist.md`
- `skills/api-contract-review/references/schema-compatibility.md`
- `skills/api-contract-review/references/event-and-async-contracts.md`
- `skills/api-contract-review/references/protobuf-and-buf.md`
- `skills/api-contract-review/references/style-and-linting.md`
- `skills/api-contract-review/references/review-template.md`
- `skills/api-contract-review/references/examples.md`
