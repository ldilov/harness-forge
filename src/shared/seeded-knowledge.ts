export const SEEDED_LANGUAGE_IDS = ["typescript", "java", "dotnet", "lua", "powershell"] as const;

export type SeededLanguageId = (typeof SEEDED_LANGUAGE_IDS)[number];

const ARCHIVE_DIRECTORY_NAMES: Record<SeededLanguageId, string> = {
  typescript: "typescript-knowledge-base",
  java: "java-knowledge-base",
  dotnet: "dotnet-knowledge-base",
  lua: "lua-knowledge-base",
  powershell: "powershell-knowledge-base"
};

export type SeededContentKind =
  | "root-doc"
  | "metadata"
  | "overview"
  | "review-checklist"
  | "examples-guide"
  | "framework-notes"
  | "example"
  | "common-rule"
  | "language-rule"
  | "legacy-seed";

export function isSeededLanguageId(value: string): value is SeededLanguageId {
  return SEEDED_LANGUAGE_IDS.includes(value as SeededLanguageId);
}

export function getSeededArchiveDirectory(language: SeededLanguageId): string {
  return ARCHIVE_DIRECTORY_NAMES[language];
}

export function getSeededArchivePath(language: SeededLanguageId, relativePath: string): string {
  return `language-knowledge-bases/${getSeededArchiveDirectory(language)}/${relativePath.replaceAll("\\", "/")}`;
}

export function classifySeededRelativePath(relativePath: string): SeededContentKind {
  const normalized = relativePath.replaceAll("\\", "/");

  if (normalized === "README.md") {
    return "root-doc";
  }

  if (normalized === "knowledge-base.json") {
    return "metadata";
  }

  if (normalized === "docs/overview.md") {
    return "overview";
  }

  if (normalized === "docs/review-checklist.md") {
    return "review-checklist";
  }

  if (normalized === "docs/examples-guide.md") {
    return "examples-guide";
  }

  if (normalized === "docs/frameworks.md") {
    return "framework-notes";
  }

  if (normalized.startsWith("examples/")) {
    return "example";
  }

  if (normalized.startsWith("rules/common/")) {
    return "common-rule";
  }

  if (normalized.startsWith("legacy-seed/")) {
    return "legacy-seed";
  }

  return "language-rule";
}
