import path from "node:path";

const SEPARATOR_RE = /[\\\/]+/g;

function normalizePath(input: string): string {
  return input.replace(SEPARATOR_RE, "/").replace(/^\.\//, "").replace(/\/$/, "");
}

function escapeRegex(input: string): string {
  return input.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

function patternToRegex(pattern: string): RegExp {
  const normalized = normalizePath(pattern);
  let i = 0;
  let regex = "";
  while (i < normalized.length) {
    const char = normalized[i]!;
    if (char === "*") {
      const next = normalized[i + 1];
      if (next === "*") {
        const after = normalized[i + 2];
        if (after === "/") {
          regex += "(?:.*/)?";
          i += 3;
          continue;
        }
        regex += ".*";
        i += 2;
        continue;
      }
      regex += "[^/]*";
      i += 1;
      continue;
    }
    if (char === "?") {
      regex += "[^/]";
      i += 1;
      continue;
    }
    regex += escapeRegex(char);
    i += 1;
  }
  return new RegExp(`^${regex}$`);
}

export class PathMatcher {
  private readonly compiled: readonly RegExp[];

  constructor(patterns: readonly string[]) {
    this.compiled = patterns.map(patternToRegex);
  }

  matches(candidate: string): boolean {
    const normalized = normalizePath(candidate);
    return this.compiled.some((re) => re.test(normalized));
  }

  firstMatch(candidate: string): RegExp | null {
    const normalized = normalizePath(candidate);
    for (const re of this.compiled) {
      if (re.test(normalized)) {
        return re;
      }
    }
    return null;
  }

  static normalize(input: string): string {
    return normalizePath(input);
  }

  static withinRoot(root: string, candidate: string): string {
    const normalizedRoot = normalizePath(root);
    const absolute = path.isAbsolute(candidate) ? candidate : path.join(root, candidate);
    const normalizedCandidate = normalizePath(absolute);
    if (normalizedCandidate.startsWith(`${normalizedRoot}/`)) {
      return normalizedCandidate.slice(normalizedRoot.length + 1);
    }
    return normalizedCandidate;
  }
}
