import { describe, expect, it } from "vitest";

import { createDefaultRecursiveBudgetPolicy } from "../../src/domain/recursive/budget.js";

describe("recursive policy unit", () => {
  it("keeps bounded code-cell and stop-condition defaults explicit", () => {
    const budget = createDefaultRecursiveBudgetPolicy();

    expect(budget.maxCodeCells).toBeGreaterThanOrEqual(0);
    expect(budget.stopConditions.length).toBeGreaterThan(0);
  });

});
