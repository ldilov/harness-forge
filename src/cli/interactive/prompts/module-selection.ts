import type { PromptSession } from "../prompt-io.js";
import type { OptionalModuleId } from "../setup-intent.js";
import { getSetupProfileDescriptor, OPTIONAL_MODULE_DESCRIPTIONS, OPTIONAL_MODULE_LABELS } from "../setup-intent.js";

const MODULE_CHOICES: OptionalModuleId[] = [
  "working-memory",
  "task-pack-support",
  "decision-templates",
  "export-support",
  "recursive-runtime"
];

export async function promptForModules(
  promptSession: PromptSession,
  profileId: "quick" | "recommended" | "advanced"
): Promise<OptionalModuleId[]> {
  const fallback = getSetupProfileDescriptor(profileId).defaultModules;
  if (profileId !== "advanced") {
    return fallback;
  }

  const selected = await promptSession.askMultiChoice(
    "modules",
    "Choose optional runtime modules",
    MODULE_CHOICES.map((moduleId) => ({
      value: moduleId,
      label: OPTIONAL_MODULE_LABELS[moduleId],
      description: OPTIONAL_MODULE_DESCRIPTIONS[moduleId]
    })),
    fallback
  );
  return selected.filter((value): value is OptionalModuleId => MODULE_CHOICES.includes(value as OptionalModuleId));
}
