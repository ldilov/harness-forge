export interface DeltaFinding {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  evidence: string[];
}

export function renderDeltaOutput(previous: DeltaFinding[], current: DeltaFinding[]): {
  added: DeltaFinding[];
  removed: DeltaFinding[];
  unchanged: DeltaFinding[];
} {
  const previousMap = new Map(previous.map((entry) => [entry.id, entry]));
  const currentMap = new Map(current.map((entry) => [entry.id, entry]));

  const added = current.filter((entry) => !previousMap.has(entry.id));
  const removed = previous.filter((entry) => !currentMap.has(entry.id));
  const unchanged = current.filter((entry) => previousMap.has(entry.id));

  return { added, removed, unchanged };
}
