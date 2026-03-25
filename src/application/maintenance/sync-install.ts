import { loadInstallState, saveInstallState } from "../../domain/state/install-state.js";

export async function syncInstallState(workspaceRoot: string, apply = false): Promise<{
  changed: boolean;
  installedBundles: string[];
  installedTargets: string[];
}> {
  const state = await loadInstallState(workspaceRoot);
  if (!state) {
    return { changed: false, installedBundles: [], installedTargets: [] };
  }

  const installedBundles = [...new Set(state.installedBundles)];
  const installedTargets = [...new Set(state.installedTargets)];
  const changed =
    installedBundles.length !== state.installedBundles.length ||
    installedTargets.length !== state.installedTargets.length;

  if (apply && changed) {
    await saveInstallState(workspaceRoot, {
      ...state,
      installedBundles,
      installedTargets,
      timestamps: {
        ...state.timestamps,
        updatedAt: new Date().toISOString()
      }
    });
  }

  return { changed, installedBundles, installedTargets };
}
