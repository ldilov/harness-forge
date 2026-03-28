#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

import { buildRepoMap } from "./shared/cartography.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const diff = args.includes("--diff");
const write = args.includes("--write");
const root = path.resolve(args.find((value) => !value.startsWith("--")) ?? ".");
const targetFlagIndex = args.indexOf("--target");
const targetId = targetFlagIndex >= 0 ? args[targetFlagIndex + 1] ?? "codex" : "codex";

const repoMap = await buildRepoMap(root);
const scopeStrategy =
  repoMap.workspaceType === "monorepo" || repoMap.services.length > 1 ? "mixed-scope" : "root-only";

const recommendations = [
  {
    path: "AGENTS.md",
    surfaceType: "root-guidance",
    reason: "Every supported repo benefits from one root guidance surface.",
    confidence: 0.95,
    evidence: [...repoMap.supportingEvidence].slice(0, 3),
    writeMode: write ? "write" : diff ? "diff" : "recommend-only"
  }
];

if (scopeStrategy !== "root-only") {
  for (const service of repoMap.services.slice(0, 2)) {
    if (service.path === ".") {
      continue;
    }
    recommendations.push({
      path: `${service.path}/AGENTS.md`,
      surfaceType: "scoped-guidance",
      reason: "Multiple service boundaries justify a scoped guidance surface.",
      confidence: 0.76,
      evidence: [service.path],
      writeMode: write ? "write" : diff ? "diff" : "recommend-only"
    });
  }
}

if (targetId === "cursor") {
  recommendations.push({
    path: ".cursor/rules/harness-forge.mdc",
    surfaceType: "target-rule",
    reason: "Cursor integrations should stay explicitly scoped and inspectable.",
    confidence: 0.62,
    evidence: ["target:cursor"],
    writeMode: write ? "write" : diff ? "diff" : "recommend-only"
  });
}

const instructionPlan = {
  generatedAt: new Date().toISOString(),
  workspaceId: repoMap.workspaceId,
  targetId,
  scopeStrategy,
  sharedRuntimeRoot: ".hforge/runtime",
  sharedRuntimeBridges: recommendations.map((recommendation) => recommendation.path),
  sharedRuntimeArtifacts: [".hforge/runtime/index.json", ".hforge/runtime/README.md"],
  recommendations,
  recommendedProfiles: repoMap.workspaceType === "library" ? ["core"] : ["developer", "core"],
  recommendedSkills: [
    ...(repoMap.workspaceType === "monorepo" || repoMap.services.length > 1 ? ["repo-onboarding"] : []),
    ...(repoMap.highRiskPaths.some((value) => /security/i.test(value)) ? ["security-scan"] : [])
  ],
  generatedArtifacts: recommendations.map((recommendation) => recommendation.path),
  riskNotes: repoMap.qualityGaps.map((gap) => gap.id)
};

if (write) {
  const targetPath = path.join(root, ".hforge", "generated", "instruction-plan.json");
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(instructionPlan, null, 2)}\n`, "utf8");
}

if (diff) {
  const lines = instructionPlan.recommendations.map(
    (recommendation) => `+ ${recommendation.path} :: ${recommendation.reason}`
  );
  console.log(lines.join("\n"));
} else if (json) {
  console.log(JSON.stringify(instructionPlan, null, 2));
} else {
  console.log(JSON.stringify(instructionPlan, null, 2));
}
