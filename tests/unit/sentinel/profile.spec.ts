import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  builtInProfile,
  defaultActiveProfile,
  profileNames,
  requiresApproval,
} from "../../../src/domain/sentinel/policy/profile.js";
import { ActiveProfileStore } from "../../../src/infrastructure/sentinel/stores/profile-store.js";

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-profile-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("built-in profiles", () => {
  it("ships exactly the five spec profiles in priority order", () => {
    expect(profileNames()).toEqual(["observe", "cautious", "assisted", "active", "maintainer"]);
  });

  it("cautious requires approval for A2..A5 and observe requires approval for everything above A0", () => {
    expect(builtInProfile("cautious").requireApproval).toEqual(["A2", "A3", "A4", "A5"]);
    expect(builtInProfile("observe").requireApproval).toEqual(["A1", "A2", "A3", "A4", "A5"]);
  });

  it("requiresApproval reflects the profile's requireApproval list", () => {
    const cautious = builtInProfile("cautious");
    expect(requiresApproval(cautious, "A2")).toBe(true);
    expect(requiresApproval(cautious, "A1")).toBe(false);
  });
});

describe("ActiveProfileStore", () => {
  it("returns the default active profile when none is persisted", async () => {
    const active = await new ActiveProfileStore(workspace).read();
    expect(active.name).toBe("cautious");
    expect(active.defaultLevel).toBe("A1");
  });

  it("write + read round-trips", async () => {
    const store = new ActiveProfileStore(workspace);
    const next = { ...defaultActiveProfile(), name: "assisted" as const, defaultLevel: "A2" as const };
    await store.write(next);
    const read = await store.read();
    expect(read.name).toBe("assisted");
    expect(read.defaultLevel).toBe("A2");
  });
});
