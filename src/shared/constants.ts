import path from "node:path";
import { fileURLToPath } from "node:url";

export const STATE_DIR = ".hforge/state";
export const AI_LAYER_ROOT_DIR = ".hforge";
export const AI_LAYER_LIBRARY_DIR = ".hforge/library";
export const AI_LAYER_VISIBLE_MODE = "hidden-ai-layer";
export const AI_LIBRARY_AGENTS_DIR = ".hforge/library/agents";
export const AI_LIBRARY_COMMANDS_DIR = ".hforge/library/commands";
export const AI_LIBRARY_CONTEXTS_DIR = ".hforge/library/contexts";
export const AI_LIBRARY_DOCS_DIR = ".hforge/library/docs";
export const AI_LIBRARY_HOOKS_DIR = ".hforge/library/hooks";
export const AI_LIBRARY_KNOWLEDGE_DIR = ".hforge/library/knowledge";
export const AI_LIBRARY_MANIFESTS_DIR = ".hforge/library/manifests";
export const AI_LIBRARY_MCP_DIR = ".hforge/library/mcp";
export const AI_LIBRARY_PROFILES_DIR = ".hforge/library/profiles";
export const AI_LIBRARY_RULES_DIR = ".hforge/library/rules";
export const AI_LIBRARY_SCRIPTS_DIR = ".hforge/library/scripts";
export const AI_LIBRARY_SCHEMAS_DIR = ".hforge/library/schemas";
export const AI_LIBRARY_SKILLS_DIR = ".hforge/library/skills";
export const AI_LIBRARY_TARGETS_DIR = ".hforge/library/targets";
export const AI_TEMPLATES_DIR = ".hforge/templates";
export const RUNTIME_DIR = ".hforge/runtime";
export const AGENT_MANIFEST_FILE = ".hforge/agent-manifest.json";
export const RUNTIME_SCHEMA_VERSION = 3;
export const RUNTIME_INDEX_FILE = "index.json";
export const RUNTIME_README_FILE = "README.md";
export const RUNTIME_REPO_DIR = "repo";
export const RUNTIME_FINDINGS_DIR = "findings";
export const RUNTIME_TASKS_DIR = "tasks";
export const RUNTIME_TEMPLATES_DIR = "templates";
export const RUNTIME_DECISIONS_DIR = "decisions";
export const RUNTIME_CACHE_DIR = "cache";
export const RUNTIME_RECURSIVE_DIR = "recursive";
export const RUNTIME_RECURSIVE_SESSIONS_DIR = "sessions";
export const RUNTIME_REPO_MAP_FILE = "repo-map.json";
export const RUNTIME_RECOMMENDATIONS_FILE = "recommendations.json";
export const RUNTIME_TARGET_SUPPORT_FILE = "target-support.json";
export const RUNTIME_INSTRUCTION_PLAN_FILE = "instruction-plan.json";
export const RUNTIME_SCAN_SUMMARY_FILE = "scan-summary.json";
export const RUNTIME_VALIDATION_GAPS_FILE = "validation-gaps.json";
export const RUNTIME_RISK_SIGNALS_FILE = "risk-signals.json";
export const RUNTIME_FILE_INTEREST_FILE = "file-interest.json";
export const RUNTIME_IMPACT_ANALYSIS_FILE = "impact-analysis.json";
export const RUNTIME_TASK_PACK_FILE = "task-pack.json";
export const RUNTIME_WORKING_MEMORY_FILE = "working-memory.json";
export const RUNTIME_TASK_RECURSIVE_LINK_FILE = "recursive-session.json";
export const RUNTIME_RUNTIME_TEMPLATE_REGISTRY_FILE = "registry.json";
export const RUNTIME_DECISION_INDEX_FILE = "index.json";
export const RUNTIME_DECISION_COVERAGE_SUMMARY_FILE = "coverage-summary.json";
export const RUNTIME_RECURSIVE_SESSION_FILE = "session.json";
export const RUNTIME_RECURSIVE_MEMORY_FILE = "memory.json";
export const RUNTIME_RECURSIVE_SCRATCH_FILE = "scratch.json";
export const RUNTIME_RECURSIVE_CALLS_FILE = "calls.json";
export const RUNTIME_RECURSIVE_TRACE_FILE = "trace.jsonl";
export const RUNTIME_RECURSIVE_SUMMARY_FILE = "summary.json";
export const RUNTIME_RECURSIVE_FINAL_OUTPUT_FILE = "final-output.json";
export const INSTALL_STATE_FILE = "install-state.json";
export const OBSERVABILITY_DIR = ".hforge/observability";
export const EFFECTIVENESS_FILE = "effectiveness-signals.json";
export const GENERATED_DIR = ".hforge/generated";
export const OBSERVABILITY_EVENTS_FILE = "events.json";
export const OBSERVABILITY_SUMMARY_FILE = "summary.json";
export const SPECIFY_STATE_DIR = ".specify/state";
export const FLOW_STATE_FILE = "flow-state.json";
export const DEFAULT_BUNDLE_MANIFEST = "manifests/catalog/index.json";
export const CAPABILITY_TAXONOMY_FILE = "manifests/catalog/capability-taxonomy.json";
export const HARNESS_CAPABILITY_MATRIX_FILE = "manifests/catalog/harness-capability-matrix.json";
export const ENGINEERING_ASSISTANT_IMPORT_INVENTORY_FILE =
  "manifests/catalog/engineering-assistant-import-inventory.json";
