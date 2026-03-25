# Parallel Worktrees

Harness Forge plans parallel execution conservatively.

The generated plan should make shard ownership, validation gates, merge
criteria, and fallback-to-single-thread reasons obvious before work starts.
