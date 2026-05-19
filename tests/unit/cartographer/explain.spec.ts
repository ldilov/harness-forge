import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildGraph } from "../../../src/application/cartographer/build-graph.js";
import { GraphStore } from "../../../src/infrastructure/cartographer/graph-store.js";
import { simulateImpact } from "../../../src/application/cartographer/simulate-impact.js";
import { ImpactStore } from "../../../src/infrastructure/cartographer/impact-store.js";
import { compileContext } from "../../../src/application/cartographer/compile-context.js";
import { BundleStore } from "../../../src/infrastructure/cartographer/bundle-store.js";
import {
  explainImpact,
  explainContext,
  prNarrative,
  prChecklist,
} from "../../../src/application/cartographer/explain.js";
import { ExplanationStore } from "../../../src/infrastructure/cartographer/explanation-store.js";
import {
  parseExplanation,
  renderExplanationMarkdown,
} from "../../../src/domain/cartographer/explain/explanation.js";
import type { DecisionProvider } from "../../../src/application/cartographer/decision-provider.js";

const noDecisions: DecisionProvider = { id: "none", relevantDecisions: async () => [] };
let workspace: string;

async function seed(): Promise<void> {
  await fs.mkdir(path.join(workspace, "src"), { recursive: true });
  await fs.writeFile(path.join(workspace, "package.json"), JSON.stringify({ name: "d", scripts: { test: "vitest" } }));
  await fs.writeFile(path.join(workspace, "src/a.ts"), "export const a = 1;\n");
  await fs.writeFile(path.join(workspace, "src/b.ts"), 'import { a } from "./a.js";\nexport const b = a;\n');
  const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());
  await new GraphStore(workspace).write(graph);
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "carto-explain-"));
});
afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("explanation schema + render", () => {
  it("renders markdown with summary, sections, and sources", () => {
    const explanation = parseExplanation({
      schemaVersion: 1,
      id: "sum_x",
      kind: "impact",
      createdAt: new Date().toISOString(),
      subject: "Subj",
      summary: "Sum",
      sections: [{ heading: "H", body: ["one", "two"] }],
      sourceRefs: ["impact:abc"],
    });
    const md = renderExplanationMarkdown(explanation);
    expect(md).toContain("# Subj");
    expect(md).toContain("> Sum");
    expect(md).toContain("## H");
    expect(md).toContain("- one");
    expect(md).toContain("## Sources");
  });

  it("rejects an unknown explanation kind", () => {
    expect(() => parseExplanation({ schemaVersion: 1, id: "x", kind: "bogus", createdAt: "t", subject: "s", summary: "x" })).toThrow();
  });

  it("rejects multi-line subject/summary/body (markdown injection guard)", () => {
    const base = { schemaVersion: 1, id: "x", kind: "impact", createdAt: "t", summary: "s" };
    expect(() => parseExplanation({ ...base, subject: "a\n## Injected" })).toThrow();
    expect(() =>
      parseExplanation({ ...base, subject: "ok", sections: [{ heading: "h", body: ["row\n# x"] }] }),
    ).toThrow();
  });

  it("renderExplanationMarkdown collapses any residual newlines defensively", () => {
    const md = renderExplanationMarkdown({
      schemaVersion: 1,
      id: "sum_x",
      kind: "impact",
      createdAt: new Date().toISOString(),
      subject: "S",
      summary: "Y",
      sections: [{ heading: "H", body: ["one"] }],
      sourceRefs: [],
    });
    expect(md.split("\n").filter((l) => l.startsWith("## ")).length).toBe(1);
  });
});

describe("explainImpact / explainContext", () => {
  it("returns null for a missing impact id", async () => {
    expect(await explainImpact(workspace, "trc_missing")).toBeNull();
  });

  it("explains a stored impact report", async () => {
    await seed();
    const { report } = await simulateImpact({ workspaceRoot: workspace, files: ["src/a.ts"], decisionProvider: noDecisions });
    await new ImpactStore(workspace).write(report);
    const explanation = await explainImpact(workspace, report.id);
    expect(explanation?.kind).toBe("impact");
    expect(explanation?.summary).toContain(report.risk);
    const headings = explanation?.sections.map((s) => s.heading) ?? [];
    expect(headings).toContain("Likely impacted");
    expect(headings).toContain("Confidence");
  });

  it("explains a stored context bundle", async () => {
    await seed();
    const { bundle } = await compileContext({ workspaceRoot: workspace, goal: "improve a", decisionProvider: noDecisions });
    await new BundleStore(workspace).write(bundle);
    const explanation = await explainContext(workspace, bundle.id);
    expect(explanation?.kind).toBe("context");
    expect(explanation?.sections.some((s) => s.heading === "Freshness")).toBe(true);
  });
});

describe("prNarrative / prChecklist", () => {
  it("produces a narrative with what-changed/why/verification sections", async () => {
    await seed();
    const narrative = await prNarrative(workspace);
    expect(narrative.kind).toBe("pr-narrative");
    const headings = narrative.sections.map((s) => s.heading);
    expect(headings).toContain("What changed");
    expect(headings).toContain("Why it matters");
    expect(headings).toContain("Verification");
  });

  it("produces a checklist with verification checkboxes", async () => {
    await seed();
    const checklist = await prChecklist(workspace);
    expect(checklist.kind).toBe("pr-checklist");
    expect(checklist.sections[0]?.body.every((line) => line.startsWith("[ ]"))).toBe(true);
  });

  it("persists and re-reads an explanation via ExplanationStore", async () => {
    await seed();
    const narrative = await prNarrative(workspace);
    const store = new ExplanationStore(workspace);
    await store.write(narrative);
    const reread = await store.read(narrative.id);
    expect(reread?.id).toBe(narrative.id);
    expect(await store.list()).toContain(narrative.id);
  });

  it("rejects path-traversal explanation ids", async () => {
    await expect(new ExplanationStore(workspace).read("../../etc/passwd")).rejects.toThrow(/invalid artifact id/);
  });
});
