---
id: adoption-strategy
kind: documentation
title: Adoption Strategy for Universal Team Use
summary: How to introduce semi-formal certificates into day-to-day engineering without creating unworkable process overhead.
status: stable
version: 1
---

# Adoption Strategy for Universal Team Use

The right way to universalize semi-formal reasoning is **not** to demand the heaviest certificate for every task.

The right strategy is:

- keep one universal reasoning contract
- choose a task-specific certificate only when risk or ambiguity justifies it
- make evidence capture incremental during exploration
- require a formal conclusion only when a decision or merge depends on it

## Why this needs a rollout strategy

The source paper shows structured reasoning improves accuracy, but it also costs more steps. That means the team should preserve rigor while using it selectively.

If you make every engineer fill the full heaviest template for every tiny task, the method will be abandoned.

If you make the templates optional for high-risk work, the team will slide back into unsupported conclusions.

The design goal is therefore:

**maximum evidentiary pressure where correctness matters, minimum ceremony where it does not.**

## Three operating modes

## Mode A - Lite

Use for:

- low-risk repo questions
- short review comments
- local understanding before implementation

Required artifacts:

- `templates/contracts/semiformal-core-contract.md`
- relevant rows from `templates/logs/semiformal-exploration-log.md`

Minimum bar:

- explicit premises
- 2-5 evidence items
- one alternative hypothesis
- concise formal conclusion

## Mode B - Standard

Use for:

- non-trivial feature work
- bug fixing
- refactors that may preserve behavior
- design review with code-level claims

Required artifacts:

- semiformal core contract
- exploration log
- one task-specific certificate or change-safety certificate

Minimum bar:

- traced execution path or dependency path
- explicit assumptions
- counterexample search
- formal recommendation

## Mode C - Deep

Use for:

- patch equivalence or solution verification
- high-risk refactors
- ambiguous production bugs
- migration behavior changes
- merge approval on correctness-sensitive systems

Required artifacts:

- full exploration log
- task-specific certificate
- separate unresolved-assumptions section
- explicit no-counterexample or counterexample record
- ship / no-ship conclusion

## Team policy recommendation

### Always required

For any engineering task that changes code or makes a behavior claim:

- a statement of premises
- at least one cited evidence section
- explicit assumptions
- explicit final conclusion

### Required when merge risk is meaningful

- exploration log
- alternative hypothesis check
- affected-path tracing
- change-safety certificate or task-specific certificate

### Required for correctness-sensitive domains

- full certificate
- reviewer spot-check of cited lines or traces
- explicit rollback or containment note

## How to keep this usable

### 1. Split the process into capture surfaces

Do not force engineers to write one huge document from scratch.
Instead, capture evidence as it is discovered:

- hypothesis / evidence / confidence while exploring
- function trace and data flow while tracing code
- certificate only after enough evidence exists

### 2. Separate confidence from evidence quality

The paper shows detailed reasoning can still be wrong if it is incomplete.
So the operating system should track:

- confidence in current answer
- quality of evidence
- completeness of trace
- unresolved assumptions

A high-confidence answer with low evidence completeness must not be treated as done.

### 3. Make reviewers inspect the evidence spine, not prose length

Reviewers should check:

- are the premises specific?
- do claims cite real evidence?
- was the opposite answer checked?
- does the conclusion actually follow?

### 4. Do not overfit to the benchmark tasks

The paper studied patch equivalence, fault localization, and code QA.
Your team will use this for:

- change safety
- review readiness
- migration correctness
- debugging
- behavior explanations

That is fine, as long as the same certificate logic is preserved.

## Suggested engineering checkpoints

### During investigation

- hypotheses are explicit
- next file request has a rationale
- observations include locations
- unresolved questions remain visible

### Before implementation

- intended behavior is stated as premises
- risky paths are identified
- counterexamples are anticipated

### Before merge

- certificate exists
- final conclusion names what is proven vs assumed
- unresolved risks are visible
- reviewer can replay the reasoning from the artifact

## Suggested repo operating model

Create a top-level reasoning surface in every project:

- `docs/reasoning/` for policies and examples
- `templates/reasoning/` for the contracts in this bundle
- `.hforge/templates/` or equivalent if using Harness Forge-like installation

Then wire usage into:

- task briefs
- review templates
- risky change workflow
- incident and postmortem follow-up

## Anti-patterns to ban

- evidence appearing only after the answer is chosen
- conclusions that rely on "probably" while omitting unresolved assumptions
- file requests with no hypothesis
- rank-ordered bug candidates with no claim support
- "same behavior" claims derived only from diff similarity
- broad semantic claims without traced code paths

## The simplest universal rule

For all engineers, in all projects:

> No important behavior claim is complete until it has premises, traced evidence, an alternative-hypothesis check, and a formal conclusion.

That one rule is the smallest reliable universalization of the paper.
