---
name: recursive-structured-analysis
description: session-scoped recursive structured analysis for difficult repository investigation. use when recursive work needs a bounded capability map, explicit execution posture, and durable run records instead of free-form chat exploration.
---

# Recursive Structured Analysis

## Trigger Signals

- the task already needs a recursive session and now needs one bounded
  analysis step inside that session
- the repository is mixed-language or architecture-heavy and support truth
  should be checked before deeper investigation
- the operator needs a durable, inspectable analysis run rather than a prompt
  transcript

## Inspect First

- `.hforge/runtime/recursive/language-capabilities.json`
- `.hforge/runtime/recursive/sessions/<sessionId>/execution-policy.json`
- `.hforge/runtime/recursive/sessions/<sessionId>/capabilities.json`
- `.hforge/generated/agent-command-catalog.json`

## Workflow

1. inspect recursive capability truth before assuming a language or adapter is
   available
2. inspect the active recursive session and execution policy
3. use one bounded structured run at a time
4. inspect run history and run results instead of relying on chat-only memory
5. keep support claims honest when a language is degraded, unavailable, or
   host-executed only

## Command Surface

- `hforge recursive capabilities --root . --json`
- `hforge recursive run <sessionId> --file <snippet> --root . --json`
- `hforge recursive run <sessionId> --stdin --root . --json`
- `hforge recursive runs <sessionId> --root . --json`
- `hforge recursive inspect-run <sessionId> <runId> --root . --json`

## Operating Rule

Recursive structured analysis is the promoted execution surface for recursive
repository investigation. Treat it as session-scoped, policy-bound, and
artifact-backed. Do not describe it as a generic REPL or as native execution
parity across all languages unless the capability map explicitly supports that
claim.
