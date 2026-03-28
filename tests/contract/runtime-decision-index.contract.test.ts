import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { parseDecisionIndex } from "../../src/domain/runtime/decision-record.js";

const root = process.cwd();

describe("runtime decision index contract", () => {
  it("accepts the machine-readable decision index shape", async () => {
    const schema = JSON.parse(await fs.readFile(path.join(root, "schemas", "runtime", "decision-record.schema.json"), "utf8"));
    const fixture = JSON.parse(
      await fs.readFile(path.join(root, "tests", "fixtures", "runtime-governance", "decisions", "index.json"), "utf8")
    );

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile({
      $schema: schema.$schema,
      $ref: "#/$defs/decisionIndex",
      $defs: schema.$defs
    });
    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);

    const parsed = parseDecisionIndex(fixture);
    expect(parsed.entries[0]?.recordType).toBe("asr");
    expect(parsed.entries[0]?.taskRefs).toContain("TASK-ARCH-001");
  });
});