export const ENGINEERING_ASSISTANT_PORT_PROVENANCE_FILE = "docs/authoring/engineering-assistant-port.md";
export const ENHANCED_SKILL_IMPORT_INVENTORY_FILE =
  "manifests/catalog/enhanced-skill-import-inventory.json";
export const ENHANCED_SKILL_IMPORT_PROVENANCE_FILE = "docs/authoring/enhanced-skill-import.md";
export const REPO_MAP_SCHEMA_FILE = "schemas/runtime/repo-map.schema.json";
export const INSTRUCTION_PLAN_SCHEMA_FILE = "schemas/runtime/instruction-plan.schema.json";
export const OBSERVABILITY_EVENT_SCHEMA_FILE = "schemas/runtime/observability-event.schema.json";
export const OBSERVABILITY_SUMMARY_SCHEMA_FILE = "schemas/runtime/observability-summary.schema.json";
export const BENCHMARK_EXPECTATION_SCHEMA_FILE = "schemas/runtime/benchmark-expectation.schema.json";
export const WORKTREE_PLAN_SCHEMA_FILE = "schemas/runtime/worktree-plan.schema.json";
export const WORKTREE_STATE_SCHEMA_FILE = "schemas/runtime/worktree-state.schema.json";
export const FILE_INTEREST_SCHEMA_FILE = "schemas/runtime/file-interest.schema.json";
export const IMPACT_ANALYSIS_SCHEMA_FILE = "schemas/runtime/impact-analysis.schema.json";
export const TASK_PACK_SCHEMA_FILE = "schemas/runtime/task-pack.schema.json";
export const WORKING_MEMORY_SCHEMA_FILE = "schemas/runtime/working-memory.schema.json";
export const ARCHITECTURE_SIGNIFICANCE_SCHEMA_FILE = "schemas/runtime/architecture-significance.schema.json";
export const DECISION_RECORD_SCHEMA_FILE = "schemas/runtime/decision-record.schema.json";
export const DECISION_COVERAGE_SUMMARY_SCHEMA_FILE = "schemas/runtime/decision-coverage-summary.schema.json";
export const RECURSIVE_SESSION_SCHEMA_FILE = "schemas/runtime/recursive-session.schema.json";
export const RECURSIVE_BUDGET_SCHEMA_FILE = "schemas/runtime/recursive-budget.schema.json";
export const RECURSIVE_TRACE_EVENT_SCHEMA_FILE = "schemas/runtime/recursive-trace-event.schema.json";
export const RECURSIVE_SESSION_SUMMARY_SCHEMA_FILE = "schemas/runtime/recursive-session-summary.schema.json";
export const RECURSIVE_ADR_CANDIDATE_SCHEMA_FILE = "schemas/runtime/recursive-adr-candidate.schema.json";
export const RECURSIVE_TEMPLATE_REGISTRY_SCHEMA_FILE = "schemas/templates/recursive-template-registry.schema.json";
export const RUNTIME_TEMPLATE_REGISTRY_SCHEMA_FILE = "schemas/templates/runtime-template-registry.schema.json";
export const TEMPLATE_REQUIRED_SECTIONS = "scripts/templates/config/required-sections.json";
export const AUTHORITATIVE_AI_LAYER_SURFACES = [
  AI_LIBRARY_SKILLS_DIR,
  AI_LIBRARY_RULES_DIR,
  AI_LIBRARY_KNOWLEDGE_DIR,
  AI_TEMPLATES_DIR,
  RUNTIME_DIR,
  RUNTIME_TASKS_DIR,
  RUNTIME_CACHE_DIR,
  STATE_DIR,
  GENERATED_DIR
] as const;
export const VISIBLE_BRIDGE_SURFACES = ["AGENTS.md", "CLAUDE.md", ".agents/skills", ".specify", ".codex", ".claude"] as const;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PACKAGE_ROOT = path.resolve(__dirname, "..", "..");
export const REPO_ROOT = PACKAGE_ROOT;
export const DEFAULT_WORKSPACE_ROOT = process.cwd();
