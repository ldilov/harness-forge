import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { assessArchitectureSignificance } from "../../src/application/runtime/assess-architecture-significance.js";
import type { ImpactAnalysis } from "../../src/domain/runtime/impact-analysis.js";
import { isArchitectureSignificant, parseArchitectureSignificanceAssessment } from "../../src/domain/runtime/architecture-significance.js";
import { parseTaskPack } from "../../src/domain/runtime/task-pack.js";

const root = process.cwd();

describe("runtime architecture significance contract", () => {
  it("derives a schema-valid high-signal assessment for architecture-sensitive work", async () => {
    const schema = JSON.parse(
      await fs.readFile(path.join(root, "schemas", "runtime", "architecture-significance.schema.json"), "utf8")
    );
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

    const assessment = assessArchitectureSignificance({
      taskId: taskPack.taskId,
      taskText: taskPack.summary,
      taskPack,
      impactAnalysis
    });

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    expect(validate(assessment), JSON.stringify(validate.errors)).toBe(true);

    const parsed = parseArchitectureSignificanceAssessment(assessment);
    expect(isArchitectureSignificant(parsed.level)).toBe(true);
    expect(["high", "critical"]).toContain(parsed.level);
    expect(parsed.signals.some((signal) => signal.includes("multiple modules"))).toBe(true);
  });
});
