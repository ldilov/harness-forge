import path from "node:path";
import fg from "fast-glob";

import { readJsonFile } from "../../shared/index.js";

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
}

export interface CatalogIndex {
  bundles: string[];
  profiles: string[];
  targets: string[];
}

export async function loadCatalogIndex(root: string): Promise<CatalogIndex> {
  return readJsonFile<CatalogIndex>(path.join(root, "manifests", "catalog", "index.json"));
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
