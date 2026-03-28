import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const IGNORED_DIRS = new Set([
  ".git",
  ".claude",
  ".codex",
  ".cursor",
  ".hforge",
  ".next",
  ".nuxt",
  ".specify",
  ".turbo",
  ".venv",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "vendor"
]);

const LOW_SIGNAL_SEGMENTS = new Set([
  ".tmp",
  "tmp",
  "temp",
  "fixtures",
  "__fixtures__",
  "__snapshots__",
  "snapshots",
  "archive",
  "archives"
]);

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function hasLowSignalSegment(file) {
  return file.split("/").some((segment) => LOW_SIGNAL_SEGMENTS.has(segment));
}

function isSupportSurface(file) {
  return (
    file.startsWith(".claude/") ||
    file.startsWith(".codex/") ||
    file.startsWith(".cursor/") ||
    file.startsWith(".agents/") ||
    file.startsWith(".github/") ||
    file.startsWith(".hforge/")
  );
}

function isDocPath(file) {
  return /\.(md|mdx|txt|rst)$/i.test(file);
}

function isRelevantForRisk(file) {
  return !hasLowSignalSegment(file) && !isDocPath(file) && !isSupportSurface(file);
}

function languageWeightForPath(file) {
  const normalized = file.replaceAll("\\", "/");

  if (isSupportSurface(normalized) || hasLowSignalSegment(normalized)) {
    return 0;
  }

  if (
    normalized.startsWith("src/") ||
    normalized.startsWith("app/") ||
    normalized.startsWith("lib/") ||
    normalized.startsWith("seed/") ||
    normalized.startsWith("data/")
  ) {
    return 2;
  }

  if (
    normalized.startsWith("scripts/") ||
    normalized.startsWith("tools/") ||
    normalized.startsWith("bin/")
  ) {
    return 0.35;
  }

  if (normalized.startsWith("tests/") || normalized.includes("/tests/")) {
    return 0.5;
  }

  return 1;
}

function bump(map, key, evidence, amount = 1) {
  const current = map.get(key) ?? { count: 0, evidence: [] };
  current.count += amount;
  if (evidence && current.evidence.length < 5 && !current.evidence.includes(evidence)) {
    current.evidence.push(evidence);
  }
  map.set(key, current);
}

function createSignal(id, evidence, confidence = 0.8) {
  return {
    id,
    confidence,
    evidence: evidence.slice(0, 5)
  };
}

function sortSignals(values) {
  return [...values].sort((left, right) => {
    if (right.confidence !== left.confidence) {
      return right.confidence - left.confidence;
    }

    return left.id.localeCompare(right.id);
  });
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readTextIfPresent(targetPath) {
  if (!(await exists(targetPath))) {
    return null;
  }

  return fs.readFile(targetPath, "utf8");
}

async function readJsonIfPresent(targetPath) {
  const content = await readTextIfPresent(targetPath);
  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function walk(root, visit, base = root) {
  let entries = [];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const absolutePath = path.join(root, entry.name);
    const relativePath = path.relative(base, absolutePath).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) {
        continue;
      }

      await walk(absolutePath, visit, base);
      continue;
    }

    visit(relativePath, absolutePath);
  }
}

