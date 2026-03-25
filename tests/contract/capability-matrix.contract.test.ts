import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

const root = process.cwd();

async function readJson(relativePath: string): Promise<any> {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

describe("capability matrix contract", () => {
  it("keeps canonical support records schema-valid and complete for every target", async () => {
    const [schema, taxonomy, matrix, targetManifest] = await Promise.all([
      readJson("schemas/manifests/harness-capability-matrix.schema.json"),
      readJson("manifests/catalog/capability-taxonomy.json"),
      readJson("manifests/catalog/harness-capability-matrix.json"),
      readJson("manifests/targets/core.json")
    ]);

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    ajv.addFormat("date-time", true);
    const validate = ajv.compile(schema);
    expect(validate(matrix), JSON.stringify(validate.errors, null, 2)).toBe(true);

    const taxonomyIds = new Set((taxonomy.capabilities ?? []).map((capability: any) => capability.id));
    const manifestTargetIds = new Set((targetManifest.targets ?? []).map((target: any) => target.id));

    expect(matrix.targets.length).toBe(manifestTargetIds.size);
    expect(taxonomyIds.size).toBe((taxonomy.capabilities ?? []).length);

    for (const target of matrix.targets ?? []) {
      expect(manifestTargetIds.has(target.targetId)).toBe(true);
      expect(new Set((target.capabilities ?? []).map((capability: any) => capability.capabilityId)).size).toBe(
        taxonomyIds.size
      );

      for (const record of target.capabilities ?? []) {
        expect(taxonomyIds.has(record.capabilityId)).toBe(true);
        expect(record.evidenceSource.length).toBeGreaterThan(0);
        expect(record.validationMethod.length).toBeGreaterThan(0);

        const degraded = !(record.supportLevel === "full" && record.supportMode === "native");
        if (degraded) {
          expect(record.fallbackBehavior?.length ?? 0).toBeGreaterThan(0);
        }
      }
    }
  });
});
