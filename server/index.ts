import process from "node:process";
import { z } from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  RemoteExecution,
  RemoteExecutionConfig,
} from "unreal-remote-execution";
import * as tools from "./tools.js";

const server = new McpServer({
  name: "UnrealMCP",
  version: "0.1.0",
});

const config = new RemoteExecutionConfig(1, ["239.0.0.1", 6766], "0.0.0.0");
const remoteExecution = new RemoteExecution(config);

// Start the remote execution server
remoteExecution.start();

let remoteNode: RemoteExecution | undefined = undefined;

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

// Add an addition tool
server.tool(
  "run_python",
  "Execute any python within the Unreal Editor. All python must have `import unreal` at the top",
  { code: z.string() },
  async ({ code }) => {
    const result = await tryRunCommand(code);

    return {
      content: [{ type: "text", text: result }],
    };
  },
);

server.tool("list_assets", "List all Unreal assets", {}, async () => {
  const result = await tryRunCommand(tools.UEListAssets());
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
  "export_asset",
  "Export an Unreal asset",
  { asset_path: z.string() },
  async ({ asset_path }) => {
    const result = await tryRunCommand(tools.UEExportAsset(asset_path));
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
  "get_asset_info",
  "Get information about an asset",
  { asset_path: z.string() },
  async ({ asset_path }) => {
    const result = await tryRunCommand(tools.UEGetAssetInfo(asset_path));
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
  "get_asset_references",
  "Get references for an asset",
  { asset_path: z.string() },
  async ({ asset_path }) => {
    const result = await tryRunCommand(tools.UEGetAssetReferences(asset_path));

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
  "console_command",
  "Run a console command in Unreal",
  { command: z.string() },
  async ({ command }) => {
    const result = await tryRunCommand(tools.UEConsoleCommand(command));
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
  "project_info",
  "Get detailed information about the current project",
  {},
  async () => {
    const result = await tryRunCommand(tools.UEGetProjectInfo());
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
  "get_map_info",
  "Get detailed information about the current map/level",
  {},
  async () => {
    const result = await tryRunCommand(tools.UEGetMapInfo());
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
  "search_assets",
  "Search for assets by name or path with optional class filter",
  {
    search_term: z.string(),
    asset_class: z.string().optional(),
  },
  async ({ search_term, asset_class }) => {
    const result = await tryRunCommand(
      tools.UESearchAssets(search_term, asset_class),
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
  "get_world_outliner",
  "Get all actors in the current world with their properties",
  {},
  async () => {
    const result = await tryRunCommand(tools.UEGetWorldOutliner());
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
  "validate_assets",
  "Validate assets in the project to check for errors",
  {
    asset_paths: z.string().optional(),
  },
  async ({ asset_paths }) => {
    const result = await tryRunCommand(tools.UEValidateAssets(asset_paths));
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

const transport = new StdioServerTransport();
await server.connect(transport);
