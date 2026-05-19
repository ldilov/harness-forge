import { generateId } from "../../shared/id-generator.js";
import { nowISO } from "../../shared/timestamps.js";
import { ImpactStore } from "../../infrastructure/cartographer/impact-store.js";
import { BundleStore } from "../../infrastructure/cartographer/bundle-store.js";
import { simulateImpact } from "./simulate-impact.js";
import { HarnessDecisionProvider } from "./decision-provider.js";
import {
  parseExplanation,
  type Explanation,
  type ExplanationSection,
} from "../../domain/cartographer/explain/explanation.js";
import type { ImpactAnalysis } from "../../domain/cartographer/impact/impact-report.js";

const MAX_LIST = 20;

function clean(value: string): string {
  return value.replace(/[\r\n]+/g, " ").slice(0, 2048);
}

function code(value: string): string {
  return `\`${clean(value).replace(/`/g, "'")}\``;
}

function explanation(
  kind: Explanation["kind"],
  subject: string,
  summary: string,
  sections: readonly ExplanationSection[],
  sourceRefs: readonly string[],
): Explanation {
  return parseExplanation({
    schemaVersion: 1,
    id: generateId("summary"),
    kind,
    createdAt: nowISO(),
    subject,
    summary,
    sections,
    sourceRefs,
  });
}

function impactSections(report: ImpactAnalysis): readonly ExplanationSection[] {
  return [
    {
      heading: "Changed",
      body:
        report.changedFiles.length > 0
          ? report.changedFiles.slice(0, MAX_LIST).map((file) => clean(file))
          : ["(no indexed changed files)"],
    },
    {
      heading: "Likely impacted",
      body:
        report.impactedFiles.length > 0
          ? report.impactedFiles.slice(0, MAX_LIST).map((ref) => clean(`${ref.path ?? ref.id} — ${ref.reason}`))
          : ["No static dependents found (see confidence note)."],
    },
    {
      heading: "Recommended verification",
      body:
        report.recommendedCommands.length > 0
          ? report.recommendedCommands.slice(0, MAX_LIST).map((cmd) => `${code(cmd.command)} — ${clean(cmd.reason)}`)
          : ["No graph-linked verification commands detected."],
    },
    ...(report.impactedDecisions.length > 0
      ? [
          {
            heading: "Relevant decisions",
            body: report.impactedDecisions
              .slice(0, MAX_LIST)
              .map((ref) => clean(`${ref.id}: ${ref.title ?? ref.id}`)),
          },
        ]
      : []),
    { heading: "Confidence", body: [clean(report.confidenceNote)] },
  ];
}

export async function explainImpact(
  workspaceRoot: string,
  impactId: string,
): Promise<Explanation | null> {
  const report = await new ImpactStore(workspaceRoot).read(impactId);
  if (report === null) {
    return null;
  }
  return explanation(
    "impact",
    clean(`Why these files are affected (${report.id})`),
    clean(`Risk ${report.risk}. ${report.explanation}`),
    impactSections(report),
    [`impact:${report.id}`, `graph:${report.graphVersion}`],
  );
}

export async function explainContext(
  workspaceRoot: string,
  bundleId: string,
): Promise<Explanation | null> {
  const bundle = await new BundleStore(workspaceRoot).read(bundleId);
  if (bundle === null) {
    return null;
  }
  const sections: ExplanationSection[] = [
    {
      heading: "Why these files were selected",
      body: bundle.relevantFiles
        .slice(0, MAX_LIST)
        .map((ref) => clean(`${ref.path ?? ref.id} — ${ref.reason}`)),
    },
  ];
  if (bundle.relevantDecisions.length > 0) {
    sections.push({
      heading: "Constraining decisions",
      body: bundle.relevantDecisions.slice(0, MAX_LIST).map((ref) => clean(`${ref.id}: ${ref.title ?? ref.id}`)),
    });
  }
  sections.push({
    heading: "Freshness",
    body: [
      `Indexed ${bundle.graphFreshness.indexedAt}`,
      `${bundle.graphFreshness.modifiedSinceIndex.length} file(s) changed since index`,
      bundle.contextTruncated ? "Bundle was truncated to fit the token budget." : "Bundle was not truncated.",
    ],
  });
  return explanation(
    "context",
    clean(`Why this context bundle (${bundle.id})`),
    clean(`Goal: ${bundle.goal}`),
    sections,
    [`context:${bundle.id}`, `graph:${bundle.graphVersion}`],
  );
}

