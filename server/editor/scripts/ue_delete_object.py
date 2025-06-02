from typing import Dict, Any, List
import unreal
import json


def delete_object(actor_name: str) -> Dict[str, Any]:
    try:
        world = unreal.get_editor_subsystem(
            unreal.UnrealEditorSubsystem
        ).get_editor_world()
        if not world:
            return {"error": "No world loaded"}

        all_actors = unreal.get_editor_subsystem(
            unreal.EditorActorSubsystem
        ).get_all_level_actors()
        target_actor = None

        for actor in all_actors:
            if actor.get_name() == actor_name or actor.get_actor_label() == actor_name:
                target_actor = actor
                break

        if not target_actor:
            return {"error": f"Actor not found: {actor_name}"}

        actor_info = {
            "actor_name": target_actor.get_name(),
            "actor_label": target_actor.get_actor_label(),
            "class": target_actor.get_class().get_name(),
            "location": {
                "x": target_actor.get_actor_location().x,
                "y": target_actor.get_actor_location().y,
                "z": target_actor.get_actor_location().z,
            },
        }

        success = unreal.get_editor_subsystem(
            unreal.EditorActorSubsystem
        ).destroy_actor(target_actor)

        if success:
            return {
                "success": True,
                "message": f"Successfully deleted actor: {actor_name}",
                "deleted_actor": actor_info,
            }
        else:
            return {"error": f"Failed to delete actor: {actor_name}"}

    except Exception as e:
        return {"error": f"Failed to delete object: {str(e)}"}


def delete_multiple_objects(actor_names: List[str]) -> Dict[str, Any]:
    try:
        results = []
        for actor_name in actor_names:
            result = delete_object(actor_name)
            results.append(result)

        return {
            "success": True,
            "total_requested": len(actor_names),
            "results": results,
        }

    except Exception as e:
        return {"error": f"Failed to delete multiple objects: {str(e)}"}


def main():
    actor_names_input = "${actor_names}"

    try:
        import ast

        actor_names = ast.literal_eval(actor_names_input)
        if isinstance(actor_names, list):
            result = delete_multiple_objects(actor_names)
        else:
            result = delete_object(str(actor_names))
    except Exception:
        result = delete_object(actor_names_input)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
