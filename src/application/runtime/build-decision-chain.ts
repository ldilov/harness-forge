import type { AdrRecord, DecisionRecord } from "../../domain/runtime/decision-record.js";
import type { DecisionChain } from "../../domain/runtime/decision-chain.js";
import type { DecisionHealthFinding } from "../../domain/runtime/decision-health.js";

function isAdr(record: DecisionRecord): record is AdrRecord {
  return record.recordType === "adr";
}

function finding(
  id: string,
  title: string,
  rationale: string,
  decisionId: string,
  evidence: string[],
  detectedAt: string,
  category: DecisionHealthFinding["category"] = "broken-lineage"
): DecisionHealthFinding {
  return {
    id,
    category,
    severity: category === "circular-lineage" || category === "conflicting-lineage" ? "blocker" : "warning",
    decisionId,
    title,
    rationale,
    evidence,
    recommendedAction: "Review ADR supersession links and update the affected decision records.",
    detectedAt
  };
}

export function buildDecisionChains(records: readonly DecisionRecord[], detectedAt = new Date().toISOString()): DecisionChain[] {
  const adrs = records.filter(isAdr);
  const byId = new Map(adrs.map((record) => [record.id, record]));
  const findings: DecisionHealthFinding[] = [];
  const referenced = new Set<string>();

  for (const record of adrs) {
    for (const previous of record.supersedes) {
      referenced.add(previous);
      if (!byId.has(previous)) {
        findings.push(
          finding(
            `decision-lineage-missing-${record.id}-${previous}`,
            `Missing superseded ADR: ${previous}`,
            `${record.id} supersedes ${previous}, but the referenced ADR was not found.`,
            record.id,
            [record.id, previous],
            detectedAt
          )
        );
      }
    }
    for (const next of record.supersededBy) {
      referenced.add(next);
      if (!byId.has(next)) {
        findings.push(
          finding(
            `decision-lineage-missing-${record.id}-${next}`,
            `Missing superseding ADR: ${next}`,
            `${record.id} is superseded by ${next}, but the referenced ADR was not found.`,
            record.id,
            [record.id, next],
            detectedAt
          )
        );
      }
    }
    if (record.supersededBy.length > 1) {
      findings.push(
        finding(
          `decision-lineage-branching-${record.id}`,
          `Branching supersession for ${record.id}`,
          `${record.id} points at multiple superseding ADRs.`,
          record.id,
          [record.id, ...record.supersededBy],
          detectedAt,
          "conflicting-lineage"
        )
      );
    }
  }

  const roots = adrs.filter((record) => record.supersedes.length === 0 || !record.supersedes.some((id) => byId.has(id)));
  const chains: DecisionChain[] = [];
  const visitedGlobally = new Set<string>();

  for (const root of roots.length > 0 ? roots : adrs) {
    const ids: string[] = [];
    const local = new Set<string>();
    let current: AdrRecord | undefined = root;
    let status: DecisionChain["status"] = "complete";

    while (current) {
      if (local.has(current.id)) {
        status = "circular";
        findings.push(
          finding(
            `decision-lineage-circular-${current.id}`,
            `Circular ADR lineage at ${current.id}`,
            `The ADR lineage loops back to ${current.id}.`,
            current.id,
            [...ids, current.id],
            detectedAt,
            "circular-lineage"
          )
        );
        break;
      }
      ids.push(current.id);
      local.add(current.id);
      visitedGlobally.add(current.id);

      const validNext: string[] = current.supersededBy.filter((id) => byId.has(id));
      if (validNext.length > 1) {
        status = "branching";
        break;
      }
      current = validNext.length === 1 ? byId.get(validNext[0]!) : undefined;
    }

    const currentDecisionId = status === "complete" && ids.length > 0 ? ids[ids.length - 1] : undefined;
    chains.push({
      chainId: `chain-${ids[0] ?? root.id}`,
      decisionIds: ids,
      currentDecisionId,
      status,
      findings: findings.filter((entry) => ids.includes(entry.decisionId ?? ""))
    });
  }

  for (const record of adrs) {
    if (!visitedGlobally.has(record.id) && !referenced.has(record.id)) {
      chains.push({
        chainId: `chain-${record.id}`,
        decisionIds: [record.id],
        currentDecisionId: record.id,
        status: "complete",
        findings: []
      });
    }
  }

  return chains.sort((left, right) => left.chainId.localeCompare(right.chainId));
}
