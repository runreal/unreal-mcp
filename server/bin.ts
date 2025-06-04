#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { server } from "./"

const transport = new StdioServerTransport()
server.connect(transport)
