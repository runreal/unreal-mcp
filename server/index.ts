import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { z } from "zod"

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { RemoteExecution, RemoteExecutionConfig } from "unreal-remote-execution"
import * as editorTools from "./editor/tools.js"

export const server = new McpServer({
	name: "UnrealMCP",
	description: "Unreal Engine mcp - use the documentation resource before using tools. Some tools run in the editor",
	version: "0.1.0",
})

const config = new RemoteExecutionConfig(1, ["239.0.0.1", 6766], "0.0.0.0")
const remoteExecution = new RemoteExecution(config)

// Start the remote execution server
remoteExecution.start()

let remoteNode: RemoteExecution | undefined = undefined
let enginePath: string | undefined = undefined
let projectPath: string | undefined = undefined

const connectWithRetry = async (maxRetries: number = 3, retryDelay: number = 2000) => {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const node = await remoteExecution.getFirstRemoteNode(1000, 5000)

			// Once a node is found, open a command connection
			await remoteExecution.openCommandConnection(node)
			remoteNode = remoteExecution

			// Execute a command to verify connection
			const result = await remoteExecution.runCommand('print("rrmcp:init")')
			if (!result.success) {
				throw new Error(`Failed to run command: ${JSON.stringify(result.result)}`)
			}

			return
		} catch (error) {
			console.log(`Connection attempt ${attempt} failed:`, error)

			if (attempt < maxRetries) {
				console.log(`Retrying in ${retryDelay}ms...`)
				await new Promise((resolve) => setTimeout(resolve, retryDelay))
				// Exponential backoff
				retryDelay = Math.min(retryDelay * 1.5, 10000)
			} else {
				console.log("Unable to connect to your Unreal Engine Editor after multiple attempts")
				remoteExecution.stop()
				process.exit(1)
			}
		}
	}
}

connectWithRetry()

const tryRunCommand = async (command: string): Promise<string> => {
	if (!remoteNode) {
		throw new Error("Remote node is not available")
	}

	const result = await remoteNode.runCommand(command)
	if (!result.success) {
		throw new Error(`Command failed with: ${result.result}`)
	}

	return result.output.map((line) => line.output).join("\n")
}

server.tool(
	"set_unreal_engine_path",
	"Set the Unreal Engine path",
	{
		path: z.string(),
	},
	async ({ path }) => {
		enginePath = path

		return {
			content: [
				{
					type: "text",
					text: `Unreal Engine path set to ${path}`,
				},
			],
		}
	},
)

server.tool(
	"set_unreal_project_path",
	"Set the Project path",
	{
		path: z.string(),
	},
	async ({ path }) => {
		projectPath = path

		return {
			content: [
				{
					type: "text",
					text: `Project path set to ${path}`,
				},
			],
		}
	},
)

server.tool("get_unreal_engine_path", "Get the current Unreal Engine path", async () => {
	if (!enginePath) {
		throw new Error("Unreal Engine path is not set")
	}

	return {
		content: [
			{
				type: "text",
				text: `Unreal Engine path: ${enginePath}`,
			},
		],
	}
})

server.tool("get_unreal_project_path", "Get the current Unreal Project path", async () => {
	if (!projectPath) {
		throw new Error("Unreal Project path is not set")
	}

	return {
		content: [
			{
				type: "text",
				text: `Unreal Project path: ${projectPath}`,
			},
		],
	}
})

/// Editor
server.tool(
	"editor_run_python",
	"Execute any python within the Unreal Editor. All python must have `import unreal` at the top. CHECK THE UNREAL PYTHON DOCUMENTATION BEFORE USING THIS TOOL. NEVER EVER ADD COMMENTS",
	{ code: z.string() },
	async ({ code }) => {
		const result = await tryRunCommand(code)

		return {
			content: [{ type: "text", text: result }],
		}
	},
)

