import type { PromptSession } from "../prompt-io.js";
import type { FolderSelectionMode } from "../setup-intent.js";
import { normalizeFolderSelection } from "../setup-intent.js";

export async function promptForFolderSelection(promptSession: PromptSession, baseRoot: string) {
  const selectionMode = (await promptSession.askChoice(
    "folderMode",
    "Choose where Harness Forge should initialize",
    [
      {
        value: "current-directory",
        label: "Current directory",
        description: "Initialize Harness Forge in the repo you are already in."
      },
      {
        value: "custom-path",
        label: "Custom path",
        description: "Point setup at another existing folder."
      },
      {
        value: "new-folder",
        label: "New folder",
        description: "Create a fresh target folder for the runtime."
      }
    ],
    "current-directory"
  )) as FolderSelectionMode;

  const requestedPath =
    selectionMode === "current-directory"
      ? "."
      : await promptSession.askText(
          "folderPath",
          selectionMode === "new-folder" ? "Enter the new folder path" : "Enter the target folder path",
          "."
        );

  return normalizeFolderSelection(baseRoot, selectionMode, requestedPath);
}
