import fs from "node:fs"
import path from "node:path"

interface ToolInfo {
	name: string
	description: string
}

function extractToolsFromIndexFile(): ToolInfo[] {
	const indexPath = path.join(__dirname, "../index.js")
	const content = fs.readFileSync(indexPath, "utf-8")

	const toolRegex = /server\.tool\(\s*["']([^"']+)["'],\s*["']([^"']+)["']/g
	const matches = Array.from(content.matchAll(toolRegex))

	return matches.reduce<ToolInfo[]>((tools, match) => {
		const fullDescription = match[2]
		const shortDescription = fullDescription.split(". ")[0].split("\\n")[0].split("\n")[0]
		tools.push({
			name: match[1],
			description: shortDescription,
		})
		return tools
	}, [])
}

function generateToolsTable(tools: ToolInfo[]): string {
	const header = "| Tool | Description |\n|------|-------------|\n"
	const rows = tools.map((tool) => `| \`${tool.name}\` | ${tool.description} |`).join("\n")
	return header + rows
}

function updateReadmeWithTools() {
	const readmePath = path.join(__dirname, "../../README.md")
	const readmeContent = fs.readFileSync(readmePath, "utf-8")

	const tools = extractToolsFromIndexFile()
	const toolsTable = generateToolsTable(tools)
	const toolsSection = `## Available Tools

${toolsTable}

`

	const toolsSectionRegex = /## Available Tools[\s\S]*?(?=##|$)/
	const updatedContent = toolsSectionRegex.test(readmeContent)
		? readmeContent.replace(toolsSectionRegex, toolsSection)
		: insertToolsSection(readmeContent, toolsSection)

	fs.writeFileSync(readmePath, updatedContent)
	console.log(`Updated README.md with ${tools.length} tools`)
}

function insertToolsSection(content: string, toolsSection: string): string {
	const insertPoints = [
		{ marker: "## Contributing", found: content.indexOf("## Contributing") },
		{ marker: "### License MIT", found: content.indexOf("### License MIT") },
	]

	const insertPoint = insertPoints.find((point) => point.found !== -1)
	return insertPoint
		? content.slice(0, insertPoint.found) + toolsSection + content.slice(insertPoint.found)
		: content + "\n" + toolsSection
}

updateReadmeWithTools()
