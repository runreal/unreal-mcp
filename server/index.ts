import process from "node:process";
import { z } from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  RemoteExecution,
  RemoteExecutionConfig,
} from "unreal-remote-execution";
import * as editorTools from "./editor/tools.js";

export const server = new McpServer({
  name: "UnrealMCP",
  description:
    "Unreal Engine mcp - use the documentation resource before using tools. Some tools run in the editor",
  version: "0.1.0",
});

const config = new RemoteExecutionConfig(1, ["239.0.0.1", 6766], "0.0.0.0");
const remoteExecution = new RemoteExecution(config);

// Start the remote execution server
remoteExecution.start();

let remoteNode: RemoteExecution | undefined = undefined;
let enginePath: string | undefined = undefined;
let projectPath: string | undefined = undefined;

remoteExecution.getFirstRemoteNode(1000, 5000).then(
  async (node) => {
    // Once a node is found, open a command connection
    // this will allow us to run commands on that node
    await remoteExecution.openCommandConnection(node);
    remoteNode = remoteExecution;

    // Execute a command
    const result = await remoteExecution.runCommand('print("rrmcp:init")');
    if (!result.success) {
      throw new Error(
        `Failed to run command: ${JSON.stringify(result.result)}`,
      );
    }

    // Close down the servers & connections once we are done
  },
  () => {
    console.log("No remote nodes found!");
    remoteExecution.stop();
    process.exit(1);
  },
);

const tryRunCommand = async (command: string): Promise<string> => {
  if (!remoteNode) {
    throw new Error("Remote node is not available");
  }

  const result = await remoteNode.runCommand(command);
  if (!result.success) {
    throw new Error(`Command failed with: ${result.result}`);
  }

  return result.output.map((line) => line.output).join("\n");
};

server.tool(
  "set_unreal_engine_path",
  "Set the Unreal Engine path",
  {
    path: z.string(),
  },
  async ({ path }) => {
    enginePath = path;

    return {
      content: [
        {
          type: "text",
          text: `Unreal Engine path set to ${path}`,
        },
      ],
    };
  },
);

server.tool(
  "set_unreal_project_path",
  "Set the Project path",
  {
    path: z.string(),
  },
  async ({ path }) => {
    projectPath = path;

    return {
      content: [
        {
          type: "text",
          text: `Project path set to ${path}`,
        },
      ],
    };
  },
);

server.tool(
  "get_unreal_engine_path",
  "Get the current Unreal Engine path",
  async () => {
    if (!enginePath) {
      throw new Error("Unreal Engine path is not set");
    }

    return {
      content: [
        {
          type: "text",
          text: `Unreal Engine path: ${enginePath}`,
        },
      ],
    };
  },
);

server.tool(
  "get_unreal_project_path",
  "Get the current Unreal Project path",
  async () => {
    if (!projectPath) {
      throw new Error("Unreal Project path is not set");
    }

    return {
      content: [
        {
          type: "text",
          text: `Unreal Project path: ${projectPath}`,
        },
      ],
    };
  },
);

/// Editor
server.tool(
  "editor_run_python",
  "Execute any python within the Unreal Editor. All python must have `import unreal` at the top. CHECK THE UNREAL PYTHON DOCUMENTATION BEFORE USING THIS TOOL.",
  { code: z.string() },
  async ({ code }) => {
    const result = await tryRunCommand(code);

    return {
      content: [{ type: "text", text: result }],
    };
  },
);

server.tool("editor_list_assets", "List all Unreal assets", async () => {
  const result = await tryRunCommand(editorTools.UEListAssets());
  return {
    content: [
      {
        type: "text",
        text: result,
      },
    ],
  };
});

