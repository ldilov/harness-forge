# Stacked Diffs And Review

## When to stack instead of shard

Use stacked branches when each change logically depends on the previous one but is still small enough to review on its own.

## Best practices

- keep each diff narrow and coherent
- make dependencies explicit in the branch order
- rebase the stack regularly onto the base branch or the previous landed diff
- merge from the bottom of the stack upward
- do not hide unrelated cleanup inside a dependency stack

## Review rule

A stack should speed review, not create archaeology. If reviewers cannot understand a diff without reading the whole stack, the slices are wrong.
