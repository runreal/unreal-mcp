import unreal
import json


def move_viewport_camera(location, rotation):
    try:
        location_vector = unreal.Vector(
            location["x"], location["y"], location["z"]
        )
        rotation_rotator = unreal.Rotator(
            rotation["roll"], rotation["pitch"], rotation["yaw"]
        )

        unreal.EditorLevelLibrary.set_level_viewport_camera_info(
            location_vector, rotation_rotator
        )

        return {
            "success": True,
            "location": {
                "x": location["x"],
                "y": location["y"],
                "z": location["z"],
            },
            "rotation": {
                "pitch": rotation["pitch"],
                "yaw": rotation["yaw"],
                "roll": rotation["roll"],
            },
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


location_data = ${location}
rotation_data = ${rotation}

if location_data and rotation_data:
    result = move_viewport_camera(location_data, rotation_data)
    print(json.dumps(result))
else:
    print(
        json.dumps(
            {"success": False, "error": "Location and rotation parameters are required"}
        )
    )

