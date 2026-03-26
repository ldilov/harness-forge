---
name: repo-modernization
description: stage legacy cleanup and modernization without losing the current operating path. use when a repo has dependency drift, weak validation, outdated frameworks, monolith friction, or repeated delivery pain that needs a phased plan instead of a rewrite impulse.
---

# Repo Modernization

## Trigger Signals

- the repo is legacy, inconsistent, slow to change, or missing dependable workflows
- dependencies, framework versions, or build tooling are clearly behind the desired support window
- repeated pain shows up in build fragility, onboarding cost, release risk, or architectural drag

## Inspect First

- build, test, and release entrypoints
- runtime and framework versions, dependency manifests, and lockfiles
- architecture seams, integration boundaries, and highest-risk hotspots
- observability, CI, documentation, and rollback surfaces that determine whether change is safe

## Workflow

1. establish the current operating path and the minimum validation baseline needed to change the repo safely
2. group problems into modernization layers: visibility, build and dependency health, codebase consistency, and architecture
3. separate quick wins from seam-first refactors and from truly strategic platform changes
4. produce a staged roadmap with validation and rollback expectations for each phase
5. prefer incremental replacement and automation over big-bang rewrites unless evidence says otherwise

## Output Contract

- current-state summary with the biggest sources of drag or risk
- prioritized modernization themes and why they matter now
- phased roadmap with prerequisites, safety rails, and likely owners
- automation candidates, migration helpers, and explicit non-goals

## Failure Modes

- the repo lacks enough validation to support any meaningful modernization safely
- production topology or support commitments are too unclear to judge migration risk
- the proposed plan collapses into a rewrite with no intermediate value or rollback path

## Escalation

- escalate when modernization would break support or release commitments without a transition plan
- escalate when the work crosses multiple teams or service boundaries with no owner alignment
- escalate when data migration, security posture, or compliance constraints materially change the plan

## References

- `skills/repo-modernization/references/modernization-layers.md`
- `skills/repo-modernization/references/strangler-and-seams.md`
- `skills/repo-modernization/references/dependency-and-build-modernization.md`
- `skills/repo-modernization/references/safety-rails.md`
- `skills/repo-modernization/references/automation-candidates.md`
- `skills/repo-modernization/references/roadmap-template.md`
- `skills/repo-modernization/references/examples.md`
