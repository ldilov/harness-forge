# Change Discipline

The imported pack required every meaningful skill, script, and reference change
to be captured in a structured change log. Harness Forge keeps that rule as a
project-owned discipline even before the translated helper commands land.

## Record these fields

- monotonically increasing change id
- UTC timestamp
- change type such as docs, rules, script, reference, or fix
- one-line summary
- short detail bullets
- touched-file list

## Update triggers

- a canonical skill contract changes materially
- a supporting reference or helper surface changes
- runtime wiring or compatibility guidance changes
- validation, governance, or provenance rules change

## Minimal entry template

- id
- date
- type
- summary
- details
- files

## MVP operating rule

Until package-owned helper commands land, capture the same fields manually in
the relevant feature notes, task updates, or maintainer-facing provenance. Keep
the entry explicit enough that another maintainer can understand what changed
and why without diff archaeology.
