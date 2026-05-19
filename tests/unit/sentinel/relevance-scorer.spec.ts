import { describe, expect, it } from "vitest";

import { applyRelevance, scoreRelevance } from "../../../src/application/sentinel/world/relevance-scorer.js";
import type { ObservationDraft } from "../../../src/infrastructure/sentinel/stores/observation-store.js";

const tree = {
  direct: new Set(["typescript"]),
  dev: new Set(["vitest"]),
  peer: new Set(["zod"]),
  optional: new Set(["fsevents"]),
};

function npmDraft(subject: string): ObservationDraft {
  return {
    source: `npm:${subject}`,
    kind: "npm.release",
    severity: "notice",
    subject,
    summary: `${subject} released`,
    evidence: [{ kind: "url", ref: "https://npmjs.com/" }],
    fingerprint: "fpx",
    confidence: 0.9,
  };
}

describe("scoreRelevance for npm", () => {
  it("returns 1 for a direct dependency", () => {
    const score = scoreRelevance({ draft: npmDraft("typescript"), tree });
    expect(score.score).toBe(1);
  });

  it("returns 0.85 for a peer dependency", () => {
    const score = scoreRelevance({ draft: npmDraft("zod"), tree });
    expect(score.score).toBe(0.85);
  });

  it("returns 0.7 for a dev dependency", () => {
    const score = scoreRelevance({ draft: npmDraft("vitest"), tree });
    expect(score.score).toBe(0.7);
  });

  it("returns 0.1 for a package not in the local tree", () => {
    const score = scoreRelevance({ draft: npmDraft("react"), tree });
    expect(score.score).toBe(0.1);
  });
});

describe("applyRelevance", () => {
  it("drops a draft below the floor (returns null)", () => {
    const draft = npmDraft("react");
    const score = scoreRelevance({ draft, tree });
    expect(applyRelevance(draft, score, 0.5)).toBeNull();
  });

  it("downgrades a draft to info when below 0.5 but above the floor", () => {
    const draft = npmDraft("react");
    const score = scoreRelevance({ draft, tree });
    const result = applyRelevance(draft, score, 0.05);
    expect(result?.severity).toBe("info");
  });

  it("preserves the draft for high-relevance scores", () => {
    const draft = npmDraft("typescript");
    const score = scoreRelevance({ draft, tree });
    const result = applyRelevance(draft, score, 0.5);
    expect(result?.severity).toBe("notice");
  });
});
