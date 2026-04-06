import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";

// ---------------------------------------------------------------------------
// ANSI escape helpers
// ---------------------------------------------------------------------------

const RESET = "\u001b[0m";
const BOLD = "\u001b[1m";
const DIM = "\u001b[90m";
const CYAN = "\u001b[36m";
const BOLD_CYAN = "\u001b[1;36m";
const BOLD_WHITE = "\u001b[1;37m";
const GREEN = "\u001b[32m";
const YELLOW = "\u001b[33m";
const MAGENTA = "\u001b[35m";

function canDecorate(capabilities: TerminalCapabilityProfile): boolean {
  return capabilities.colorLevel !== "none" && capabilities.presentationTier === "rich";
}

// ---------------------------------------------------------------------------
// Original style functions (signatures preserved)
// ---------------------------------------------------------------------------

export function styleHeading(capabilities: TerminalCapabilityProfile, value: string): string {
  if (!canDecorate(capabilities)) {
    return value;
  }
  return `${BOLD}${value}${RESET}`;
}

export function styleSection(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return `${value}:`;
  }
  return `${BOLD_CYAN}${value}${RESET}`;
}

export function styleMuted(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return value;
  }
  return `${DIM}${value}${RESET}`;
}

export function styleAccent(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return value;
  }
  return `${CYAN}${value}${RESET}`;
}

export function styleLabel(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return value;
  }
  return `${BOLD_WHITE}${value}${RESET}`;
}

export function styleSuccess(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return value;
  }
  return `${GREEN}${value}${RESET}`;
}

export function styleWarning(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return value;
  }
  return `${YELLOW}${value}${RESET}`;
}

export function stylePath(capabilities: TerminalCapabilityProfile, value: string): string {
  if (capabilities.colorLevel === "none") {
    return value;
  }
  return `${MAGENTA}${value}${RESET}`;
}

// ---------------------------------------------------------------------------
// New beautification functions
// ---------------------------------------------------------------------------

/** Returns the emoji when Unicode is safe, or the ASCII fallback otherwise. */
export function styleEmoji(
  emoji: string,
  caps: TerminalCapabilityProfile,
  asciiFallback = ""
): string {
  return caps.prefersAsciiSafeOutput ? asciiFallback : emoji;
}

/** Computes box inner width from terminal capabilities. */
export function boxWidth(caps: TerminalCapabilityProfile): number {
  return Math.min(caps.terminalWidth, 50);
}

// ---------------------------------------------------------------------------
// Box-drawing primitives (reusable)
// ---------------------------------------------------------------------------

function boxChars(caps: TerminalCapabilityProfile): {
  tl: string; tr: string; bl: string; br: string;
  h: string; v: string; tee: string; elbow: string; pipe: string;
} {
  if (caps.prefersAsciiSafeOutput) {
    return { tl: "+", tr: "+", bl: "+", br: "+", h: "-", v: "|", tee: "|--", elbow: "`--", pipe: "|" };
  }
  return { tl: "\u256D", tr: "\u256E", bl: "\u2570", br: "\u256F", h: "\u2500", v: "\u2502", tee: "\u251C\u2500", elbow: "\u2514\u2500", pipe: "\u2502" };
}

/**
 * Renders a box with Unicode box-drawing characters.
 *
 * ```
 *   ╭─ Title ────────────────────────────────╮
 *   │                                        │
 *   │  content line 1                        │
 *   │  content line 2                        │
 *   │                                        │
 *   ╰────────────────────────────────────────╯
 * ```
 *
 * Each line is left-padded by 2 spaces for breathing room.
 */
