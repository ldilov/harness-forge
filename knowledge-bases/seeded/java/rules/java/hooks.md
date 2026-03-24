---
paths:
  - "**/*.java"
  - "**/pom.xml"
  - "**/build.gradle*"
extends: ../common/hooks.md
language: java
layer: language
---
# Java Hooks

> This file extends [common/hooks.md](../common/hooks.md) with Java-specific hook suggestions.

## Post-edit hooks

- format with Spotless or project formatter
- compile changed modules
- run nearby tests when behavior changes

## Stop hooks

- final module build
- dependency vulnerability check when build files change
