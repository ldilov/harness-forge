# Contract: Catalog Manifests

## Purpose

Define the manifest contract that drives install planning, bundle selection,
target compatibility, and migration.

## Manifest families

- `bundles`
- `profiles`
- `targets`
- `transforms`
- `migrations`
- `catalog`

## Bundle manifest requirements

Each bundle manifest must define:

- `id`
- `family`
- `version`
- `description`
- `paths`
- `targets`
- `dependencies`
- `conflicts`
- `optional`
- `defaultInstall`
- `stability`
- `tags`
- `owner`
- `usageCues`

## Target manifest requirements

Each target manifest must define:

- `id`
- `displayName`
- `installRootStrategy`
- `pathMappings`
- `mergeRules`
- `supportsHooks`
- `supportsCommands`
- `supportsAgents`
- `supportsContexts`
- `supportsPlugins`
- `capabilityMatrix`
- `postInstallGuidanceStrategy`

## Profile manifest requirements

Each profile manifest must define:

- `id`
- `description`
- `bundleIds`
- `recommendedTargets`
- `recommendedLanguages`
- `recommendedCapabilities`

## Validation guarantees

- Every declared path must exist in the packaged artifact.
- Every dependency must resolve.
- Every conflict must refer to a valid bundle id.
- Target capability mismatches must surface as warnings or errors before apply.
- Migration manifests must explicitly mark partial or manual mappings.
