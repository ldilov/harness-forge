import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";
import { styleAccent, styleLabel, styleMuted } from "./text-style.js";

export function renderScreen(title: string, sections: string[], capabilities: TerminalCapabilityProfile): string {
  const width = Math.min(capabilities.terminalWidth, 72);
  const divider = capabilities.prefersAsciiSafeOutput ? "=".repeat(width) : "═".repeat(width);
  const top = capabilities.prefersAsciiSafeOutput ? divider : `╔${"═".repeat(Math.max(width - 2, 1))}╗`;
  const bottom = capabilities.prefersAsciiSafeOutput ? divider : `╚${"═".repeat(Math.max(width - 2, 1))}╝`;
  const content = sections.filter((section) => section.length > 0).join("\n\n");

  if (capabilities.presentationTier === "rich") {
    return [top, title, divider, content, bottom].join("\n");
  }

  return [title, divider, content].join("\n");
}

export function renderBulletList(items: string[], capabilities: TerminalCapabilityProfile): string {
  const bullet = capabilities.prefersAsciiSafeOutput ? "-" : styleAccent(capabilities, "●");
  return items.map((item) => `${bullet} ${item}`).join("\n");
}

export function renderKeyValueTable(values: Array<{ label: string; value: string }>): string {
  const labelWidth = values.reduce((max, entry) => Math.max(max, entry.label.length), 0);
  return values
    .map((entry) => `${entry.label.padEnd(labelWidth)} : ${entry.value}`)
    .join("\n");
}

export function renderInfoCard(
  title: string,
  lines: string[],
  capabilities: TerminalCapabilityProfile
): string {
  const border = capabilities.prefersAsciiSafeOutput ? "-".repeat(Math.min(capabilities.terminalWidth, 56)) : `┄`.repeat(Math.min(capabilities.terminalWidth, 56));
  return [styleLabel(capabilities, title), border, ...lines.map((line) => styleMuted(capabilities, line))].join("\n");
}
