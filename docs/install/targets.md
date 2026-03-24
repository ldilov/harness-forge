# Target Installation Guide

Harness Forge currently ships target-aware installation for:

- Codex
- Claude Code

Each target adapter defines:

- install destinations
- merge behavior
- post-install guidance strategy
- supported capability surface

## Seeded knowledge behavior

Seeded language bundles now ship their full imported knowledge base under
`knowledge-bases/seeded/<language>`. Dry-run output should show those paths as
copy operations when a seeded language pack is selected.
