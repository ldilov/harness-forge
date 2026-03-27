# Contract: Discovery Bridges

## Purpose

Define how supported runtimes discover the hidden `.hforge/` AI layer through
root-visible and target-native bridge surfaces.

## Required Guarantees

- Each supported runtime has an explicit bridge path into the hidden canonical
  AI layer.
- Discovery bridges stay thin and navigational rather than becoming large
  duplicated knowledge surfaces.
- Scoped bridges only exist when they have explicit justification.
- Partial, translated, or documentation-only behavior is labeled honestly for
  the affected runtime.
- Bridge surfaces make hidden-layer absence, staleness, or degradation visible
  enough for operators to react.

## Validation Expectations

- Bridge-alignment checks fail when a visible runtime-facing surface no longer
  points to the hidden AI layer.
- Support-honesty checks fail when target notes omit required fallback or
  capability limitations.
- Package-surface validation fails when required bridge surfaces disappear or
  expand into canonical-content duplication.
