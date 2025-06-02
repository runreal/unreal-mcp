from typing import Dict, Any
import unreal
import json


def get_map_info() -> Dict[str, Any]:
    world = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
    if not world:
        return {"error": "No world loaded"}

    map_info = {}
    map_info["map_name"] = world.get_name()
    map_info["map_path"] = world.get_path_name()

    all_actors = unreal.get_editor_subsystem(
        unreal.EditorActorSubsystem
    ).get_all_level_actors()
    map_info["total_actors"] = len(all_actors)

    actor_types = {}
    for actor in all_actors:
        actor_class = actor.get_class().get_name()
        actor_types[actor_class] = actor_types.get(actor_class, 0) + 1

    map_info["actor_types"] = dict(
        sorted(actor_types.items(), key=lambda x: x[1], reverse=True)[:15]
    )

    lighting_info = {}
    lighting_info["has_lightmass_importance_volume"] = any(
        actor.get_class().get_name() == "LightmassImportanceVolume"
        for actor in all_actors
    )
    lighting_info["directional_lights"] = sum(
        1 for actor in all_actors if actor.get_class().get_name() == "DirectionalLight"
    )
    lighting_info["point_lights"] = sum(
        1 for actor in all_actors if actor.get_class().get_name() == "PointLight"
    )
    lighting_info["spot_lights"] = sum(
        1 for actor in all_actors if actor.get_class().get_name() == "SpotLight"
    )

    map_info["lighting"] = lighting_info

    try:
        streaming_levels = unreal.EditorLevelLibrary.get_all_level_actors_of_class(
            unreal.LevelStreamingDynamic
        )
        map_info["streaming_levels"] = len(streaming_levels)
        map_info["streaming_level_names"] = [
            level.get_name() for level in streaming_levels
        ]
    except Exception:
        map_info["streaming_levels"] = 0
        map_info["streaming_level_names"] = []

    return map_info


def main():
    map_data = get_map_info()
    print(json.dumps(map_data, indent=2))


if __name__ == "__main__":
    main()
