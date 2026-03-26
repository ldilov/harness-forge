# Task Sharding Rules

## Good split signals

- packages or services with clean ownership boundaries
- additive work that touches separate source roots
- changes that can be reviewed and validated independently
- one shared prerequisite followed by several independent follow-up tracks

## Bad split signals

- one migration or contract change every track depends on immediately
- repo-wide formatting or config edits mixed with feature work
- shared generated artifacts or lockfiles touched by all tracks
- a cross-cutting refactor disguised as many small tasks

## Preferred strategy

- isolate the prerequisite or high-risk seam first
- keep follow-up tracks small and purpose-built
- sequence contract or schema changes ahead of consumer updates when possible
- leave root-level cleanup or broad modernization for a dedicated track, not mixed into feature branches
