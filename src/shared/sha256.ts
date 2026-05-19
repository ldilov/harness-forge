import { createHash } from "node:crypto";
import { canonicalJson } from "./canonical-json.js";

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function sha256ContentHash(content: string | Buffer): string {
  return `sha256-${createHash("sha256").update(content).digest("base64url")}`;
}

export function sha256OfCanonicalJson(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}

export function shortHash(input: string, length = 16): string {
  return sha256Hex(input).slice(0, length);
}
