# Manifest Governance

Harness Forge uses manifests to keep installs, docs, and package surfaces aligned.

## Primary manifests

- `manifests/catalog/index.json` points to bundle, profile, target, and catalog inventories
- `manifests/catalog/language-assets.json` maps language packs to their surfaced docs and rule entrypoints
- `manifests/catalog/seeded-knowledge-files.json` provides file-level coverage for the imported starter archives
- `manifests/catalog/package-surface.json` defines the required published file surface

## Update rules

- add or change seeded files only with a matching update to the seeded coverage manifest
- keep package surface paths aligned with `package.json` publish configuration
- do not reference template validators from docs unless the paths are shipped in the package
