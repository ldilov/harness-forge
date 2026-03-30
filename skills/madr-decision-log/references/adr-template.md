# Canonical MADR ADR Template

Use this template as the default starting point.

```md
---
status: proposed
date: YYYY-MM-DD
decision-makers:
  - name 1
consulted:
  - name 2
informed:
  - name 3
---

# Short title that captures the problem and chosen direction

## Context and Problem Statement

Describe the situation that requires a decision. State the problem as a durable engineering concern, ideally in two to five sentences. A question-style problem statement is acceptable when it makes the trade-off clearer.

## Decision Drivers

* Driver 1
* Driver 2
* Driver 3

## Considered Options

* Option A
* Option B
* Option C

## Decision Outcome

Chosen option: "Option A", because it best satisfies the key decision drivers while keeping the main trade-offs acceptable.

### Consequences

* Good, because it simplifies the deployment topology.
* Neutral, because it requires minor migration work.
* Bad, because it increases coupling in one boundary.

### Confirmation

Describe how the team will confirm the decision is implemented or followed correctly. Prefer observable checks such as tests, architecture reviews, runbooks, dashboards, lint rules, or release gates.

## Pros and Cons of the Options

### Option A

Short description or link to more detail.

* Good, because it is operationally simpler.
* Good, because it reduces time-to-recovery.
* Neutral, because it requires moderate retraining.
* Bad, because it raises initial migration cost.

### Option B

Short description or link to more detail.

* Good, because it reduces lock-in.
* Bad, because it adds operational complexity.

### Option C

Short description or link to more detail.

* Good, because it minimizes short-term change.
* Bad, because it does not solve the core scalability concern.

## More Information

Add links to related ADRs, RFCs, issues, diagrams, benchmarks, or rollout notes. When superseding an ADR, link both directions.
```

## Minimal acceptable variant

Use this only when the user explicitly wants a lightweight ADR:

```md
---
status: accepted
date: YYYY-MM-DD
---

# Short title

## Context and Problem Statement

## Considered Options

* Option A
* Option B

## Decision Outcome

Chosen option: "Option A", because ...
```
