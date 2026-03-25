---
name: kotlin-engineering
description: kotlin engineering guidance for structured Harness Forge language packs.
---

# Kotlin Engineering

Use this skill when the repository is primarily Kotlin or when the task touches `.kt`, `.kts`, or Gradle Kotlin DSL.

## Activation

- Kotlin dominates the task or repository
- the work touches server modules, Android, multiplatform code, or build logic

## Load Order

- `rules/common/`
- `rules/kotlin/`
- `knowledge-bases/structured/kotlin/docs/`
- `knowledge-bases/structured/kotlin/examples/`

## Execution Contract

1. inspect module boundaries, state flow, and platform assumptions
2. select common and Kotlin-specific rules for the change
3. implement with explicit nullability, coroutine, and API decisions
4. verify with the repo test path and the structured checklist

## Outputs

- touched-module summary
- implementation summary
- validation result or blocker note

## Validation

- run the repo Kotlin or Gradle validation path when available
- consult `knowledge-bases/structured/kotlin/docs/review-checklist.md`

## Escalation

- escalate when platform boundaries or concurrency semantics stay ambiguous
- escalate when the task needs framework guidance beyond the shipped pack
