import { readFile } from 'node:fs/promises';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { callTool, parseConfig, toolDefinitions } from './ops.js';

const config = parseConfig(JSON.parse(await readFile(process.env.OPS_SITES_FILE ?? 'sites.json', 'utf8')));
const server = new Server({ name: 'laravel-ops-mcp', version: '0.1.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: toolDefinitions }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const result = await callTool(config, request.params.name, request.params.arguments);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch {
    return { isError: true, content: [{ type: 'text', text: 'Request rejected or health unavailable. Check local configuration and environment.' }] };
  }
});
await server.connect(new StdioServerTransport());
