export const metadata = {
  version: 1,
  kind: "recursive-structured-analysis",
  requestedBehaviors: ["read-runtime"]
};

export async function analyze(context) {
  const repoMap = await context.readHandle("repo-map");
  await context.appendScratch("Inspected repo-map during structured recursive analysis.");
  await context.log("Read repo-map handle from the structured analysis snippet.");

  return {
    summary: "Structured recursive analysis inspected the repo map successfully.",
    findings: [`Repo map keys: ${Object.keys(repoMap).join(", ")}`],
    warnings: [],
    diagnostics: [],
    artifactsRead: [context.resolveHandle("repo-map")],
    artifactsWritten: [context.scratchPath]
  };
}
