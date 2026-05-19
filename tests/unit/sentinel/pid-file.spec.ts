import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  acquirePidFile,
  classifyPidLiveness,
  PidFileBusyError,
  readPidRecord,
  type PidRecord,
} from "../../../src/application/sentinel/runtime/pid-file.js";
import { sentinelPidPath } from "../../../src/domain/sentinel/paths.js";

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-pid-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("acquirePidFile", () => {
  it("creates a structured record on first acquire", async () => {
    const lock = await acquirePidFile(workspace);
    try {
      expect(lock.record.pid).toBe(process.pid);
      expect(lock.record.hostname).toBe(os.hostname());
      expect(lock.record.workspaceRoot).toBe(path.resolve(workspace));
      expect(typeof lock.record.startedAt).toBe("string");
      const onDisk = await readPidRecord(workspace);
      expect(onDisk).toEqual(lock.record);
    } finally {
      await lock.release();
    }
  });

  it("releases cleanly", async () => {
    const lock = await acquirePidFile(workspace);
    await lock.release();
    expect(await readPidRecord(workspace)).toBeNull();
  });

  it("clears a stale record from a dead PID and re-acquires", async () => {
    const stale: PidRecord = {
      pid: 999_999_999,
      startedAt: "2020-01-01T00:00:00.000Z",
      hostname: os.hostname(),
      workspaceRoot: path.resolve(workspace),
    };
    const filePath = sentinelPidPath(workspace);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(stale), "utf8");
    const lock = await acquirePidFile(workspace);
    try {
      expect(lock.record.pid).toBe(process.pid);
    } finally {
      await lock.release();
    }
  });

  it("refuses when the record is from a foreign host", async () => {
    const foreign: PidRecord = {
      pid: 12345,
      startedAt: "2026-01-01T00:00:00.000Z",
      hostname: "some-other-machine",
      workspaceRoot: path.resolve(workspace),
    };
    const filePath = sentinelPidPath(workspace);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(foreign), "utf8");
    await expect(acquirePidFile(workspace)).rejects.toBeInstanceOf(PidFileBusyError);
  });

  it("refuses when the live process is the current process", async () => {
    const lock = await acquirePidFile(workspace);
    try {
      await expect(acquirePidFile(workspace)).rejects.toBeInstanceOf(PidFileBusyError);
    } finally {
      await lock.release();
    }
  });
});

describe("classifyPidLiveness", () => {
  it("flags foreign hosts", () => {
    const record: PidRecord = {
      pid: 1,
      startedAt: "2026-01-01T00:00:00.000Z",
      hostname: "elsewhere",
      workspaceRoot: "/tmp/x",
    };
    expect(classifyPidLiveness(record, "here")).toBe("foreign-host");
  });

  it("classifies the current process as alive", () => {
    const record: PidRecord = {
      pid: process.pid,
      startedAt: "2026-01-01T00:00:00.000Z",
      hostname: os.hostname(),
      workspaceRoot: "/tmp/x",
    };
    expect(classifyPidLiveness(record)).toBe("alive");
  });

  it("classifies an obviously dead PID as dead", () => {
    const record: PidRecord = {
      pid: 999_999_999,
      startedAt: "2020-01-01T00:00:00.000Z",
      hostname: os.hostname(),
      workspaceRoot: "/tmp/x",
    };
    expect(classifyPidLiveness(record)).toBe("dead");
  });
});