export async function explainDiff(workspaceRoot: string): Promise<Explanation> {
  const { report } = await simulateImpact({
    workspaceRoot,
    changedOnly: true,
    decisionProvider: new HarnessDecisionProvider(workspaceRoot),
  });
  return explanation(
    "diff",
    "What the working-tree changes touch",
    clean(`Risk ${report.risk}. ${report.explanation}`),
    impactSections(report),
    [`impact:${report.id}`, `graph:${report.graphVersion}`],
  );
}

export async function prNarrative(workspaceRoot: string): Promise<Explanation> {
  const { report } = await simulateImpact({
    workspaceRoot,
    changedOnly: true,
    decisionProvider: new HarnessDecisionProvider(workspaceRoot),
  });
  const verification =
    report.recommendedCommands.length > 0
      ? report.recommendedCommands.slice(0, MAX_LIST).map((cmd) => cmd.command)
      : ["npm test", "npm run build"];
  const sections: ExplanationSection[] = [
    {
      heading: "What changed",
      body:
        report.changedFiles.length > 0
          ? report.changedFiles.slice(0, MAX_LIST).map((file) => clean(file))
          : ["(no indexed changed files detected)"],
    },
    {
      heading: "Why it matters",
      body: [
        `Risk classified ${report.risk}.`,
        `${report.impactedFiles.length} file(s) statically depend on the change.`,
        ...(report.impactedDecisions.length > 0
          ? [clean(`Touches decisions: ${report.impactedDecisions.slice(0, MAX_LIST).map((d) => d.id).join(", ")}`)]
          : []),
      ],
    },
    { heading: "Verification", body: verification.map((cmd) => code(cmd)) },
    ...(report.suggestedSplit.length > 0
      ? [{ heading: "Suggested split", body: report.suggestedSplit.slice(0, MAX_LIST).map((s) => clean(s)) }]
      : []),
  ];
  return explanation(
    "pr-narrative",
    "Pull request narrative",
    `${report.changedFiles.length} changed file(s), risk ${report.risk}.`,
    sections,
    [`impact:${report.id}`, `graph:${report.graphVersion}`],
  );
}

export async function prChecklist(workspaceRoot: string): Promise<Explanation> {
  const { report } = await simulateImpact({
    workspaceRoot,
    changedOnly: true,
    decisionProvider: new HarnessDecisionProvider(workspaceRoot),
  });
  const commands =
    report.recommendedCommands.length > 0
      ? report.recommendedCommands
          .slice(0, MAX_LIST)
          .map((cmd) => `[ ] ${code(cmd.command)} — ${clean(cmd.reason)}`)
      : ["[ ] `npm test`", "[ ] `npm run build`"];
  const checklist: ExplanationSection[] = [
    { heading: "Verification checklist", body: commands },
    {
      heading: "Review focus",
      body:
        report.impactedFiles.length > 0
          ? report.impactedFiles.slice(0, MAX_LIST).map((ref) => clean(`[ ] Review ${ref.path ?? ref.id}`))
          : ["[ ] No static dependents; confirm runtime coupling manually."],
    },
  ];
  return explanation(
    "pr-checklist",
    "Pull request verification checklist",
    `Risk ${report.risk}; ${report.recommendedCommands.length} recommended command(s).`,
    checklist,
    [`impact:${report.id}`],
  );
}
