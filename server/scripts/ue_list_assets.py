import unreal

assets = unreal.EditorAssetLibrary.list_assets("/Game", recursive=True)
print(assets)
