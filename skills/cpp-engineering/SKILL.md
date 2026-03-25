---
name: cpp-engineering
description: c++ engineering guidance for structured Harness Forge language packs.
---

# C++ Engineering

Use this skill when the repository is primarily C++ or when the task touches native source, headers, or build files.

## Activation

- native code dominates the task or repository
- the work touches ABI-sensitive, performance-critical, or concurrency-heavy code

## Load Order

- `rules/common/`
- `rules/cpp/`
- `knowledge-bases/structured/cpp/docs/`
- `knowledge-bases/structured/cpp/examples/`

## Execution Contract

1. inspect ownership, build, and interface boundaries
2. select the common and C++-specific rules for the change
3. implement with explicit compatibility and memory-safety tradeoffs
4. verify with the repo native build/test path and the structured checklist

## Outputs

- touched-module summary
- implementation summary
- validation result or blocker note

## Validation

- run the repo native validation path when available
- consult `knowledge-bases/structured/cpp/docs/review-checklist.md`

## Escalation

- escalate when ABI, threading, or platform-specific changes are involved
- escalate when the safe ownership strategy is not obvious
