# Modernization Layers

## Layer 1: Visibility and confidence

Create or repair the basic map first: build commands, test paths, release path, ownership, and the critical systems that must not break.

## Layer 2: Dependency and tooling health

Update package managers, SDK pins, CI drift, and outdated dependencies with the smallest safe steps. This layer often unlocks everything else.

## Layer 3: Codebase consistency

Normalize linting, formatting, generated-code boundaries, package structure, and shared conventions so later refactors stop fighting the repo.

## Layer 4: Architectural seams

Only after the repo can validate itself reliably should you extract modules, split services, or change runtime boundaries.

## Rule

Do not start with architecture theater when the repo cannot build or test reliably.
