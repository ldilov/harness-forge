---
name: impact-analysis
description: universal change impact analysis for software, infrastructure, data, api, schema, configuration, ui, security, and operational work. use when evaluating a proposed or implemented change, diff, migration, dependency upgrade, rollout, hotfix, refactor, incident remediation, or architectural decision to determine what is affected, how much is affected, how risky the change is, which direct and indirect dependencies may break, which evidence supports the assessment, and what validation, rollout, and rollback plan is required.
---

# Impact Analysis

## Overview

Use this skill to turn a change into a structured impact model instead of a vague intuition. Treat impact quantity, risk, and confidence as separate dimensions:

- **impact quantity** = how much of the system, workflow, or organization is touched
- **risk** = how likely the change is to cause harm and how severe that harm could be
- **confidence** = how strong the evidence is behind the analysis

A wide change is not always risky. A tiny change can be extremely risky. Keep these dimensions independent.

## Trigger Signals

- a proposed or implemented change needs blast-radius analysis before approval, rollout, or rollback
- the task involves a diff, migration, dependency upgrade, config change, rollout, hotfix, refactor, incident remediation, or architectural decision
- the user needs a structured answer about what is affected, how risky the change is, what evidence supports the analysis, or what safeguards are required

## Inspect First

- the actual diff, PR, migration, schema, manifest, config, dashboard, or runtime artifact that defines the change
- direct consumers, downstream contracts, test coverage, and observability definitions before scoring
- existing rollout, rollback, incident, or release notes that already constrain the change
- the most trustworthy evidence tier available; if the analysis is mostly assumptions, keep confidence low and label the gaps

## Workflow

Run this workflow in order:

1. **Normalize the change**
2. **Build the impact graph**
3. **Check the change through the eight impact lenses**
4. **Score impact quantity, risk, and confidence**
5. **Produce a report with validation and rollback guidance**

When the user gives a real diff, PR, migration, or proposal, base the analysis on evidence from the artifacts first. Use assumptions only when evidence is missing, and label them explicitly.

## 1. Normalize the Change

Start by reducing the request into a compact change record:

- **change summary**: what is being changed
- **change type**: feature, fix, refactor, dependency upgrade, schema change, config change, infra change, rollout, permissions change, documentation/process change, or mixed
- **change stage**: proposed, in review, implemented, deployed, or post-incident
- **artifacts touched**: code, contracts, schemas, manifests, pipelines, dashboards, docs, tests, feature flags
- **rollout mode**: big bang, phased, canary, shadow, flag-based, migration-based
- **constraints**: uptime, compatibility, compliance, latency, cost, release deadline

If the user input is ambiguous, infer the smallest defensible change record and state the assumptions.

## 2. Build the Impact Graph

Model the change as nodes and edges before scoring it.

Use these node types:

- **component**: service, package, module, library, frontend, job, worker
- **contract**: api endpoint, event, message schema, cli, file format
- **data**: table, column, cache key, index, object store path, retention rule
- **runtime**: config, flag, secret, environment variable, resource limit
- **control plane**: pipeline, deployment, IAM, policy, network rule, scheduler
- **workflow**: user journey, support flow, ops runbook, analyst workflow, business process

Map these relationships when relevant:

- calls / imports / depends on
- publishes to / subscribes to
- reads / writes / transforms
- configures / gates / deploys
- monitors / alerts on / rolls back
- owned by / approved by / operated by

Always distinguish:

- **direct impact**: touched by the change itself
- **indirect impact**: affected through dependencies or consumers
- **latent impact**: unlikely to fail immediately but may drift, degrade, or surprise later

## 3. Check the Eight Impact Lenses

Inspect the change through all eight lenses below. Do not stop at compile-time or unit-test boundaries.

### Lens A: functional behavior
- Does behavior change for users, operators, batch jobs, or downstream systems?
- Does the change alter defaults, edge-case behavior, retries, ordering, or idempotency?

### Lens B: contracts and compatibility
- Does the change alter APIs, payloads, events, schemas, public types, CLI flags, file formats, or expected semantics?
- Is it backward compatible, forward compatible, versioned, or breaking?

### Lens C: data semantics and lifecycle
- Does it change storage shape, meaning, migration paths, retention, indexing, cache invalidation, or replay behavior?
- Could old and new data coexist safely during rollout and rollback?

### Lens D: runtime and operational characteristics
- Does it change latency, throughput, memory, CPU, concurrency, scheduling, startup, deployment topology, autoscaling, or failure modes?
- Does it create new operational burden or reduce existing burden?

### Lens E: security, privacy, and compliance
- Does it touch permissions, secrets, authn/authz, data classification, auditability, or policy boundaries?
- Could it widen access or reduce traceability?

### Lens F: observability and diagnosability
- Will the team notice regressions quickly?
- Are metrics, logs, traces, dashboards, alerts, and probes aligned with the new behavior?

### Lens G: delivery and rollback mechanics
- Can the change be rolled back cleanly?
- Does rollback require data repair, dual writes, compatibility windows, or coordinated releases?

