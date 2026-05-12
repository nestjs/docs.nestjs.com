import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';

import {
  createDocsIndex,
  listMarkdownFiles,
  readDocFile,
  searchDocs,
} from './docs-index.mjs';
import { executeVfsCommand } from './vfs-executor.mjs';

const index = createDocsIndex();

let indexPromise = null;
function getIndex() {
  if (!indexPromise) {
    indexPromise = index.build().then(() => index);
  }
  return indexPromise;
}

function jsonText(value) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function text(value) {
  return {
    content: [
      {
        type: 'text',
        text: value,
      },
    ],
  };
}

async function createNestDocsMcpServer() {
  const server = new McpServer({
    name: 'nestjs-docs',
    version: '1.0.0',
  });

  const idx = await getIndex();

  server.registerResource(
    'nestjs-docs-index',
    'nestjs-docs://index',
    {
      title: 'NestJS Docs Index',
      description: 'List of available markdown files in the NestJS documentation.',
      mimeType: 'application/json',
    },
    async uri => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(await listMarkdownFiles(idx), null, 2),
        },
      ],
    }),
  );

  server.registerTool(
    'list_docs',
    {
      title: 'List NestJS Docs',
      description: 'List markdown documentation files available in this repository.',
      inputSchema: {},
    },
    async () => jsonText(await listMarkdownFiles(idx)),
  );

  server.registerTool(
    'search_docs',
    {
      title: 'Search NestJS Docs',
      description: 'Search NestJS documentation markdown files by text.',
      inputSchema: {
        query: z.string().min(1).describe('Text to search for.'),
        limit: z.number().int().min(1).max(25).optional().describe('Maximum number of matches.'),
      },
    },
    async ({ query, limit }) => jsonText(await searchDocs(idx, query, { limit })),
  );

  server.registerTool(
    'read_doc',
    {
      title: 'Read NestJS Doc',
      description: 'Read one NestJS documentation markdown file by path, for example content/controllers.md.',
      inputSchema: {
        path: z.string().min(1).describe('A content/**/*.md path returned by list_docs or search_docs.'),
      },
    },
    async ({ path }) => {
      try {
        const content = await readDocFile(idx, path);
        return text(content);
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error reading doc: ${error.message}` }],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    'query_docs_filesystem',
    {
      title: 'Query NestJS Docs Filesystem',
      description: 'Run read-only shell commands against the documentation filesystem (root is content/). Supported: ls, tree, find, stat, cat, head, tail, grep, rg, sed, awk, jq, cut, sort, uniq, wc.',
      inputSchema: {
        command: z.string().min(1).describe('The command to run (e.g., "ls -R", "grep -r NestJS .").'),
      },
    },
    async ({ command }) => {
      try {
        const output = await executeVfsCommand(command, idx.contentDir);
        return jsonText(output);
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    },
  );

  return server;
}

export { createNestDocsMcpServer };
