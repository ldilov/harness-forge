import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { parseRecursiveSession } from "../../src/domain/recursive/session.js";

const root = process.cwd();

describe("recursive session contract", () => {
  it("accepts the canonical recursive session fixture", async () => {
    const budgetSchema = JSON.parse(
      await fs.readFile(path.join(root, "schemas", "runtime", "recursive-budget.schema.json"), "utf8")
    );
    const sessionSchema = JSON.parse(
      await fs.readFile(path.join(root, "schemas", "runtime", "recursive-session.schema.json"), "utf8")
    );
    const fixture = JSON.parse(
      await fs.readFile(path.join(root, "tests", "fixtures", "recursive-runtime", "session", "basic-session.json"), "utf8")
    );

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    ajv.addSchema(budgetSchema, "recursive-budget.schema.json");
    const validate = ajv.compile(sessionSchema);

    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);
    expect(parseRecursiveSession(fixture).taskId).toBe("TASK-REC-001");
  });

  it("keeps recursive sessions explicit about tools, handles, and budget policy", async () => {
    const fixture = JSON.parse(
      await fs.readFile(path.join(root, "tests", "fixtures", "recursive-runtime", "session", "basic-session.json"), "utf8")
    );

    const session = parseRecursiveSession(fixture);
    expect(session.tools).toContain("runtime.read-handle");
    expect(session.handles[0]?.targetRef).toBe(".hforge/runtime/repo/repo-map.json");
    expect(session.budgetPolicy.policyId).toBe("default-recursive-policy");
  });
});
