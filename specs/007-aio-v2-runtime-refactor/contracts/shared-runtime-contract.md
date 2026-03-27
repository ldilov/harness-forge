# Contract: Hidden Shared Runtime

## Purpose

Define the authoritative hidden `.hforge/` AI layer that stores durable repo
knowledge, rules, templates, task packs, exports, findings, decisions, and
compact working memory.

## Required Guarantees

- One active hidden AI layer acts as the system of record for cross-agent repo
  intelligence and operational guidance.
- Canonical AI content lives under `.hforge/` rather than visible repo-root
  content directories.
- Durable knowledge and short-term working memory remain clearly separated.
- The hidden AI layer exposes typed authoritative surfaces for library,
  runtime, tasks, cache, exports, state, and generated helpers.

## Validation Expectations

- Package-surface checks fail if the hidden canonical surfaces promised by the
  install model are missing.
- Runtime-alignment checks fail if visible bridges point at divergent or
  duplicated visible knowledge stores instead of `.hforge/`.
- Documentation and lifecycle checks fail if the hidden layer no longer makes
  its authoritative surfaces explicit.
