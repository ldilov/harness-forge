import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { parseDecisionLog } from "../../src/domain/runtime/decision-log.js";

const root = process.cwd();

describe("runtime decision log contract", () => {
  it("accepts the generated decision log shape", async () => {
    const schema = JSON.parse(await fs.readFile(path.join(root, "schemas", "runtime", "decision-record.schema.json"), "utf8"));
    const fixture = JSON.parse(
      await fs.readFile(path.join(root, "tests", "fixtures", "runtime-governance", "decision-log.example.json"), "utf8")
    );
    const validate = new Ajv2020({ allErrors: true, strict: false }).compile({
      $schema: schema.$schema,
      $ref: "#/$defs/decisionLog",
      $defs: schema.$defs
    });

    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);
    expect(parseDecisionLog(fixture).entries[0]?.id).toBe("ASR-TASK-ARCH-001");
  });
});
