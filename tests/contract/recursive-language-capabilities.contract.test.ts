import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { parseRecursiveLanguageCapabilities } from "../../src/domain/recursive/language-capabilities.js";

const root = process.cwd();

describe("recursive language capabilities contract", () => {
  it("accepts the canonical recursive structured-analysis capability fixture", async () => {
    const schema = JSON.parse(
      await fs.readFile(path.join(root, "schemas", "runtime", "recursive-language-capabilities.schema.json"), "utf8")
    );
    const fixture = JSON.parse(
      await fs.readFile(
        path.join(root, "tests", "fixtures", "recursive-structured-analysis", "capabilities", "workspace-language-capabilities.json"),
        "utf8"
      )
    );

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);

    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);
    expect(parseRecursiveLanguageCapabilities(fixture).languages.map((entry) => entry.languageId)).toEqual(
      expect.arrayContaining(["typescript", "python"])
    );
  });
});
