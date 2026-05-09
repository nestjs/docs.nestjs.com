import { describe, expect, it } from 'vitest';

import { handler } from '../netlify/functions/mcp.mjs';

function createMcpEvent({ headers = {}, body }) {
  return {
    rawUrl: 'https://nestjs-docs-mcp.netlify.app/mcp',
    rawQuery: '',
    path: '/mcp',
    httpMethod: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
      host: 'nestjs-docs-mcp.netlify.app',
      ...headers,
    },
    multiValueHeaders: {},
    body: body ?? JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: {
          name: 'vitest',
          version: '0.0.1',
        },
      },
    }),
    isBase64Encoded: false,
  };
}

describe('Netlify MCP function', () => {
  it('accepts streamable HTTP initialize requests with JSON and SSE accept types', async () => {
    const response = await handler(createMcpEvent({}), {});

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.body).toContain('"serverInfo"');
  });
});
