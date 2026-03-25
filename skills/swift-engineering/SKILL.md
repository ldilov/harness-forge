---
name: swift-engineering
description: swift engineering guidance for structured Harness Forge language packs.
---

# Swift Engineering

Use this skill when the repository is primarily Swift or when the task touches `.swift` or `Package.swift`.

## Activation

- Swift dominates the task or repository
- the work touches package modules, platform code, or concurrency-sensitive logic

## Load Order

- `rules/common/`
- `rules/swift/`
- `knowledge-bases/structured/swift/docs/`
- `knowledge-bases/structured/swift/examples/`

## Execution Contract

1. inspect module boundaries, platform assumptions, and concurrency concerns
2. select the common and Swift-specific rules for the change
3. implement with explicit API, ownership, and build decisions
4. verify with the repo package or Xcode-equivalent validation path and the checklist

## Outputs

- touched-module summary
- implementation summary
- validation result or blocker note

## Validation

- run the repo Swift validation path when available
- consult `knowledge-bases/structured/swift/docs/review-checklist.md`

## Escalation

- escalate when platform behavior, Apple ecosystem constraints, or concurrency tradeoffs are unclear
- escalate when the task affects multiple targets or package boundaries
