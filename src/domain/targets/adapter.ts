import path from "node:path";
import fg from "fast-glob";

import { readJsonFile } from "../../shared/index.js";
import type { TargetManifest } from "../manifests/index.js";

export interface TargetAdapter extends TargetManifest {
  guidanceTemplate?: string;
}

export async function loadTargetAdapters(root: string): Promise<TargetAdapter[]> {
  const files = await fg("targets/*/adapter.json", { cwd: root, absolute: true });
  return Promise.all(files.map((file) => readJsonFile<TargetAdapter>(file)));
}

export async function loadTargetAdapterRegistry(root: string): Promise<Map<string, TargetAdapter>> {
  const adapters = await loadTargetAdapters(root);
  return new Map(adapters.map((adapter) => [adapter.id, adapter]));
}

export async function loadTargetAdapter(root: string, targetId: string): Promise<TargetAdapter> {
  const adapterPath = path.join(root, "targets", targetId, "adapter.json");
  return readJsonFile<TargetAdapter>(adapterPath);
}
