import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";

function canDecorate(capabilities: TerminalCapabilityProfile): boolean {
  return capabilities.colorLevel !== "none" && capabilities.presentationTier === "rich";
}

export function styleHeading(capabilities: TerminalCapabilityProfile, value: string): string {
  if (!canDecorate(capabilities)) {
    return value.toUpperCase();
  }
  return `\u001b[1m${value}\u001b[0m`;
}

export function styleSection(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return `${value}:`;
  }
  return `\u001b[1;36m${value}\u001b[0m`;
}

export function styleMuted(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return value;
  }
  return `\u001b[90m${value}\u001b[0m`;
}

export function styleAccent(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return value;
  }
  return `\u001b[36m${value}\u001b[0m`;
}

export function styleLabel(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return value;
  }
  return `\u001b[1;37m${value}\u001b[0m`;
}

export function styleSuccess(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return value;
  }
  return `\u001b[32m${value}\u001b[0m`;
}

export function styleWarning(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return value;
  }
  return `\u001b[33m${value}\u001b[0m`;
}

export function stylePath(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return value;
  }
  return `\u001b[35m${value}\u001b[0m`;
}
