import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";
import { renderBulletList, renderInfoCard, renderScreen } from "./screen-layout.js";
import { styleAccent, styleHeading, styleMuted, styleSection } from "./text-style.js";

export function renderWelcomeScreen(capabilities: TerminalCapabilityProfile): string {
  return renderScreen(
    styleHeading(capabilities, "Harness Forge Setup"),
    [
      "Harness Forge can guide you through a clean hidden-runtime setup without requiring raw flags first.",
      renderInfoCard(
        "What you will do",
        [
          "Pick a workspace folder",
          "Choose one or more agent targets",
          "Select the setup depth",
          "Review every planned write before apply"
        ],
        capabilities
      ),
      styleSection(capabilities, "Guided flow"),
      renderBulletList(
        [
          `choose the ${styleAccent(capabilities, "project folder")} you want to modify`,
          `select ${styleAccent(capabilities, "agent targets")} and setup depth`,
          `review ${styleAccent(capabilities, "planned writes")} before anything changes`,
          `finish with ${styleAccent(capabilities, "next steps")} for status, refresh, task, pack, review, and export`
        ],
        capabilities
      ),
      styleMuted(capabilities, "Interactive mode never writes before the review step.")
    ],
    capabilities
  );
}
