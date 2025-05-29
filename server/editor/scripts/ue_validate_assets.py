from typing import Dict, List, Any, Optional, Union
import unreal
import json


def validate_assets(
    asset_paths: Optional[Union[str, List[str]]] = None,
) -> Dict[str, Any]:
    validation_results = {
        "total_validated": 0,
        "valid_assets": [],
        "invalid_assets": [],
        "validation_summary": {},
    }

    if asset_paths:
        assets_to_validate = (
            asset_paths if isinstance(asset_paths, list) else [asset_paths]
        )
    else:
        asset_registry = unreal.AssetRegistryHelpers.get_asset_registry()
        all_assets = asset_registry.get_all_assets()
        assets_to_validate = [
            str(asset.package_path) + "/" + str(asset.asset_name)
            for asset in all_assets[:100]
        ]  # Limit to 100 for performance

    validation_results["total_validated"] = len(assets_to_validate)

    for asset_path in assets_to_validate:
        try:
            if not unreal.EditorAssetLibrary.does_asset_exist(asset_path):
                validation_results["invalid_assets"].append(
                    {"path": asset_path, "error": "Asset does not exist"}
                )
                continue

            asset = unreal.EditorAssetLibrary.load_asset(asset_path)
            if not asset:
                validation_results["invalid_assets"].append(
                    {"path": asset_path, "error": "Failed to load asset"}
                )
                continue

            asset_data = unreal.EditorAssetLibrary.find_asset_data(asset_path)
            if not asset_data.is_valid():
                validation_results["invalid_assets"].append(
                    {"path": asset_path, "error": "Asset data is invalid"}
                )
                continue

            validation_results["valid_assets"].append(
                {
                    "path": asset_path,
                    "class": asset.get_class().get_name(),
                    "size": asset_data.get_tag_value("AssetFileSize") or "Unknown",
                }
            )

        except Exception as e:
            validation_results["invalid_assets"].append(
                {"path": asset_path, "error": str(e)}
            )

    # Generate summary
    validation_results["validation_summary"] = {
        "valid_count": len(validation_results["valid_assets"]),
        "invalid_count": len(validation_results["invalid_assets"]),
        "success_rate": round(
            len(validation_results["valid_assets"])
            / validation_results["total_validated"]
            * 100,
            2,
        )
        if validation_results["total_validated"] > 0
        else 0,
    }

    return validation_results


def main():
    result = validate_assets("${asset_paths}")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