function detectLanguages(files) {
  const languageCounts = new Map();
  const hasCppSource = files.some((file) => {
    const weight = languageWeightForPath(file);
    return weight > 0 && /\.(cpp|cxx|cc|hpp|hh)$/i.test(file);
  });

  for (const file of files) {
    const weight = languageWeightForPath(file);
    if (weight <= 0) {
      continue;
    }

    if (/\.(ts|tsx)$/i.test(file)) {
      bump(languageCounts, "typescript", file, weight);
    }
    if (/\.(js|jsx)$/i.test(file)) {
      bump(languageCounts, "javascript", file, weight);
    }
    if (/\.py$/i.test(file)) {
      bump(languageCounts, "python", file, weight);
    }
    if (/\.go$/i.test(file)) {
      bump(languageCounts, "go", file, weight);
    }
    if (/\.java$/i.test(file)) {
      bump(languageCounts, "java", file, weight);
    }
    if (/\.(kt|kts)$/i.test(file)) {
      bump(languageCounts, "kotlin", file, weight);
    }
    if (/\.rs$/i.test(file)) {
      bump(languageCounts, "rust", file, weight);
    }
    if (/\.(cpp|cxx|cc|hpp|hh)$/i.test(file)) {
      bump(languageCounts, "cpp", file, weight);
    }
    if (/\.h$/i.test(file) && hasCppSource) {
      bump(languageCounts, "cpp", file, weight);
    }
    if (/\.php$/i.test(file)) {
      bump(languageCounts, "php", file, weight);
    }
    if (/\.(pl|pm)$/i.test(file)) {
      bump(languageCounts, "perl", file, weight);
    }
    if (/\.swift$/i.test(file)) {
      bump(languageCounts, "swift", file, weight);
    }
    if (/\.lua$/i.test(file)) {
      bump(languageCounts, "lua", file, weight);
    }
    if (/\.(sh|bash|zsh)$/i.test(file)) {
      bump(languageCounts, "shell", file, weight);
    }
    if (/\.(cs|csproj|sln)$/i.test(file)) {
      bump(languageCounts, "dotnet", file, weight);
    }
  }

  const dominantLanguages = [...languageCounts.entries()]
    .sort((left, right) => right[1].count - left[1].count)
    .map(([id, value], index, values) => ({
      id,
      count: value.count,
      confidence: Number((value.count / (values[0]?.[1].count ?? value.count)).toFixed(2)),
      evidence: value.evidence
    }));

  return { dominantLanguages, languageCounts };
}

function detectBuildSignals(files, packageJson) {
  const signals = [];
  const fileSet = new Set(files.filter((file) => !hasLowSignalSegment(file)));

  if (packageJson) {
    const packageManager = typeof packageJson.packageManager === "string" ? packageJson.packageManager.split("@")[0] : "npm";
    signals.push(createSignal(`package-manager:${packageManager}`, ["package.json"], 0.95));

    if (packageJson.workspaces) {
      signals.push(createSignal("workspace:package-json", ["package.json#workspaces"], 0.95));
    }
    if (packageJson.scripts?.build) {
      signals.push(createSignal("build:package-json-script", ["package.json#scripts.build"], 0.85));
    }
  }

  const directBuildMarkers = [
    ["build:vite", /^vite\.config\.(ts|js|mts|mjs)$/i],
    ["build:typescript", /^tsconfig\.json$/i],
    ["build:go", /^go\.mod$/i],
    ["build:rust", /^Cargo\.toml$/i],
    ["build:maven", /^pom\.xml$/i],
    ["build:gradle", /^build\.gradle(\.kts)?$/i],
    ["build:dotnet", /\.csproj$/i],
    ["build:composer", /^composer\.json$/i],
    ["build:swift", /^Package\.swift$/i],
    ["workspace:pnpm", /^pnpm-workspace\.yaml$/i]
  ];

  for (const [signalId, pattern] of directBuildMarkers) {
    const evidence = [...fileSet].filter((file) => pattern.test(path.posix.basename(file)));
    if (evidence.length > 0) {
      signals.push(createSignal(signalId, evidence, 0.8));
    }
  }

  if (fileSet.has("Makefile")) {
    signals.push(createSignal("build:make", ["Makefile"], 0.75));
  }

  return sortSignals(signals);
}

