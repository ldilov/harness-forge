# Contract: Language Pack Completeness

## Purpose

Define what makes a Harness Forge language pack first-class and shippable.

## Required baseline guidance

Every first-class language pack must include:

- coding style guidance
- patterns guidance
- testing guidance
- security guidance
- hooks guidance

## Required supporting documentation

Every seeded language pack in scope for this feature must also provide:

- overview documentation
- review checklist or review guidance
- framework or tooling notes where relevant
- at least one concrete scenario example

## Seeded language packs covered by this feature

- TypeScript
- Java
- .NET
- Lua
- PowerShell

## Maturity expectations

- each language pack must declare a visible maturity level
- seeded languages must not be presented as first-class if the baseline
  guidance set is incomplete
- framework-heavy guidance can be split into follow-on docs, but the baseline
  pack must remain useful on its own

## Validation guarantees

- manifest entries must resolve to real language assets
- docs and examples must not point to missing files
- seeded pack content must be materially present, not represented only by empty
  folders
