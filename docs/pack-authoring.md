# Pack Authoring

Use this guide when adding a new language or capability pack.

## Minimum content for a first-class language pack

- language overview
- review checklist or equivalent review guidance
- framework notes where relevant
- at least one scenario example
- coding style, patterns, testing, security, and hooks guidance

## Seeded pack workflow

1. import or author the canonical pack content
2. map every shipped file in `manifests/catalog/seeded-knowledge-files.json`
3. add the knowledge base path to bundle manifests
4. add catalog and rules entry docs
5. run `npm run validate:release`
