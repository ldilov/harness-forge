function normalize(command: string): string {
  return command.trim().replace(/\s+/g, " ").toLowerCase();
}

export class CommandMatcher {
  private readonly literals: readonly string[];

  constructor(deniedCommands: readonly string[]) {
    this.literals = deniedCommands.map(normalize).filter((entry) => entry.length > 0);
  }

  matches(command: string): boolean {
    const normalized = normalize(command);
    if (normalized.length === 0) {
      return false;
    }
    return this.literals.some((deny) => normalized === deny || normalized.startsWith(`${deny} `));
  }

  firstMatch(command: string): string | null {
    const normalized = normalize(command);
    for (const deny of this.literals) {
      if (normalized === deny || normalized.startsWith(`${deny} `)) {
        return deny;
      }
    }
    return null;
  }
}
