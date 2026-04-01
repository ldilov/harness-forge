import path from "node:path";

import type { RecursiveTemplateRegistry } from "../../domain/recursive/template-registry.js";
import { parseRecursiveTemplateRegistry } from "../../domain/recursive/template-registry.js";
import { AI_TEMPLATES_DIR, PACKAGE_ROOT, exists, readJsonFile } from "../../shared/index.js";

export async function loadRecursiveTemplateRegistry(workspaceRoot: string): Promise<RecursiveTemplateRegistry> {
  const candidates = [
    path.join(workspaceRoot, AI_TEMPLATES_DIR, "recursive", "registry.json"),
    path.join(PACKAGE_ROOT, "templates", "recursive", "registry.json")
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return parseRecursiveTemplateRegistry(await readJsonFile<RecursiveTemplateRegistry>(candidate));
    }
  }

  return {
    version: 1,
    entries: [
      {
        id: "typed-rlm-action-bundle",
        kind: "final-output",
        file: "templates/recursive/typed-rlm-action-bundle.json",
        format: "json",
        scope: "session",
        description: "Structured bundle template for environment-first recursive execution.",
        variables: ["sessionId", "iterationId", "intent", "actions"]
      }
    ]
  };
}
