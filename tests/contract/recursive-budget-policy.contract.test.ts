import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { createDefaultRecursiveBudgetPolicy, parseRecursiveBudgetPolicy } from "../../src/domain/recursive/budget.js";

const root = process.cwd();

describe("recursive budget policy contract", () => {
  it("accepts the default recursive budget policy fixture", async () => {
    const schema = JSON.parse(
      await fs.readFile(path.join(root, "schemas", "runtime", "recursive-budget.schema.json"), "utf8")
    );
    const fixture = JSON.parse(
      await fs.readFile(path.join(root, "tests", "fixtures", "recursive-runtime", "budgets", "default-policy.json"), "utf8")
    );

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);

    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);
    expect(parseRecursiveBudgetPolicy(fixture).isolationLevel).toBe("read-only-inspection");
  });

  it("ships a read-only offline default policy", () => {
    const policy = createDefaultRecursiveBudgetPolicy();
    expect(policy.allowNetwork).toBe(false);
    expect(policy.allowWritesToScratchOnly).toBe(true);
    expect(policy.sandboxMode).toBe("disabled");
  });
});
