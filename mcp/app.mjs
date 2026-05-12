import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createNestDocsMcpServer } from './nest-docs-server.mjs';

const app = express();
app.use(cors());

app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      console.log(`[MCP] ${req.method} ${req.url} -> ${res.statusCode}`);
    }
  });
  next();
});

// Fix for clients (like Antigravity) that might omit the Content-Type header on some POST requests
app.use((req, res, next) => {
  if (req.method === 'POST' && (!req.headers['content-type'] || req.headers['content-type'] === '')) {
    req.headers['content-type'] = 'application/json';
  }
  next();
});

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'nestjs-docs-mcp' });
});

/**
 * Session management
 * We store dedicated McpServer and Transport instances per session.
 */
const sessions = new Map();

/**
 * Helper to get or create a session for Streamable HTTP
 */
async function getStreamableSession(req) {
  const sessionId = req.headers['mcp-session-id'] || req.query.sessionId;
  
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    if (session.transport instanceof StreamableHTTPServerTransport) {
      return session;
    }
  }
  
  // If no session ID, it MUST be an initialize request (POST)
  if (req.method === 'POST' && req.body?.method === 'initialize') {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        console.log(`[MCP] StreamableHTTP session initialized: ${id}`);
        sessions.set(id, { server, transport });
      },
      onsessionclosed: (id) => {
        console.log(`[MCP] StreamableHTTP session closed: ${id}`);
        sessions.delete(id);
      }
    });
    
    transport.onerror = (error) => {
      console.error('[MCP Transport Error]:', error);
    };

    const server = await createNestDocsMcpServer();
    await server.connect(transport);
    
    return { server, transport };
  }
  
  return null;
}

/**
 * Main MCP endpoint (Streamable HTTP)
 */
app.all('/mcp', async (req, res) => {
  const accept = req.headers.accept || '';
  
  // Browser-friendly summary
  if (req.method === 'GET' && !accept.includes('text/event-stream') && accept.includes('text/html')) {
    return res.json({
      server: { name: 'NestJS Docs MCP', version: '1.0.0', transport: 'streamable-http' },
      endpoints: { mcp: '/mcp', sse: '/sse', messages: '/messages' }
    });
  }

  try {
    const session = await getStreamableSession(req);
    if (!session) {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: No valid session ID provided and not an initialize request' },
        id: req.body?.id || null
      });
    }
    
    await session.transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('[MCP] Error details:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: error.message },
        id: req.body?.id || null
      });
    }
  }
});

/**
 * Legacy SSE endpoint for older clients
 */
app.get('/sse', async (req, res) => {
  try {
    const transport = new SSEServerTransport('/messages', res);
    const server = await createNestDocsMcpServer();
    
    sessions.set(transport.sessionId, { server, transport });
    console.log(`[MCP] Legacy SSE session established: ${transport.sessionId}`);
    
    res.on('close', () => {
      console.log(`[MCP] Legacy SSE session closed: ${transport.sessionId}`);
      sessions.delete(transport.sessionId);
    });
    
    await server.connect(transport);
  } catch (error) {
    console.error('[MCP SSE] Error:', error);
    if (!res.headersSent) {
      res.status(500).send(error.message);
    }
  }
});

/**
 * Legacy message endpoint for older clients
 */
app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  const session = sessions.get(sessionId);
  
  if (session && session.transport instanceof SSEServerTransport) {
    try {
      await session.transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      console.error('[MCP Messages] Error:', error);
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: error.message }, id: req.body?.id || null });
    }
  } else {
    res.status(400).send('No active SSE session found for the provided sessionId');
  }
});

export { app };
