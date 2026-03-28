import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { selectFilesOfInterest } from "../../src/application/runtime/select-files-of-interest.js";
import type { RepoMap } from "../../src/domain/intelligence/repo-map.js";
import { parseFileInterestDocument } from "../../src/domain/runtime/file-interest.js";

const root = process.cwd();

describe("task-aware file-interest contract", () => {
  it("produces a schema-valid ranked artifact with explainable reasons", async () => {
    const schema = JSON.parse(
      await fs.readFile(path.join(root, "schemas", "runtime", "file-interest.schema.json"), "utf8")
    );
    const repoMap = JSON.parse(
      await fs.readFile(path.join(root, "tests", "fixtures", "runtime", "task-aware-selection", "repo-map.json"), "utf8")
    ) as RepoMap;
    const artifact = selectFilesOfInterest({
      taskId: "TASK-001",
      taskText: "add billing webhook retry handling and route tests",
      repoMap,
      candidateFiles: [
        {
          path: "src/billing/service.ts",
          role: "service-entry",
          symbols: ["retryWebhook", "billingService"]
        },
        {
          path: "src/api/routes/billing.ts",
          role: "router-entry",
          symbols: ["billingWebhookRoute"]
        },
        {
          path: "tests/billing/service.test.ts",
          role: "test"
        },
        {
          path: "dist/server.js",
          role: "build-output"
        }
      ],
      basedOnCommit: "abc123"
    });

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    expect(validate(artifact), JSON.stringify(validate.errors)).toBe(true);

    const parsed = parseFileInterestDocument(artifact);
    expect(parsed.items.some((item) => item.path === "dist/server.js")).toBe(false);
    expect(parsed.items[0]?.bucket).toBe("must-include");
    expect(parsed.items[0]?.reasons.length).toBeGreaterThan(0);
    expect(parsed.items.find((item) => item.path === "src/billing/service.ts")?.riskTags).toContain("high-risk-path");
  });
});
