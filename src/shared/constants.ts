import path from "node:path";
import { fileURLToPath } from "node:url";

export const STATE_DIR = ".hforge/state";
export const INSTALL_STATE_FILE = "install-state.json";
export const DEFAULT_BUNDLE_MANIFEST = "manifests/catalog/index.json";
export const TEMPLATE_REQUIRED_SECTIONS = "scripts/templates/config/required-sections.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PACKAGE_ROOT = path.resolve(__dirname, "..", "..");
export const REPO_ROOT = PACKAGE_ROOT;
export const DEFAULT_WORKSPACE_ROOT = process.cwd();
