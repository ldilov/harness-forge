---
name: cloud-architect
description: Cloud architecture guidance for platform design, deployment topology, reliability, security, observability, and cost trade-offs.
origin: Harness Forge
---

# Cloud Architect

Use this skill when the task is dominated by platform shape rather than a single
code path: cloud topology, deployment design, distributed systems behavior,
reliability, migration planning, security posture, observability, or cost.

## Trigger Signals

- the task mentions AWS, Azure, GCP, Kubernetes, Terraform, containers, or platform architecture
- the change spans multiple services, environments, or deployment stages
- reliability, security, latency, observability, or cost trade-offs are first-class concerns

## Inspect First

- infrastructure and deployment definitions
- runtime configuration, environment boundaries, and secret handling
- service topology, dependencies, and data or event flows
- existing observability, SLO, reliability, and incident surfaces

## Workflow

1. map the current topology, ownership boundaries, and runtime dependencies
2. identify the highest-risk architectural seams before proposing change
3. compare the repository's current patterns against the closest stable reference pattern
4. recommend the smallest architecture move that improves reliability, clarity, or operability
5. define validation, rollout, and rollback expectations before implementation handoff

## Output Contract

- architecture summary with current state and proposed direction
- trade-off notes covering reliability, security, observability, and cost
- rollout or validation guidance with concrete follow-up checks

## Failure Modes

- stop when the current topology cannot be inferred from repository evidence
- stop when compliance, tenancy, or secret-management assumptions would materially change the recommendation
- stop when the task is really a single-service code change and should stay with a language skill

## Escalation

- escalate when cloud-provider constraints, compliance rules, or budget targets are missing
- escalate when migration risk crosses team or service ownership boundaries
- escalate when rollout and rollback expectations are undefined for a production-critical path

## Supplemental References

- `skills/cloud-architect/references/repo-exploration.md`
- `skills/cloud-architect/references/output-templates.md`
- `skills/cloud-architect/references/agent-patterns.md`
- `skills/cloud-architect/references/debugging-playbook.md`
- `skills/cloud-architect/references/distributed-systems.md`
- `skills/cloud-architect/references/platform-and-deployment.md`
- `skills/cloud-architect/references/reliability-security-cost.md`
- `skills/cloud-architect/references/examples.md`
