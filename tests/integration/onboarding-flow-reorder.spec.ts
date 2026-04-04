import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { showDiagnosisStep } from "../../src/cli/interactive/onboarding-flow.js";

describe("onboarding flow reorder", () => {
  const tempDirs: string[] = [];

  function createTempRepo(files: Record<string, string> = {}): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hforge-onboard-"));
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

  it("diagnosis step returns valid result for TypeScript repo", async () => {
    const root = createTempRepo({
      "package.json": JSON.stringify({ name: "test", devDependencies: { vitest: "1.0.0" } }),
      "tsconfig.json": "{}",
    });
    const result = await showDiagnosisStep(root);
    expect(result.repoType).toBe("typescript-cli");
    expect(result.dominantLanguages.length).toBeGreaterThan(0);
  });

  it("diagnosis step returns valid result for empty repo", async () => {
    const root = createTempRepo();
    const result = await showDiagnosisStep(root);
    expect(result.repoType).toBe("generic-repo");
  });

  it("diagnosis step detects codex target", async () => {
    const root = createTempRepo({ "package.json": "{}" });
    fs.mkdirSync(path.join(root, ".codex"));
    const result = await showDiagnosisStep(root);
    expect(result.detectedTargets).toContain("codex");
  });

  it("diagnosis step detects both targets", async () => {
    const root = createTempRepo({ "package.json": "{}" });
    fs.mkdirSync(path.join(root, ".codex"));
    fs.mkdirSync(path.join(root, ".claude"));
    const result = await showDiagnosisStep(root);
    expect(result.detectedTargets).toContain("codex");
    expect(result.detectedTargets).toContain("claude-code");
  });

  it("diagnosis step handles intelligence failure gracefully", async () => {
    const root = createTempRepo();
    const result = await showDiagnosisStep(root);
    expect(result.generatedAt).toBeTruthy();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("diagnosis result has valid structure for downstream consumption", async () => {
    const root = createTempRepo({
      "package.json": JSON.stringify({ name: "test" }),
    });
    fs.mkdirSync(path.join(root, ".codex"));
    fs.mkdirSync(path.join(root, ".claude"));
    const result = await showDiagnosisStep(root);
    expect(typeof result.generatedAt).toBe("string");
    expect(typeof result.root).toBe("string");
    expect(typeof result.repoType).toBe("string");
    expect(Array.isArray(result.dominantLanguages)).toBe(true);
    expect(Array.isArray(result.topEvidence)).toBe(true);
  });
});
