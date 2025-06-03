from typing import List, Dict, Any
import unreal
import json


def get_asset_info(asset_path: str) -> List[Dict[str, Any]]:
    asset = unreal.EditorAssetLibrary.find_asset_data(asset_path)
    if asset.is_valid():
        asset_data = asset.get_asset()
        asset_info = {
            "name": asset_data.get_name(),
            "is_valid": asset.is_valid(),
            "is_u_asset": asset.is_u_asset(),
            "is_asset_loaded": asset.is_asset_loaded(),
            "class": asset_data.get_class().get_name(),
            "path": asset_data.get_path_name(),
            "package": asset_data.get_package().get_name(),
            "package_path": asset_data.get_package().get_path_name(),
        }

        # Add LOD information for assets that support it
        lod_info = get_lod_info(asset_data)
        if lod_info:
            asset_info["lod_levels"] = lod_info

        return [asset_info]
    else:
        return []


def get_lod_info(asset_data) -> List[Dict[str, Any]]:
    lod_levels = []

    try:
        if isinstance(asset_data, unreal.StaticMesh):
            num_lods = asset_data.get_num_lods()
            for i in range(num_lods):
                lod_data = asset_data.get_render_data().lod_resources[i]
                lod_info = {
                    "lod_index": i,
                    "num_vertices": lod_data.get_num_vertices(),
                    "num_triangles": lod_data.get_num_triangles(),
                }
                lod_levels.append(lod_info)

        elif isinstance(asset_data, unreal.SkeletalMesh):
            editor_subsystem = unreal.get_editor_subsystem(
                unreal.SkeletalMeshEditorSubsystem
            )
            if editor_subsystem:
                try:
                    lod_count = editor_subsystem.get_lod_count(asset_data)
                    for lod_index in range(lod_count):
                        try:
                            lod_info_data = editor_subsystem.get_lod_info(
                                asset_data, lod_index
                            )
                            lod_data = {
                                "lod_index": lod_index,
                                "lod_info": str(lod_info_data)
                                if lod_info_data
                                else None,
                            }
                            lod_levels.append(lod_data)
                        except Exception:
                            lod_data = {
                                "lod_index": lod_index,
                                "lod_info": None,
                            }
                            lod_levels.append(lod_data)
                except Exception:
                    pass

    except Exception as e:
        # If we can't get LOD info, return empty list
        pass

    return lod_levels


def main():
    asset_info = get_asset_info("${asset_path}")
    print(json.dumps(asset_info))


if __name__ == "__main__":
    main()
