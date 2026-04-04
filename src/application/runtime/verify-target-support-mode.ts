export type SupportMode = "native" | "bridged" | "translated" | "partial";

export interface TargetSupportRecord {
  targetId: string;
  declaredMode: SupportMode;
  observedSupportsHooks: boolean;
  observedSupportsCommands: boolean;
}

export function verifyTargetSupportMode(record: TargetSupportRecord): { targetId: string; consistent: boolean; reason?: string } {
  if (record.declaredMode === "native" && !record.observedSupportsCommands) {
    return { targetId: record.targetId, consistent: false, reason: "Native mode requires command support." };
  }
  if (record.declaredMode === "translated" && record.observedSupportsHooks) {
    return { targetId: record.targetId, consistent: false, reason: "Translated mode should not declare full hook parity." };
  }
  return { targetId: record.targetId, consistent: true };
}
