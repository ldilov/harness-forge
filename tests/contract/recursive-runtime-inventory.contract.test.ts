import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { parseRecursiveRuntimeInventory } from "../../src/domain/recursive/runtime-inventory.js";

const root = process.cwd();

describe("recursive runtime inventory contract", () => {
  it("accepts the canonical recursive runtime inventory fixture", async () => {
    const schema = JSON.parse(
      await fs.readFile(path.join(root, "schemas", "runtime", "recursive-runtime-inventory.schema.json"), "utf8")
    );
    const fixture = JSON.parse(
      await fs.readFile(
        path.join(root, "tests", "fixtures", "recursive-structured-analysis", "capabilities", "workspace-runtime-inventory.json"),
        "utf8"
      )
    );

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);

    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);
    expect(parseRecursiveRuntimeInventory(fixture).runtimes.map((entry) => entry.runtimeId)).toEqual(
      expect.arrayContaining(["node", "python", "powershell"])
    );
  });
});
