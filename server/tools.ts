import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export function Template(tmpl: string, vars: Record<string, string> = {}) {
  return new Function(...Object.keys(vars), `return \`${tmpl}\`;`)(
    ...Object.values(vars),
  );
}

export const UE_GET_ASSET_INFO = fs.readFileSync(
  path.join(__dirname, "./scripts/ue_get_asset_info.py"),
  "utf8",
);

export const UE_LIST_ASSETS = fs.readFileSync(
  path.join(__dirname, "./scripts/ue_list_assets.py"),
  "utf8",
);

export const UE_EXPORT_ASSET = fs.readFileSync(
  path.join(__dirname, "./scripts/ue_export_asset.py"),
  "utf8",
);

export const UE_GET_ASSET_REFERENCES = fs.readFileSync(
  path.join(__dirname, "./scripts/ue_get_asset_references.py"),
  "utf8",
);

export const UE_CONSOLE_COMMAND = fs.readFileSync(
  path.join(__dirname, "./scripts/ue_console_command.py"),
  "utf8",
);

export const UE_GET_PROJECT_INFO = fs.readFileSync(
  path.join(__dirname, "./scripts/ue_get_project_info.py"),
  "utf8",
);

export const UE_GET_MAP_INFO = fs.readFileSync(
  path.join(__dirname, "./scripts/ue_get_map_info.py"),
  "utf8",
);

export const UE_SEARCH_ASSETS = fs.readFileSync(
  path.join(__dirname, "./scripts/ue_search_assets.py"),
  "utf8",
);

export const UE_GET_WORLD_OUTLINER = fs.readFileSync(
  path.join(__dirname, "./scripts/ue_get_world_outliner.py"),
  "utf8",
);

export const UE_VALIDATE_ASSETS = fs.readFileSync(
  path.join(__dirname, "./scripts/ue_validate_assets.py"),
  "utf8",
);

export const UEGetAssetInfo = (asset_path: string) =>
  Template(UE_GET_ASSET_INFO, { asset_path });

export const UEListAssets = () => Template(UE_LIST_ASSETS);

export const UEExportAsset = (asset_path: string) =>
  Template(UE_EXPORT_ASSET, { asset_path });

export const UEGetAssetReferences = (asset_path: string) =>
  Template(UE_GET_ASSET_REFERENCES, { asset_path });

export const UEConsoleCommand = (command: string) =>
  Template(UE_CONSOLE_COMMAND, { command });

export const UEGetProjectInfo = () => Template(UE_GET_PROJECT_INFO);

export const UEGetMapInfo = () => Template(UE_GET_MAP_INFO);

export const UESearchAssets = (search_term: string, asset_class?: string) =>
  Template(UE_SEARCH_ASSETS, { search_term, asset_class: asset_class || "" });

export const UEGetWorldOutliner = () => Template(UE_GET_WORLD_OUTLINER);

export const UEValidateAssets = (asset_paths?: string) =>
  Template(UE_VALIDATE_ASSETS, { asset_paths: asset_paths || "" });