### Lens H: human and process coupling
- Does the change affect documentation, support, onboarding, QA, incident playbooks, stakeholder communication, or manual workflows?
- Could it create silent process debt even if the code is safe?

Use the detailed heuristics in [references/impact-lenses.md](references/impact-lenses.md) when the change spans multiple domains.

## 4. Score the Change

Use the quantitative model in [references/scoring-model.md](references/scoring-model.md).

### Scoring rules

- Score **impact quantity**, **risk**, and **confidence** separately.
- Use **0 to 5** per factor, then calculate the final score on a **0 to 100** scale.
- Attach one sentence of evidence or rationale to every factor scored above 2.
- Do not hide uncertainty inside fake precision. If evidence is weak, reduce confidence.
- If the change affects security, regulated data, money movement, destructive migrations, or irreversible workflows, bias toward higher risk unless strong mitigations are proven.

### Fast path

When you already have factor ratings, run:

```bash
python scripts/impact_score.py --input assets/sample-scorecard.json --format markdown
```

For real analyses, replace the example file with a user-specific scorecard JSON using the same schema.

### Required output from scoring

Always report:

- **impact quantity score and band**
- **risk score and band**
- **confidence score and band**
- **escalators triggered**
- **top three uncertainty drivers**

## 5. Produce the Report

Use the structure in [references/output-template.md](references/output-template.md).

Every finished analysis should include:

1. **executive summary**
2. **change fingerprint**
3. **impact inventory**
4. **scorecard**
5. **evidence and assumptions**
6. **validation plan**
7. **rollout and rollback notes**
8. **recommended decision**

## Output Contract

- an executive summary that separates impact quantity, risk, and confidence
- a compact change fingerprint covering scope, stage, rollout mode, and constraints
- an impact inventory across direct, indirect, and latent effects
- a scorecard with evidence-backed drivers, escalators, uncertainty, validation, and rollback guidance
- a final recommendation using one of: approve, approve with safeguards, needs more evidence, redesign before merge, or stage behind compatibility window

## Guardrails

### Separate scope from danger

Do not collapse these questions:

- “how many things does this touch?”
- “how dangerous is it?”
- “how sure are we?”

These are different.

### Treat evidence hierarchically

Prefer evidence in this order:

1. actual diff, migration, manifest, config, schema, or runtime artifact
2. repository-wide references and consumers
3. tests and monitoring definitions
4. tickets, design docs, commit messages, release notes
5. assumptions

If the analysis relies mostly on tiers 4 or 5, confidence should stay low.

### Look for second-order effects

Always ask:

- what consumes this indirectly?
- what is cached, replicated, retried, or replayed?
- what breaks only during rollback, failover, scale-up, or partial deployment?
- what remains “working” but becomes harder to observe or operate?

### Detect common false negatives

Treat these patterns as suspicious even if the diff is small:

- dependency upgrades with transitive changes
- config or flag default changes
- schema changes labeled “non-breaking” without consumer proof
- auth or permission changes
- retry, timeout, queue, or concurrency changes
- serialization and parsing changes
- clock, ordering, timezone, locale, or currency logic
- cache key or invalidation changes
- feature enablement without observability updates

### Detect common false positives

Reduce risk when strong evidence shows:

- the change is isolated behind an internal boundary
- interfaces remain stable and verified by contract tests
- rollback is trivial and well rehearsed
- coverage includes integration, migration, and operational checks
- rollout is gated and observable

## Decision Output

End with one of these recommendations:

- **approve**
- **approve with safeguards**
- **needs more evidence**
- **redesign before merge**
- **stage behind compatibility window**

Include the minimum safeguards needed to move the decision one level safer.

## Failure Modes

- treating a small diff as low impact without checking downstream consumers, rollout mechanics, or observability
- collapsing impact quantity, risk, and confidence into one score and hiding uncertainty
- relying on tickets, design notes, or intuition without checking the concrete artifacts that define the change
- calling a rollback safe without proving data, compatibility, and operational recovery paths

## Escalation

- escalate when the change affects security boundaries, regulated or sensitive data, money movement, or irreversible workflows
- escalate when confidence stays low because consumer coverage, migration reasoning, or observability evidence is missing
- escalate when approval depends on coordinated multi-service rollout, compatibility windows, or non-lossless rollback

## Example Use Cases

Use [references/examples.md](references/examples.md) for compact examples covering:

- dependency upgrade with low direct scope but medium operational risk
- schema migration with high impact quantity and high rollback difficulty
- refactor with broad code touch but low external risk

## Resources

- [references/impact-lenses.md](references/impact-lenses.md): deep heuristics by impact lens
- [references/scoring-model.md](references/scoring-model.md): factor definitions, formulas, bands, and escalators
- [references/output-template.md](references/output-template.md): report skeleton
- [references/examples.md](references/examples.md): compact worked examples
- [scripts/impact_score.py](scripts/impact_score.py): deterministic score calculator
- [assets/sample-scorecard.json](assets/sample-scorecard.json): example input schema for the calculator
