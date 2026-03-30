---
id: implement-java-change
kind: workflow-template
title: Implement Java Change
summary: Deliver Java work using the seeded Java rules, examples, and review guidance.
mode: sequential
status: stable
version: 2
applies_to:
  - codex
  - claude-code
languages:
  - java
supported_targets:
  - codex
  - claude-code
supported_languages:
  - java
default_agents:
  - planner
owner: core
generated: false
---

## Purpose

Deliver Java work with explicit use of the promoted rules and seeded examples.

## When to Use

Use when a task touches Java, Spring Boot, Gradle, Maven, or JVM backend code.

## Entry Conditions

- the affected files are known
- the dominant language is Java
- `rules/common/` and `rules/java/` are available

## Workflow Stages

### Stage 1: Orient

**Goal**
Load the Java rules and seeded references relevant to the task.

**Consumes**
- `rules/common/coding-style.md`
- `rules/java/coding-style.md`
- `knowledge-bases/seeded/java/docs/overview.md`
- `knowledge-bases/seeded/java/docs/examples-guide.md`

**Produces**
- selected rule set
- chosen scenario reference
- implementation constraints

**Exit Criteria**
- required Java constraints are identified
- a concrete seeded scenario is chosen when one is relevant

**Failure Conditions**
- the task language is mismatched
- the seeded references are unavailable

**Next Trigger**
Move to design once the applicable rules are pinned down.

### Stage 2: Design

**Goal**
Map the change to modules, services, contracts, and tests.

**Consumes**
- `rules/common/patterns.md`
- `rules/java/patterns.md`
- chosen scenario from `knowledge-bases/seeded/java/examples/`

**Produces**
- file touch list
- verification approach
- boundary note tied to the chosen scenario

**Exit Criteria**
- domain and service boundaries are explicit
- testing strategy is clear

**Failure Conditions**
- architecture remains ambiguous
- verification strategy is missing

**Next Trigger**
Move to implementation when file-level changes are concrete.

### Stage 3: Implement

**Goal**
Apply the change following the promoted Java and common rules.

**Consumes**
- selected design
- `rules/common/security.md`
- `rules/java/security.md`

**Produces**
- code changes
- updated docs if behavior changes

**Exit Criteria**
- implementation follows the selected structure
- security and validation concerns are addressed

**Failure Conditions**
- layering collapses
- error handling or validation is incomplete

**Next Trigger**
Move to verification after implementation is complete.

### Stage 4: Verify

**Goal**
Check behavior against the seeded review and testing guidance.

**Consumes**
- `rules/common/testing.md`
- `rules/java/testing.md`
- `knowledge-bases/seeded/java/docs/review-checklist.md`

**Produces**
- test results
- final review notes

**Exit Criteria**
- validations are run or blockers are documented
- the review checklist is satisfied

**Failure Conditions**
- tests fail without a safe fix
- critical review issues remain

**Next Trigger**
Complete the workflow when verification is documented.

## Handoff Contracts

- record which rule files shaped the implementation
- list the validation commands that were run

## Exit Conditions

- code aligns with `rules/common/` and `rules/java/`
- `docs/examples-guide.md` was consulted and the nearest scenario informed the change
- relevant seeded review notes were consulted

## Failure Modes

- bypassing the promoted Java rules
- shipping service changes without seeded review coverage

## Escalation Rules

- escalate when framework constraints conflict with the promoted guidance
- escalate when the seeded examples do not cover the required architecture

## Artifacts Produced

- changed source files
- validation output
- implementation summary

## Human Approval Points

- approve any architectural boundary changes
- approve any deviation from the seeded Java guidance

## Examples

- add a Spring Boot endpoint using the seeded REST API example
- refactor a backend module using the seeded multi-module structure
