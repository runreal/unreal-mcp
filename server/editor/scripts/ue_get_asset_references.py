from typing import List, Dict
import unreal
import json


def get_asset_references(asset_path: str) -> List[Dict[str, str]]:
    asset_registry = unreal.AssetRegistryHelpers.get_asset_registry()

    asset_data = asset_registry.get_asset_by_object_path(asset_path)

    referencing_assets = asset_registry.get_referencers(
        asset_data.package_name, unreal.AssetRegistryDependencyOptions()
    )

    asset_paths = []
    for referencer in referencing_assets:
        assets = asset_registry.get_assets_by_package_name(referencer)
        for asset in assets:
            [asset_class, asset_name] = asset.get_full_name().split(" ", 1)
            asset_paths.append({"name": asset_name, "class": asset_class})

    return asset_paths


def main():
    references = get_asset_references("${asset_path}")
    print(json.dumps(references))


if __name__ == "__main__":
    main()
