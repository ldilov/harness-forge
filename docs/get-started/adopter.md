# Adopter Guide

This guide is for operators who want the smallest useful Harness Forge install
for a repository and a clear path to expand it later.

## Install Profiles

- Minimal: install the smallest stable runtime surface for the chosen target.
- Recommended: install the baseline runtime plus common workflow and intelligence support.
- Full: install the broadest runtime footprint for teams that want all packaged guidance available immediately.

## Key Runtime Truth Files

- `.hforge/manifests/installed-packs.json`: which packs are currently selected in the workspace
- `.hforge/manifests/selected-profile.json`: which profile selected the current pack set
- `.hforge/manifests/materialization-index.json`: which operations materialized which workspace surfaces
- `.hforge/runtime/repo/recommendation-evidence.json`: why selected packs or profiles matched repo recommendations
- `.hforge/runtime/provenance/index.json`: ownership and edit-policy records for managed surfaces
- `.hforge/runtime/provenance/update-action-plan.json`: dry-run style action recommendations for update flows

## Recommended Commands

```bash
npx @harness-forge/cli bootstrap --root . --yes
hforge pack list --root . --json
hforge pack explain baseline:agents --root . --json
hforge profile list --root . --json
hforge profile inspect recommended --root . --json
```

## When To Expand

- Move from minimal to recommended when repo-aware recommendations or release checks start to matter.
- Move from recommended to full when the team wants broader skills, validation, and authored guidance preinstalled.
- Re-run install or refresh after changing packs so runtime manifests and provenance stay current.
