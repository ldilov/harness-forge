---
name: go-engineering
description: go engineering guidance for structured Harness Forge language packs.
---

# Go Engineering

Use this skill when the repository is primarily Go or when the task touches `.go` or `go.mod`.

## Activation

- Go files dominate the task or repository
- the work touches packages, services, CLIs, or concurrency-sensitive code

## Load Order

- `rules/common/`
- `rules/golang/`
- `knowledge-bases/structured/go/docs/`
- `knowledge-bases/structured/go/examples/`

## Execution Contract

1. inspect package layout and public API boundaries
2. select the common and Go-specific rules that fit the task
3. implement with explicit error handling and interface discipline
4. verify with the repo build or test path plus the structured checklist

## Outputs

- touched-package summary
- implementation summary
- validation result or blocker note

## Validation

- run the repo Go test path when available
- consult `knowledge-bases/structured/go/docs/review-checklist.md`

## Escalation

- escalate when concurrency, performance, or protocol design risks become non-local
- escalate when service boundaries remain ambiguous after discovery
