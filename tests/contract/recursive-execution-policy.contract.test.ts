import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { parseRecursiveExecutionPolicy } from "../../src/domain/recursive/execution-policy.js";

const root = process.cwd();

describe("recursive execution policy contract", () => {
  it("accepts the canonical recursive structured-analysis execution-policy fixture", async () => {
    const schema = JSON.parse(
      await fs.readFile(path.join(root, "schemas", "runtime", "recursive-execution-policy.schema.json"), "utf8")
    );
    const fixture = JSON.parse(
      await fs.readFile(
        path.join(root, "tests", "fixtures", "recursive-structured-analysis", "policy", "execution-policy.json"),
        "utf8"
      )
    );

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);

    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);
    expect(parseRecursiveExecutionPolicy(fixture).allowStructuredRun).toBe(true);
  });
});