server.tool(
  "editor_export_asset",
  "Export an Unreal asset to text",
  {
    asset_path: z.string(),
  },
  async ({ asset_path }) => {
    const result = await tryRunCommand(editorTools.UEExportAsset(asset_path));
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "editor_get_asset_info",
  "Get information about an asset",
  { asset_path: z.string() },
  async ({ asset_path }) => {
    const result = await tryRunCommand(editorTools.UEGetAssetInfo(asset_path));
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "editor_get_asset_references",
  "Get references for an asset",
  { asset_path: z.string() },
  async ({ asset_path }) => {
    const result = await tryRunCommand(
      editorTools.UEGetAssetReferences(asset_path),
    );

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "editor_console_command",
  "Run a console command in Unreal",
  { command: z.string() },
  async ({ command }) => {
    const result = await tryRunCommand(editorTools.UEConsoleCommand(command));
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "editor_project_info",
  "Get detailed information about the current project",
  {},
  async () => {
    const result = await tryRunCommand(editorTools.UEGetProjectInfo());
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "editor_get_map_info",
  "Get detailed information about the current map/level",
  {},
  async () => {
    const result = await tryRunCommand(editorTools.UEGetMapInfo());
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "editor_search_assets",
  "Search for assets by name or path with optional class filter",
  {
    search_term: z.string(),
    asset_class: z.string().optional(),
  },
  async ({ search_term, asset_class }) => {
    const result = await tryRunCommand(
      editorTools.UESearchAssets(search_term, asset_class),
    );
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "editor_get_world_outliner",
  "Get all actors in the current world with their properties",
  {},
  async () => {
    const result = await tryRunCommand(editorTools.UEGetWorldOutliner());
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "editor_validate_assets",
  "Validate assets in the project to check for errors",
  {
    asset_paths: z.string().optional(),
  },
  async ({ asset_paths }) => {
    const result = await tryRunCommand(
      editorTools.UEValidateAssets(asset_paths),
    );
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "editor_create_object",
  "Create a new object/actor in the world",
  {
    object_class: z
      .string()
      .describe(
        "Unreal class name (e.g., 'StaticMeshActor', 'DirectionalLight')",
      ),
    object_name: z.string().describe("Name/label for the created object"),
    location: z
      .object({
        x: z.number().default(0),
        y: z.number().default(0),
        z: z.number().default(0),
      })
      .optional()
      .describe("World position coordinates"),
    rotation: z
      .object({
        pitch: z.number().default(0),
        yaw: z.number().default(0),
        roll: z.number().default(0),
      })
      .optional()
      .describe("Rotation in degrees"),
    scale: z
      .object({
        x: z.number().default(1),
        y: z.number().default(1),
        z: z.number().default(1),
      })
      .optional()
      .describe("Scale multipliers"),
    properties: z
      .record(z.any())
      .optional()
      .describe("Additional actor properties"),
  },
  async ({
    object_class,
    object_name,
    location,
    rotation,
    scale,
    properties,
  }) => {
    const result = await tryRunCommand(
      editorTools.UECreateObject(
        object_class,
        object_name,
        location,
        rotation,
        scale,
        properties,
      ),
    );
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "editor_update_object",
  "Update an existing object/actor in the world",
  {
    actor_name: z.string().describe("Name or label of the actor to update"),
    location: z
      .object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      })
      .optional()
      .describe("New world position coordinates"),
    rotation: z
      .object({
        pitch: z.number(),
        yaw: z.number(),
        roll: z.number(),
      })
      .optional()
      .describe("New rotation in degrees"),
    scale: z
      .object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      })
      .optional()
      .describe("New scale multipliers"),
    properties: z
      .record(z.any())
      .optional()
      .describe("Additional actor properties to update"),
    new_name: z.string().optional().describe("New name/label for the actor"),
  },
  async ({ actor_name, location, rotation, scale, properties, new_name }) => {
    const result = await tryRunCommand(
      editorTools.UEUpdateObject(
        actor_name,
        location,
        rotation,
        scale,
        properties,
        new_name,
      ),
    );
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "editor_delete_object",
  "Delete an object/actor from the world",
  {
    actor_names: z.string(),
  },
  async ({ actor_names }) => {
    const result = await tryRunCommand(editorTools.UEDeleteObject(actor_names));
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.resource("docs", "docs://unreal_python", async () => {
  return {
    contents: [
      {
        uri: "https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/",
        text: "Unreal Engine Python API Documentation",
      },
    ],
  };
});
