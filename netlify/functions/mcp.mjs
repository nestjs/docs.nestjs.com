import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

import { createNestDocsMcpServer } from '../../mcp/nest-docs-server.mjs';

function jsonRpcResponse(statusCode, message) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message,
      },
      id: null,
    }),
  };
}

function eventHeaders(event) {
  const headers = new Headers();

  for (const [name, value] of Object.entries(event.headers ?? {})) {
    if (value !== undefined && value !== null) {
      headers.set(name, value);
    }
  }

  for (const [name, values] of Object.entries(event.multiValueHeaders ?? {})) {
    if (Array.isArray(values) && values.length > 0) {
      headers.set(name, values.join(', '));
    }
  }

  return headers;
}

function eventUrl(event) {
  if (event.rawUrl) {
    return event.rawUrl;
  }

  const headers = eventHeaders(event);
  const host = headers.get('host') ?? 'localhost';
  const query = event.rawQuery ? `?${event.rawQuery}` : '';

  return `https://${host}${event.path ?? '/mcp'}${query}`;
}

function eventBody(event) {
  if (!event.body || event.httpMethod === 'GET' || event.httpMethod === 'HEAD') {
    return undefined;
  }

  return event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : event.body;
}

function responseHeaders(response) {
  return Object.fromEntries(response.headers.entries());
}

async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonRpcResponse(
      405,
      event.httpMethod === 'GET'
        ? 'Method not allowed. Use POST for Streamable HTTP MCP requests.'
        : 'Method not allowed.',
    );
  }

  const mcpServer = await createNestDocsMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await mcpServer.connect(transport);

    const request = new Request(eventUrl(event), {
      method: event.httpMethod,
      headers: eventHeaders(event),
      body: eventBody(event),
    });
    const response = await transport.handleRequest(request);

    return {
      statusCode: response.status,
      headers: responseHeaders(response),
      body: await response.text(),
      isBase64Encoded: false,
    };
  } catch (error) {
    console.error('Error handling MCP request:', error);

    return jsonRpcResponse(500, 'Internal server error');
  } finally {
    await transport.close();
    await mcpServer.close();
  }
}

export { handler };
