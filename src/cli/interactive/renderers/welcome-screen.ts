import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";
import { styleBox, styleEmoji, styleMuted } from "./text-style.js";

export function renderWelcomeScreen(capabilities: TerminalCapabilityProfile): string {
  const hammer = styleEmoji("\uD83D\uDD28", capabilities, "*");
  const check = styleEmoji("\u2705", capabilities, "[x]");

  const lines = [
    `        ${hammer} Harness Forge Setup`,
    "",
    "Make AI coding agents actually useful",
    "in your repository.",
    "",
    `${styleEmoji("\uD83D\uDCD6", capabilities, " ")} What you'll do:`,
    `${check} Pick a workspace folder`,
    `${check} Choose agent targets`,
    `${check} Select setup depth`,
    `${check} Review every write before it happens`,
  ];

  const box = styleBox(lines, capabilities);
  const footer = styleMuted(capabilities, "  Interactive mode never writes before the review step.");

  return `\n${box}\n${footer}\n`;
}
