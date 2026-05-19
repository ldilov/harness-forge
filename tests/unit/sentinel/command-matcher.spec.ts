import { describe, expect, it } from "vitest";

import { CommandMatcher } from "../../../src/infrastructure/sentinel/policy/command-matcher.js";

describe("CommandMatcher", () => {
  it("matches a literal denied command", () => {
    const matcher = new CommandMatcher(["npm publish"]);
    expect(matcher.matches("npm publish")).toBe(true);
    expect(matcher.firstMatch("npm publish")).toBe("npm publish");
  });

  it("matches when the denied command is a prefix of the candidate", () => {
    const matcher = new CommandMatcher(["git push --force"]);
    expect(matcher.matches("git push --force origin main")).toBe(true);
  });

  it("does NOT match unrelated commands that share a token", () => {
    const matcher = new CommandMatcher(["npm publish"]);
    expect(matcher.matches("npm install")).toBe(false);
    expect(matcher.matches("publish-to-npm-please")).toBe(false);
  });

  it("normalizes whitespace and case", () => {
    const matcher = new CommandMatcher(["NPM   Publish"]);
    expect(matcher.matches("npm publish")).toBe(true);
  });
});
