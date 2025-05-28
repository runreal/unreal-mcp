import unreal
import json

asset = unreal.EditorAssetLibrary.find_asset_data("${asset_path}")
if asset.is_valid():
    asset_data = asset.get_asset()
    a = [
        {
            "name": asset_data.get_name(),
            "is_valid": asset.is_valid(),
            "is_u_asset": asset.is_u_asset(),
            "is_asset_loaded": asset.is_asset_loaded(),
            "class": asset_data.get_class().get_name(),
            "path": asset_data.get_path_name(),
            "package": asset_data.get_package().get_name(),
            "package_path": asset_data.get_package().get_path_name(),
        }
    ]
    print(json.dumps(a))
else:
    print("[]")
