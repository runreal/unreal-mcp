# unreal-mcp
> MCP server for Unreal Engine that uses Unreal Python Remote Execution

![hero](https://github.com/runreal/unreal-mcp/raw/refs/heads/main/hero.png)

![gif](https://github.com/runreal/unreal-mcp/raw/refs/heads/main/mcp.gif)

<p align="center">
  <a href="https://x.com/runreal_dev">Twitter</a>
  ·
  <a href="https://discord.gg/6ZhWVU5W47">Discord</a>
</p>

<div align="center">
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/LICENSE-MIT-GREEN?style=flat-square"></a>
</div>

## ⚡ Differences

This server does not require installing a new UE plugin as it uses the built-in Python remote execution protocol.

Adding new tools/features is much faster to develop since it does not require any C++ code.

It can support the full [Unreal Engine Python API](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api)


## ⚠️ Note

- This is not an official Unreal Engine project.
- Your AI agents or tools will have full access to your Editor.
- Review any changes your Client suggests before you approve them.

## 📦 Installation

#### 📋 Requirements
- 🔧 Unreal Engine 5.4+ (verified, may work with earlier versions)
- 🟢 Node.js with npx
- 🤖 MCP Client (Claude, Cursor, etc.)

1. Setting up your Editor:
   - Open your Unreal Engine project
   - Go to `Edit` -> `Plugins`
   - Search for "Python Editor Script Plugin" and enable it
   - Restart the editor if prompted
   - Go to `Edit` -> `Project Settings` 
   - Search for "Python" and enable the "Enable Remote Execution" option

  ![enable plugin](https://github.com/runreal/unreal-mcp/raw/refs/heads/main/img1.png)
  ![enable remote execution](https://github.com/runreal/unreal-mcp/raw/refs/heads/main/img2.png)

2. Set up your Client:
   - Edit your Claude (or Cursor) config
```json
{
  "mcpServers": {
    "unreal": {
      "command": "npx",
      "args": [
        "-y",
        "@runreal/unreal-mcp"
      ]
    }
  }
}
```

### 🔧 Troubleshooting

If you get an error similar to `MCP Unreal: Unexpected token 'C', Connection...` it means that the mcp-server was not able to connect to the Unreal Editor.

- Make sure that the Python Editor Script Plugin is enabled and that the Remote Execution option is checked in your project settings.
- Try also changing your bind address from `127.0.0.1` to `0.0.0.0` but note that this will allow connections from your local network.
- Restart your Unreal Editor fully.
- Fully close/open your client (Claude, Cursor, etc.) to ensure it reconnects to the MCP server. (`File -> Exit` on windows).
- Check your running processes and kill any zombie unreal-mcp Node.js processes.


## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `set_unreal_engine_path` | Set the Unreal Engine path |
| `set_unreal_project_path` | Set the Project path |
| `get_unreal_engine_path` | Get the current Unreal Engine path |
| `get_unreal_project_path` | Get the current Unreal Project path |
| `editor_run_python` | Execute any python within the Unreal Editor |
| `editor_list_assets` | List all Unreal assets |
| `editor_export_asset` | Export an Unreal asset to text |
| `editor_get_asset_info` | Get information about an asset, including LOD levels for StaticMesh and SkeletalMesh assets |
| `editor_get_asset_references` | Get references for an asset |
| `editor_console_command` | Run a console command in Unreal |
| `editor_project_info` | Get detailed information about the current project |
| `editor_get_map_info` | Get detailed information about the current map/level |
| `editor_search_assets` | Search for assets by name or path with optional class filter |
| `editor_get_world_outliner` | Get all actors in the current world with their properties |
| `editor_validate_assets` | Validate assets in the project to check for errors |
| `editor_create_object` | Create a new object/actor in the world |
| `editor_update_object` | Update an existing object/actor in the world |
| `editor_delete_object` | Delete an object/actor from the world |
| `editor_take_screenshot` | Take a screenshot of the Unreal Editor |
| `editor_move_camera` | Move the viewport camera to a specific location and rotation for positioning screenshots |

## 🤝 Contributing

Please feel free to open issues or pull requests. Contributions are welcome, especially new tools/commands.

<a href="https://glama.ai/mcp/servers/@runreal/unreal-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@runreal/unreal-mcp/badge" />
</a>

### License MIT
