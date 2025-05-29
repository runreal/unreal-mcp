from typing import Dict, List, Any, Optional
import unreal
import json


def search_assets(
    search_term: str, asset_class: Optional[str] = None
) -> Dict[str, Any]:
    asset_registry = unreal.AssetRegistryHelpers.get_asset_registry()
    all_assets = asset_registry.get_all_assets()

    matching_assets = []
    search_term_lower = search_term.lower()

    for asset in all_assets:
        asset_name = str(asset.asset_name).lower()
        package_path = str(asset.package_path).lower()
        asset_class_name = str(asset.asset_class_path.asset_name).lower()

        name_match = search_term_lower in asset_name
        path_match = search_term_lower in package_path

        class_match = True
        if asset_class:
            class_match = asset_class.lower() in asset_class_name

        if (name_match or path_match) and class_match:
            matching_assets.append(
                {
                    "name": str(asset.asset_name),
                    "path": str(asset.package_path),
                    "class": str(asset.asset_class_path.asset_name),
                    "package_name": str(asset.package_name),
                }
            )

    def relevance_score(asset):
        name_exact = search_term_lower == asset["name"].lower()
        name_starts = asset["name"].lower().startswith(search_term_lower)
        return (name_exact * 3) + (name_starts * 2) + 1

    matching_assets.sort(key=relevance_score, reverse=True)

    return {
        "search_term": search_term,
        "asset_class_filter": asset_class,
        "total_matches": len(matching_assets),
        "assets": matching_assets[:50],  # Limit to 50 results
    }


def main():
    result = search_assets("${search_term}", "${asset_class}")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
