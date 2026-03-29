import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("token budget optimizer promotion contract", () => {
  it("ships canonical, wrapper, and provenance surfaces", async () => {
    const [skill, wrapper, inventory, portDoc, readme, agents, playbook, packageSurface] = await Promise.all([
      fs.readFile(path.join(root, "skills", "token-budget-optimizer", "SKILL.md"), "utf8"),
      fs.readFile(path.join(root, ".agents", "skills", "token-budget-optimizer", "SKILL.md"), "utf8"),
      fs.readFile(path.join(root, "manifests", "catalog", "token-budget-optimizer-import-inventory.json"), "utf8"),
      fs.readFile(path.join(root, "docs", "authoring", "token-budget-optimizer-port.md"), "utf8"),
      fs.readFile(path.join(root, "README.md"), "utf8"),
      fs.readFile(path.join(root, "AGENTS.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "agent-usage-playbook.md"), "utf8"),
      fs.readFile(path.join(root, "manifests", "catalog", "package-surface.json"), "utf8")
    ]);

    expect(skill).toContain("compact context");
    expect(skill).toContain("inspect_token_surfaces.py");
    expect(wrapper).toContain(".hforge/library/skills/token-budget-optimizer/SKILL.md");
    expect(wrapper).toContain(".hforge/library/docs/authoring/token-budget-optimizer-port.md");
    expect(inventory).toContain("\"skillId\": \"token-budget-optimizer\"");
    expect(portDoc).toContain("Token Budget Optimizer");
    expect(readme).toContain("token-budget-optimizer");
    expect(agents).toContain(".hforge/library/skills/token-budget-optimizer/");
    expect(playbook).toContain(".agents/skills/token-budget-optimizer/SKILL.md");
    expect(packageSurface).toContain(".agents/skills/token-budget-optimizer/SKILL.md");
    expect(packageSurface).toContain("skills/token-budget-optimizer/SKILL.md");
  });
});
