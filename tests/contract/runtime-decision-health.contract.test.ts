import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { parseDecisionHealthFinding } from "../../src/domain/runtime/decision-health.js";

const root = process.cwd();

describe("runtime decision health contract", () => {
  it("accepts the machine-readable decision health finding shape", async () => {
    const schema = JSON.parse(await fs.readFile(path.join(root, "schemas", "runtime", "decision-record.schema.json"), "utf8"));
    const fixture = JSON.parse(
      await fs.readFile(path.join(root, "tests", "fixtures", "runtime-governance", "decision-health.example.json"), "utf8")
    );

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile({
      $schema: schema.$schema,
      $ref: "#/$defs/decisionHealthFinding",
      $defs: schema.$defs
    });
    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);

    const parsed = parseDecisionHealthFinding(fixture);
    expect(parsed.category).toBe("stale-decision");
    expect(parsed.severity).toBe("warning");
  });
});
