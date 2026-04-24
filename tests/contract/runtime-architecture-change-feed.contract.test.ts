import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { parseArchitectureChangeFeedEntry } from "../../src/domain/runtime/architecture-change-feed.js";

const root = process.cwd();

describe("runtime architecture change feed contract", () => {
  it("accepts the architecture change feed entry shape", async () => {
    const schema = JSON.parse(await fs.readFile(path.join(root, "schemas", "runtime", "decision-record.schema.json"), "utf8"));
    const fixture = JSON.parse(
      await fs.readFile(path.join(root, "tests", "fixtures", "runtime-governance", "architecture-change-feed.example.json"), "utf8")
    );
    const validate = new Ajv2020({ allErrors: true, strict: false }).compile({
      $schema: schema.$schema,
      $ref: "#/$defs/architectureChangeFeedEntry",
      $defs: schema.$defs
    });

    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);
    expect(parseArchitectureChangeFeedEntry(fixture).eventType).toBe("decision-created");
  });
});
