---
name: parallel-worktree-supervisor
description: plan and supervise low-overlap parallel work across git worktrees or stacked branches. use when a backlog could be split safely, when multiple small dependent changes need reviewable sequencing, or when merge-blocking risks must be made explicit before parallel execution.
---

# Parallel Worktree Supervisor

## Trigger Signals

- the backlog could be split into low-overlap tracks with clear ownership boundaries
- multiple small dependent changes need stacked review instead of one giant branch
- the team wants explicit merge blockers, rebase rules, and validation gates before parallel execution

## Inspect First

- task list or issue graph, including dependencies and shared prerequisites
- repo hotspots such as root config, lockfiles, generated artifacts, migrations, and shared contracts
- code ownership, test entrypoints, and branch protection or merge expectations
- whether worktrees, stacked branches, or plain feature branches are already in use

## Workflow

1. map tasks by dependency, risk, and shared-file overlap
2. carve the work into tracks that minimize contention on root config, generated files, and public contracts
3. assign a branch or worktree plan with base branch, stack order, and merge blockers
4. define rebase cadence, validation gates, and when a track must pause for another track to land
5. report status in terms of ready, blocked, risky overlap, or merge-ready

## Output Contract

- sharding plan with branch or worktree names and ownership notes
- explicit dependency graph and merge order
- overlap hotspots and the files or contracts that make them risky
- validation and rebase expectations for each track

## Failure Modes

- hidden coupling means the work is not actually independent enough to parallelize
- the repo relies on shared generated files, lockfiles, or root config that every track must touch
- there is no trustworthy validation path to catch skew between branches

## Escalation

- escalate when a schema, API, or root-build change affects multiple tracks at once
- escalate when stacked branches become too interdependent to review independently
- escalate when branch protection, review ownership, or release timing constraints are unclear

## References

- `skills/parallel-worktree-supervisor/references/task-sharding-rules.md`
- `skills/parallel-worktree-supervisor/references/worktree-operations.md`
- `skills/parallel-worktree-supervisor/references/stacked-diffs-and-review.md`
- `skills/parallel-worktree-supervisor/references/merge-readiness.md`
- `skills/parallel-worktree-supervisor/references/output-template.md`
- `skills/parallel-worktree-supervisor/references/examples.md`
