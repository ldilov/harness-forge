import { describe, expect, it } from "vitest";

import { parseRecursivePromotionProposal } from "../../src/domain/recursive/promotion-proposal.js";

describe("recursive promotion contract", () => {
  it("parses evidence-linked promotion proposals", () => {
    const proposal = parseRecursivePromotionProposal({
      promotionId: "PROMO-001",
      sessionId: "RS-001",
      promotionKind: "review-artifact",
      sourceRefs: ["repo-map"],
      targetSurface: "docs/reviews/billing.md",
      status: "proposed",
      rationale: "Review the findings before promotion",
      createdAt: "2026-04-01T10:00:00.000Z"
    });

    expect(proposal.status).toBe("proposed");
  });

});
