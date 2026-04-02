#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerActions } from './actions/registry.js';
import { queryActions } from './actions/queries.js';
import { mutationActions } from './actions/mutations.js';
import { useBufferApiSchema, handleUseBufferApi } from './tools/use-buffer-api.js';
import { bufferApiHelpSchema, handleBufferApiHelp } from './tools/buffer-api-help.js';

if (!process.env.BUFFER_ACCESS_TOKEN) {
    console.error('BUFFER_ACCESS_TOKEN environment variable is required');
    process.exit(1);
}

registerActions(queryActions);
registerActions(mutationActions);

const server = new McpServer({
    name: 'buffer-mcp',
    version: '0.1.0',
});

server.tool(
    'use_buffer_api',
    'Execute a Buffer API action (list organizations, channels, posts, create/delete posts, create ideas, and more)',
    useBufferApiSchema.shape,
    async ({ action, payload }) => {
        const result = await handleUseBufferApi({ action, payload });
        return { content: [{ type: 'text' as const, text: result }] };
    },
);

server.tool(
    'buffer_api_help',
    'Get help on available Buffer API actions — list all actions or get detailed schema info for a specific action',
    bufferApiHelpSchema.shape,
    async ({ action, category }) => {
        const result = handleBufferApiHelp({ action, category });
        return { content: [{ type: 'text' as const, text: result }] };
    },
);

async function main(): Promise<void> {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
