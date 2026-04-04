import type { OutputPolicyDocument, OutputProfileName } from "../../domain/runtime/output-policy.js";

export type ActorType = "recursiveWorker" | "topLevelHuman" | "releaseSignoff";

export function selectOutputProfile(policy: OutputPolicyDocument, actor: ActorType): OutputProfileName {
  if (actor === "recursiveWorker") {
    return policy.defaults.recursiveWorker;
  }
  if (actor === "releaseSignoff") {
    return policy.defaults.releaseSignoff;
  }
  return policy.defaults.topLevelHuman;
}
