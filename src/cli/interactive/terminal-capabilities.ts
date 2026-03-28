import os from "node:os";

export type InteractiveColorLevel = "full" | "reduced" | "none";
export type InteractivePresentationTier = "rich" | "compact" | "minimal" | "non-interactive";

export interface TerminalCapabilityProfile {
  supportsInteractiveInput: boolean;
  colorLevel: InteractiveColorLevel;
  terminalWidth: number;
  prefersAsciiSafeOutput: boolean;
  screenReaderSafeMode: boolean;
  isWindowsLike: boolean;
  presentationTier: InteractivePresentationTier;
}

export interface DetectTerminalCapabilitiesOptions {
  env?: NodeJS.ProcessEnv;
  stdinIsTTY?: boolean;
  stdoutIsTTY?: boolean;
  columns?: number;
  platform?: NodeJS.Platform;
}

function parseForcedTty(value: string | undefined): boolean | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return null;
}

function detectColorLevel(env: NodeJS.ProcessEnv, stdoutIsTTY: boolean): InteractiveColorLevel {
  if (env.NO_COLOR || !stdoutIsTTY) {
    return "none";
  }

  const forceColor = env.FORCE_COLOR?.trim();
  if (forceColor === "0") {
    return "none";
  }
  if (forceColor === "1") {
    return "reduced";
  }
  if (forceColor === "2" || forceColor === "3") {
    return "full";
  }

  return stdoutIsTTY ? "full" : "none";
}

export function detectTerminalCapabilities(
  options: DetectTerminalCapabilitiesOptions = {}
): TerminalCapabilityProfile {
  const env = options.env ?? process.env;
  const forcedTty = parseForcedTty(env.HFORGE_FORCE_TTY);
  const stdinIsTTY = forcedTty ?? options.stdinIsTTY ?? process.stdin.isTTY ?? false;
  const stdoutIsTTY = forcedTty ?? options.stdoutIsTTY ?? process.stdout.isTTY ?? false;
  const supportsInteractiveInput = stdinIsTTY && stdoutIsTTY && env.CI !== "true";
  const terminalWidth = Number.parseInt(env.HFORGE_TERM_WIDTH ?? `${options.columns ?? process.stdout.columns ?? 80}`, 10);
  const colorLevel = detectColorLevel(env, stdoutIsTTY);
  const platform = options.platform ?? process.platform;
  const screenReaderSafeMode = env.HFORGE_SCREEN_READER === "1";
  const prefersAsciiSafeOutput =
    env.HFORGE_ASCII === "1" ||
    colorLevel === "none" ||
    screenReaderSafeMode ||
    env.TERM === "dumb";
  const width = Number.isFinite(terminalWidth) && terminalWidth > 0 ? terminalWidth : 80;

  let presentationTier: InteractivePresentationTier;
  if (!supportsInteractiveInput) {
    presentationTier = "non-interactive";
  } else if (width < 52) {
    presentationTier = "minimal";
  } else if (width < 80 || colorLevel === "none") {
    presentationTier = "compact";
  } else {
    presentationTier = "rich";
  }

  return {
    supportsInteractiveInput,
    colorLevel,
    terminalWidth: width,
    prefersAsciiSafeOutput,
    screenReaderSafeMode,
    isWindowsLike: platform === "win32" || os.platform() === "win32",
    presentationTier
  };
}
