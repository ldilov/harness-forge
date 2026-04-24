import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { parseDecisionCoverageResult } from "../../src/domain/runtime/decision-coverage.js";

const root = process.cwd();

describe("runtime decision coverage contract", () => {
  it("accepts the machine-readable decision coverage result shape", async () => {
    const schema = JSON.parse(await fs.readFile(path.join(root, "schemas", "runtime", "decision-record.schema.json"), "utf8"));
    const fixture = JSON.parse(
      await fs.readFile(path.join(root, "tests", "fixtures", "runtime-governance", "decision-coverage.example.json"), "utf8")
    );

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile({
      $schema: schema.$schema,
      $ref: "#/$defs/decisionCoverageResult",
      $defs: schema.$defs
    });
    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);

    const parsed = parseDecisionCoverageResult(fixture);
    expect(parsed.classification).toBe("covered");
  });
});
