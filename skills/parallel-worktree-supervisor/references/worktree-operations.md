# Worktree Operations

## Core commands and hygiene

Git worktree lets one repository manage multiple working trees attached to different branches. Use it when contributors need isolated working directories without cloning the repo repeatedly.

## Practical rules

- create one worktree per track with a clear branch name
- keep each worktree focused on a single reviewable objective
- prune and remove stale worktrees when tracks land or are abandoned
- lock long-lived worktrees only when there is a real reason to protect them from pruning

## Operational caution

Worktrees solve filesystem isolation, not dependency management. Shared caches, generated files, or external environments can still create cross-track interference.
