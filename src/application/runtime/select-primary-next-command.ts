export interface WorkspaceStateInput {
  hasHforgeDir: boolean;
  doctorStatus: "healthy" | "warnings" | "errors" | "unknown";
  installedTargets: string[];
}

export interface PrimaryNextCommandResult {
  primary: string;
  alternates: string[];
}

export function selectPrimaryNextCommand(state: WorkspaceStateInput): PrimaryNextCommandResult {
  if (!state.hasHforgeDir || state.installedTargets.length === 0) {
    return {
      primary: "hforge recommend --root . --json",
      alternates: [
        "hforge review --root . --json",
        "hforge status --root . --json"
      ]
    };
  }

  if (state.doctorStatus === "warnings" || state.doctorStatus === "errors") {
    return {
      primary: "hforge doctor --root . --json",
      alternates: [
        "hforge review --root . --json"
      ]
    };
  }

  return {
    primary: "hforge review --root . --json",
    alternates: [
      "hforge recommend --root . --json"
    ]
  };
}
