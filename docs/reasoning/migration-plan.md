# Reasoning Rollout Migration Plan

## Purpose

Migrate from mixed informal reasoning practices to deterministic semiformal reasoning artifacts without disrupting delivery velocity.

## Rollout Stages

1. Stage A: Baseline and orientation
   - Publish reasoning index and quickstart routes.
   - Introduce Lite mode for low-risk use cases.
2. Stage B: Standard enforcement
   - Require core contract + exploration log for code-changing investigations.
   - Start certificate usage for medium-risk decisions.
3. Stage C: High-risk governance
   - Require task-specific certificates and pre-merge workflow for high-risk changes.
   - Enforce deterministic recommendation outputs.
4. Stage D: Drift prevention
   - Enable parity and validation checks in CI.
   - Review success metrics on a recurring cadence.

## Rollback Approach

- Revert bridge docs first if migration creates confusion.
- Keep canonical templates intact to preserve policy continuity.
- Re-introduce stages incrementally.
