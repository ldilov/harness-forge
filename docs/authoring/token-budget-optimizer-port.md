# Token Budget Optimizer Port Governance

This document records how the March 2026 `hforge-token-budget-optimizer`
archive was ported into Harness Forge.

## Source pack

- Pack name: `Harness Forge Token Budget Optimizer Skill Pack`
- Inventory record: `manifests/catalog/token-budget-optimizer-import-inventory.json`
- Imported scope:
  - context compaction and reuse-first operating guidance
  - token-surface audit heuristics
  - a promotion ladder for choosing what belongs in active context
  - a deterministic helper script for identifying high-value low-cost surfaces
  - OpenAI-oriented runtime metadata in `agents/openai.yaml`

## Canonical outcome

Harness Forge now owns one canonical token-budget optimization surface at
`skills/token-budget-optimizer/SKILL.md`.

The port preserves the imported pack's distinctive value:

- compact first, scan later
- prefer authoritative runtime summaries over repeated broad repo reads
- keep context costs explicit instead of relying on intuition alone
- reuse task artifacts, decision records, repo maps, and command catalogs before
  re-deriving them in chat

## Artifact decisions

| Imported artifact | Outcome | Project-owned destination | Why |
| --- | --- | --- | --- |
| `hforge-token-budget-optimizer/SKILL.md` | embed | `skills/token-budget-optimizer/SKILL.md` | the responsibility is distinct and should be first-class in the skill library |
| `hforge-token-budget-optimizer/references/*.md` | embed | `skills/token-budget-optimizer/references/` | the audit dimensions, promotion ladder, scoring model, and report template are direct runtime guidance |
| `hforge-token-budget-optimizer/scripts/inspect_token_surfaces.py` | embed | `skills/token-budget-optimizer/scripts/inspect_token_surfaces.py` | the helper is deterministic and useful across supported runtimes |
| `hforge-token-budget-optimizer/agents/openai.yaml` | translate | this document plus the canonical wrapper | runtime-specific metadata becomes maintainer provenance instead of a universal contract |

## Imported metadata summary

The source pack carried one OpenAI-oriented descriptor under
`agents/openai.yaml`. Harness Forge treats that file as provenance only and
keeps cross-agent discovery in the project-owned wrapper under
`.agents/skills/token-budget-optimizer/SKILL.md`.

## Promotion intent

This skill is intentionally promoted because it improves one of Harness Forge's
core product promises: lower token burn through better reuse of installed
runtime knowledge.

The intended workflow is:

1. consult existing runtime and task artifacts first
2. keep only the smallest authoritative set of surfaces in active context
3. expand into focused code reads only when the compact context is not enough

## Runtime compatibility baseline

- Codex: translated support through canonical skill, wrapper, and packaged helper
  script
- Claude Code: translated support through canonical skill, wrapper, and packaged
  helper script
- Cursor: guidance-first support
- OpenCode: guidance-first support

This keeps support claims honest while still making the skill broadly usable.

## Acceptance rules for future updates

- keep `manifests/catalog/token-budget-optimizer-import-inventory.json` aligned
  with every imported artifact and follow-up translation
- preserve one canonical `skills/token-budget-optimizer/` surface instead of
  creating variants with overlapping responsibility
- do not promote compaction in ways that hide release gates, support posture,
  migration steps, or other safety-critical details
- keep runtime-specific metadata maintainer-facing unless project-owned
  cross-agent surfaces are explicitly added