server.tool(
	"editor_list_assets",
	"List all Unreal assets\n\nExample output: [''/Game/Characters/Hero/BP_Hero'', ''/Game/Maps/TestMap'', ''/Game/Materials/M_Basic'']\n\nReturns a Python list of asset paths.",
	async () => {
		const result = await tryRunCommand(editorTools.UEListAssets())
		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.tool(
	"editor_export_asset",
	"Export an Unreal asset to text\n\nExample output: Binary data of the exported asset file\n\nReturns the raw binary content of the exported asset.",
	{
		asset_path: z.string(),
	},
	async ({ asset_path }) => {
		const result = await tryRunCommand(editorTools.UEExportAsset(asset_path))
		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.tool(
	"editor_get_asset_info",
	"Get information about an asset, including LOD levels for StaticMesh and SkeletalMesh assets\n\nExample output: [{'name': 'SM_Cube', 'is_valid': True, 'is_u_asset': True, 'is_asset_loaded': True, 'class': 'StaticMesh', 'path': '/Game/Meshes/SM_Cube', 'package': 'SM_Cube', 'package_path': '/Game/Meshes/SM_Cube', 'lod_levels': [{'lod_index': 0, 'num_vertices': 24, 'num_triangles': 12}, {'lod_index': 1, 'num_vertices': 16, 'num_triangles': 8}]}]\n\nReturns asset metadata with LOD information for mesh assets.",
	{ asset_path: z.string() },
	async ({ asset_path }) => {
		const result = await tryRunCommand(editorTools.UEGetAssetInfo(asset_path))
		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.tool(
	"editor_get_asset_references",
	"Get references for an asset\n\nExample output: [{'name': '/Game/Materials/M_Character.M_Character', 'class': 'Material'}, {'name': '/Game/Blueprints/BP_Player.BP_Player', 'class': 'Blueprint'}]\n\nReturns list of assets that reference the specified asset.",
	{ asset_path: z.string() },
	async ({ asset_path }) => {
		const result = await tryRunCommand(editorTools.UEGetAssetReferences(asset_path))

		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.tool(
	"editor_console_command",
	"Run a console command in Unreal\n\nExample output: (No output for most commands, executed silently)\n\nExecutes the console command without returning output.",
	{ command: z.string() },
	async ({ command }) => {
		const result = await tryRunCommand(editorTools.UEConsoleCommand(command))
		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.tool(
	"editor_project_info",
	"Get detailed information about the current project\n\nExample output: {'project_name': 'MyGame', 'project_directory': '/Users/dev/MyGame/', 'engine_version': '5.3.0', 'total_assets': 1250, 'asset_locations': {'Game': 800, 'Engine': 450}, 'enhanced_input_enabled': true, 'input_actions': ['/Game/Input/IA_Move'], 'game_modes': ['/Game/Core/GM_Main'], 'characters': ['/Game/Characters/B_Hero'], 'maps': ['/Game/Maps/L_TestMap']}\n\nReturns comprehensive project metadata and asset counts.",
	{},
	async () => {
		const result = await tryRunCommand(editorTools.UEGetProjectInfo())
		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.tool(
	"editor_get_map_info",
	"Get detailed information about the current map/level\n\nExample output: {'map_name': 'TestMap', 'map_path': '/Game/Maps/TestMap', 'total_actors': 45, 'actor_types': {'StaticMeshActor': 20, 'DirectionalLight': 1, 'PlayerStart': 1}, 'lighting': {'has_lightmass_importance_volume': false, 'directional_lights': 1, 'point_lights': 3, 'spot_lights': 0}, 'streaming_levels': 0, 'streaming_level_names': []}\n\nReturns current level information with actor counts and lighting details.",
	{},
	async () => {
		const result = await tryRunCommand(editorTools.UEGetMapInfo())
		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.tool(
	"editor_search_assets",
	"Search for assets by name or path with optional class filter\n\nExample output: {'search_term': 'character', 'asset_class_filter': 'Blueprint', 'total_matches': 3, 'assets': [{'name': 'BP_Character', 'path': '/Game/Characters', 'class': 'Blueprint', 'package_name': 'BP_Character'}, {'name': 'BP_EnemyCharacter', 'path': '/Game/Enemies', 'class': 'Blueprint', 'package_name': 'BP_EnemyCharacter'}]}\n\nReturns search results with asset details, limited to 50 results.",
	{
		search_term: z.string(),
		asset_class: z.string().optional(),
	},
	async ({ search_term, asset_class }) => {
		const result = await tryRunCommand(editorTools.UESearchAssets(search_term, asset_class))
		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.tool(
	"editor_get_world_outliner",
	"Get all actors in the current world with their properties\n\nExample output: {'world_name': 'TestMap', 'total_actors': 45, 'actors': [{'name': 'StaticMeshActor_0', 'class': 'StaticMeshActor', 'location': {'x': 0.0, 'y': 0.0, 'z': 0.0}, 'rotation': {'pitch': 0.0, 'yaw': 0.0, 'roll': 0.0}, 'scale': {'x': 1.0, 'y': 1.0, 'z': 1.0}, 'is_hidden': false, 'folder_path': '/Meshes', 'components': ['StaticMeshComponent', 'SceneComponent']}]}\n\nReturns complete world outliner with all actors and their transform data.",
	{},
	async () => {
		const result = await tryRunCommand(editorTools.UEGetWorldOutliner())
		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.tool(
	"editor_validate_assets",
	"Validate assets in the project to check for errors\n\nExample output: {'total_validated': 100, 'valid_assets': [{'path': '/Game/Meshes/SM_Cube', 'class': 'StaticMesh', 'size': '1024'}], 'invalid_assets': [{'path': '/Game/Missing/Asset', 'error': 'Asset does not exist'}], 'validation_summary': {'valid_count': 95, 'invalid_count': 5, 'success_rate': 95.0}}\n\nReturns validation results with asset status and error details.",
	{
		asset_paths: z.string().optional(),
	},
	async ({ asset_paths }) => {
		const result = await tryRunCommand(editorTools.UEValidateAssets(asset_paths))
		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.tool(
	"editor_create_object",
	"Create a new object/actor in the world\n\nExample output: {'success': true, 'actor_name': 'StaticMeshActor_1', 'actor_label': 'MyCube', 'class': 'StaticMeshActor', 'location': {'x': 100.0, 'y': 200.0, 'z': 0.0}, 'rotation': {'pitch': 0.0, 'yaw': 45.0, 'roll': 0.0}, 'scale': {'x': 1.0, 'y': 1.0, 'z': 1.0}}\n\nReturns created actor details with final transform values.",
	{
		object_class: z.string().describe("Unreal class name (e.g., 'StaticMeshActor', 'DirectionalLight')"),
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
			.describe(
				'Additional actor properties. For StaticMeshActor: use \'StaticMesh\' for mesh path, \'Material\' for single material path, or \'Materials\' for array of material paths. Example: {"StaticMesh": "/Game/Meshes/Cube", "Material": "/Game/Materials/M_Basic"}',
			),
	},
	async ({ object_class, object_name, location, rotation, scale, properties }) => {
		const result = await tryRunCommand(
			editorTools.UECreateObject(object_class, object_name, location, rotation, scale, properties),
		)
		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.tool(
	"editor_update_object",
	"Update an existing object/actor in the world\n\nExample output: {'success': true, 'actor_name': 'StaticMeshActor_1', 'actor_label': 'UpdatedCube', 'class': 'StaticMeshActor', 'location': {'x': 150.0, 'y': 200.0, 'z': 50.0}, 'rotation': {'pitch': 0.0, 'yaw': 90.0, 'roll': 0.0}, 'scale': {'x': 2.0, 'y': 2.0, 'z': 2.0}}\n\nReturns updated actor details with new transform values.",
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
			.describe(
				'Additional actor properties to update. For StaticMeshActor: use \'StaticMesh\' for mesh path, \'Material\' for single material path, or \'Materials\' for array of material paths. Example: {"StaticMesh": "/Game/Meshes/Cube", "Material": "/Game/Materials/M_Basic"}',
			),
		new_name: z.string().optional().describe("New name/label for the actor"),
	},
	async ({ actor_name, location, rotation, scale, properties, new_name }) => {
		const result = await tryRunCommand(
			editorTools.UEUpdateObject(actor_name, location, rotation, scale, properties, new_name),
		)
		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.tool(
	"editor_delete_object",
	"Delete an object/actor from the world\n\nExample output: {'success': true, 'message': 'Successfully deleted actor: MyCube', 'deleted_actor': {'actor_name': 'StaticMeshActor_1', 'actor_label': 'MyCube', 'class': 'StaticMeshActor', 'location': {'x': 100.0, 'y': 200.0, 'z': 0.0}}}\n\nReturns deletion confirmation with details of the deleted actor.",
	{
		actor_names: z.string(),
	},
	async ({ actor_names }) => {
		const result = await tryRunCommand(editorTools.UEDeleteObject(actor_names))
		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.tool(
	"editor_take_screenshot",
	"Take a screenshot of the Unreal Editor\n\nExample output: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...\n\nReturns a base64-encoded PNG image of the current editor view. IF THIS ERRORS OUT MAKE SURE THE UNREAL ENGINE WINDOW IS FOCUSED",
	{},
	async () => {
		const result = await tryRunCommand(editorTools.UETakeScreenshot())

		const filePath = result.trim()
		const fullPath = path.resolve(filePath)
		await new Promise((resolve) => setTimeout(resolve, 3000))
		if (fs.existsSync(fullPath)) {
			const base64Data = fs.readFileSync(fullPath, { encoding: "base64" })
			fs.unlinkSync(fullPath)
			if (base64Data) {
				return {
					content: [
						{
							type: "image",
							data: base64Data,
							mimeType: "image/png",
						},
					],
				}
			}
		}

		return {
			content: [
				{
					type: "text",
					text: result || "Failed to take screenshot. Is the Unreal Engine window focused?",
				},
			],
		}
	},
)

server.tool(
	"editor_move_camera",
	"Move the viewport camera to a specific location and rotation for positioning screenshots",
	{
		location: z
			.object({
				x: z.number(),
				y: z.number(),
				z: z.number(),
			})
			.describe("Camera world position coordinates"),
		rotation: z
			.object({
				pitch: z.number(),
				yaw: z.number(),
				roll: z.number(),
			})
			.describe("Camera rotation in degrees"),
	},
	async ({ location, rotation }) => {
		const result = await tryRunCommand(editorTools.UEMoveCamera(location, rotation))
		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
		}
	},
)

server.resource("docs", "docs://unreal_python", async () => {
	return {
		contents: [
			{
				uri: "https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/",
				text: "Unreal Engine Python API Documentation",
			},
		],
	}
})
