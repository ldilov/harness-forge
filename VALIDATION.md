# Validation

## Passed on the upgraded repo copy

- `node scripts/ci/validate-skill-depth.mjs`
- `node scripts/ci/validate-no-placeholders.mjs`

## Notes on full release smoke

A full repo-wide smoke run still reports upstream issues from the uploaded archive that are outside this skills-only enhancement pack, including missing `.specify` paths referenced by the repo metadata, missing Node dependencies in the current container session, and a pre-existing Lua example filename mismatch in the shipped knowledge base.

Those repo-level issues do not affect the upgraded skill folders included in this export.
