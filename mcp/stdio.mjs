import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createNestDocsMcpServer } from './nest-docs-server.mjs';

async function main() {
  const server = await createNestDocsMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('NestJS docs MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in stdio server:', error);
  process.exit(1);
});
