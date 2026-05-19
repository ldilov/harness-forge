import { describe, expect, it } from "vitest";

import { PathMatcher } from "../../../src/infrastructure/sentinel/policy/path-matcher.js";

describe("PathMatcher", () => {
  it("matches a literal pattern", () => {
    const matcher = new PathMatcher([".env"]);
    expect(matcher.matches(".env")).toBe(true);
    expect(matcher.matches(".env.local")).toBe(false);
  });

  it("supports a single-star segment match", () => {
    const matcher = new PathMatcher([".env.*"]);
    expect(matcher.matches(".env.local")).toBe(true);
    expect(matcher.matches(".env.production")).toBe(true);
    expect(matcher.matches(".env")).toBe(false);
  });

  it("supports double-star recursive directory match", () => {
    const matcher = new PathMatcher(["**/secrets/**"]);
    expect(matcher.matches("secrets/db.json")).toBe(true);
    expect(matcher.matches("nested/deep/secrets/api.key")).toBe(true);
    expect(matcher.matches("nosecrets/x")).toBe(false);
  });

  it("matches **/*.pem and **/*.key", () => {
    const matcher = new PathMatcher(["**/*.pem", "**/*.key"]);
    expect(matcher.matches("server.pem")).toBe(true);
    expect(matcher.matches("ssl/server.key")).toBe(true);
    expect(matcher.matches("README.md")).toBe(false);
  });

  it("normalizes Windows backslashes", () => {
    const matcher = new PathMatcher(["**/secrets/**"]);
    expect(matcher.matches("nested\\path\\secrets\\db.json")).toBe(true);
  });

  it("PathMatcher.withinRoot strips the workspace prefix", () => {
    expect(PathMatcher.withinRoot("/repo", "/repo/src/app.ts")).toBe("src/app.ts");
    expect(PathMatcher.withinRoot("/repo", "src/app.ts")).toBe("src/app.ts");
  });
});
