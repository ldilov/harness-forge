// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\x1b\[[0-9;]*[a-zA-Z]/g;

export function stripAnsi(input: string): string {
  return input.replace(ANSI_REGEX, "");
}

export function normalizeForSnapshot(input: string): string {
  return stripAnsi(input)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trimEnd();
}
