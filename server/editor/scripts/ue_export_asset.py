import unreal
import sys
import tempfile


def export_asset(asset_path: str) -> bytes:
    asset = unreal.EditorAssetLibrary.load_asset(asset_path)

    if not asset:
        raise ValueError(f"Asset not found at {asset_path}")

    export_task = unreal.AssetExportTask()
    export_task.automated = True
    export_task.prompt = False
    export_task.replace_identical = True
    export_task.exporter = None
    export_task.object = asset

    temp_file = tempfile.NamedTemporaryFile(delete=True, suffix=".uasset.copy")

    export_file_path = temp_file.name

    export_task.filename = export_file_path

    result = unreal.Exporter.run_asset_export_task(export_task)

    if not result:
        raise RuntimeError(
            f"Failed to export asset {asset.get_name()} to {export_file_path}"
        )

    file = open(export_file_path, "rb")
    data = file.read()
    file.close()
    temp_file.close()
    return data


def main():
    data = export_asset("${asset_path}")
    sys.stdout.buffer.write(data)


if __name__ == "__main__":
    main()
