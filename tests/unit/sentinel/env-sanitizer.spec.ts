import { describe, expect, it } from "vitest";

import {
  buildSandboxEnv,
  sandboxHomePath,
} from "../../../src/infrastructure/sentinel/executor/env-sanitizer.js";

describe("buildSandboxEnv", () => {
  it("sets the safety markers on every invocation", () => {
    const env = buildSandboxEnv({
      actionId: "act_x",
      worktreePath: "/tmp/work",
      inherit: { PATH: "/usr/bin", HOME: "/Users/alice", SECRET_KEY: "leak-me" },
    });
    expect(env.HFORGE_ACTION_ID).toBe("act_x");
    expect(env.HFORGE_SANDBOX).toBe("1");
    expect(env.CI).toBe("true");
  });

  it("never passes through SECRET_KEY or other unlisted variables", () => {
    const env = buildSandboxEnv({
      actionId: "act_x",
      worktreePath: "/tmp/work",
      inherit: { SECRET_KEY: "leak-me", AWS_ACCESS_KEY_ID: "AKIA...", PATH: "/usr/bin" },
    });
    expect(env.SECRET_KEY).toBeUndefined();
    expect(env.AWS_ACCESS_KEY_ID).toBeUndefined();
  });

  it("redirects HOME to a sandboxed location under the worktree", () => {
    const env = buildSandboxEnv({
      actionId: "act_x",
      worktreePath: "/tmp/work",
      inherit: { HOME: "/Users/alice", PATH: "/usr/bin" },
    });
    expect(env.HOME).toBe(sandboxHomePath("/tmp/work"));
    expect(env.HOME).not.toBe("/Users/alice");
  });

  it("preserves PATH when present", () => {
    const env = buildSandboxEnv({
      actionId: "act_x",
      worktreePath: "/tmp/work",
      inherit: { PATH: "/usr/local/bin:/usr/bin", HOME: "/h" },
    });
    expect(env.PATH).toBe("/usr/local/bin:/usr/bin");
  });

  it("passes through TMPDIR on POSIX so child processes can write temp files", () => {
    const env = buildSandboxEnv({
      actionId: "act_x",
      worktreePath: "/tmp/work",
      inherit: { TMPDIR: "/var/folders/abc", HOME: "/h", PATH: "/usr/bin" },
    });
    if (process.platform === "win32") {
      expect(env.TMPDIR).toBeUndefined();
    } else {
      expect(env.TMPDIR).toBe("/var/folders/abc");
    }
  });

  it("passes through TEMP and TMP on Windows so git lock files can be written", () => {
    const env = buildSandboxEnv({
      actionId: "act_x",
      worktreePath: "C:/tmp/work",
      inherit: {
        TEMP: "C:/Users/me/AppData/Local/Temp",
        TMP: "C:/Users/me/AppData/Local/Temp",
        PATH: "C:/Windows",
      },
    });
    if (process.platform === "win32") {
      expect(env.TEMP).toBe("C:/Users/me/AppData/Local/Temp");
      expect(env.TMP).toBe("C:/Users/me/AppData/Local/Temp");
    } else {
      expect(env.TEMP).toBeUndefined();
      expect(env.TMP).toBeUndefined();
    }
  });
});
