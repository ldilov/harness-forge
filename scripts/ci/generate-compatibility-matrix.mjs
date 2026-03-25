#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

import { buildCapabilityCompatibilityEntries, loadCapabilityInputs } from "./capability-matrix-shared.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = path.resolve(args.find((value) => !value.startsWith("--")) ?? ".");

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

async function listBundleManifests() {
  const manifestDir = path.join(root, "manifests", "bundles");
  const files = await fs.readdir(manifestDir);
  const manifests = await Promise.all(files.map((file) => readJson(path.join("manifests", "bundles", file))));
  return manifests.flatMap((manifest) => manifest.bundles ?? []);
}

async function listWorkflowIds() {
  const workflowDir = path.join(root, "templates", "workflows");
  const files = await fs.readdir(workflowDir);
  return files.filter((file) => file.endsWith(".md")).map((file) => file.replace(/\.md$/, ""));
}

async function listSkillIds() {
  const skillDir = path.join(root, "skills");
  const entries = await fs.readdir(skillDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function noteForLevel(target, level, subjectType, subjectId) {
  if (level === "full") {
    return undefined;
  }

  if (level === "partial") {
    return `${target.displayName} only provides partial ${subjectType} support for ${subjectId}.`;
  }

  if (level === "emulated") {
    return `${target.displayName} only emulates ${subjectType} support for ${subjectId}.`;
  }

  return `${target.displayName} does not ship ${subjectType} support for ${subjectId}.`;
}

const [{ targets }, { hooks }, languageAssets, frameworkAssets, { matrix: capabilityMatrixInputs }] = await Promise.all([
  readJson(path.join("manifests", "targets", "core.json")),
  readJson(path.join("manifests", "hooks", "index.json")),
  readJson(path.join("manifests", "catalog", "language-assets.json")),
  readJson(path.join("manifests", "catalog", "framework-assets.json")),
  loadCapabilityInputs(root)
]);
const bundleManifests = await listBundleManifests();
const workflowIds = await listWorkflowIds();
const skillIds = await listSkillIds();
const profileFiles = await fs.readdir(path.join(root, "manifests", "profiles"));
const profiles = (
  await Promise.all(profileFiles.map((file) => readJson(path.join("manifests", "profiles", file))))
).flatMap((manifest) => manifest.profiles ?? []);

const frameworkByBundleId = new Map((frameworkAssets.frameworks ?? []).map((framework) => [framework.bundleId, framework]));
const entries = [];

for (const bundle of bundleManifests) {
  for (const target of targets) {
    const level = bundle.targets.includes(target.id)
      ? target.supportLevel === "partial" || target.supportLevel === "emulated"
        ? target.supportLevel
        : "full"
      : "unsupported";
    entries.push({
      subjectType: "target",
      subjectId: target.id,
      relationType: "supports",
      relatedType: "bundle",
      relatedId: bundle.id,
      supportLevel: level,
      ...(noteForLevel(target, level, "bundle", bundle.id) ? { notes: noteForLevel(target, level, "bundle", bundle.id) } : {})
    });
  }
}

for (const hook of hooks ?? []) {
  for (const target of targets) {
    const level = hook.targetCompatibility?.[target.id] ?? "unsupported";
    entries.push({
      subjectType: "target",
      subjectId: target.id,
      relationType: "supports",
      relatedType: "hook",
      relatedId: hook.id,
      supportLevel: level,
      ...(noteForLevel(target, level, "hook", hook.id) ? { notes: noteForLevel(target, level, "hook", hook.id) } : {})
    });
  }
}

for (const skillId of skillIds) {
  for (const target of targets) {
    const level = target.id === "codex" || target.id === "claude-code" ? "full" : "partial";
    entries.push({
      subjectType: "target",
      subjectId: target.id,
      relationType: "supports",
      relatedType: "skill",
      relatedId: skillId,
      supportLevel: level,
      ...(noteForLevel(target, level, "skill", skillId) ? { notes: noteForLevel(target, level, "skill", skillId) } : {})
    });
  }
}

for (const workflowId of workflowIds) {
  for (const target of targets) {
    const level = target.id === "codex" || target.id === "claude-code" ? "full" : "partial";
    entries.push({
      subjectType: "workflow",
      subjectId: workflowId,
      relationType: "supports",
      relatedType: "target",
      relatedId: target.id,
      supportLevel: level,
      ...(noteForLevel(target, level, "workflow", workflowId) ? { notes: noteForLevel(target, level, "workflow", workflowId) } : {})
    });
  }
}

for (const profile of profiles) {
  for (const target of targets) {
    const level = profile.targetCompatibility?.[target.id] ?? "unsupported";
    entries.push({
      subjectType: "profile",
      subjectId: profile.id,
      relationType: "supports",
      relatedType: "target",
      relatedId: target.id,
      supportLevel: level,
      ...(noteForLevel(target, level, "profile", profile.id) ? { notes: noteForLevel(target, level, "profile", profile.id) } : {})
    });
  }
}

for (const [languageId, entry] of Object.entries(languageAssets.languages ?? {})) {
  for (const frameworkBundleId of entry.frameworkBundles ?? []) {
    const framework = frameworkByBundleId.get(frameworkBundleId);
    if (!framework) {
      continue;
    }

    entries.push({
      subjectType: "language",
      subjectId: languageId,
      relationType: "extends",
      relatedType: "framework",
      relatedId: framework.id,
      supportLevel: "full"
    });
  }
}

entries.push(...buildCapabilityCompatibilityEntries(capabilityMatrixInputs));

entries.sort((left, right) =>
  `${left.subjectType}:${left.subjectId}:${left.relatedType}:${left.relatedId}`.localeCompare(
    `${right.subjectType}:${right.subjectId}:${right.relatedType}:${right.relatedId}`
  )
);

const output = {
  generatedAt: new Date().toISOString(),
  entries
};

const destination = path.join(root, "manifests", "catalog", "compatibility-matrix.json");
await fs.writeFile(destination, `${JSON.stringify(output, null, 2)}\n`, "utf8");

const result = { ok: true, destination, entries: entries.length };
if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(JSON.stringify(result, null, 2));
}
