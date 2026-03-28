import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { afterEach, describe, expect, it } from "vitest";

import { createAsrRecord } from "../../src/application/runtime/create-asr-record.js";
import type { ImpactAnalysis } from "../../src/domain/runtime/impact-analysis.js";
import { parseDecisionRecord } from "../../src/domain/runtime/decision-record.js";
import { parseTaskPack } from "../../src/domain/runtime/task-pack.js";

const root = process.cwd();
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("runtime decision record contract", () => {
  it("writes a schema-valid ASR record and companion index entry", async () => {
    const schema = JSON.parse(await fs.readFile(path.join(root, "schemas", "runtime", "decision-record.schema.json"), "utf8"));
    const taskPack = parseTaskPack(
      JSON.parse(
        await fs.readFile(
          path.join(root, "tests", "fixtures", "runtime-governance", "significance", "task-pack.json"),
          "utf8"
        )
      )
    );
    const impactAnalysis: ImpactAnalysis = {
      taskId: taskPack.taskId,
      generatedAt: "2026-03-27T10:00:00.000Z",
      basedOnCommit: "abc123",
      architectureSignificance: taskPack.architectureSignificance,
      affectedModules: [
        {
          id: "billing-service",
          paths: ["src/billing/service.ts"],
          reason: "billing retry logic lives here",
          confidence: "high"
        },
        {
          id: "api-service",
          paths: ["src/api/routes/billing.ts"],
          reason: "public route behavior changes here",
          confidence: "high"
        }
      ],
      riskAreas: ["high-risk-path", "entrypoint-risk"],
      suggestedTests: ["tests/billing/service.test.ts"],
      relatedAdrs: [],
      openQuestions: ["How should retry state be stored?"]
    };
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-runtime-decision-"));
    tempRoots.push(workspaceRoot);

    const { record, indexEntry } = await createAsrRecord({
      workspaceRoot,
      taskPack,
      assessment: taskPack.architectureSignificance!,
      impactAnalysis
    });

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    expect(validate(record), JSON.stringify(validate.errors)).toBe(true);

    const parsed = parseDecisionRecord(record);
    expect(parsed.recordType).toBe("asr");
    expect(parsed.taskRefs).toContain(taskPack.taskId);
    expect(indexEntry.id).toBe(parsed.id);
    expect(indexEntry.path).toContain(".hforge/runtime/decisions/");
  });
});
