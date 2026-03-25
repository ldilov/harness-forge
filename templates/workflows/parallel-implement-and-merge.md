---
id: parallel-implement-and-merge
kind: workflow-template
title: Parallel Implement And Merge
summary: Plan, execute, and merge low-overlap work conservatively across isolated worktrees.
mode: sequential
status: stable
version: 1
applies_to:
  - codex
  - claude-code
languages:
  - any
supported_targets:
  - codex
  - claude-code
supported_languages:
  - any
default_agents:
  - planner
owner: core
generated: false
---

## Purpose

Coordinate safe parallel implementation when a backlog contains low-overlap
work that can be isolated into separate worktrees.

## When to Use

Use when tasks can be split with clear ownership, validation gates, and merge
criteria, and when a blocked fallback-to-single-thread path is acceptable.

## Entry Conditions

- an ordered task backlog exists
- risky shared paths are known or can be inferred
- validation gates are agreed before sharding starts

## Workflow Stages

### Stage 1: Plan

**Goal**
Produce a conservative shard plan and identify whether parallel work is safe.

**Consumes**
- task backlog
- known shared paths
- target capability constraints

**Produces**
- shard plan
- merge criteria
- fallback-to-single-thread reason when needed

**Exit Criteria**
- shard ownership is explicit
- validation gates are listed
- blocked or single-thread outcomes are justified

**Failure Conditions**
- overlap risk is too high
- ownership remains ambiguous

**Next Trigger**
Move to execution when the shard plan is accepted.

### Stage 2: Execute

**Goal**
Complete shard-owned work in isolated worktrees without violating the plan.

**Consumes**
- accepted shard plan
- shard ownership
- validation gates

**Produces**
- shard changes
- shard validation results
- blocker notes when progress stops

**Exit Criteria**
- each active shard reports status
- validation results are attached to shard work

**Failure Conditions**
- shared-path overlap grows unexpectedly
- a shard cannot satisfy its validation gate

**Next Trigger**
Move to merge review when shard work stabilizes.

### Stage 3: Merge Review

**Goal**
Decide whether the shard set is safe to merge or must remain blocked.

**Consumes**
- shard status
- validation results
- merge criteria

**Produces**
- merge-readiness finding
- required actions for blocked plans

**Exit Criteria**
- readiness status is explicit
- required actions are clear for blocked work

**Failure Conditions**
- required artifacts are missing
- shard dependencies are stale

**Next Trigger**
Move to merge when readiness is approved.

### Stage 4: Merge

**Goal**
Combine shard work safely or fall back to single-threaded completion.

**Consumes**
- ready merge decision
- approved shard changes
- rollback plan

**Produces**
- merged result
- final validation output

**Exit Criteria**
- merge criteria remain satisfied
- rollback path is documented if merge is abandoned

**Failure Conditions**
- conflicts invalidate shard isolation
- final validation regresses

**Next Trigger**
Stop after the final validation output is captured.

## Handoff Contracts

- Plan -> Execute: shard ownership, validation gates, and risky shared paths
  must be explicit
- Execute -> Merge Review: each shard must report validation status and
  blockers
- Merge Review -> Merge: the readiness finding must state ready or blocked with
  reasons

## Exit Conditions

- the plan is either merged safely or explicitly returned to single-threaded
  execution
- final validation results are attached to the merged outcome

## Failure Modes

- optimistic sharding without clear ownership
- missing validation evidence at merge time
- hidden overlap on shared configuration or generated artifacts

## Escalation Rules

- escalate when a blocked shard changes the original scope materially
- escalate when merge conflicts invalidate the original shard plan
- escalate before overriding a blocked merge-readiness decision

## Artifacts Produced

- parallel execution plan
- shard status updates
- merge-readiness finding
- final validation output

## Human Approval Points

- approve the initial shard plan
- approve any fallback from blocked parallel work to single-threaded execution
- approve the final merge when residual risks remain

## Examples

- split doc updates, schema additions, and isolated scripts into separate
  worktrees with independent validation
- block parallel execution for a migration-heavy change that touches the same
  runtime and schema surfaces
