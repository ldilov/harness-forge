import { describe, expect, it } from "vitest";

import { normalizeLineEndings, readText } from "../../helpers/reasoning-template-assertions";

const parityPairs: Array<[string, string]> = [
  [".hforge/templates/reasoning/contracts/semiformal-core-contract.md", "templates/reasoning/contracts/semiformal-core-contract.md"],
  [".hforge/templates/reasoning/logs/semiformal-exploration-log.md", "templates/reasoning/logs/semiformal-exploration-log.md"],
  [".hforge/templates/reasoning/ledgers/function-trace-table.md", "templates/reasoning/ledgers/function-trace-table.md"],
  [".hforge/templates/reasoning/ledgers/data-flow-and-semantic-properties.md", "templates/reasoning/ledgers/data-flow-and-semantic-properties.md"],
  [".hforge/templates/reasoning/certificates/patch-equivalence-certificate.md", "templates/reasoning/certificates/patch-equivalence-certificate.md"],
  [".hforge/templates/reasoning/certificates/fault-localization-certificate.md", "templates/reasoning/certificates/fault-localization-certificate.md"],
  [".hforge/templates/reasoning/certificates/code-question-answering-certificate.md", "templates/reasoning/certificates/code-question-answering-certificate.md"],
  [".hforge/templates/reasoning/certificates/change-safety-certificate.md", "templates/reasoning/certificates/change-safety-certificate.md"],
  [".hforge/templates/reasoning/workflows/universal-semiformal-investigation-workflow.md", "templates/reasoning/workflows/universal-semiformal-investigation-workflow.md"],
  [".hforge/templates/reasoning/workflows/pre-merge-semiformal-review-workflow.md", "templates/reasoning/workflows/pre-merge-semiformal-review-workflow.md"],
  [".hforge/templates/reasoning/contracts/reasoning-artifact-interface.md", "templates/reasoning/contracts/reasoning-artifact-interface.md"],
  [".hforge/templates/reasoning/contracts/pre-merge-decision-interface.md", "templates/reasoning/contracts/pre-merge-decision-interface.md"]
];

describe("reasoning template parity", () => {
  it("keeps canonical and bridge surfaces in sync", async () => {
    for (const [canonical, bridge] of parityPairs) {
      const [a, b] = await Promise.all([readText(canonical), readText(bridge)]);
      expect(normalizeLineEndings(a)).toBe(normalizeLineEndings(b));
    }
  });
});
