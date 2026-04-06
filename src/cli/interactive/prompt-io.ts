import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { ValidationError } from "../../shared/index.js";
import type { TerminalCapabilityProfile } from "./terminal-capabilities.js";
import { styleBox, styleEmoji, styleMuted } from "./renderers/text-style.js";

export type PromptScriptValue = string | string[] | boolean | null;

interface PromptScript {
  [key: string]: PromptScriptValue;
}

export interface PromptChoiceOption {
  value: string;
  label: string;
  description?: string;
}

type PromptChoiceInput = string | PromptChoiceOption;

export interface PromptSession {
  script: PromptScript;
  capabilities: TerminalCapabilityProfile;
  scripted: boolean;
  askText(stepId: string, prompt: string, fallback?: string): Promise<string>;
  askChoice(stepId: string, prompt: string, choices: readonly PromptChoiceInput[], fallback: string): Promise<string>;
  askMultiChoice(stepId: string, prompt: string, choices: readonly PromptChoiceInput[], fallback: string[]): Promise<string[]>;
  askConfirm(stepId: string, prompt: string, fallback?: boolean): Promise<boolean>;
}

function normalizeScriptValue(value: PromptScriptValue, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function parsePromptScript(): PromptScript {
  const raw = process.env.HFORGE_INTERACTIVE_SCRIPT;
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as PromptScript;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

async function askInteractive(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input, output });
  try {
    return (await rl.question(`${prompt} `)).trim();
  } finally {
    rl.close();
  }
}

function normalizeChoiceOption(choice: PromptChoiceInput): PromptChoiceOption {
  if (typeof choice === "string") {
    return { value: choice, label: choice };
  }
  return choice;
}

function renderChoiceMenu(
  prompt: string,
  choices: PromptChoiceOption[],
  multi = false,
  caps?: TerminalCapabilityProfile
): string {
  // If we have capabilities, render a beautiful boxed menu
  if (caps && !caps.prefersAsciiSafeOutput && caps.colorLevel !== "none") {
    const choiceLines: string[] = [];
    for (const [index, choice] of choices.entries()) {
      const num = `${index + 1}`;
      const arrow = styleEmoji("\u2192", caps, "->");
      choiceLines.push(`${num}  ${arrow}  ${choice.label}`);
      if (choice.description) {
        choiceLines.push(`       ${styleMuted(caps, choice.description)}`);
      }
      if (index < choices.length - 1) {
        choiceLines.push("");
      }
    }
    const titleIcon = styleEmoji("\uD83D\uDCC2", caps, ">");
    const box = styleBox(choiceLines, caps, `${titleIcon} ${prompt}`);
    const inputPrompt = multi
      ? "  Enter one or more numbers separated by commas:"
      : "  Enter a number:";
    return `${box}\n\n${inputPrompt}`;
  }

  // Legacy fallback
  const lines = [
    prompt,
    ...choices.map((choice, index) => {
      const suffix = choice.description ? ` - ${choice.description}` : "";
      return `  ${index + 1}. ${choice.label}${suffix}`;
    }),
    multi ? "Enter one or more numbers separated by commas:" : "Enter a number:"
  ];
  return lines.join("\n");
}

function normalizeChoice(value: string, choices: PromptChoiceOption[], fallback: string): string {
  const exact = choices.find(
    (choice) =>
      choice.value.toLowerCase() === value.toLowerCase() ||
      choice.label.toLowerCase() === value.toLowerCase()
  );
  if (exact) {
    return exact.value;
  }

  const numericIndex = Number.parseInt(value, 10);
  if (Number.isInteger(numericIndex) && numericIndex >= 1 && numericIndex <= choices.length) {
    return choices[numericIndex - 1]?.value ?? fallback;
  }

  return fallback;
}

export function createPromptSession(capabilities: TerminalCapabilityProfile): PromptSession {
  const script = parsePromptScript();
  const scripted = Object.keys(script).length > 0;

  return {
    script,
    capabilities,
    scripted,
    async askText(stepId, prompt, fallback = "") {
      const scripted = script[stepId];
      if (typeof scripted === "string") {
        return scripted;
      }
      if (scripted && fallback) {
        return fallback;
      }
      if (!capabilities.supportsInteractiveInput) {
        if (fallback) {
          return fallback;
        }
        throw new ValidationError(`Interactive input required for ${stepId}. Re-run with explicit flags or HFORGE_INTERACTIVE_SCRIPT.`);
      }
      const answer = await askInteractive(prompt);
      return answer || fallback;
    },
    async askChoice(stepId, prompt, choices, fallback) {
      const normalizedChoices = choices.map(normalizeChoiceOption);
      const scripted = script[stepId];
      if (typeof scripted === "string") {
        return normalizeChoice(scripted, normalizedChoices, fallback);
      }
      if (scripted && fallback) {
        return fallback;
      }
      if (!capabilities.supportsInteractiveInput) {
        return fallback;
      }
      const answer = await askInteractive(renderChoiceMenu(prompt, normalizedChoices, false, capabilities));
      return normalizeChoice(answer, normalizedChoices, fallback);
    },
    async askMultiChoice(stepId, prompt, choices, fallback) {
      const normalizedChoices = choices.map(normalizeChoiceOption);
      const scripted = script[stepId];
      if (Array.isArray(scripted)) {
        const resolved = scripted
          .filter((item): item is string => typeof item === "string")
          .map((item) => normalizeChoice(item, normalizedChoices, item))
          .filter((item) => normalizedChoices.some((choice) => choice.value === item));
        return resolved.length > 0 ? [...new Set(resolved)] : fallback;
      }
      if (typeof scripted === "string") {
        const values = scripted
          .split(",")
          .map((item) => normalizeChoice(item.trim(), normalizedChoices, item.trim()))
          .filter((item) => normalizedChoices.some((choice) => choice.value === item));
        return values.length > 0 ? [...new Set(values)] : fallback;
      }
      if (scripted) {
        return fallback;
      }
      if (!capabilities.supportsInteractiveInput) {
        return fallback;
      }
      const answer = await askInteractive(renderChoiceMenu(prompt, normalizedChoices, true, capabilities));
      if (!answer) {
        return fallback;
      }
      return answer
        .split(",")
        .map((item) => normalizeChoice(item.trim(), normalizedChoices, item.trim()))
        .filter((item) => normalizedChoices.some((choice) => choice.value === item));
    },
    async askConfirm(stepId, prompt, fallback = false) {
      const scripted = script[stepId];
      if (typeof scripted === "boolean") {
        return scripted;
      }
      if (typeof scripted === "string") {
        return ["1", "true", "yes", "y", "confirm"].includes(scripted.toLowerCase());
      }
      if (scripted) {
        return fallback;
      }
      if (!capabilities.supportsInteractiveInput) {
        return fallback;
      }
      const answer = await askInteractive(`${prompt} (${fallback ? "Y/n" : "y/N"})`);
      if (!answer) {
        return fallback;
      }
      return ["1", "true", "yes", "y"].includes(answer.toLowerCase());
    }
  };
}

export function readScriptLabel(stepId: string, fallback: string): string {
  const script = parsePromptScript();
  return normalizeScriptValue(script[stepId] ?? fallback, fallback);
}
