import type { PromptSession } from "../prompt-io.js";
import type { SetupProfileId } from "../setup-intent.js";

export async function promptForSetupProfile(
  promptSession: PromptSession,
  fallback: SetupProfileId
): Promise<SetupProfileId> {
  return (await promptSession.askChoice(
    "setupProfile",
    "Choose the setup depth",
    [
      {
        value: "quick",
        label: "Quick",
        description: "Minimal decisions with a mandatory review before writes."
      },
      {
        value: "recommended",
        label: "Recommended",
        description: "Best default for most repos."
      },
      {
        value: "advanced",
        label: "Advanced",
        description: "Expose optional modules and deeper runtime choices."
      }
    ],
    fallback
  )) as SetupProfileId;
}
