#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

const [targetsManifest, hooksManifest, languageAssets, frameworkAssets, compatibilityMatrix, flowArtifacts, capabilityTaxonomy] = await Promise.all([
  readJson(path.join("manifests", "targets", "core.json")),
  readJson(path.join("manifests", "hooks", "index.json")),
  readJson(path.join("manifests", "catalog", "language-assets.json")),
  readJson(path.join("manifests", "catalog", "framework-assets.json")),
  readJson(path.join("manifests", "catalog", "compatibility-matrix.json")),
  readJson(path.join("manifests", "catalog", "flow-artifacts.json")),
  readJson(path.join("manifests", "catalog", "capability-taxonomy.json"))
]);
const bundleFiles = await fs.readdir(path.join(root, "manifests", "bundles"));
const profileFiles = await fs.readdir(path.join(root, "manifests", "profiles"));
const workflowFiles = await fs.readdir(path.join(root, "templates", "workflows"));
const skillEntries = await fs.readdir(path.join(root, "skills"), { withFileTypes: true });

const bundles = (
  await Promise.all(bundleFiles.map((file) => readJson(path.join("manifests", "bundles", file))))
).flatMap((manifest) => manifest.bundles ?? []);
const profiles = (
  await Promise.all(profileFiles.map((file) => readJson(path.join("manifests", "profiles", file))))
).flatMap((manifest) => manifest.profiles ?? []);

const targetIds = new Set((targetsManifest.targets ?? []).map((target) => target.id));
const bundleIds = new Set(bundles.map((bundle) => bundle.id));
const hookIds = new Set((hooksManifest.hooks ?? []).map((hook) => hook.id));
const profileIds = new Set(profiles.map((profile) => profile.id));
const workflowIds = new Set(workflowFiles.filter((file) => file.endsWith(".md")).map((file) => file.replace(/\.md$/, "")));
const skillIds = new Set(skillEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name));
const languageIds = new Set(Object.keys(languageAssets.languages ?? {}));
const frameworkIds = new Set((frameworkAssets.frameworks ?? []).map((framework) => framework.id));
const capabilityIds = new Set((capabilityTaxonomy.capabilities ?? []).map((capability) => capability.id));

const failures = [];

for (const profile of profiles) {
  for (const bundleId of profile.bundleIds ?? []) {
    if (!bundleIds.has(bundleId)) {
      failures.push({ issue: "Profile references an unknown bundle id.", profileId: profile.id, bundleId });
    }
  }

  for (const targetId of profile.recommendedTargets ?? []) {
    if (!targetIds.has(targetId)) {
      failures.push({ issue: "Profile references an unknown target.", profileId: profile.id, targetId });
    }
  }

  for (const hookId of profile.recommendedHooks ?? []) {
    if (!hookIds.has(hookId)) {
      failures.push({ issue: "Profile references an unknown hook.", profileId: profile.id, hookId });
    }
  }

  for (const targetId of Object.keys(profile.targetCompatibility ?? {})) {
    if (!targetIds.has(targetId)) {
      failures.push({ issue: "Profile targetCompatibility references an unknown target.", profileId: profile.id, targetId });
    }
  }
}

for (const hook of hooksManifest.hooks ?? []) {
  for (const targetId of Object.keys(hook.targetCompatibility ?? {})) {
    if (!targetIds.has(targetId)) {
      failures.push({ issue: "Hook targetCompatibility references an unknown target.", hookId: hook.id, targetId });
    }
  }
}

for (const requiredArtifactId of [
  "spec",
  "plan",
  "tasks",
  "flow-state",
  "issue-export",
  "recursive-runtime-language-capabilities",
  "recursive-runtime-execution-policy",
  "recursive-runtime-session-capabilities",
  "recursive-runtime-run-meta",
  "recursive-runtime-run-result"
]) {
  if (!(flowArtifacts.artifacts ?? []).some((artifact) => artifact.id === requiredArtifactId)) {
    failures.push({ issue: "Flow artifact catalog is missing a required artifact.", artifactId: requiredArtifactId });
  }
}

function isKnown(type, id) {
  switch (type) {
    case "target":
      return targetIds.has(id);
    case "bundle":
      return bundleIds.has(id);
    case "hook":
      return hookIds.has(id);
    case "profile":
      return profileIds.has(id);
    case "workflow":
      return workflowIds.has(id);
    case "skill":
      return skillIds.has(id);
    case "language":
      return languageIds.has(id);
    case "framework":
      return frameworkIds.has(id);
    case "capability":
      return capabilityIds.has(id);
    default:
      return false;
  }
}

for (const entry of compatibilityMatrix.entries ?? []) {
  if (!isKnown(entry.subjectType, entry.subjectId)) {
    failures.push({ issue: "Compatibility entry subject is unknown.", subjectType: entry.subjectType, subjectId: entry.subjectId });
  }

  if (!isKnown(entry.relatedType, entry.relatedId)) {
    failures.push({ issue: "Compatibility entry relation target is unknown.", relatedType: entry.relatedType, relatedId: entry.relatedId });
  }

  if ((entry.supportLevel === "partial" || entry.supportLevel === "unsupported" || entry.supportLevel === "emulated") && !entry.notes) {
    failures.push({
      issue: "Compatibility entries with non-full support must include notes.",
      subjectType: entry.subjectType,
      subjectId: entry.subjectId,
      relatedType: entry.relatedType,
      relatedId: entry.relatedId
    });
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, profiles: profiles.length, compatibilityEntries: compatibilityMatrix.entries?.length ?? 0 }, null, 2));
