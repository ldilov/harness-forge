# Architecture Playbook

Use this checklist when the engineering-assistant skill is responsible for
architecture, delivery framing, or architecture-informed implementation.

## What to produce

1. requirements and constraints, including functional and non-functional needs
2. at least two viable architecture options with trade-offs
3. the selected design with boundaries, data flow, failure modes, and operating model
4. decision records for the choices that materially shape implementation
5. a delivery plan with milestones, risks, and validation expectations

## Cloud and platform checklist

- network segmentation, ingress and egress, and private-surface expectations
- identity, secrets handling, least privilege, and workload identity
- data classification, encryption, retention, backup, and restore expectations
- reliability requirements such as SLOs, retries, idempotency, DLQs, and rollback
- observability expectations across logs, metrics, traces, dashboards, and alerts
- cost drivers such as scale knobs, storage tiers, and egress exposure

## Code architecture checklist

- ownership boundaries across modules, packages, or services
- contract stability, versioning, and backward-compatibility expectations
- domain-versus-infrastructure separation and dependency direction
- unit, integration, and contract-test coverage needed to trust the design
- error and invariant handling, including recovery and operator visibility

## Common patterns

### Backend and services

- ports and adapters when infrastructure seams need isolation
- CQRS when read and write concerns truly diverge
- outbox or transactional messaging when durable event publication matters

### Frontend and apps

- feature-based slicing with shared primitives
- explicit separation between server state and client state

### Data

- default to Postgres or another measured OLTP store before adding search or cache tiers
- add event streaming only when async workflows or multiple consumers are first-class requirements
