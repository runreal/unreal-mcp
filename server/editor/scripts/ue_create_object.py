from typing import Dict, Any, Optional
import unreal
import json


def create_object(
    object_class: str,
    object_name: str,
    location: Optional[Dict[str, float]] = None,
    rotation: Optional[Dict[str, float]] = None,
    scale: Optional[Dict[str, float]] = None,
    properties: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    try:
        world = unreal.get_editor_subsystem(
            unreal.UnrealEditorSubsystem
        ).get_editor_world()
        if not world:
            return {"error": "No world loaded"}

        actor_class = None

        class_mappings = {
            "StaticMeshActor": unreal.StaticMeshActor,
            "SkeletalMeshActor": unreal.SkeletalMeshActor,
            "DirectionalLight": unreal.DirectionalLight,
            "PointLight": unreal.PointLight,
            "SpotLight": unreal.SpotLight,
            "Camera": unreal.CameraActor,
            "CameraActor": unreal.CameraActor,
            "Pawn": unreal.Pawn,
            "Character": unreal.Character,
            "PlayerStart": unreal.PlayerStart,
        }

        actor_class = class_mappings.get(object_class)

        # If not found, try loading as native class
        if not actor_class:
            try:
                actor_class = unreal.load_class(None, object_class)
            except Exception:
                pass

        # If still not found, try finding by name
        if not actor_class:
            try:
                actor_class = unreal.find_class(object_class)
            except Exception:
                pass

        # If still not found, try loading as blueprint class last
        if not actor_class:
            try:
                actor_class = unreal.EditorAssetLibrary.load_blueprint_class(
                    object_class
                )
            except Exception:
                pass

        if not actor_class:
            return {"error": f"Could not find class: {object_class}"}

        spawn_location = unreal.Vector(
            x=location.get("x", 0.0) if location else 0.0,
            y=location.get("y", 0.0) if location else 0.0,
            z=location.get("z", 0.0) if location else 0.0,
        )

        spawn_rotation = unreal.Rotator(
            pitch=rotation.get("pitch", 0.0) if rotation else 0.0,
            yaw=rotation.get("yaw", 0.0) if rotation else 0.0,
            roll=rotation.get("roll", 0.0) if rotation else 0.0,
        )

        spawn_scale = unreal.Vector(
            x=scale.get("x", 1.0) if scale else 1.0,
            y=scale.get("y", 1.0) if scale else 1.0,
            z=scale.get("z", 1.0) if scale else 1.0,
        )

        actor = unreal.EditorLevelLibrary.spawn_actor_from_class(
            actor_class, spawn_location, spawn_rotation
        )

        if not actor:
            return {"error": "Failed to spawn actor"}

        if object_name:
            actor.set_actor_label(object_name)

        actor.set_actor_scale3d(spawn_scale)

        # Apply default mesh and material for StaticMeshActor if no properties provided
        if actor.get_class().get_name() == "StaticMeshActor" and not properties:
            mesh_component = actor.get_component_by_class(unreal.StaticMeshComponent)
            if mesh_component:
                name_lower = object_name.lower()
                mesh_path = "/Engine/BasicShapes/Cube"  # Default fallback

                if "sphere" in name_lower or "ball" in name_lower:
                    mesh_path = "/Engine/BasicShapes/Sphere"
                elif "cylinder" in name_lower:
                    mesh_path = "/Engine/BasicShapes/Cylinder"
                elif "cone" in name_lower:
                    mesh_path = "/Engine/BasicShapes/Cone"
                elif "plane" in name_lower:
                    mesh_path = "/Engine/BasicShapes/Plane"

                mesh = unreal.EditorAssetLibrary.load_asset(mesh_path)
                if mesh:
                    mesh_component.set_static_mesh(mesh)

                # Apply default material
                default_material = unreal.EditorAssetLibrary.load_asset(
                    "/Engine/BasicShapes/BasicShapeMaterial"
                )
                if default_material:
                    mesh_component.set_material(0, default_material)

        if properties:
            for prop_name, prop_value in properties.items():
                try:
                    if (
                        prop_name == "StaticMesh"
                        and actor.get_class().get_name() == "StaticMeshActor"
                    ):
                        static_mesh = unreal.EditorAssetLibrary.load_asset(prop_value)
                        if static_mesh:
                            mesh_component = actor.get_component_by_class(
                                unreal.StaticMeshComponent
                            )
                            if mesh_component:
                                mesh_component.set_static_mesh(static_mesh)
                    elif (
                        prop_name == "Material"
                        and actor.get_class().get_name() == "StaticMeshActor"
                    ):
                        material = unreal.EditorAssetLibrary.load_asset(prop_value)
                        if material:
                            mesh_component = actor.get_component_by_class(
                                unreal.StaticMeshComponent
                            )
                            if mesh_component:
                                mesh_component.set_material(0, material)
                    elif (
                        prop_name == "Materials"
                        and actor.get_class().get_name() == "StaticMeshActor"
                        and isinstance(prop_value, list)
                    ):
                        mesh_component = actor.get_component_by_class(
                            unreal.StaticMeshComponent
                        )
                        if mesh_component:
                            for i, material_path in enumerate(prop_value):
                                if material_path:
                                    material = unreal.EditorAssetLibrary.load_asset(
                                        material_path
                                    )
                                    if material:
                                        mesh_component.set_material(i, material)
                    elif hasattr(actor, prop_name):
                        setattr(actor, prop_name, prop_value)
                except Exception as e:
                    continue

        return {
            "success": True,
            "actor_name": actor.get_name(),
            "actor_label": actor.get_actor_label(),
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
        }

    except Exception as e:
        return {"error": f"Failed to create object: {str(e)}"}


def parse_value(value_str):
    import json as parse_json

    if value_str and value_str != "null" and value_str.strip():
        try:
            return parse_json.loads(value_str)
        except Exception:
            return None
    return None


def main():
    # These are template variables from the js side
    object_class = "${object_class}"
    object_name = "${object_name}"

    location_str = """${location}"""
    rotation_str = """${rotation}"""
    scale_str = """${scale}"""
    properties_str = """${properties}"""

    location = parse_value(location_str)
    rotation = parse_value(rotation_str)
    scale = parse_value(scale_str)
    properties = parse_value(properties_str)

    result = create_object(
        object_class=object_class,
        object_name=object_name,
        location=location,
        rotation=rotation,
        scale=scale,
        properties=properties,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
