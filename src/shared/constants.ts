import path from "node:path";
import { fileURLToPath } from "node:url";

export const STATE_DIR = ".hforge/state";
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
export const REPO_MAP_SCHEMA_FILE = "schemas/runtime/repo-map.schema.json";
export const INSTRUCTION_PLAN_SCHEMA_FILE = "schemas/runtime/instruction-plan.schema.json";
export const OBSERVABILITY_EVENT_SCHEMA_FILE = "schemas/runtime/observability-event.schema.json";
export const OBSERVABILITY_SUMMARY_SCHEMA_FILE = "schemas/runtime/observability-summary.schema.json";
export const BENCHMARK_EXPECTATION_SCHEMA_FILE = "schemas/runtime/benchmark-expectation.schema.json";
export const WORKTREE_PLAN_SCHEMA_FILE = "schemas/runtime/worktree-plan.schema.json";
export const WORKTREE_STATE_SCHEMA_FILE = "schemas/runtime/worktree-state.schema.json";
export const TEMPLATE_REQUIRED_SECTIONS = "scripts/templates/config/required-sections.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PACKAGE_ROOT = path.resolve(__dirname, "..", "..");
export const REPO_ROOT = PACKAGE_ROOT;
export const DEFAULT_WORKSPACE_ROOT = process.cwd();
