from typing import Dict, Any, Optional
import unreal
import json


def update_object(
    actor_name: str,
    location: Optional[Dict[str, float]] = None,
    rotation: Optional[Dict[str, float]] = None,
    scale: Optional[Dict[str, float]] = None,
    properties: Optional[Dict[str, Any]] = None,
    new_name: Optional[str] = None,
) -> Dict[str, Any]:
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

        if location:
            new_location = unreal.Vector(
                x=location.get("x", target_actor.get_actor_location().x),
                y=location.get("y", target_actor.get_actor_location().y),
                z=location.get("z", target_actor.get_actor_location().z),
            )
            target_actor.set_actor_location(new_location, False, False)

        if rotation:
            new_rotation = unreal.Rotator(
                pitch=rotation.get("pitch", target_actor.get_actor_rotation().pitch),
                yaw=rotation.get("yaw", target_actor.get_actor_rotation().yaw),
                roll=rotation.get("roll", target_actor.get_actor_rotation().roll),
            )
            target_actor.set_actor_rotation(new_rotation, False)

        if scale:
            new_scale = unreal.Vector(
                x=scale.get("x", target_actor.get_actor_scale3d().x),
                y=scale.get("y", target_actor.get_actor_scale3d().y),
                z=scale.get("z", target_actor.get_actor_scale3d().z),
            )
            target_actor.set_actor_scale3d(new_scale)

        if new_name:
            target_actor.set_actor_label(new_name)

        if properties:
            for prop_name, prop_value in properties.items():
                try:
                    if hasattr(target_actor, prop_name):
                        setattr(target_actor, prop_name, prop_value)
                except Exception as e:
                    continue

        return {
            "success": True,
            "actor_name": target_actor.get_name(),
            "actor_label": target_actor.get_actor_label(),
            "class": target_actor.get_class().get_name(),
            "location": {
                "x": target_actor.get_actor_location().x,
                "y": target_actor.get_actor_location().y,
                "z": target_actor.get_actor_location().z,
            },
            "rotation": {
                "pitch": target_actor.get_actor_rotation().pitch,
                "yaw": target_actor.get_actor_rotation().yaw,
                "roll": target_actor.get_actor_rotation().roll,
            },
            "scale": {
                "x": target_actor.get_actor_scale3d().x,
                "y": target_actor.get_actor_scale3d().y,
                "z": target_actor.get_actor_scale3d().z,
            },
        }

    except Exception as e:
        return {"error": f"Failed to update object: {str(e)}"}


def parse_value(value_str):
    import json as parse_json

    if value_str and value_str != "null" and value_str.strip():
        try:
            return parse_json.loads(value_str)
        except Exception:
            return None
    return None


def parse_string(value_str):
    if value_str and value_str != "null" and value_str.strip():
        return value_str
    return None


def main():
    actor_name = "${actor_name}"
    location_str = """${location}"""
    rotation_str = """${rotation}"""
    scale_str = """${scale}"""
    properties_str = """${properties}"""
    new_name_str = """${new_name}"""

    location = parse_value(location_str)
    rotation = parse_value(rotation_str)
    scale = parse_value(scale_str)
    properties = parse_value(properties_str)
    new_name = parse_string(new_name_str)

    result = update_object(
        actor_name=actor_name,
        location=location,
        rotation=rotation,
        scale=scale,
        properties=properties,
        new_name=new_name,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
