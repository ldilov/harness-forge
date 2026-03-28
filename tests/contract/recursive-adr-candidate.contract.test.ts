import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { parseRecursiveAdrCandidate } from "../../src/domain/recursive/adr-candidate.js";

const root = process.cwd();

describe("recursive ADR candidate contract", () => {
  it("accepts the evidence-backed ADR candidate fixture", async () => {
    const schema = JSON.parse(
      await fs.readFile(path.join(root, "schemas", "runtime", "recursive-adr-candidate.schema.json"), "utf8")
    );
    const fixture = JSON.parse(
      await fs.readFile(path.join(root, "tests", "fixtures", "recursive-runtime", "evidence", "adr-candidate.json"), "utf8")
    );

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);

    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);
    expect(parseRecursiveAdrCandidate(fixture).promotionRecommendation).toBe("promote");
  });
});
