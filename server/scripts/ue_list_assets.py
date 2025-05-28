from typing import List
import unreal


def list_assets() -> List[str]:
    assets = unreal.EditorAssetLibrary.list_assets("/Game", recursive=True)
    return assets


def main():
    assets = list_assets()
    print(assets)


if __name__ == "__main__":
    main()
