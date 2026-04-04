import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { generateDiagnosis } from "../../src/application/onboarding/generate-diagnosis.js";

describe("diagnosis generation", () => {
  const tempDirs: string[] = [];

  function createTempRepo(files: Record<string, string> = {}): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hforge-diag-"));
    tempDirs.push(dir);
    for (const [name, content] of Object.entries(files)) {
      const filePath = path.join(dir, name);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
    }
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it("produces typescript-cli for repo with package.json", async () => {
    const root = createTempRepo({
      "package.json": JSON.stringify({ name: "test", devDependencies: { vitest: "1.0.0" } }),
      "tsconfig.json": "{}",
    });
    const result = await generateDiagnosis({ workspaceRoot: root });
    expect(result.repoType).toBe("typescript-cli");
    expect(result.dominantLanguages.some((l) => l.language === "TypeScript" && l.strength === "high")).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it("produces generic-repo for empty repo", async () => {
    const root = createTempRepo();
    const result = await generateDiagnosis({ workspaceRoot: root });
    expect(result.repoType).toBe("generic-repo");
    expect(result.confidence).toBeLessThan(0.7);
  });

  it("detects codex target from .codex directory", async () => {
    const root = createTempRepo({ "package.json": "{}" });
    fs.mkdirSync(path.join(root, ".codex"), { recursive: true });
    const result = await generateDiagnosis({ workspaceRoot: root });
    expect(result.detectedTargets).toContain("codex");
  });

  it("detects both targets when both markers present", async () => {
    const root = createTempRepo({ "package.json": "{}" });
    fs.mkdirSync(path.join(root, ".codex"), { recursive: true });
    fs.mkdirSync(path.join(root, ".claude"), { recursive: true });
    const result = await generateDiagnosis({ workspaceRoot: root });
    expect(result.detectedTargets).toContain("codex");
    expect(result.detectedTargets).toContain("claude-code");
  });
});
