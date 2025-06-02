from typing import Dict, Any
import unreal
import json


def get_world_outliner() -> Dict[str, Any]:
    world = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
    if not world:
        return {"error": "No world loaded"}

    # Get all actors in the current level
    all_actors = unreal.get_editor_subsystem(
        unreal.EditorActorSubsystem
    ).get_all_level_actors()

    outliner_data = {
        "world_name": world.get_name(),
        "total_actors": len(all_actors),
        "actors": [],
    }

    for actor in all_actors:
        try:
            actor_info = {
                "name": actor.get_name(),
                "class": actor.get_class().get_name(),
                "location": {
                    "x": actor.get_actor_location().x,
                    "y": actor.get_actor_location().y,
                    "z": actor.get_actor_location().z,
                },
                "rotation": {
                    "pitch": actor.get_actor_rotation().pitch,
                    "yaw": actor.get_actor_rotation().yaw,
                    "roll": actor.get_actor_rotation().roll,
                },
                "scale": {
                    "x": actor.get_actor_scale3d().x,
                    "y": actor.get_actor_scale3d().y,
                    "z": actor.get_actor_scale3d().z,
                },
                "is_hidden": actor.is_hidden_ed(),
                "folder_path": str(actor.get_folder_path())
                if hasattr(actor, "get_folder_path")
                else None,
            }

            components = actor.get_components_by_class(unreal.ActorComponent)
            if components:
                actor_info["components"] = [
                    comp.get_class().get_name() for comp in components[:5]
                ]

            outliner_data["actors"].append(actor_info)

        except Exception as e:
            continue

    outliner_data["actors"].sort(key=lambda x: x["name"])

    return outliner_data


def main():
    outliner_data = get_world_outliner()
    print(json.dumps(outliner_data, indent=2))


if __name__ == "__main__":
    main()
