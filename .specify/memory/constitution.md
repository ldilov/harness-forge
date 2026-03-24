<!--
Sync Impact Report
- Version change: unversioned template -> 1.0.0
- Modified principles:
  - Template Principle 1 -> I. Spec-Led Delivery
  - Template Principle 2 -> II. Language-Native Engineering
  - Template Principle 3 -> III. Test-First Verification (NON-NEGOTIABLE)
  - Template Principle 4 -> IV. Modular Boundaries & Contract-First Design
  - Template Principle 5 -> V. Agent-Neutral Operations
- Added sections:
  - Engineering Guardrails
  - Workflow & Quality Gates
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md
  - ✅ updated: .specify/templates/spec-template.md
  - ✅ updated: .specify/templates/tasks-template.md
  - ✅ updated: .specify/templates/agent-file-template.md
  - ⚠ pending: .specify/templates/commands/ (directory not present in this repo)
- Follow-up TODOs:
  - None
-->

# Harness Forge Constitution

## Core Principles

### I. Spec-Led Delivery
Every meaningful change MUST begin with a specification, an implementation plan,
and executable tasks that trace back to user value. Work MUST define scope,
acceptance scenarios, measurable success criteria, and explicit assumptions before
implementation begins. Ad hoc coding is allowed only for trivial, low-risk changes
that do not alter behavior, architecture, or interfaces.

Rationale: clear specs reduce rework, let agents collaborate safely, and create a
shared source of truth across humans and tools.

### II. Language-Native Engineering
Each codebase area MUST follow the best practices of its language and framework
rather than forcing one global style across unlike stacks. Teams MUST prefer the
strongest native correctness mechanisms available for the chosen stack, including
formatters, linters, type checking, compiler diagnostics, and idiomatic project
layout. Shared patterns are allowed only when they remain natural in each
language.

Rationale: maintainable systems are built from idiomatic components; cross-language
consistency matters, but not at the cost of fighting the platform.

### III. Test-First Verification (NON-NEGOTIABLE)
Behavioral changes MUST be backed by automated verification defined before or
alongside implementation. New features and bug fixes MUST start from failing tests,
contract checks, reproducible fixtures, or another executable proof of expected
behavior. A change is incomplete until the relevant verification passes locally or
the repo records why execution was blocked.

Rationale: test-first workflows give agents and humans an objective target and
reduce regressions during parallel or iterative work.

### IV. Modular Boundaries & Contract-First Design
Architecture MUST favor small, composable modules with explicit boundaries,
well-defined data contracts, and dependency direction that keeps domain logic
isolated from delivery and infrastructure concerns. Integrations MUST cross
boundaries through stable interfaces, schemas, or adapters rather than hidden
coupling. Simpler structures SHOULD be chosen by default, and extra abstraction
MUST be justified in the plan.

Rationale: clear module seams make systems easier to test, evolve, and split across
agents without merge or ownership confusion.

### V. Agent-Neutral Operations
Repository process, documentation, and automation MUST remain usable from both
Codex and Claude, and SHOULD avoid critical instructions that depend on a single
vendor's UX. Shared guidance MUST live in repository-owned files such as specs,
plans, tasks, `AGENTS.md`, and generated agent-context files. When agent-specific
files are needed, they MUST be derived from the same underlying project facts and
kept synchronized.

Rationale: the repo must outlive any one assistant surface and support mixed-agent
teams without duplicated or conflicting instructions.

## Engineering Guardrails

- Inputs MUST be validated at system boundaries, including APIs, CLIs, file
  imports, background jobs, and external service callbacks.
- Secrets MUST come from environment or secret-management systems and MUST NOT be
  hardcoded in source, fixtures, or generated docs.
- New modules MUST expose observability appropriate to their runtime:
  structured logs, actionable errors, and metrics or traces where the stack
  supports them.
- Performance, security, and data-retention constraints that materially affect
  design MUST be captured in the spec and enforced in the plan.
- Documentation MUST be updated when behavior, architecture, commands, or agent
  guidance changes.

## Workflow & Quality Gates

- `spec.md` MUST capture prioritized user stories, acceptance scenarios, edge
  cases, measurable success criteria, and quality or architecture constraints.
- `plan.md` MUST record language, dependencies, storage, testing strategy,
  structure decisions, constitution gates, and any justified complexity.
- `tasks.md` MUST include exact file paths, test tasks for each affected story or
  contract, and explicit work for validation, observability, and documentation
  when those concerns change.
- Before merge, every change MUST receive a review for correctness, regression
  risk, and architectural fit; security-sensitive changes MUST also receive a
  security review.
- Before release or handoff, contributors MUST run the strongest available local
  verification suite for the affected area or document why a required check could
  not run.

## Governance

This constitution supersedes informal local practice for engineering workflow in
this repository. Amendments require a documented rationale, updates to impacted
templates or guidance files, and a version bump recorded in this file.

Versioning policy:
- MAJOR: removes or redefines a core principle or governance rule in a
  backward-incompatible way.
- MINOR: adds a new principle, section, or mandatory workflow expectation.
- PATCH: clarifies wording without changing required behavior.

Compliance review expectations:
- Every implementation plan MUST pass the Constitution Check before design and
  again before implementation.
- Every code review MUST verify compliance with language-native standards,
  verification requirements, modular boundaries, and agent-neutral guidance.
- Any temporary exception MUST be recorded in the relevant plan or pull request
  with owner, scope, and expiration.

**Version**: 1.0.0 | **Ratified**: 2026-03-24 | **Last Amended**: 2026-03-24
