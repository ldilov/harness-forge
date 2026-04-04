import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

const mergedSkills = [
  {
    skillPath: "skills/repo-onboarding/SKILL.md",
    includes: ["command-discovery.md", "ownership-and-health-signals.md"],
    references: [
      "skills/repo-onboarding/references/discovery-checklist.md",
      "skills/repo-onboarding/references/command-discovery.md"
    ]
  },
  {
    skillPath: "skills/architecture-decision-records/SKILL.md",
    includes: ["decision-rubric.md", "adr-anti-patterns.md"],
    references: [
      "skills/architecture-decision-records/references/decision-rubric.md",
      "skills/architecture-decision-records/references/madr-style-guide.md"
    ]
  },
  {
    skillPath: "skills/api-contract-review/SKILL.md",
    includes: ["event-and-async-contracts.md", "protobuf-and-buf.md"],
    references: [
      "skills/api-contract-review/references/review-template.md",
      "skills/api-contract-review/references/schema-compatibility.md"
    ]
  },
  {
    skillPath: "skills/db-migration-review/SKILL.md",
    includes: ["expand-contract.md", "engine-specific-hotspots.md"],
    references: [
      "skills/db-migration-review/references/review-template.md",
      "skills/db-migration-review/references/rollout-and-backfill.md"
    ]
  },
  {
    skillPath: "skills/parallel-worktree-supervisor/SKILL.md",
    includes: ["task-sharding-rules.md", "merge-readiness.md"],
    references: [
      "skills/parallel-worktree-supervisor/references/output-template.md",
      "skills/parallel-worktree-supervisor/references/stacked-diffs-and-review.md"
    ]
  },
  {
    skillPath: "skills/repo-modernization/SKILL.md",
    includes: ["modernization-layers.md", "roadmap-template.md"],
    references: [
      "skills/repo-modernization/references/safety-rails.md",
      "skills/repo-modernization/references/roadmap-template.md"
    ]
  },
  {
    skillPath: "skills/typescript-engineering/SKILL.md",
    includes: ["runtime-validation-and-boundaries.md", "workspace-and-monorepo.md"],
    references: [
      "skills/typescript-engineering/references/runtime-validation-and-boundaries.md",
      "skills/typescript-engineering/references/workspace-and-monorepo.md"
    ]
  },
  {
    skillPath: "skills/lua-engineering/SKILL.md",
    includes: [
      "runtime-profiles.md",
      "neovim-and-editor-patterns.md",
      "openresty-patterns.md",
      "tooling-and-quality.md"
    ],
    references: [
      "skills/lua-engineering/references/runtime-profiles.md",
      "skills/lua-engineering/references/openresty-patterns.md"
    ]
  },
  {
    skillPath: "skills/javascript-engineering/SKILL.md",
    includes: ["browser-and-bundler-patterns.md", "package-contracts.md"],
    references: [
      "skills/javascript-engineering/references/browser-and-bundler-patterns.md",
      "skills/javascript-engineering/references/package-contracts.md"
    ]
  }
] as const;

describe("enhanced skill merge integration", () => {
  it("ships the deeper imported reference packs through the canonical skills", async () => {
    for (const entry of mergedSkills) {
      const content = await fs.readFile(path.join(root, entry.skillPath), "utf8");
      for (const needle of entry.includes) {
        expect(content).toContain(needle);
      }
      for (const referencePath of entry.references) {
        await expect(fs.readFile(path.join(root, referencePath), "utf8")).resolves.toBeTruthy();
      }
    }
  });
});
