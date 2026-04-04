import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { parseRecursiveEscalationHeuristics } from "../../src/domain/recursive/escalation-heuristics.js";
import { loadAgentCommandCatalog } from "../../src/application/runtime/command-catalog.js";

const root = process.cwd();

describe("recursive escalation heuristics contract", () => {
  it("accepts the canonical recursive escalation heuristics fixture", async () => {
    const schema = JSON.parse(
      await fs.readFile(path.join(root, "schemas", "runtime", "recursive-escalation-heuristics.schema.json"), "utf8")
    );
    const fixture = JSON.parse(
      await fs.readFile(
        path.join(root, "tests", "fixtures", "recursive-structured-analysis", "capabilities", "escalation-heuristics.json"),
        "utf8"
      )
    );

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);

    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);
    expect(parseRecursiveEscalationHeuristics(fixture).operatorHintCommand).toBe("/hforge-recursive-investigate");
  });

  it("promotes recursive escalation heuristics through the command catalog", async () => {
    const catalog = await loadAgentCommandCatalog(root);

    expect(catalog.recursiveEscalationHeuristics?.advisoryOnly).toBe(true);
    expect(catalog.recursiveEscalationHeuristics?.operatorHintCommand).toBe("/hforge-recursive-investigate");
    expect(catalog.recursiveEscalationHeuristics?.triggers).toContain("cross-module investigation");
  });
});
