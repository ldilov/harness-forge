export type CapabilitySupportLevel = "full" | "partial" | "emulated" | "unsupported" | "contract";
export type CapabilitySupportMode =
  | "native"
  | "translated"
  | "emulated"
  | "documentation-only"
  | "unsupported"
  | "contract"
  | "bridged";

export interface CapabilityRecord {
  capabilityId: string;
  supportLevel: CapabilitySupportLevel;
  supportMode: CapabilitySupportMode;
  evidenceSource: string[];
  lastValidatedAt: string;
  validationMethod: string;
  confidence: number;
  notes?: string;
  fallbackBehavior?: string;
}

export interface CapabilityTargetRecord {
  targetId: string;
  displayName: string;
  supportLevel: CapabilitySupportLevel;
  capabilities: CapabilityRecord[];
}

export interface HarnessCapabilityMatrixDocument {
  version: number;
  generatedAt: string;
  targets: CapabilityTargetRecord[];
}