export function styleBox(
  lines: readonly string[],
  caps: TerminalCapabilityProfile,
  title = ""
): string {
  const bc = boxChars(caps);
  const width = boxWidth(caps);
  const innerWidth = Math.max(width - 4, 10); // 2 for border + 1 space padding each side

  // Strip ANSI for length calculation
  const stripAnsi = (s: string): string => s.replace(/\u001b\[[0-9;]*m/g, "");

  // Top border with optional title
  let topLine: string;
  if (title.length > 0) {
    const titleStripped = stripAnsi(title);
    const dashesAfter = Math.max(innerWidth - titleStripped.length - 3, 1);
    topLine = `  ${bc.tl}${bc.h} ${title} ${bc.h.repeat(dashesAfter)}${bc.tr}`;
  } else {
    topLine = `  ${bc.tl}${bc.h.repeat(innerWidth + 2)}${bc.tr}`;
  }

  // Pad a content line inside the box
  const padLine = (text: string): string => {
    const visible = stripAnsi(text);
    const padding = Math.max(innerWidth - visible.length, 0);
    return `  ${bc.v}  ${text}${" ".repeat(padding)}${bc.v}`;
  };

  const emptyLine = padLine("");
  const bottomLine = `  ${bc.bl}${bc.h.repeat(innerWidth + 2)}${bc.br}`;

  const body = lines.map(padLine);

  return [topLine, emptyLine, ...body, emptyLine, bottomLine].join("\n");
}

/**
 * Renders a compact banner for section titles.
 *
 * ```
 *   ─── Step 1/4 · 📂 Workspace ────────────────
 * ```
 */
export function styleBanner(
  text: string,
  caps: TerminalCapabilityProfile
): string {
  const bc = boxChars(caps);
  const width = boxWidth(caps);
  const stripAnsi = (s: string): string => s.replace(/\u001b\[[0-9;]*m/g, "");
  const visibleLen = stripAnsi(text).length;
  const trailLen = Math.max(width - visibleLen - 7, 3);
  const prefix = `  ${bc.h.repeat(3)} `;
  const suffix = ` ${bc.h.repeat(trailLen)}`;
  if (caps.colorLevel === "none") {
    return `${prefix}${text}${suffix}`;
  }
  return `${DIM}${prefix}${RESET}${BOLD}${text}${RESET}${DIM}${suffix}${RESET}`;
}

/**
 * Renders a progress bar.
 *
 * ```
 *   ████████░░░░ 75%
 * ```
 */
export function styleProgressBar(
  percent: number,
  width: number,
  caps: TerminalCapabilityProfile
): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;

  if (caps.prefersAsciiSafeOutput) {
    return `[${"#".repeat(filled)}${".".repeat(empty)}] ${Math.round(clamped)}%`;
  }

  const filledChar = "\u2588";
  const emptyChar = "\u2591";
  const bar = `${filledChar.repeat(filled)}${emptyChar.repeat(empty)}`;

  if (caps.colorLevel === "none") {
    return `${bar} ${Math.round(clamped)}%`;
  }
  return `${GREEN}${bar}${RESET} ${Math.round(clamped)}%`;
}

/**
 * Renders a colored badge: `[label: value]`
 */
export function styleBadge(
  label: string,
  value: string,
  color: string,
  caps: TerminalCapabilityProfile
): string {
  if (caps.colorLevel === "none") {
    return `[${label}: ${value}]`;
  }
  return `${color}[${label}: ${value}]${RESET}`;
}

/**
 * Renders a styled horizontal separator.
 */
export function styleSeparator(caps: TerminalCapabilityProfile): string {
  const width = boxWidth(caps);
  if (caps.prefersAsciiSafeOutput) {
    return `  ${"-".repeat(width - 4)}`;
  }
  const bc = boxChars(caps);
  if (caps.colorLevel === "none") {
    return `  ${bc.h.repeat(width - 4)}`;
  }
  return `  ${DIM}${bc.h.repeat(width - 4)}${RESET}`;
}

/**
 * Renders a key-value pair with dot leaders.
 *
 * ```
 *   📦 Repo type    typescript-cli
 * ```
 */
export function styleKeyValue(
  key: string,
  value: string,
  caps: TerminalCapabilityProfile,
  keyWidth = 14
): string {
  const stripAnsi = (s: string): string => s.replace(/\u001b\[[0-9;]*m/g, "");
  const visibleKey = stripAnsi(key);
  const padding = Math.max(keyWidth - visibleKey.length, 1);
  return `${key}${" ".repeat(padding)}${value}`;
}

/**
 * Renders a tree-style list of activity items.
 *
 * ```
 *      ├─ detecting targets
 *      ├─ checking language signals
 *      └─ building recommendation brief
 * ```
 */
export function styleTreeList(
  items: readonly string[],
  caps: TerminalCapabilityProfile
): string {
  const bc = boxChars(caps);
  return items
    .map((item, i) => {
      const connector = i < items.length - 1 ? bc.tee : bc.elbow;
      return `     ${connector} ${item}`;
    })
    .join("\n");
}
