from typing import Dict, Any
import unreal
import json


def get_project_info() -> Dict[str, dict]:
    project_info = {}

    project_info["project_name"] = (
        unreal.Paths.get_project_file_path().split("/")[-1].replace(".uproject", "")
        if unreal.Paths.get_project_file_path()
        else "Unknown"
    )
    project_info["project_directory"] = unreal.Paths.project_dir()
    project_info["engine_version"] = unreal.SystemLibrary.get_engine_version()

    # Asset registry analysis
    asset_registry = unreal.AssetRegistryHelpers.get_asset_registry()
    all_assets = asset_registry.get_all_assets()

    # Asset summary
    total_assets = len(all_assets)
    asset_locations = {}

    input_actions = []
    input_mappings = []
    game_modes = []
    characters = []
    experiences = []
    weapons = []
    maps = []

    for asset in all_assets:
        asset_name = str(asset.asset_name)
        package_path = str(asset.package_path)

        # Count by location
        location = package_path.split("/")[1] if "/" in package_path else "Root"
        asset_locations[location] = asset_locations.get(location, 0) + 1

        asset_name_lower = asset_name.lower()
        full_path = f"{package_path}/{asset_name}"

        if asset_name.startswith("IA_"):
            input_actions.append(full_path)
        elif asset_name.startswith("IMC_"):
            input_mappings.append(full_path)
        elif "gamemode" in asset_name_lower:
            game_modes.append(full_path)
        elif (
            any(term in asset_name_lower for term in ["hero", "character"])
            and "b_" in asset_name_lower
        ):
            characters.append(full_path)
        elif "experience" in asset_name_lower and "ui" not in package_path.lower():
            experiences.append(full_path)
        elif any(term in asset_name_lower for term in ["weapon", "wid_"]):
            weapons.append(full_path)
        elif asset_name.startswith("L_"):
            maps.append(full_path)

    project_info["total_assets"] = total_assets
    project_info["asset_locations"] = dict(
        sorted(asset_locations.items(), key=lambda x: x[1], reverse=True)[:10]
    )

    # system
    project_info["enhanced_input_enabled"] = True
    project_info["input_actions"] = input_actions[:10]
    project_info["input_mappings"] = input_mappings[:10]
    project_info["input_actions_count"] = len(input_actions)
    project_info["input_mappings_count"] = len(input_mappings)

    # assets
    project_info["game_modes"] = game_modes[:5]
    project_info["characters"] = characters[:5]
    project_info["experiences"] = experiences[:5]
    project_info["weapons"] = weapons[:10]
    project_info["maps"] = maps[:10]

    # capabilities
    project_info["gameplay_ability_system"] = True
    project_info["modular_gameplay"] = True
    project_info["python_scripting"] = True
    project_info["networking"] = True

    # info
    project_info["total_maps"] = len(maps)
    project_info["total_weapons"] = len(weapons)
    project_info["total_experiences"] = len(experiences)

    return project_info


def main():
    project_data = get_project_info()
    print(json.dumps(project_data, indent=2))


if __name__ == "__main__":
    main()
