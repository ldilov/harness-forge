# Data Model: Harness Forge Agentic AI Platform

## Overview

Harness Forge combines runtime application state, packaged catalog content, and
assistant-facing template metadata. The model below describes the core entities
needed for planning, installation, validation, migration, and template-driven
execution.

## Entities

### Target Workspace

- **Purpose**: Represents a supported assistant environment such as Codex or
  Claude Code.
- **Core fields**:
  - `id`
  - `displayName`
  - `installRootStrategy`
  - `pathMappings`
  - `mergeRules`
  - `capabilityMatrix`
  - `postInstallGuidance`
- **Validation rules**:
  - `id` must be unique and stable.
  - Every mapping destination must resolve inside the chosen workspace root.
  - Merge rules must exist for every installable file class used by that target.

### Bundle Manifest

- **Purpose**: Defines an installable unit such as a baseline pack, language
  knowledge base, framework add-on, workflow bundle, or template collection.
- **Core fields**:
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
- **Validation rules**:
  - Every declared path must exist in the packed artifact.
  - Every dependency and conflict must resolve to a known bundle.
  - `usageCues` must be present for assistant-discoverable packs.

### Profile Manifest

- **Purpose**: Groups multiple bundles into a named install preset.
- **Core fields**:
  - `id`
  - `description`
  - `bundleIds`
  - `recommendedTargets`
  - `recommendedLanguages`
  - `recommendedCapabilities`
- **Validation rules**:
  - Profiles may only reference known bundles.
  - A profile must resolve to a target-compatible bundle set for every
    recommended target it declares.

### Template Definition

- **Purpose**: Represents a task template authored in Markdown with YAML front
  matter.
- **Core fields**:
  - `id`
  - `kind`
  - `title`
  - `category`
  - `status`
  - `version`
  - `supportedTargets`
  - `supportedLanguages`
  - `recommendedAgents`
  - `recommendedCommands`
  - `owner`
  - `generated`
  - `requiredSections`
- **Validation rules**:
  - Required front matter fields must exist.
  - Required sections must exist in order.
  - Referenced agents, commands, workflows, and validators must resolve.

### Workflow Definition

- **Purpose**: Represents a staged workflow template with explicit handoffs.
- **Core fields**:
  - `id`
  - `kind`
  - `title`
  - `mode`
  - `status`
  - `version`
  - `supportedTargets`
  - `supportedLanguages`
  - `defaultAgents`
  - `artifactsProduced`
  - `stages`
  - `handoffContracts`
- **Validation rules**:
  - Every stage must define goal, consumed inputs, produced outputs, exit
    criteria, failure conditions, and next trigger.
  - Every stage transition must have a matching handoff contract.

### Install Selection

- **Purpose**: Captures a user's requested install shape before planning.
- **Core fields**:
  - `targetId`
  - `profileId`
  - `bundleIds`
  - `languageIds`
  - `frameworkIds`
  - `capabilityIds`
  - `rootPath`
  - `mode`
  - `backupOptions`
- **Validation rules**:
  - The selection must resolve into a compatible target and bundle graph.
  - Duplicate or conflicting requested bundles must be normalized or rejected.

### Install Plan

- **Purpose**: Represents the computed preview of proposed file and metadata
  changes.
- **Core fields**:
  - `planId`
  - `selection`
  - `operations`
  - `warnings`
  - `conflicts`
  - `backupRequirements`
  - `hash`
  - `validationSummary`
- **Validation rules**:
  - Every operation must reference a known source asset and resolved destination.
  - Conflicts must be explicit before apply is allowed.
  - Plan hash must change when selected content or mappings change.

### Install Operation

- **Purpose**: Describes one planned filesystem action.
- **Core fields**:
  - `type` (`copy`, `merge`, `template-render`, `append-once`, `skip`, `remove`)
  - `sourcePath`
  - `destinationPath`
  - `mergeStrategy`
  - `reason`
  - `riskLevel`
  - `backupRequired`
- **Validation rules**:
  - `destinationPath` must remain inside the allowed workspace root.
  - `mergeStrategy` must be supported by the chosen target adapter.

### Installation State Record

- **Purpose**: Tracks what Harness Forge actually installed and can later
  inspect, repair, restore, or remove.
- **Core fields**:
  - `version`
  - `installedTargets`
  - `installedBundles`
  - `appliedPlanHash`
  - `fileWrites`
  - `backupSnapshots`
  - `timestamps`
  - `lastValidationStatus`
- **Validation rules**:
  - Recorded bundle versions must match the release catalog used at install time.
  - Every managed file path must be normalized and unique.

### Validation Run

- **Purpose**: Captures the output of a validator over templates, manifests, or
  installs.
- **Core fields**:
  - `validatorId`
  - `scope`
  - `status`
  - `findings`
  - `startedAt`
  - `finishedAt`
- **Validation rules**:
  - Findings must include severity and source reference.
  - Failing validators must return actionable messages for humans and assistants.

### Migration Mapping

- **Purpose**: Links a detected reference-project footprint to a Harness Forge
  equivalent plan.
- **Core fields**:
  - `sourceComponentId`
  - `detectedPaths`
  - `suggestedBundleIds`
  - `warnings`
  - `manualFollowUps`
- **Validation rules**:
  - Mappings must preserve visibility for unsupported or ambiguous components.
  - Migration output must never imply silent destructive replacement.

## Relationships

- A **Profile Manifest** expands into many **Bundle Manifests**.
- A **Bundle Manifest** may target many **Target Workspaces**.
- An **Install Selection** resolves to one **Install Plan**.
- An **Install Plan** contains many **Install Operations**.
- An **Installation State Record** points back to the applied plan hash and
  managed file set.
- **Template Definitions** and **Workflow Definitions** may be included by one or
  more **Bundle Manifests**.
- **Validation Runs** apply to manifests, templates, workflows, install plans,
  or installation state.
- **Migration Mappings** translate legacy footprint evidence into proposed
  bundle selections and follow-up steps.

## State Transitions

### Install Plan Lifecycle

`draft -> validated -> approved -> applied -> verified`

- `draft`: selection has been assembled but not fully checked
- `validated`: dependencies, conflicts, and target rules pass
- `approved`: user or automation confirms the plan
- `applied`: filesystem operations have run
- `verified`: post-apply validation and guidance generation succeed

### Installation State Lifecycle

`absent -> installed -> drifted -> repaired -> upgraded -> uninstalled`

- `absent`: no Harness Forge state exists
- `installed`: managed content matches the recorded state
- `drifted`: managed files differ from the recorded state
- `repaired`: managed state has been reconciled after breakage
- `upgraded`: bundles or platform version have been advanced safely
- `uninstalled`: managed content has been removed and archived as needed
