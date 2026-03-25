# Contract: Repo Intelligence Output

## Purpose

Define the machine-readable and human-readable contract for repo scanning,
framework detection, and recommendation scoring.

## Required Outputs

- detected repo type
- dominant languages with evidence
- framework matches with confidence
- build and package-manager signals
- test-stack signals
- deployment signals
- risk signals
- recommended bundles
- recommended profiles
- recommended skills
- missing validation surfaces

## JSON Contract

Each result must provide:

- `repoType`
- `dominantLanguages[]`
- `frameworkMatches[]`
- `buildSignals[]`
- `testSignals[]`
- `deploymentSignals[]`
- `riskSignals[]`
- `recommendations.bundles[]`
- `recommendations.profiles[]`
- `recommendations.skills[]`
- `recommendations.validations[]`

Each recommendation entry must include:

- `id`
- `kind`
- `confidence`
- `evidence[]`
- `why`

## Behavioral Rules

- recommendation output must never be an unexplained list
- framework-level detections must be justified by explicit repo evidence
- human-readable output must preserve the same reasoning as JSON output
- confidence and evidence must be stable enough for benchmark regression tests

## Validation Rules

- benchmark scenarios must define expected detections and recommendations
- recommendation output must include at least one evidence item for each
  top-level recommendation
- unsupported or weakly supported recommendations must be clearly marked
