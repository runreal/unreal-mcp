import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Template } from "../utils.js";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export function read(filePath: string): string {
  return fs.readFileSync(path.join(__dirname, filePath), "utf8");
}

export const UEGetAssetInfo = (asset_path: string) =>
  Template(read("./scripts/ue_get_asset_info.py"), { asset_path });

export const UEListAssets = () => Template(read("./scripts/ue_list_assets.py"));

export const UEExportAsset = (asset_path: string) =>
  Template(read("./scripts/ue_export_asset.py"), { asset_path });

export const UEGetAssetReferences = (asset_path: string) =>
  Template(read("./scripts/ue_get_asset_references.py"), { asset_path });

export const UEConsoleCommand = (command: string) =>
  Template(read("./scripts/ue_console_command.py"), { command });

export const UEGetProjectInfo = () =>
  Template(read("./scripts/ue_get_project_info.py"));

export const UEGetMapInfo = () =>
  Template(read("./scripts/ue_get_map_info.py"));

export const UESearchAssets = (search_term: string, asset_class?: string) =>
  Template(read("./scripts/ue_search_assets.py"), {
    search_term,
    asset_class: asset_class || "",
  });

export const UEGetWorldOutliner = () =>
  Template(read("./scripts/ue_get_world_outliner.py"));

export const UEValidateAssets = (asset_paths?: string) =>
  Template(read("./scripts/ue_validate_assets.py"), {
    asset_paths: asset_paths || "",
  });
