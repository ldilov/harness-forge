import { describe, expect, it } from "vitest";

import {
  extractImportSpecifiers,
  resolveRelativeImport,
  collapseCycles,
} from "../../../src/infrastructure/cartographer/scan/ts-import-extractor.js";

describe("extractImportSpecifiers", () => {
  it("captures static import, export-from, and require specifiers", () => {
    const src = [
      `import { a } from "./a.js";`,
      `export * from "./barrel.js";`,
      `const x = require("./legacy.js");`,
      `import def from "pkg";`,
    ].join("\n");
    const result = extractImportSpecifiers(src);
    expect(result.specifiers.sort()).toEqual(["./a.js", "./barrel.js", "./legacy.js", "pkg"]);
    expect(result.hasDynamicUncertainty).toBe(false);
  });

  it("flags dynamic import with a non-literal specifier as uncertain", () => {
    const result = extractImportSpecifiers(`const m = await import(dynamicPath);`);
    expect(result.hasDynamicUncertainty).toBe(true);
  });

  it("captures a literal dynamic import specifier", () => {
    const result = extractImportSpecifiers(`const m = await import("./lazy.js");`);
    expect(result.specifiers).toContain("./lazy.js");
    expect(result.hasDynamicUncertainty).toBe(false);
  });

  it("ignores specifiers inside line and block comments", () => {
    const src = [
      `// import { Old } from "./old.js";`,
      `/* import { Gone } from "./gone.js"; */`,
      `import { Real } from "./real.js";`,
    ].join("\n");
    const result = extractImportSpecifiers(src);
    expect(result.specifiers).toEqual(["./real.js"]);
  });
});

describe("resolveRelativeImport", () => {
  const known = new Set(["src/a.ts", "src/dir/index.ts", "src/b.ts"]);

  it("resolves a .js specifier to its .ts source", () => {
    expect(resolveRelativeImport("src/b.ts", "./a.js", known)).toBe("src/a.ts");
  });

  it("resolves a directory specifier to index.ts", () => {
    expect(resolveRelativeImport("src/b.ts", "./dir", known)).toBe("src/dir/index.ts");
  });

  it("returns null for bare/package specifiers", () => {
    expect(resolveRelativeImport("src/b.ts", "commander", known)).toBeNull();
  });
});

describe("collapseCycles (SCC detection)", () => {
  it("marks members of an import cycle cyclic and acyclic nodes not", () => {
    const adjacency = new Map<string, string[]>([
      ["a", ["b"]],
      ["b", ["a"]],
      ["c", ["a"]],
    ]);
    const cyclic = collapseCycles(adjacency);
    expect(cyclic.get("a")).toBe(true);
    expect(cyclic.get("b")).toBe(true);
    expect(cyclic.get("c")).toBe(false);
  });

  it("detects a self-loop (A imports A) as cyclic", () => {
    const cyclic = collapseCycles(new Map<string, string[]>([["a", ["a"]], ["b", []]]));
    expect(cyclic.get("a")).toBe(true);
    expect(cyclic.get("b")).toBe(false);
  });

  it("does not overflow the call stack on a deep linear chain", () => {
    const adjacency = new Map<string, string[]>();
    const depth = 20000;
    for (let i = 0; i < depth; i += 1) {
      adjacency.set(`n${i}`, i + 1 < depth ? [`n${i + 1}`] : []);
    }
    const cyclic = collapseCycles(adjacency);
    expect(cyclic.get("n0")).toBe(false);
    expect(cyclic.get(`n${depth - 1}`)).toBe(false);
  });
});
