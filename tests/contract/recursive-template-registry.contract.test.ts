import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { loadRecursiveTemplateRegistry } from "../../src/infrastructure/recursive/template-loader.js";
import { parseRecursiveTemplateRegistry } from "../../src/domain/recursive/template-registry.js";

const root = process.cwd();

describe("recursive template registry contract", () => {
  it("accepts a schema-valid recursive registry shape", async () => {
    const schema = JSON.parse(
      await fs.readFile(path.join(root, "schemas", "templates", "recursive-template-registry.schema.json"), "utf8")
    );
    const registry = {
      version: 1,
      entries: [
        {
          id: "recursive-summary-md",
          kind: "summary",
          file: "recursive/summary-template.md",
          format: "md",
          scope: "session",
          description: "Recursive session summary template",
          variables: ["SESSION_ID", "TASK_ID", "SUMMARY"]
        }
      ]
    };

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    expect(validate(registry), JSON.stringify(validate.errors)).toBe(true);
    expect(parseRecursiveTemplateRegistry(registry).entries[0]?.id).toBe("recursive-summary-md");
  });

  it("falls back to an empty registry when recursive templates are not installed yet", async () => {
    const registry = await loadRecursiveTemplateRegistry(root);
    expect(registry.version).toBe(1);
    expect(Array.isArray(registry.entries)).toBe(true);
  });
});
