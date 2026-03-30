---
id: implement-change
kind: workflow-template
title: Implement Change
summary: Technology-agnostic workflow that forces every change to answer the seven core engineering questions before ship or handoff.
mode: sequential
status: stable
version: 1
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - any
supported_targets:
  - codex
  - claude-code
  - cursor
  - opencode
supported_languages:
  - any
default_agents:
  - planner
owner: core
generated: false
---

## Purpose

Move any engineering change from intent to validated handoff while forcing the
work to answer seven questions regardless of language or framework:
what is changing, why, what must remain true, what could break, how success is
proven, how rollback works, and what future engineers should remember.

## When to Use

Use for technology-agnostic delivery work, especially when stack-specific
implementation templates are too narrow or when correctness and reusability are
more important than framework-specific ceremony.

## Entry Conditions

- a task, ticket, or request exists
- enough repo or system context is available to start framing the change

## Workflow Stages

### Stage 1: Frame the Change

**Goal**
Define the smallest useful change and answer the first two questions: what is
changing and why.

**Consumes**
- request, ticket, or task brief
- repo or system context
- stakeholder constraints

**Produces**
- `change-brief`
- explicit scope and non-goals
- success criteria and assumptions

**Exit Criteria**
- the requested change is concrete enough to plan
- the reason for the change is explicit and reviewable

**Failure Conditions**
- scope is still ambiguous
- the task describes a solution but not the underlying problem

**Next Trigger**
Move to impact and correctness once the brief is stable.

### Stage 2: Map Impact and Correctness

**Goal**
Answer what must remain true and what could break before implementation begins.

**Consumes**
- change brief
- relevant code, docs, schemas, contracts, or runtime surfaces
- incident or regression history when available

**Produces**
- impact notes
- `correctness-contract`
- initial risk list

**Exit Criteria**
- invariants and compatibility promises are explicit
- main failure modes and blast radius are identified

**Failure Conditions**
- affected boundaries are still unclear
- no one can state what correctness means for the change

**Next Trigger**
Move to execution planning once the preservation rules are explicit.

### Stage 3: Plan Execution and Evidence

**Goal**
Answer how the team will know the change works and how it will be rolled back.

**Consumes**
- change brief
- correctness contract
- repo command and validation context

**Produces**
- ordered execution plan
- `verification-matrix`
- rollback notes or `migration-plan` when needed

**Exit Criteria**
- execution steps are ordered and reviewable
- required evidence is explicit
- rollback posture exists for the highest-risk path

**Failure Conditions**
- validation is vague or purely aspirational
- rollback is impossible or undefined for risky changes

**Next Trigger**
Move to implementation after the plan and evidence strategy are coherent.

### Stage 4: Implement the Smallest Safe Slice

**Goal**
Apply the change in dependency order while keeping the blast radius controlled.

**Consumes**
- execution plan
- correctness contract
- verification matrix

**Produces**
- code, configuration, data, or workflow changes
- interim check results
- updated notes on newly discovered risks

**Exit Criteria**
- the intended slice is complete
- unexpected changes in scope are documented

**Failure Conditions**
- implementation reveals larger architectural work than planned
- key invariants cannot be preserved within the current slice

**Next Trigger**
Move to validation once the planned slice is complete.

### Stage 5: Verify and Decide

**Goal**
Run the required checks and make a go/no-go call for handoff or release.

**Consumes**
- changed artifacts
- verification matrix
- manual or automated validation output

**Produces**
- evidence summary
- `release-gate-report` or handoff-ready validation note
- residual-risk statement

**Exit Criteria**
- required evidence is complete
- blockers, warnings, and residual risks are explicit

**Failure Conditions**
- required checks fail
- missing evidence prevents a trustworthy release decision

**Next Trigger**
Move to memory capture once ship or no-ship is explicit.

### Stage 6: Capture Durable Memory

**Goal**
Answer what future engineers should remember about this change.

**Consumes**
- change brief
- validation report
- implementation and review notes

**Produces**
- follow-up actions
- ADR or change note when warranted
- durable summary of trade-offs, caveats, and monitoring needs

**Exit Criteria**
- the next engineer can understand the decision without replaying the whole chat
- follow-up work and monitoring gaps are visible

**Failure Conditions**
- important trade-offs remain buried in transient discussion
- the team cannot tell what to monitor or revisit later

**Next Trigger**
Stop after the durable summary or ADR is captured.

## Handoff Contracts

- Frame -> Impact: scope, rationale, and non-goals must be explicit
- Impact -> Plan: invariants and risks must be visible
- Plan -> Implement: ordered steps, evidence plan, and rollback posture must exist
- Implement -> Verify: change summary and executed checks must exist
- Verify -> Memory: release decision, residual risk, and follow-up notes must exist

## Exit Conditions

- the change has a stable brief, a correctness contract, validation evidence,
  and durable follow-up memory
- unanswered questions are explicit rather than implied

## Failure Modes

- implementation begins before correctness is defined
- validation stays generic instead of risk-based
- rollback is ignored until late in the change
- important trade-offs never become durable artifacts

## Escalation Rules

- escalate when preserving correctness would materially expand the scope
- escalate when the rollback posture is weaker than the business risk allows
- escalate when the change crosses ownership, contract, or migration boundaries

## Artifacts Produced

- `change-brief`
- `correctness-contract`
- `verification-matrix`
- optional `migration-plan`
- `release-gate-report` or equivalent handoff note

## Validation Tools

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/shell/verify-workflow-contracts.sh`
- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/powershell/Test-WorkflowContracts.ps1`

## Human Approval Points

- after the change brief if scope or intent is still contested
- before implementation when rollback is weak or the blast radius is large
- after validation when blockers or residual risks remain

## Examples

- frame a repo-wide modernization change without assuming a specific stack
- implement an installer refresh while preserving existing runtime state
- move a prototype into production with explicit evidence and rollback gates
