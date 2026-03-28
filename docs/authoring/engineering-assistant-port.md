# Engineering Assistant Port Governance

This document records how the March 2026 `engineering-assistant` archive was
ported into Harness Forge.

## Source pack

- Pack name: `Engineering Assistant Skill Pack`
- Inventory record: `manifests/catalog/engineering-assistant-import-inventory.json`
- Imported scope:
  - architecture and implementation orchestration guidance
  - practical SOLID and pattern heuristics
  - skill-composition rules for delegated specialist work
  - project-memory expectations through `PROJECT_NOTES.md`
  - structured change-discipline expectations through `CHANGELOG.md`
  - OpenAI-oriented runtime metadata in `agents/openai.yaml`

## Canonical outcome

Harness Forge now owns one canonical engineering-assistant surface at
`skills/engineering-assistant/SKILL.md`.

The port keeps the imported pack's distinctive value:

- architecture plus implementation collaboration in one skill
- explicit trade-off framing with at least two viable options
- named invariants and small, reversible execution slices
- mandatory project-memory upkeep
- mandatory change-discipline guidance for meaningful edits

## Artifact decisions

| Imported artifact | Outcome | Project-owned destination | Why |
| --- | --- | --- | --- |
| `engineering-assistant/SKILL.md` | embed | `skills/engineering-assistant/SKILL.md` | the imported responsibility is distinct and should be first-class in the library |
| `engineering-assistant/references/*.md` | embed | `skills/engineering-assistant/references/` | the architecture, SOLID, and composition playbooks are direct runtime guidance |
| `engineering-assistant/PROJECT_NOTES.md` | adapt | `skills/engineering-assistant/references/project-notes.md` | the structure matters, but the sample state should not ship as live package memory |
| `engineering-assistant/CHANGELOG.md` | adapt | `skills/engineering-assistant/references/change-discipline.md` | the structure matters, but the sample entries should not ship as live package state |
| `engineering-assistant/scripts/*.py` | adapt | this document plus later runtime-helper tasks | the behavior is valuable, but package-owned helpers should be shared and cross-agent aware |
| `engineering-assistant/agents/openai.yaml` | translate | this document plus later runtime-wrapper tasks | metadata from one runtime becomes compatibility guidance, not a universal descriptor |

## Imported metadata summary

The source pack described itself as:

- display name: `Engineering Assistant`
- short description: architecture and implementation collaborator with strict
  change logging and project notes
- icon: `wrench`
- accent color: `#2F6FED`

Harness Forge preserves that intent in the canonical skill wording and uses the
metadata values as provenance, not as a cross-runtime contract.

## Project-memory translation

The imported `PROJECT_NOTES.md` expected a maintained project snapshot,
constraints list, stack summary, mini-ADRs, open questions, and glossary.

The MVP port translates that into:

- `skills/engineering-assistant/references/project-notes.md` as the canonical
  structure and update guidance
- helper-surface planning in the inventory so later runtime commands can update
  those notes deterministically

Until packaged helper commands land, operators should use the canonical
reference manually instead of relying on the original Python helper.

## Change-discipline translation

The imported `CHANGELOG.md` and `scripts/change_log.py` enforced structured
entries with:

- monotonically increasing ids
- UTC timestamps
- typed change categories
- one-line summaries
- short detail bullets
- touched-file lists

The MVP port preserves those rules in
`skills/engineering-assistant/references/change-discipline.md` and records the
helper-script translation target in the inventory. Until package-owned commands
land, operators should apply the same structure manually.

## Runtime compatibility baseline

The MVP slice intentionally stops short of claiming runtime-native parity and
does not claim runtime-native parity for any target yet.

- Codex: translated support through canonical skill and maintainer guidance
- Claude Code: translated support through canonical skill and maintainer guidance
- Cursor: guidance-only support during MVP
- OpenCode: guidance-only support during MVP

This keeps the package honest while later user stories add wrappers, target
adapters, and reusable helper commands.

## Acceptance rules for future updates

- keep `manifests/catalog/engineering-assistant-import-inventory.json` aligned
  with every imported artifact and follow-up translation
- do not ship sample-pack notes or changelog entries as live package state
- do not claim runtime-native metadata or hook parity until the translated
  package-owned surfaces exist
- prefer one canonical `skills/engineering-assistant/` surface over multiple
  diverging copies
