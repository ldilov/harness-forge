# Go

`knowledge-bases/structured/go/` is the structured knowledge pack for Go.

## When to Install

- the repo contains `.go` files or `go.mod`
- the task touches services, CLIs, automation, or concurrency-sensitive code
- the change needs idiomatic package, interface, and testing guidance

## Pack Depth

- overview, review checklist, and framework notes
- promoted rules in `rules/golang/`
- canonical skill in `skills/go-engineering/SKILL.md`
- workflow template in `templates/workflows/implement-go-change.md`

## Examples

- `knowledge-bases/structured/go/examples/01-reference-scenario.md`

## Framework Overlays

- `framework:gin`

## Validation Cues

- run the repo build or test path after implementation
- call out package-boundary or concurrency risks before closing the task
