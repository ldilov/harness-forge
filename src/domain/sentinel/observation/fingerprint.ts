import { shortHash } from "../../../shared/sha256.js";

const TEMPLATE_VAR = /\$\{([a-zA-Z0-9_.-]+)\}/g;

export interface FingerprintContext {
  readonly subject: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

function lookup(context: FingerprintContext, dottedPath: string): string {
  if (dottedPath === "subject") {
    return context.subject;
  }
  const segments = dottedPath.split(".");
  let cursor: unknown = context.metadata;
  for (const segment of segments) {
    if (cursor === undefined || cursor === null || typeof cursor !== "object") {
      return `<missing:${dottedPath}>`;
    }
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  if (cursor === undefined || cursor === null) {
    return `<missing:${dottedPath}>`;
  }
  if (typeof cursor === "string") {
    return cursor;
  }
  if (typeof cursor === "number" || typeof cursor === "boolean") {
    return String(cursor);
  }
  return JSON.stringify(cursor);
}

export function resolveFingerprint(template: string, context: FingerprintContext): string {
  const expanded = template.replace(TEMPLATE_VAR, (_, key: string) => lookup(context, key));
  return shortHash(expanded, 16);
}
