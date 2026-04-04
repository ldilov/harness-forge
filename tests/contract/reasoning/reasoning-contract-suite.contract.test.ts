import { describe, expect, it } from "vitest";

import { exists } from "../../helpers/reasoning-template-assertions";

const requiredFiles = [
  "templates/reasoning/contracts/semiformal-core-contract.md",
  "templates/reasoning/logs/semiformal-exploration-log.md",
  "templates/reasoning/ledgers/function-trace-table.md",
  "templates/reasoning/ledgers/data-flow-and-semantic-properties.md",
  "templates/reasoning/certificates/patch-equivalence-certificate.md",
  "templates/reasoning/certificates/fault-localization-certificate.md",
  "templates/reasoning/certificates/code-question-answering-certificate.md",
  "templates/reasoning/certificates/change-safety-certificate.md",
  "templates/reasoning/workflows/universal-semiformal-investigation-workflow.md",
  "templates/reasoning/workflows/pre-merge-semiformal-review-workflow.md"
];

describe("reasoning contract suite", () => {
  it("keeps canonical reasoning surfaces present", async () => {
    const checks = await Promise.all(requiredFiles.map((file) => exists(file)));
    expect(checks.every(Boolean)).toBe(true);
  });
});
