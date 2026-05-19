---
name: complex-task-protocol
description: Automatic operating protocol for complex agent tasks. Use when work is multi-step, risky, cross-module, orchestration-heavy, or likely to benefit from bounded sidecar help, verification discipline, recovery checkpoints, and durable learning capture.
---

# Complex Task Protocol

## Activation

Before meaningful coding work, classify the task as `simple` or `complex`.

Activate this protocol when either condition is true:

- at least two ordinary complexity signals are present
- at least one high-signal condition is present

Ordinary complexity signals:

- touches three or more files or two or more modules
- requires investigation plus implementation
- changes architecture, runtime behavior, generated surfaces, install flows, release flows, security, or agent instructions
- likely needs multiple verification commands
- has independent sidecar work such as focused evidence gathering, review, or verification
- the initial focused read does not reveal a clear path

High-signal conditions:

- security-sensitive change
- release, publish, or signoff work
- cross-target agent behavior
- recursive, runtime, orchestration, or subagent behavior
- persistent bug after one direct fix attempt
- explicit user request for complex-task, subagent, learning, or orchestration behavior

## Simple Task Bypass

Keep simple work lightweight. Do not announce this protocol or spawn subagents by default for:

- direct questions that do not require code changes
- typo, wording, or single-surface documentation fixes
- obvious one-file edits with a clear verification path
- narrow configuration changes with low blast radius

## Execution Map

When the protocol activates, give a concise execution map before broad scanning:

- why the task is complex enough to activate the protocol
- what the main agent will keep on the critical path
- which sidecar work, if any, is independent enough to delegate
- what verification will prove the result
- what recovery threshold will stop unbounded exploration
- whether durable learning capture is likely

## Bounded Subagent Use

Consider subagents by default when this protocol is active, but spawn them only when independent work exists.

Default limit: zero to two subagents. Use three only when the user explicitly asks or when three independent tracks are clearly available.

Allowed subagent work:

- focused evidence gathering
- documentation or API verification
- security, correctness, or regression review
- verification while the main agent continues non-overlapping work
- isolated implementation slices with clear file ownership

Disallowed subagent work:

- the main agent's immediate blocking decision
- vague exploration without a concrete question
- duplicate work already assigned elsewhere
- broad scans without a bounded purpose
- edits that overlap another active editor's ownership scope

Keep critical-path decisions and the next blocking task with the main agent.

## Subagent Result Schema

Require every sidecar result to include:

- finding or change
- evidence inspected
- files inspected
- files changed, if any
- risks
- confidence
- verification performed, if any

Coding sidecars must also state the behavior changed and known gaps.

## Verification

Before claiming completion, run appropriate verification or state what could not be verified. Report:

- checks run
- result
- checks not run
- residual risk

## Recovery

Stop unbounded exploration when any recovery trigger appears:

- repeated failed attempts
- unclear root cause after focused inspection
- expanding scope
- context bloat or repeated broad scans

When triggered, produce a concise recovery summary with evidence, attempts, blockers, and the next bounded step. For hard investigations, prefer the recursive investigation flow or token-budget optimizer before adding more prompt context.

## Learning Capture

At the end of complex tasks, decide whether anything reusable was learned.

Durable learning categories:

- repository convention
- command or verification recipe
- recurring failure mode
- architecture or runtime decision
- agent tactic that improved outcomes
- target support caveat

Do not persist:

- temporary task state
- obvious facts already documented
- duplicate guidance
- private or user-specific preferences unless explicitly requested
- speculative lessons without evidence

Prefer existing destinations:

- project docs
- runtime task artifacts
- decision records
- observability summaries
- canonical guidance or skill surfaces

Ask before creating a new top-level document when no established destination exists.

## References

- `.hforge/runtime/agent-brief.md`
- `.hforge/generated/agent-command-catalog.json`
- `.hforge/library/skills/token-budget-optimizer/SKILL.md`
- `.hforge/library/skills/recursive-structured-analysis/SKILL.md`
- `.hforge/runtime/recursive/language-capabilities.json`
