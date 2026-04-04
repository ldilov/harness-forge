import { describe, expect, it } from "vitest";

import { exists } from "../../helpers/reasoning-template-assertions";

const requiredTemplates = [
  "templates/reasoning/contracts/semiformal-core-contract.md",
  "templates/reasoning/logs/semiformal-exploration-log.md",
  "templates/reasoning/ledgers/function-trace-table.md",
  "templates/reasoning/ledgers/data-flow-and-semantic-properties.md",
  "templates/reasoning/certificates/patch-equivalence-certificate.md",
  "templates/reasoning/certificates/fault-localization-certificate.md",
  "templates/reasoning/certificates/code-question-answering-certificate.md",
  "templates/reasoning/certificates/change-safety-certificate.md",
  "templates/reasoning/workflows/universal-semiformal-investigation-workflow.md",
  "templates/reasoning/workflows/pre-merge-semiformal-review-workflow.md",
  "templates/reasoning/contracts/reasoning-artifact-interface.md",
  "templates/reasoning/contracts/pre-merge-decision-interface.md"
];

describe("reasoning template parity", () => {
  it("verifies all reasoning template files exist", async () => {
    for (const file of requiredTemplates) {
      expect(await exists(file), `Missing: ${file}`).toBe(true);
    }
  });
});
