import { describe, expect, it } from "vitest";

import { exists } from "../../helpers/reasoning-template-assertions";

const requiredFiles = [
  ".hforge/templates/reasoning/contracts/semiformal-core-contract.md",
  ".hforge/templates/reasoning/logs/semiformal-exploration-log.md",
  ".hforge/templates/reasoning/ledgers/function-trace-table.md",
  ".hforge/templates/reasoning/ledgers/data-flow-and-semantic-properties.md",
  ".hforge/templates/reasoning/certificates/patch-equivalence-certificate.md",
  ".hforge/templates/reasoning/certificates/fault-localization-certificate.md",
  ".hforge/templates/reasoning/certificates/code-question-answering-certificate.md",
  ".hforge/templates/reasoning/certificates/change-safety-certificate.md",
  ".hforge/templates/reasoning/workflows/universal-semiformal-investigation-workflow.md",
  ".hforge/templates/reasoning/workflows/pre-merge-semiformal-review-workflow.md"
];

describe("reasoning contract suite", () => {
  it("keeps canonical reasoning surfaces present", async () => {
    const checks = await Promise.all(requiredFiles.map((file) => exists(file)));
    expect(checks.every(Boolean)).toBe(true);
  });
});
