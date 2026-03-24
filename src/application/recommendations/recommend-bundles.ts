import fs from "node:fs/promises";
import path from "node:path";

export async function recommendBundles(root: string): Promise<string[]> {
  const recommendations = new Set<string>();
  const entries = await fs.readdir(root, { recursive: true });

  for (const entry of entries) {
    const file = String(entry);
    if (file.endsWith(".ts") || file.endsWith(".tsx")) recommendations.add("lang:typescript");
    if (file.endsWith(".java")) recommendations.add("lang:java");
    if (file.endsWith(".cs")) recommendations.add("lang:dotnet");
    if (file.endsWith(".lua")) recommendations.add("lang:lua");
    if (file.endsWith(".ps1")) recommendations.add("lang:powershell");
    if (path.basename(file) === "package.json") recommendations.add("capability:workflow-quality");
  }

  return [...recommendations];
}
