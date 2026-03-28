import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import YAML from "yaml";
import { TEMPLATE_REQUIRED_SECTIONS } from "../../shared/constants.js";

export interface TemplateValidationFinding {
  file: string;
  message: string;
}

export interface TemplateValidationReport {
  ok: boolean;
  findings: TemplateValidationFinding[];
}

export interface TemplateCatalogEntry {
  id: string;
  kind: string;
  title: string;
  file: string;
}

const REQUIRED_FRONT_MATTER: Record<string, string[]> = {
  "task-template": [
    "id",
    "kind",
    "title",
    "category",
    "status",
    "version",
    "supported_targets",
    "supported_languages",
    "recommended_agents",
    "recommended_commands",
    "owner",
    "generated"
  ],
  "workflow-template": [
    "id",
    "kind",
    "title",
    "mode",
    "status",
    "version",
    "supported_targets",
    "supported_languages",
    "default_agents",
    "owner",
    "generated"
  ]
};

const REQUIRED_WORKFLOW_STAGE_FIELDS = [
  "**Goal**",
  "**Consumes**",
  "**Produces**",
  "**Exit Criteria**",
  "**Failure Conditions**",
  "**Next Trigger**"
];

interface RequiredSectionsConfig {
  "task-template": string[];
  "workflow-template": string[];
  "workflow-stage-fields"?: string[];
}

function parseFrontMatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    return {};
  }
  return YAML.parse(match[1] ?? "") as Record<string, unknown>;
}

async function collectTemplateEntries(root: string, patterns: string[]): Promise<Array<{ file: string; content: string; frontMatter: Record<string, unknown> }>> {
  const files = await fg(patterns, { cwd: root, absolute: true });
  return Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(file, "utf8");
      return {
        file,
        content,
        frontMatter: parseFrontMatter(content)
      };
    })
  );
}

function validateTemplateEntry(
  root: string,
  file: string,
  content: string,
  frontMatter: Record<string, unknown>,
  requiredSections: RequiredSectionsConfig
): TemplateValidationFinding[] {
  const findings: TemplateValidationFinding[] = [];
  const relativeFile = path.relative(root, file);
  const kind = String(frontMatter.kind ?? "");
  const requiredFields = REQUIRED_FRONT_MATTER[kind];

  if (!requiredFields) {
    findings.push({ file: relativeFile, message: "Unknown or missing template kind." });
    return findings;
  }

  for (const field of requiredFields) {
    if (!(field in frontMatter)) {
      findings.push({ file: relativeFile, message: `Missing front matter field ${field}` });
    }
  }

  for (const section of requiredSections[kind as keyof RequiredSectionsConfig] ?? []) {
    if (!content.includes(section)) {
      findings.push({ file: relativeFile, message: `Missing required section ${section}` });
    }
  }

  if (kind === "workflow-template") {
    const hasStage = /^###\s+Stage\s+\d+:/m.test(content);
    if (!hasStage) {
      findings.push({ file: relativeFile, message: "Workflow template must define at least one stage." });
    }

    if (hasStage) {
      for (const field of REQUIRED_WORKFLOW_STAGE_FIELDS) {
        if (!content.includes(field)) {
          findings.push({ file: relativeFile, message: `Missing workflow stage field ${field}` });
        }
      }
    }
  }

  return findings;
}

async function loadRequiredSections(root: string): Promise<RequiredSectionsConfig> {
  const configPath = path.join(root, TEMPLATE_REQUIRED_SECTIONS);
  return JSON.parse(await fs.readFile(configPath, "utf8")) as RequiredSectionsConfig;
}

export async function listTemplateCatalog(root: string): Promise<TemplateCatalogEntry[]> {
  const entries = await collectTemplateEntries(root, ["templates/tasks/*.md", "templates/workflows/*.md"]);
  return entries
    .map(({ file, frontMatter }) => ({
      id: String(frontMatter.id ?? ""),
      kind: String(frontMatter.kind ?? ""),
      title: String(frontMatter.title ?? ""),
      file: path.relative(root, file)
    }))
    .filter((entry) => entry.id.length > 0);
}

export async function validateTemplateCatalog(root: string): Promise<TemplateValidationReport> {
  const entries = await collectTemplateEntries(root, ["templates/tasks/*.md", "templates/workflows/*.md"]);
  const requiredSections = await loadRequiredSections(root);
  const findings: TemplateValidationFinding[] = [];

  for (const entry of entries) {
    findings.push(...validateTemplateEntry(root, entry.file, entry.content, entry.frontMatter, requiredSections));
  }

  return {
    ok: findings.length === 0,
    findings
  };
}

export async function validateWorkflowTemplate(root: string, workflowId: string): Promise<TemplateValidationReport> {
  const entries = await collectTemplateEntries(root, ["templates/workflows/*.md"]);
  const requiredSections = await loadRequiredSections(root);
  const entry = entries.find(({ frontMatter }) => frontMatter.id === workflowId);
  if (!entry) {
    throw new Error(`Unknown workflow: ${workflowId}`);
  }

  const findings = validateTemplateEntry(root, entry.file, entry.content, entry.frontMatter, requiredSections);
  return { ok: findings.length === 0, findings };
}

export async function workflowGraph(root: string, workflowId: string): Promise<string> {
  const files = await collectTemplateEntries(root, ["templates/workflows/*.md"]);
  for (const { content, frontMatter } of files) {
    if (frontMatter.id === workflowId) {
      const stages = [...content.matchAll(/^###\s+Stage\s+\d+:\s+(.+)$/gm)].map((match) => match[1]);
      return ["graph TD", ...stages.map((stage, index) => `${index === 0 ? "Start" : `S${index}`} --> S${index + 1}[\"${stage}\"]`)].join("\n");
    }
  }
  throw new Error(`Unknown workflow: ${workflowId}`);
}
