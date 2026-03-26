# Merge Readiness

## A track is merge-ready when

- its direct prerequisites are landed or no longer required
- validation passes in the same shape the base branch expects
- conflict hotspots were rebased recently enough to trust the diff
- no hidden dependency on unpublished generated output or local-only state remains

## Merge blockers to call out explicitly

- schema or API prerequisites not landed yet
- lockfile or root-config conflicts likely on rebase
- failing tests caused by another branch's unpublished changes
- code-owner or release-window constraints
