---
id: context-dev
kind: context
title: Development Context
summary: Shared development expectations for safe iteration, validation, and docs updates.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
languages:
  - all
generated: false
---
# Development Context

The development context focuses on safe iteration, test-first execution,
structured validation, and documentation updates after behavior changes.

## Expectations

- define executable verification before changing behavior
- keep seeded knowledge and package manifests in sync
- update docs when commands, targets, or content surfaces change
- protect Codex and Claude Code compatibility together
