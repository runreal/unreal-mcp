import unreal


def execute_console_command(command: str) -> None:
    unreal.SystemLibrary.execute_console_command(None, command)


def main():
    execute_console_command("${command}")


if __name__ == "__main__":
    main()
