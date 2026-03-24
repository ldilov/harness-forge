# Generated Artifacts

Harness Forge allows generated derivative files, but only when provenance is explicit.

## Required provenance

- mark generated markdown with `generated: true`
- include `canonical_source` in metadata
- keep the canonical authored or imported source in the repository

## Files in this feature

- `manifests/catalog/seeded-knowledge-files.json` is generated from the attached starter archive mapping
- `manifests/catalog/package-surface.json` is authored and reviewed directly
- `knowledge-bases/seeded/` is imported source content, not generated output

## Drift policy

- generated derivatives must be reproducible from the canonical source
- release validation must fail when a generated file declares a missing source
- do not silently regenerate authored summaries from seeded imports
