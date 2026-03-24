---
id: command-test
kind: command
title: Test Command
summary: Use when defining or running verification for code, docs, templates, or migration work.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
languages:
  - all
generated: false
---
# Test Command

## Syntax

Invoke the test or validation path that matches the active workflow and content
surface.

## Arguments and options

- choose the command or validator path being exercised
- scope the run to the feature, docs, or package surface you are changing

## Output contract

- clear pass or fail result
- missing coverage or drift called out explicitly
- next validation step identified when partial checks pass

## Side effects

- may run CLI, docs, or template validators
- may produce build or validation artifacts

## Failure behavior

- stop on release-gate failures
- surface missing seeded coverage or package drift as actionable errors
