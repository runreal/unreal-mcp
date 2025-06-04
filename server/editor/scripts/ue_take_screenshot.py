import unreal
import os
from pathlib import Path
import tempfile


def take_screenshot() -> str:
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
            screenshot_path = temp_file.name

            unreal.AutomationLibrary.take_high_res_screenshot(640, 520, screenshot_path)

            return screenshot_path

        return ""

    except Exception:
        return ""


def main():
    path = take_screenshot()
    if path:
        print(path)
    else:
        print("Failed to take screenshot")


if __name__ == "__main__":
    main()

