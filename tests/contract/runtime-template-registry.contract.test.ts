import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { parseRuntimeTemplateRegistry } from "../../src/domain/runtime/template-registry.js";

const root = process.cwd();

describe("runtime template registry contract", () => {
  it("accepts a schema-valid registry shape", async () => {
    const schema = JSON.parse(
      await fs.readFile(path.join(root, "schemas", "templates", "runtime-template-registry.schema.json"), "utf8")
    );
    const registry = {
      version: 1,
      entries: [
        {
          id: "runtime-task-pack-md",
          kind: "task-pack",
          file: "tasks/task-pack-template.md",
          format: "md",
          scope: "task",
          description: "Task-pack template",
          variables: ["TASK_ID", "TITLE"],
          supportedTargets: ["codex", "any"],
          overrideTargets: []
        }
      ]
    };

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    expect(validate(registry), JSON.stringify(validate.errors)).toBe(true);
    expect(parseRuntimeTemplateRegistry(registry).entries[0]?.id).toBe("runtime-task-pack-md");
  });

  it.todo("loads the canonical runtime template registry from hidden runtime surfaces");
});
