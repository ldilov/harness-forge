# Profile Guide

Profiles are behavioral overlays that change how Harness Forge recommends,
installs, validates, and recovers work. A real profile does more than label a
bundle set: it changes skill emphasis, validation strictness, review depth, and
risk posture.

## What a profile controls

- default bundles and capabilities
- preferred skills
- recommended hooks
- validation strictness
- review depth
- risk posture
- target compatibility

## Shipped profiles

| Profile | Primary use | Validation | Review | Risk posture |
| --- | --- | --- | --- | --- |
| `core` | smallest portable install | standard | standard | balanced |
| `developer` | day-to-day implementation | standard | standard | balanced |
| `reviewer` | correctness and compatibility review | strict | deep | low |
| `security` | trust boundaries and sensitive services | strict | deep | low |
| `release-manager` | release and package safety | strict | deep | low |
| `rapid-prototyping` | fast iteration | lenient | shallow | aggressive |
| `legacy-modernization` | incremental cleanup of older repos | strict | deep | low |
| `research-first` | decision-heavy discovery work | standard | deep | balanced |
| `game-dev-native` | native and scripting-heavy game loops | standard | standard | balanced |
| `ai-runtime` | orchestration, evaluation, and agent runtime work | strict | deep | balanced |

## Practical guidance

- use `core` when you need the smallest durable baseline
- use `developer` for routine implementation with repo intelligence and flow
  recovery
- use `reviewer`, `security`, or `release-manager` when correctness and safety
  dominate
- use `legacy-modernization` or `research-first` when discovery is the hard
  part
- use `rapid-prototyping` only when speed matters more than deep validation

## Machine-readable source of truth

Profile manifests live under `manifests/profiles/*.json`. Each profile declares
bundle ids, preferred skills, recommended hooks, and target compatibility so
recommendations and validation surfaces can stay aligned.
