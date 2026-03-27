# Contract: Visibility Policy

## Purpose

Define the boundary between hidden canonical AI-layer content, visible bridge
surfaces, and intentionally shareable outputs.

## Required Guarantees

- Canonical AI-only content remains hidden under `.hforge/` by default.
- Visible repo-root and target-native surfaces are limited to thin bridges and
  other explicitly allowed minimal entrypoints.
- The default lifecycle treats the hidden AI layer as local operational content
  rather than routine product-code review material.
- Export bundles and selected bridge surfaces may be intentionally shared
  without becoming second canonical runtimes.
- Operators can tell which surfaces are hidden, visible, canonical, cache-like,
  or export-only.

## Validation Expectations

- Visibility checks fail when canonical AI content is installed as visible
  product-root directories without explicit policy allowance.
- Lifecycle checks fail when the default install no longer behaves as
  local-first operational content.
- Sharing-policy checks fail when exports or bridges are ambiguous enough to be
  mistaken for the canonical runtime itself.