function detectTestSignals(files, packageJson, textSources) {
  const signals = [];
  const dependencyNames = new Set([
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {})
  ]);
  const testFiles = files.filter((file) => !hasLowSignalSegment(file));
  const javascriptTestFiles = testFiles.filter(
    (file) =>
      ((/(^|\/)(__tests__|tests?)\//i.test(file) && /\.(m?[jt]sx?|cjs|mjs)$/i.test(file)) ||
        /\.(test|spec)\.(m?[jt]sx?)$/i.test(file))
  );

  if (dependencyNames.has("vitest")) {
    signals.push(createSignal("test:vitest", ["package.json"], 0.95));
  }
  if (dependencyNames.has("jest")) {
    signals.push(createSignal("test:jest", ["package.json"], 0.9));
  }
  if (javascriptTestFiles.length > 0) {
    signals.push(createSignal("test:javascript-files", javascriptTestFiles, 0.8));
  }
  if (testFiles.some((file) => /^tests\/.+\.py$/i.test(file) || /test_.+\.py$/i.test(file))) {
    signals.push(createSignal("test:pytest", testFiles.filter((file) => /^tests\/.+\.py$/i.test(file) || /test_.+\.py$/i.test(file)), 0.8));
  }
  if (testFiles.some((file) => /_test\.go$/i.test(file))) {
    signals.push(createSignal("test:go", testFiles.filter((file) => /_test\.go$/i.test(file)), 0.8));
  }
  if (testFiles.some((file) => /src\/test\/java\//i.test(file))) {
    signals.push(createSignal("test:junit", testFiles.filter((file) => /src\/test\/java\//i.test(file)), 0.8));
  }
  if (testFiles.some((file) => /\.Tests?\.csproj$/i.test(file) || (/tests\//i.test(file) && /\.cs$/i.test(file)))) {
    signals.push(createSignal("test:xunit", testFiles.filter((file) => /\.Tests?\.csproj$/i.test(file) || (/tests\//i.test(file) && /\.cs$/i.test(file))), 0.8));
  }

  const pyproject = textSources.get("pyproject.toml") ?? "";
  if (pyproject.includes("pytest")) {
    signals.push(createSignal("test:pytest", ["pyproject.toml"], 0.9));
  }

  return sortSignals(signals);
}

function detectDeploymentSignals(files) {
  const signals = [];
  const deploymentFiles = files.filter((file) => !hasLowSignalSegment(file));

  const markers = [
    ["deploy:docker", /^Dockerfile$/i],
    ["deploy:docker-compose", /^docker-compose\.ya?ml$/i],
    ["deploy:github-actions", /^\.github\/workflows\//i],
    ["deploy:vercel", /^vercel\.json$/i],
    ["deploy:netlify", /^netlify\.toml$/i],
    ["deploy:kubernetes", /(^|\/)(k8s|kubernetes)\//i],
    ["deploy:helm", /(^|\/)chart(s)?\//i],
    ["deploy:procfile", /^Procfile$/i]
  ];

  for (const [signalId, pattern] of markers) {
    const evidence = deploymentFiles.filter((file) => pattern.test(file));
    if (evidence.length > 0) {
      signals.push(createSignal(signalId, evidence, 0.8));
    }
  }

  return sortSignals(signals);
}

function detectRiskSignals(files, testSignals) {
  const signals = [];
  const riskFiles = files.filter(isRelevantForRisk);
  const securityEvidence = files.filter(
    (file) => !hasLowSignalSegment(file) && !isSupportSurface(file) && /(security|auth|threat|iam|permissions?)/i.test(file)
  );

  if (securityEvidence.length > 0) {
    signals.push(createSignal("security", securityEvidence, 0.86));
  }

  const legacyEvidence = riskFiles.filter((file) => /(legacy|deprecated|old)/i.test(file));
  if (legacyEvidence.length > 0) {
    signals.push(createSignal("legacy", legacyEvidence, 0.88));
  }

  const migrationEvidence = riskFiles.filter((file) => /(migration|migrate|flyway|liquibase)/i.test(file));
  if (migrationEvidence.length > 0) {
    signals.push(createSignal("migration", migrationEvidence, 0.82));
  }

  if (testSignals.length === 0) {
    signals.push(createSignal("missing-tests", ["No test files or frameworks detected."], 0.92));
  }

  return sortSignals(signals);
}

function detectMissingValidationSurfaces(files, testSignals, buildSignals) {
  const missing = [];
  const fileSet = new Set(files.filter((file) => !hasLowSignalSegment(file)));

  if (testSignals.length === 0) {
    missing.push(
      createSignal("validation:missing-tests", ["No tests directory, test files, or test framework detected."], 0.95)
    );
  }

  const hasCi = [...fileSet].some((file) => /^\.github\/workflows\//i.test(file));
  if (!hasCi) {
    missing.push(createSignal("validation:missing-ci", ["No GitHub Actions workflows detected."], 0.75));
  }

  const hasLint =
    buildSignals.some((signal) => signal.id.startsWith("build:typescript")) ||
    fileSet.has(".eslintrc") ||
    fileSet.has("eslint.config.js");
  if (!hasLint) {
    missing.push(createSignal("validation:missing-lint", ["No lint configuration detected."], 0.65));
  }

  return missing;
}

function detectFrameworksFromText(facts) {
  const { files, packageManifests, textSources } = facts;
  const packageDeps = new Set(
    packageManifests.flatMap((manifest) => [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {})
    ])
  );
  const frameworkFiles = files.filter((file) => !hasLowSignalSegment(file));
  const frameworks = [];
  const pushMatch = (id, confidence, evidence) => {
    frameworks.push({
      id,
      confidence,
      evidence: evidence.slice(0, 5)
    });
  };

  if (packageDeps.has("react") || frameworkFiles.some((file) => /\.tsx$/i.test(file))) {
    pushMatch(
      "react",
      packageDeps.has("react") ? 0.96 : 0.7,
      packageDeps.has("react") ? ["package.json dependency react"] : frameworkFiles.filter((file) => /\.tsx$/i.test(file))
    );
  }
  if (packageDeps.has("vite") || frameworkFiles.some((file) => /^vite\.config\./i.test(path.posix.basename(file)))) {
    pushMatch(
      "vite",
      packageDeps.has("vite") ? 0.95 : 0.8,
      packageDeps.has("vite")
        ? ["package.json dependency vite"]
        : frameworkFiles.filter((file) => /^vite\.config\./i.test(path.posix.basename(file)))
    );
  }
  if (packageDeps.has("express")) {
    pushMatch("express", 0.95, ["package.json dependency express"]);
  }
  if (packageDeps.has("next") || frameworkFiles.some((file) => /^next\.config\./i.test(path.posix.basename(file)))) {
    pushMatch(
      "nextjs",
      packageDeps.has("next") ? 0.97 : 0.84,
      packageDeps.has("next")
        ? ["package.json dependency next"]
        : frameworkFiles.filter((file) => /^next\.config\./i.test(path.posix.basename(file)))
    );
  }

  const pyproject = textSources.get("pyproject.toml") ?? "";
  const requirements = textSources.get("requirements.txt") ?? "";
  if (pyproject.includes("fastapi") || requirements.includes("fastapi")) {
    pushMatch(
      "fastapi",
      0.95,
      [pyproject.includes("fastapi") ? "pyproject.toml dependency fastapi" : "requirements.txt dependency fastapi"]
    );
  }
  if (pyproject.includes("django") || requirements.includes("django") || frameworkFiles.includes("manage.py")) {
    pushMatch(
      "django",
      0.94,
      [
        frameworkFiles.includes("manage.py")
          ? "manage.py"
          : pyproject.includes("django")
            ? "pyproject.toml dependency django"
            : "requirements.txt dependency django"
      ]
    );
  }

  const pom = textSources.get("pom.xml") ?? "";
  const gradle = `${textSources.get("build.gradle") ?? ""}\n${textSources.get("build.gradle.kts") ?? ""}`;
  if (pom.includes("spring-boot") || gradle.includes("spring-boot")) {
    pushMatch("spring-boot", 0.95, [pom.includes("spring-boot") ? "pom.xml spring-boot" : "build.gradle spring-boot"]);
  }
  if (gradle.includes("ktor")) {
    pushMatch("ktor", 0.92, ["build.gradle ktor"]);
  }

  const csproj = [...textSources.entries()].find(([filePath]) => /\.csproj$/i.test(filePath))?.[1] ?? "";
  const programCs = textSources.get("Program.cs") ?? "";
  if (csproj.includes("Microsoft.NET.Sdk.Web") || programCs.includes("WebApplication.CreateBuilder")) {
    pushMatch(
      "aspnet-core",
      csproj.includes("Microsoft.NET.Sdk.Web") ? 0.96 : 0.86,
      [csproj.includes("Microsoft.NET.Sdk.Web") ? "Api.csproj Microsoft.NET.Sdk.Web" : "Program.cs WebApplication.CreateBuilder"]
    );
  }

  const goMod = textSources.get("go.mod") ?? "";
  const goSources = [...textSources.entries()]
    .filter(([filePath]) => /\.go$/i.test(filePath))
    .map(([, content]) => content)
    .join("\n");
  if (goMod.includes("gin-gonic/gin") || goSources.includes("gin.Default(")) {
    pushMatch(
      "gin",
      goMod.includes("gin-gonic/gin") ? 0.93 : 0.82,
      [goMod.includes("gin-gonic/gin") ? "go.mod gin-gonic/gin" : "gin.Default()"]
    );
  }

  const composer = textSources.get("composer.json") ?? "";
  if (composer.includes("symfony/") || frameworkFiles.includes("bin/console")) {
    pushMatch(
      "symfony",
      composer.includes("symfony/") ? 0.92 : 0.82,
      [composer.includes("symfony/") ? "composer.json symfony/*" : "bin/console"]
    );
  }
  if (composer.includes("laravel/framework") || frameworkFiles.includes("artisan")) {
    pushMatch(
      "laravel",
      composer.includes("laravel/framework") ? 0.96 : 0.88,
      [composer.includes("laravel/framework") ? "composer.json laravel/framework" : "artisan"]
    );
  }

  return sortSignals(frameworks);
}

function detectRepoType(facts) {
  const { files, buildSignals, frameworkMatches, riskSignals, packageJson } = facts;
  const fileSet = new Set(files.filter((file) => !hasLowSignalSegment(file)));

  if (buildSignals.some((signal) => signal.id.startsWith("workspace:"))) {
    return "monorepo";
  }
  if (frameworkMatches.some((match) => ["react", "vite", "nextjs"].includes(match.id))) {
    return "app";
  }
  if (
    frameworkMatches.some((match) =>
      ["express", "fastapi", "django", "spring-boot", "aspnet-core", "gin", "ktor", "symfony", "laravel"].includes(match.id)
    )
  ) {
    return "service";
  }
  if (fileSet.has("cmd/hforge/main.go") || packageJson?.bin) {
    return "cli";
  }
  if (riskSignals.some((signal) => signal.id === "legacy")) {
    return "legacy";
  }
  if ([...fileSet].some((file) => file.startsWith("scripts/")) && [...fileSet].every((file) => !file.startsWith("src/"))) {
    return "automation";
  }

  return "library";
}

function normalizeRecommendations(result, frameworkCatalog, languageCatalog) {
  const bundleRecommendations = [];
  const profileRecommendations = [];
  const skillRecommendations = [];
  const validationRecommendations = [];
  const knownLanguageIds = new Set(Object.keys(languageCatalog.languages ?? {}));

  for (const language of result.dominantLanguages.slice(0, 3)) {
    if (!knownLanguageIds.has(language.id)) {
      continue;
    }

    bundleRecommendations.push({
      id: `lang:${language.id}`,
      kind: "bundle",
      confidence: language.confidence,
      evidence: language.evidence,
      why: `Dominant ${language.id} files were detected in the repository.`
    });
  }

  for (const framework of result.frameworkMatches) {
    const frameworkEntry = frameworkCatalog.frameworks.find((item) => item.id === framework.id);
    if (!frameworkEntry) {
      continue;
    }

    bundleRecommendations.push({
      id: frameworkEntry.bundleId,
      kind: "bundle",
      confidence: framework.confidence,
      evidence: framework.evidence,
      why: `${frameworkEntry.displayName} evidence indicates this repo needs framework-specific guidance.`
    });
  }

  if (["service", "app", "monorepo"].includes(result.repoType)) {
    profileRecommendations.push({
      id: "developer",
      kind: "profile",
      confidence: result.repoType === "monorepo" ? 0.92 : 0.82,
      evidence: [`repoType:${result.repoType}`],
      why: "The developer profile matches active implementation and validation work."
    });
  }

  profileRecommendations.push({
    id: "core",
    kind: "profile",
    confidence: 0.7,
    evidence: ["baseline portable install surface"],
    why: "The core profile remains the safest minimal baseline."
  });

  const riskIds = new Set(result.riskSignals.map((signal) => signal.id));
  const languageIds = new Set(result.dominantLanguages.map((language) => language.id));
  if (result.repoType === "monorepo" || result.repoType === "legacy" || result.dominantLanguages.length > 1) {
    skillRecommendations.push({
      id: "skill:repo-onboarding",
      kind: "skill",
      confidence: 0.9,
      evidence: [`repoType:${result.repoType}`, ...result.dominantLanguages.slice(0, 2).map((language) => `lang:${language.id}`)],
      why: "Complex repository layouts benefit from a deterministic onboarding pass."
    });
    skillRecommendations.push({
      id: "skill:architecture-decision-records",
      kind: "skill",
      confidence: 0.74,
      evidence: [`repoType:${result.repoType}`],
      why: "Cross-cutting or modernization work should capture architecture intent explicitly."
    });
  }

  if (languageIds.has("javascript")) {
    skillRecommendations.push({
      id: "skill:javascript-engineering",
      kind: "skill",
      confidence: 0.84,
      evidence: result.dominantLanguages.find((language) => language.id === "javascript")?.evidence ?? [],
      why: "JavaScript-heavy repositories benefit from the dedicated JavaScript engineering skill without forcing the TypeScript bundle."
    });
  }

  if (
    riskIds.has("security") ||
    result.frameworkMatches.some((framework) =>
      ["express", "fastapi", "django", "spring-boot", "aspnet-core", "gin", "ktor", "symfony", "laravel"].includes(framework.id)
    )
  ) {
    skillRecommendations.push({
      id: "skill:security-scan",
      kind: "skill",
      confidence: riskIds.has("security") ? 0.95 : 0.76,
      evidence: riskIds.has("security")
        ? result.riskSignals.find((signal) => signal.id === "security")?.evidence ?? []
        : result.frameworkMatches.map((framework) => `framework:${framework.id}`),
      why: "Service and security-sensitive repositories need an explicit security boundary review."
    });
  }

  if (result.deploymentSignals.length > 0 || result.missingValidationSurfaces.length > 0) {
    skillRecommendations.push({
      id: "skill:release-readiness",
      kind: "skill",
      confidence: 0.84,
      evidence: [
        ...result.deploymentSignals.slice(0, 2).map((signal) => signal.id),
        ...result.missingValidationSurfaces.slice(0, 2).map((signal) => signal.id)
      ],
      why: "Release-focused validation helps convert deployment and quality signals into a clear gate."
    });
  }

  if (result.frameworkMatches.length > 0) {
    skillRecommendations.push({
      id: "skill:documentation-lookup",
      kind: "skill",
      confidence: 0.72,
      evidence: result.frameworkMatches.map((framework) => `framework:${framework.id}`),
      why: "Framework-specific work benefits from a docs-first lookup path."
    });
  }

  for (const missing of result.missingValidationSurfaces) {
    validationRecommendations.push({
      id: missing.id,
      kind: "validation",
      confidence: missing.confidence,
      evidence: missing.evidence,
      why: "The repo is missing a validation surface that Harness Forge can flag early."
    });
  }

  const dedupe = (values) =>
    Object.values(
      values.reduce((accumulator, value) => {
        const existing = accumulator[value.id];
        if (!existing || existing.confidence < value.confidence) {
          accumulator[value.id] = value;
        }
        return accumulator;
      }, {})
    ).sort((left, right) => right.confidence - left.confidence);

  return {
    bundles: dedupe(bundleRecommendations),
    profiles: dedupe(profileRecommendations),
    skills: dedupe(skillRecommendations),
    validations: dedupe(validationRecommendations)
  };
}

export async function collectRepoFacts(root) {
  const repoRoot = path.resolve(root);
  const files = [];
  const generatedAt = new Date().toISOString();

  await walk(repoRoot, (relativePath) => {
    files.push(relativePath);
  });

  files.sort((left, right) => left.localeCompare(right));

  const interestingFiles = new Set(
    files.filter((file) => {
      if (hasLowSignalSegment(file)) {
        return false;
      }

      const baseName = path.posix.basename(file);
      return (
        baseName === "package.json" ||
        baseName === "pyproject.toml" ||
        baseName === "requirements.txt" ||
        baseName === "go.mod" ||
        baseName === "pom.xml" ||
        baseName === "build.gradle" ||
        baseName === "build.gradle.kts" ||
        baseName === "composer.json" ||
        baseName === "Program.cs" ||
        /\.csproj$/i.test(baseName) ||
        /\.go$/i.test(baseName)
      );
    })
  );

  const textSources = new Map();
  await Promise.all(
    [...interestingFiles].map(async (relativePath) => {
      const content = await readTextIfPresent(path.join(repoRoot, relativePath));
      if (content) {
        textSources.set(relativePath, content);
      }
    })
  );

  const packageManifestPaths = files.filter(
    (file) => path.posix.basename(file) === "package.json" && !hasLowSignalSegment(file)
  );
  const packageManifestEntries = await Promise.all(
    packageManifestPaths.map(async (relativePath) => ({
      relativePath,
      manifest: await readJsonIfPresent(path.join(repoRoot, relativePath))
    }))
  );
  const packageManifests = packageManifestEntries.map((entry) => entry.manifest).filter(Boolean);
  const packageJson = packageManifestEntries.find((entry) => entry.relativePath === "package.json")?.manifest ?? packageManifests[0] ?? null;
  const { dominantLanguages } = detectLanguages(files);
  const buildSignals = detectBuildSignals(files, packageJson);
  const testSignals = detectTestSignals(files, packageJson, textSources);
  const deploymentSignals = detectDeploymentSignals(files);
  const riskSignals = detectRiskSignals(files, testSignals);
  const frameworkMatches = detectFrameworksFromText({
    files,
    packageManifests,
    textSources
  });

  const repoType = detectRepoType({
    files,
    buildSignals,
    frameworkMatches,
    riskSignals,
    packageJson
  });
  const missingValidationSurfaces = detectMissingValidationSurfaces(files, testSignals, buildSignals);

  return {
    generatedAt,
    root: repoRoot,
    repoType,
    dominantLanguages,
    frameworkMatches,
    buildSignals,
    testSignals,
    deploymentSignals,
    riskSignals,
    missingValidationSurfaces
  };
}

export async function loadFrameworkCatalog() {
  const frameworkCatalogPath = path.join(PACKAGE_ROOT, "manifests", "catalog", "framework-assets.json");
  const content = await fs.readFile(frameworkCatalogPath, "utf8");
  return JSON.parse(content);
}

export async function loadLanguageCatalog() {
  const languageCatalogPath = path.join(PACKAGE_ROOT, "manifests", "catalog", "language-assets.json");
  const content = await fs.readFile(languageCatalogPath, "utf8");
  return JSON.parse(content);
}

export async function scoreRecommendations(root) {
  const facts = await collectRepoFacts(root);
  const frameworkCatalog = await loadFrameworkCatalog();
  const languageCatalog = await loadLanguageCatalog();

  return {
    ...facts,
    recommendations: normalizeRecommendations(facts, frameworkCatalog, languageCatalog)
  };
}

export function formatHumanReadable(result) {
  const formatSection = (title, values, formatter) => {
    if (values.length === 0) {
      return `${title}: none`;
    }

    return `${title}:\n${values.map((value) => `- ${formatter(value)}`).join("\n")}`;
  };

  return [
    `Repository: ${result.root}`,
    `Type: ${result.repoType}`,
    formatSection("Dominant languages", result.dominantLanguages, (value) => `${value.id} (${value.confidence}) via ${value.evidence.join(", ")}`),
    formatSection("Frameworks", result.frameworkMatches, (value) => `${value.id} (${value.confidence}) via ${value.evidence.join(", ")}`),
    formatSection("Bundles", result.recommendations?.bundles ?? [], (value) => `${value.id} (${value.confidence}) - ${value.why}`),
    formatSection("Profiles", result.recommendations?.profiles ?? [], (value) => `${value.id} (${value.confidence}) - ${value.why}`),
    formatSection("Skills", result.recommendations?.skills ?? [], (value) => `${value.id} (${value.confidence}) - ${value.why}`),
    formatSection("Validations", result.recommendations?.validations ?? [], (value) => `${value.id} (${value.confidence}) - ${value.why}`)
  ].join("\n\n");
}
