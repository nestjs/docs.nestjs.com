import { createServer } from 'node:http';
import { app } from './app.mjs';

const host = process.env.MCP_HOST ?? '127.0.0.1';
const port = Number(process.env.MCP_PORT ?? 3000);

const httpServer = createServer(app);

httpServer.listen(port, host, () => {
  console.log(`NestJS docs MCP server listening on http://${host}:${port}/mcp`);
});

process.on('SIGINT', () => {
  httpServer.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0));
});
