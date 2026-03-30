---
name: madr-decision-log
description: create, review, normalize, validate, and maintain markdown architectural decision records using madr conventions. use when a repository needs durable adr files, a repeatable docs/decisions workflow, adr indexing, status updates, supersession handling, or file-based quality checks around decision records.
---

# MADR Decision Log

## Trigger Signals

- a decision should become a durable markdown record rather than remain trapped in chat or meeting notes
- the repository needs a `docs/decisions/` practice with numbering, indexing, review, and validation
- an ADR should be reviewed, normalized, superseded, or updated without losing historical meaning
- the team wants a file-oriented MADR workflow rather than a lightweight one-off decision summary

## Inspect First

- existing ADRs, RFCs, design docs, and release notes that already touch the same decision
- whether the repository already uses `docs/decisions/`, another decision directory, or a numbering convention worth preserving
- whether the request is about creating a new ADR, reviewing one, bootstrapping an ADR corpus, or maintaining an existing ADR log
- whether the repo already emits machine-readable decision indexes under runtime surfaces such as `.hforge/runtime/decisions/`; keep those derived artifacts separate from the authored markdown ADRs

## Workflow

1. determine the mode: create, review, bootstrap, or maintain
2. default to authored ADR files under `docs/decisions/` unless the repository already has a different documented location
3. use the canonical template and conventions from:
   - `skills/madr-decision-log/references/adr-template.md`
   - `skills/madr-decision-log/references/madr-reference.md`
   - `skills/madr-decision-log/references/review-checklist.md`
4. when repository artifacts are needed, use the packaged scripts instead of rebuilding helpers ad hoc:
   - `python skills/madr-decision-log/scripts/new_adr.py --dir docs/decisions --title "<decision title>"`
   - `python skills/madr-decision-log/scripts/validate_madr.py docs/decisions`
   - `python skills/madr-decision-log/scripts/build_log.py docs/decisions`
5. preserve existing numbering, folder rules, and terminology when the repository already has an ADR practice
6. when a decision is superseded, keep the old ADR, update its status, link the successor, and rebuild the ADR log

### Create mode

- capture the problem statement, decision drivers, considered options, chosen option, consequences, confirmation strategy, and known stakeholders
- scaffold the file with `skills/madr-decision-log/scripts/new_adr.py` when the user wants repository artifacts
- write the ADR using the MADR structure and keep option names consistent across sections
- validate before handoff with `skills/madr-decision-log/scripts/validate_madr.py`

### Review mode

- compare the ADR against `skills/madr-decision-log/references/review-checklist.md`
- separate structural issues, reasoning gaps, missing metadata, and wording improvements
- keep the decision meaning intact while normalizing the document into clearer MADR shape
- when the user asked for review only, do not silently rewrite first; report the issues and then provide a corrected version or patch

### Bootstrap mode

- create `docs/decisions/` if it does not exist
- create or propose an initial repository-level ADR such as `0001-record-architecture-decisions.md` when a seed decision is useful
- build `ADR-LOG.md` from the actual ADR files using `skills/madr-decision-log/scripts/build_log.py`
- validate the directory using `skills/madr-decision-log/scripts/validate_madr.py`

### Maintenance mode

- update status and supersession links without deleting historical ADRs
- rebuild `ADR-LOG.md` after filename, status, or path changes
- treat the ADR log as a generated navigation artifact; the ADR files remain the source of truth

## Output Contract

- repository-ready MADR markdown or an explicit review report, depending on the request
- preserved numbering and directory conventions unless a change was requested
- validation results when files were created or updated
- explicit note on supersession, confirmation, and follow-up links when the decision changes over time

## Failure Modes

- the task is still exploratory and no stable decision exists yet
- the repository already has an ADR convention, but the response would overwrite it instead of extending it
- chosen option names drift across sections and make the ADR inconsistent
- the request mixes authored ADR files with generated runtime decision indexes and loses the source-of-truth distinction

## Escalation

- escalate when the decision changes public contracts, cross-team ownership, migration policy, or release obligations
- escalate when a requested rewrite would change the historical meaning of an existing ADR rather than clarify it
- escalate when the repository already has conflicting ADR practices and the owner must choose the canonical one

## References

- `skills/madr-decision-log/references/adr-template.md`
- `skills/madr-decision-log/references/madr-reference.md`
- `skills/madr-decision-log/references/review-checklist.md`
- `skills/madr-decision-log/scripts/new_adr.py`
- `skills/madr-decision-log/scripts/validate_madr.py`
- `skills/madr-decision-log/scripts/build_log.py`
