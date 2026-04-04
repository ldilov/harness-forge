import type { TargetAdapter } from "../../domain/targets/adapter.js";

export interface TargetAdapterValidationResult {
  targetId: string;
  valid: boolean;
  errors: string[];
}

export function validateTargetAdapters(adapters: TargetAdapter[]): TargetAdapterValidationResult[] {
  return adapters.map((adapter) => {
    const errors: string[] = [];

    if (!adapter.id) {
      errors.push("id is required");
    }
    if (!adapter.displayName) {
      errors.push("displayName is required");
    }
    if (!adapter.pathMappings || Object.keys(adapter.pathMappings).length === 0) {
      errors.push("pathMappings must define at least one mapping");
    }

    const bridge = adapter.sharedRuntimeBridge;
    if (!bridge) {
      errors.push("sharedRuntimeBridge is required for runtime-native validation");
    } else {
      if (!bridge.instructionSurfaces || bridge.instructionSurfaces.length === 0) {
        errors.push("instructionSurfaces must not be empty");
      }
      if (!bridge.supportMode) {
        errors.push("supportMode is required");
      }
    }

    return {
      targetId: adapter.id,
      valid: errors.length === 0,
      errors
    };
  });
}
