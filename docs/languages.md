# Languages

Harness Forge has two language-pack tiers:

- seeded packs under `knowledge-bases/seeded/`
- structured packs under `knowledge-bases/structured/`

Each language pack is expected to expose docs, rules, skills, examples, and at
least one workflow surface that can be recommended or installed intentionally.

Agent runtimes should discover language packs through `.agents/skills/` and
then execute against the canonical `skills/` surface plus any attached
`references/` depth.

## How recommendations use them

- dominant repo language signals drive `lang:*` bundle recommendations
- framework signals extend a base language recommendation with `framework:*`
  packs
- high-risk or weakly validated repos also receive skill, profile, and
  validation guidance

## Current emphasis

- seeded packs preserve imported source knowledge with file-level traceability
- structured packs provide deeper operational guidance where the source archive
  was missing
- framework packs overlay repo-shape context on top of language guidance

See `docs/catalog/language-packs.md` for pack coverage and
`docs/catalog/framework-packs.md` for framework overlays.
