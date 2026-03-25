---
name: rust-engineering
description: rust engineering guidance for structured Harness Forge language packs.
---

# Rust Engineering

Use this skill when the repository is primarily Rust or when the task touches `.rs` or `Cargo.toml`.

## Activation

- Rust dominates the task or repository
- the work touches ownership-heavy modules, CLIs, services, or libraries

## Load Order

- `rules/common/`
- `rules/rust/`
- `knowledge-bases/structured/rust/docs/`
- `knowledge-bases/structured/rust/examples/`

## Execution Contract

1. inspect crate boundaries, ownership hotspots, and error paths
2. select the common and Rust-specific rules for the change
3. implement with explicit trait, ownership, and error-handling decisions
4. verify with the repo cargo path and the structured checklist

## Outputs

- touched-crate summary
- implementation summary
- validation result or blocker note

## Validation

- run the repo Rust validation path when available
- consult `knowledge-bases/structured/rust/docs/review-checklist.md`

## Escalation

- escalate when `unsafe`, public API compatibility, or performance-sensitive changes appear
- escalate when ownership tradeoffs remain unclear after design
