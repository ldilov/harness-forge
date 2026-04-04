import path from "node:path";
import fg from "fast-glob";

import { readJsonFile } from "../../shared/index.js";
import type { CapabilityTaxonomyDocument } from "../capabilities/capability-taxonomy.js";
import type { HarnessCapabilityMatrixDocument } from "../capabilities/capability-record.js";

export interface BundleManifest {
  id: string;
  family: string;
  version: number;
  description: string;
  paths: string[];
  targets: string[];
  dependencies: string[];
  conflicts: string[];
  optional: boolean;
  defaultInstall: boolean;
  stability: "draft" | "stable" | "beta" | "deprecated";
  tags: string[];
  owner: string;
  usageCues?: string[];
}

export interface ProfileManifest {
  id: string;
  description: string;
  bundleIds: string[];
  recommendedTargets: string[];
  recommendedLanguages: string[];
  recommendedCapabilities: string[];
  displayName?: string;
  preferredSkills?: string[];
  recommendedHooks?: string[];
  validationStrictness?: "lenient" | "standard" | "strict";
  reviewDepth?: "shallow" | "standard" | "deep";
  riskAppetite?: "aggressive" | "balanced" | "low";
  targetCompatibility?: Record<string, "full" | "partial" | "emulated" | "unsupported">;
}

export interface TargetManifest {
  id: string;
  displayName: string;
  installRootStrategy: string;
  pathMappings: Record<string, string>;
  mergeRules: Record<string, string>;
  supportsHooks: boolean;
  supportsCommands: boolean;
  supportsAgents: boolean;
  supportsContexts: boolean;
  supportsPlugins: boolean;
  capabilityMatrix: Record<string, boolean>;
  postInstallGuidanceStrategy?: string;
  supportLevel?: "full" | "partial" | "emulated" | "unsupported" | "contract";
  supportNotes?: string[];
  capabilitySupportRef?: string;
}

export interface CatalogIndex {
  bundles: string[];
  profiles: string[];
  targets: string[];
  catalogs: string[];
  schemas: string[];
  hooks: string[];
  fixtures: string[];
}

export interface FlowArtifactManifest {
  artifacts: Array<{
    id: string;
    stage: string;
    pathPattern: string;
    generatedBy: string;
    required: boolean;
    lineageRole: string;
  }>;
}

export interface EnhancedSkillImportInventoryEntry {
  resourcePath: string;
  resourceType: "skill" | "wrapper" | "reference" | "provenance" | "script";
  skillId: string | null;
  existingProjectSurface: string | null;
  decision: "merge" | "promote" | "provenance-only" | "unchanged" | "excluded";
  decisionReason: string;
  destinationPath: string;
  reviewStatus: "pending" | "accepted" | "rejected";
}

export interface EmbeddingRule {
  ruleId: string;
  matchCriteria: string;
  preferredOutcome: "merge" | "promote" | "provenance-only" | "exclude";
  requiredFollowUps: string[];
  exceptions: string[];
}

export interface EnhancedSkillImportInventoryDocument {
  packId: string;
  sourceName: string;
  sourceVersion: string;
  resourceRoots: string[];
  summary: string;
  validationScope: string;
  researchScope: string;
  entries: EnhancedSkillImportInventoryEntry[];
  embeddingRules: EmbeddingRule[];
}

export interface EngineeringAssistantImportInventoryEntry {
  artifactPath: string;
  artifactType: "skill" | "reference" | "notes" | "changelog" | "script" | "metadata";
  skillId: string | null;
  existingProjectSurface: string | null;
  decision: "embed" | "adapt" | "translate" | "provenance-only" | "exclude";
  decisionReason: string;
  destinationPath: string;
  reviewStatus: "pending" | "accepted" | "rejected";
}

export interface EngineeringAssistantCompatibilityProfile {
  targetId: string;
  supportLevel: "full" | "partial" | "translated" | "guidance-only";
  metadataMode: "native" | "translated" | "unsupported";
  hookMode: "native" | "translated" | "manual" | "documentation-only";
  helperMode: "native-command" | "packaged-helper" | "documentation-only";
  notes: string;
  currentSurfaces: string[];
}

export interface EngineeringAssistantHelperSurface {
  helperId: string;
  sourceArtifact: string;
  surfaceType: "documentation-plan" | "script" | "command" | "template";
  purpose: string;
  destinationPath: string;
  targetCoverage: string[];
  failureMode: string;
}

export interface EngineeringAssistantPortingRule {
  ruleId: string;
  matchCriteria: string;
  preferredOutcome: "embed" | "adapt" | "translate" | "provenance-only" | "exclude";
  requiredFollowUps: string[];
}

export interface EngineeringAssistantImportInventoryDocument {
  packId: string;
  sourceName: string;
  sourceVersion: string;
  resourceRoots: string[];
  summary: string;
  validationScope: string;
  researchScope: string;
  entries: EngineeringAssistantImportInventoryEntry[];
  compatibilityProfiles: EngineeringAssistantCompatibilityProfile[];
  helperSurfaces: EngineeringAssistantHelperSurface[];
  portingRules: EngineeringAssistantPortingRule[];
}

export async function loadCatalogIndex(root: string): Promise<CatalogIndex> {
  return readJsonFile<CatalogIndex>(path.join(root, "manifests", "catalog", "index.json"));
}

export async function loadEnhancedSkillImportInventory(
  root: string
): Promise<EnhancedSkillImportInventoryDocument> {
  return readJsonFile<EnhancedSkillImportInventoryDocument>(
    path.join(root, "manifests", "catalog", "enhanced-skill-import-inventory.json")
  );
}

export async function loadEngineeringAssistantImportInventory(
  root: string
): Promise<EngineeringAssistantImportInventoryDocument> {
  return readJsonFile<EngineeringAssistantImportInventoryDocument>(
    path.join(root, "manifests", "catalog", "engineering-assistant-import-inventory.json")
  );
}

export async function loadBundleManifests(root: string): Promise<BundleManifest[]> {
  const files = await fg("manifests/bundles/*.json", { cwd: root, absolute: true });
  const all = await Promise.all(files.map((file) => readJsonFile<{ bundles: BundleManifest[] }>(file)));
  return all.flatMap((entry) => entry.bundles);
}

export async function loadProfileManifests(root: string): Promise<ProfileManifest[]> {
  const files = await fg("manifests/profiles/*.json", { cwd: root, absolute: true });
  const all = await Promise.all(files.map((file) => readJsonFile<{ profiles: ProfileManifest[] }>(file)));
  return all.flatMap((entry) => entry.profiles);
}

export async function loadTargetManifests(root: string): Promise<TargetManifest[]> {
  const files = await fg("manifests/targets/*.json", { cwd: root, absolute: true });
  const all = await Promise.all(files.map((file) => readJsonFile<{ targets: TargetManifest[] }>(file)));
  return all.flatMap((entry) => entry.targets);
}

export async function loadCapabilityTaxonomy(root: string): Promise<CapabilityTaxonomyDocument> {
  return readJsonFile<CapabilityTaxonomyDocument>(
    path.join(root, "manifests", "catalog", "capability-taxonomy.json")
  );
}

export async function loadHarnessCapabilityMatrix(root: string): Promise<HarnessCapabilityMatrixDocument> {
  return readJsonFile<HarnessCapabilityMatrixDocument>(
    path.join(root, "manifests", "catalog", "harness-capability-matrix.json")
  );
}

export async function loadFlowArtifactManifest(root: string): Promise<FlowArtifactManifest> {
  return readJsonFile<FlowArtifactManifest>(
    path.join(root, "manifests", "catalog", "flow-artifacts.json")
  );
}
