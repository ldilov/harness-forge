import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";

const CAPABILITY_SUPPORT_REF = "manifests/catalog/harness-capability-matrix.json";

async function readJson(root, relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

async function readText(root, relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

function formatSupportCell(record) {
  return `${record.supportLevel} (${record.supportMode})`;
}

function toSummaryCell(records, taxonomyById, predicate) {
  const values = records
    .filter(predicate)
    .map((record) => taxonomyById.get(record.capabilityId)?.displayName ?? record.capabilityId);

  return values.length > 0 ? values.join(", ") : "none";
}

export async function loadCapabilityInputs(root) {
  const [taxonomy, matrix, schema, targetManifest, compatibilityMatrix] = await Promise.all([
    readJson(root, "manifests/catalog/capability-taxonomy.json"),
    readJson(root, "manifests/catalog/harness-capability-matrix.json"),
    readJson(root, "schemas/manifests/harness-capability-matrix.schema.json"),
    readJson(root, "manifests/targets/core.json"),
    readJson(root, "manifests/catalog/compatibility-matrix.json")
  ]);

  const adapters = await Promise.all(
    (targetManifest.targets ?? []).map(async (target) => {
      const adapterPath = `targets/${target.id}/adapter.json`;
      try {
        return [target.id, await readJson(root, adapterPath)];
      } catch {
        return [target.id, null];
      }
    })
  );

  return {
    taxonomy,
    matrix,
    schema,
    targetManifest,
    compatibilityMatrix,
    adapters: new Map(adapters)
  };
}

export function buildCapabilityCompatibilityEntries(matrix) {
  return [...matrix.targets]
    .flatMap((target) =>
      target.capabilities.map((record) => ({
        subjectType: "target",
        subjectId: target.targetId,
        relationType: "supports-capability",
        relatedType: "capability",
        relatedId: record.capabilityId,
        supportLevel: record.supportLevel,
        supportMode: record.supportMode,
        confidence: record.confidence,
        evidenceSource: record.evidenceSource,
        fallbackBehavior: record.fallbackBehavior,
        ...(record.notes ? { notes: record.notes } : {})
      }))
    )
    .sort((left, right) =>
      `${left.subjectType}:${left.subjectId}:${left.relatedType}:${left.relatedId}`.localeCompare(
        `${right.subjectType}:${right.subjectId}:${right.relatedType}:${right.relatedId}`
      )
    );
}

export function renderTargetSupportMarkdown(taxonomy, matrix) {
  const taxonomyById = new Map(taxonomy.capabilities.map((entry) => [entry.id, entry]));
  const lines = [
    "# Target Support Matrix",
    "",
    "Harness Forge keeps one canonical target-capability truth source in",
    "`manifests/catalog/harness-capability-matrix.json`. The broader",
    "`manifests/catalog/compatibility-matrix.json` remains a derived view for",
    "cross-surface relationships.",
    "",
    "## Support levels",
    "",
    "- `full`: shipped and validated in this package",
    "- `partial`: usable with explicit gaps and fallback guidance",
    "- `emulated`: approximated behavior without a native runtime surface",
    "- `unsupported`: do not rely on it",
    "",
    "## Support modes",
    "",
    "- `native`: first-class runtime support ships in the package",
    "- `translated`: support works through portable scripts or guidance layers",
    "- `emulated`: behavior is approximated rather than native",
    "- `documentation-only`: only docs and manifests are portable",
    "- `unsupported`: no packaged runtime support is claimed",
    "",
    "## Target summary",
    "",
    "| Target | Overall support | Strengths | Gaps |",
    "| --- | --- | --- | --- |"
  ];

  for (const target of matrix.targets) {
    const strengths = toSummaryCell(
      target.capabilities,
      taxonomyById,
      (record) => record.supportLevel === "full" && record.supportMode === "native"
    );
    const gaps = toSummaryCell(
      target.capabilities,
      taxonomyById,
      (record) => !(record.supportLevel === "full" && record.supportMode === "native")
    );
    lines.push(`| \`${target.targetId}\` | ${target.supportLevel} | ${strengths} | ${gaps} |`);
  }

  lines.push("", "## Capability honesty", "", `| Capability | ${matrix.targets.map((target) => target.displayName).join(" | ")} |`);
  lines.push(`| --- | ${matrix.targets.map(() => "---").join(" | ")} |`);

  for (const capability of taxonomy.capabilities) {
    const cells = matrix.targets.map((target) => {
      const record = target.capabilities.find((entry) => entry.capabilityId === capability.id);
      return record ? formatSupportCell(record) : "missing";
    });
    lines.push(`| ${capability.displayName} | ${cells.join(" | ")} |`);
  }

  lines.push("", "## Degraded support details");

  for (const target of matrix.targets) {
    const degraded = target.capabilities.filter(
      (record) => !(record.supportLevel === "full" && record.supportMode === "native")
    );
    lines.push("", `### ${target.displayName}`);
    if (degraded.length === 0) {
      lines.push("", "- none");
      continue;
    }

    lines.push("");
    for (const record of degraded) {
      const label = taxonomyById.get(record.capabilityId)?.displayName ?? record.capabilityId;
      const detail = record.notes ? ` ${record.notes}` : "";
      lines.push(
        `- ${label}: ${record.supportLevel} via ${record.supportMode}. Fallback: ${record.fallbackBehavior ?? "No fallback documented."}${detail}`
      );
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

export async function collectCapabilityValidationIssues(root, options = {}) {
  const { checkDocs = true, checkCompatibility = true } = options;
  const issues = [];
  const { taxonomy, matrix, schema, targetManifest, compatibilityMatrix, adapters } = await loadCapabilityInputs(root);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.addFormat("date-time", true);
  const validate = ajv.compile(schema);

  if (!validate(matrix)) {
    for (const error of validate.errors ?? []) {
      issues.push(`Schema validation failed at ${error.instancePath || "/"}: ${error.message}`);
    }
  }

  const taxonomyIds = taxonomy.capabilities.map((entry) => entry.id);
  const taxonomyIdSet = new Set(taxonomyIds);
  if (taxonomyIdSet.size !== taxonomyIds.length) {
    issues.push("Capability taxonomy contains duplicate capability ids.");
  }

  const targetIds = (targetManifest.targets ?? []).map((target) => target.id);
  const targetIdSet = new Set(targetIds);
  const matrixTargetIds = matrix.targets.map((target) => target.targetId);
  if (new Set(matrixTargetIds).size !== matrixTargetIds.length) {
    issues.push("Capability matrix contains duplicate target ids.");
  }

  for (const targetId of targetIds) {
    if (!matrixTargetIds.includes(targetId)) {
      issues.push(`Capability matrix is missing target ${targetId}.`);
    }
  }

  for (const target of matrix.targets) {
    if (!targetIdSet.has(target.targetId)) {
      issues.push(`Capability matrix includes unknown target ${target.targetId}.`);
    }

    const capabilityIds = target.capabilities.map((record) => record.capabilityId);
    if (new Set(capabilityIds).size !== capabilityIds.length) {
      issues.push(`Target ${target.targetId} has duplicate capability records.`);
    }

    for (const capabilityId of taxonomyIds) {
      if (!capabilityIds.includes(capabilityId)) {
        issues.push(`Target ${target.targetId} is missing capability ${capabilityId}.`);
      }
    }

    for (const record of target.capabilities) {
      if (!taxonomyIdSet.has(record.capabilityId)) {
        issues.push(`Target ${target.targetId} references unknown capability ${record.capabilityId}.`);
      }

      const degraded = !(record.supportLevel === "full" && record.supportMode === "native");
      if (degraded && !record.fallbackBehavior) {
        issues.push(`Target ${target.targetId} capability ${record.capabilityId} is degraded but missing fallback behavior.`);
      }
      if (!record.validationMethod) {
        issues.push(`Target ${target.targetId} capability ${record.capabilityId} is missing validationMethod.`);
      }
      if (!record.evidenceSource?.length) {
        issues.push(`Target ${target.targetId} capability ${record.capabilityId} is missing evidenceSource.`);
      }
    }
  }

  for (const target of targetManifest.targets ?? []) {
    if (target.capabilitySupportRef !== CAPABILITY_SUPPORT_REF) {
      issues.push(`Target manifest ${target.id} must set capabilitySupportRef to ${CAPABILITY_SUPPORT_REF}.`);
    }

    const adapter = adapters.get(target.id);
    if (adapter && adapter.capabilitySupportRef !== CAPABILITY_SUPPORT_REF) {
      issues.push(`Target adapter ${target.id} must set capabilitySupportRef to ${CAPABILITY_SUPPORT_REF}.`);
    }
  }

  if (checkDocs) {
    const expected = renderTargetSupportMarkdown(taxonomy, matrix);
    const actual = await readText(root, "docs/target-support-matrix.md");
    if (actual.replaceAll("\r\n", "\n") !== expected.replaceAll("\r\n", "\n")) {
      issues.push("docs/target-support-matrix.md is out of sync with the canonical capability matrix.");
    }
  }

  if (checkCompatibility) {
    const actualEntries = (compatibilityMatrix.entries ?? []).filter(
      (entry) => entry.relationType === "supports-capability" && entry.relatedType === "capability"
    );
    const expectedEntries = buildCapabilityCompatibilityEntries(matrix);
    if (JSON.stringify(actualEntries) !== JSON.stringify(expectedEntries)) {
      issues.push("manifests/catalog/compatibility-matrix.json is out of sync with the canonical capability matrix.");
    }
  }

  return issues;
}

export { CAPABILITY_SUPPORT_REF };
