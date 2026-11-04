### Testing

Tools, resources and prompts are methods of providers, so their logic is tested like any provider's: call the method. What MCP adds around it, the schemas, guards, scopes and the shape of the results, is tested through a real MCP client, which `@nestjs/mcp/testing` connects to the application in memory.

#### Unit tests

A unit test calls the method with the arguments and the context it needs:

```typescript
@@filename(orders/orders.tools.spec)
import type { McpContext } from '@nestjs/mcp';
import { OrdersService } from './orders.service';
import { OrdersTools } from './orders.tools';

describe('OrdersTools', () => {
  it('changes the delivery address', async () => {
    const orders = {
      changeAddress: vi
        .fn()
        .mockResolvedValue({
          id: 'ord_123',
          address: '12 Whisker Lane, Leeds',
          status: 'pending',
        }),
    };
    const tools = new OrdersTools(orders as unknown as OrdersService);
    const ctx = { authInfo: { clientId: 'support-desk' } } as McpContext;

    const result = await tools.changeAddress(
      { orderId: 'ord_123', address: '12 Whisker Lane, Leeds' },
      ctx,
    );

    expect(result).toEqual({
      orderId: 'ord_123',
      address: '12 Whisker Lane, Leeds',
      status: 'pending',
    });
    expect(orders.changeAddress).toHaveBeenCalledWith(
      'ord_123',
      '12 Whisker Lane, Leeds',
      'support-desk',
    );
  });
});
```

A direct call skips everything the module adds: the arguments aren't validated, guards and interceptors don't run, and the return value isn't turned into an MCP result. The client tests those.

#### The in-memory client

`connectMcpClient()` connects a client of the official MCP SDK to the application, through the same handler as the HTTP endpoint: the token check, the schemas, and every guard, interceptor, pipe and filter. It starts no HTTP server. The client comes from `@modelcontextprotocol/client`, a dev dependency:

```bash
$ npm i --save-dev @modelcontextprotocol/client
```

The order API requires a token, so the tests replace its verifier with one that knows a few test tokens:

```typescript
@@filename(test/test-token.verifier)
import type { McpTokenVerifier } from '@nestjs/mcp';
import type { AuthInfo } from '@modelcontextprotocol/server';

const TOKENS: Record<
  string,
  { clientId: string; scopes: string[]; team?: string }
> = {
  'support-token': {
    clientId: 'support-desk',
    scopes: ['orders:read', 'orders:write'],
    team: 'support',
  },
  'warehouse-token': {
    clientId: 'warehouse',
    scopes: ['orders:read', 'orders:write'],
    team: 'warehouse',
  },
  'reader-token': { clientId: 'reporting', scopes: ['orders:read'] },
};

export class TestTokenVerifier implements McpTokenVerifier {
  async verifyAccessToken(token: string): Promise<AuthInfo | null> {
    const found = TOKENS[token];
    if (!found) {
      return null;
    }
    return {
      token,
      clientId: found.clientId,
      scopes: found.scopes,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      resource: new URL('https://api.catstore.example/mcp'),
      extra: { team: found.team },
    };
  }
}
```

Like a real token, a test token needs an `expiresAt` in the future and the server's `resource`. The tests override the verifier class, and connect with a token:

```typescript
@@filename(test/orders.e2e-spec)
import { Test, type TestingModule } from '@nestjs/testing';
import type { Client } from '@modelcontextprotocol/client';
import { connectMcpClient } from '@nestjs/mcp/testing';
import { AppModule } from '../src/app.module';
import { IdentityProviderTokenVerifier } from '../src/auth/identity-provider-token.verifier';
import { TestTokenVerifier } from './test-token.verifier';

describe('cat-store MCP server', () => {
  let moduleRef: TestingModule;
  let client: Client;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(IdentityProviderTokenVerifier)
      .useClass(TestTokenVerifier)
      .compile();
    client = await connectMcpClient(moduleRef, { token: 'support-token' });
  });

  afterAll(async () => {
    await client.close();
    await moduleRef.close();
  });

  it('lists the tools', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining(['find-order', 'change-address']),
    );
  });

  it('finds an order', async () => {
    const result = await client.callTool({
      name: 'find-order',
      arguments: { orderId: 'ord_123' },
    });
    expect(result.isError).toBeFalsy();
    expect(result.content).toEqual([
      { type: 'text', text: expect.stringContaining('ord_123') },
    ]);
  });
});
```

The client is the SDK's own `Client`: `listTools()`, `callTool()`, `readResource()`, `getPrompt()` and the rest are what an assistant calls.

#### Results and errors

What goes wrong in a tool is a result the model reads, not an exception in the test. `isError` and the text say what the model was told:

```typescript
@@filename(test/orders.e2e-spec)
it('tells the model about arguments the schema refuses', async () => {
  const result = await client.callTool({
    name: 'change-address',
    arguments: { orderId: 'ord_123', address: 'Leeds' },
  });
  expect(result.isError).toBe(true);
  expect(result.content).toEqual([
    { type: 'text', text: expect.stringContaining('Input validation error') },
  ]);
});

it('returns structured content, as the output schema describes it', async () => {
  const result = await client.callTool({
    name: 'change-address',
    arguments: { orderId: 'ord_123', address: '12 Whisker Lane, Leeds' },
  });
  expect(result.structuredContent).toEqual({
    orderId: 'ord_123',
    address: '12 Whisker Lane, Leeds',
    status: 'pending',
  });
});

it('answers a guard refusal with a tool error', async () => {
  const warehouse = await connectMcpClient(moduleRef, {
    token: 'warehouse-token',
  });
  try {
    const result = await warehouse.callTool({
      name: 'change-address',
      arguments: { orderId: 'ord_123', address: '12 Whisker Lane, Leeds' },
    });
    expect(result).toMatchObject({
      isError: true,
      content: [{ type: 'text', text: 'Forbidden resource' }],
    });
  } finally {
    await warehouse.close();
  }
});
```

Resources and prompts answer with JSON-RPC errors instead, which the client throws:

```typescript
@@filename(test/orders.e2e-spec)
it('reads an order', async () => {
  const { contents } = await client.readResource({ uri: 'orders://ord_123' });
  expect(JSON.parse((contents[0] as { text: string }).text)).toMatchObject({
    id: 'ord_123',
  });
});

it('knows no order that does not exist', async () => {
  await expect(
    client.readResource({ uri: 'orders://ord_404' }),
  ).rejects.toThrow();
});

it('drafts a reply', async () => {
  const { messages } = await client.getPrompt({
    name: 'draft-reply',
    arguments: { orderId: 'ord_123', tone: 'friendly' },
  });
  expect(messages[0].content).toMatchObject({
    type: 'text',
    text: expect.stringContaining('friendly'),
  });
});
```

#### Tokens and scopes

Connect a client for each token a test needs. A call without the scopes its tool declares fails before the method runs, with the error that tells a real client to ask the user for more access. A client without a token can't connect at all:

```typescript
@@filename(test/orders.e2e-spec)
import {
  InsufficientScopeError,
  SdkHttpError,
} from '@modelcontextprotocol/client';

it('asks for orders:write to change an address', async () => {
  const reader = await connectMcpClient(moduleRef, { token: 'reader-token' });
  try {
    const error = await reader
      .callTool({
        name: 'change-address',
        arguments: { orderId: 'ord_123', address: '12 Whisker Lane, Leeds' },
      })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(InsufficientScopeError);
    expect(error).toMatchObject({ requiredScope: 'orders:write' });
  } finally {
    await reader.close();
  }
});

it('refuses a client without a token', async () => {
  await expect(connectMcpClient(moduleRef)).rejects.toBeInstanceOf(
    SdkHttpError,
  );
});
```

#### Headers and protocol revisions

`headers` sends request headers with every request, which guards read from `ctx.request.headers`, in lowercase. `era: 'legacy'` connects as a client of the 2025 protocol revisions, to check that the server works for both:

```typescript
@@filename(test/orders.e2e-spec)
it('serves clients of the 2025 revisions', async () => {
  const legacy = await connectMcpClient(moduleRef, {
    token: 'support-token',
    era: 'legacy',
  });
  try {
    expect(legacy.getProtocolEra()).toBe('legacy');
    expect(
      (
        await legacy.callTool({
          name: 'find-order',
          arguments: { orderId: 'ord_123' },
        })
      ).isError,
    ).toBeFalsy();
  } finally {
    await legacy.close();
  }
});
```

> info **Hint** The in-memory client starts where the endpoint's route ends: middleware, and guards given in the module's `decorators`, don't run, and `ctx.request` is a plain `{{ '{' }} method, url, headers {{ '}' }}` object. Test what happens on the route over HTTP.

#### Every primitive at once

`McpRegistry` holds what the module found at startup. A test can hold every tool to rules of your own, such as a description the model can work with:

```typescript
@@filename(test/orders.e2e-spec)
import { McpRegistry } from '@nestjs/mcp';

it('describes every tool for the model', () => {
  for (const tool of moduleRef.get(McpRegistry).tools) {
    expect(
      tool.options.description?.length,
      `${tool.name} needs a description`,
    ).toBeGreaterThan(20);
  }
});
```

The registry is filled when the application initializes, which `connectMcpClient()` does; without it, call `moduleRef.init()` first.

#### Over HTTP

The route itself, the global prefix, middleware, CORS and the `Origin` check, is tested over a socket. Start the application on a free port, and send requests to it:

```typescript
@@filename(test/mcp-endpoint.e2e-spec)
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('MCP endpoint', () => {
  let app: INestApplication;
  let url: URL;

  const listTools = (headers: Record<string, string> = {}) =>
    fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        ...headers,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    url = new URL('/mcp', await app.getUrl());
  });

  afterAll(() => app.close());

  it('points a client without a token at the metadata', async () => {
    const response = await listTools();
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toContain(
      'resource_metadata=',
    );
  });

  it('refuses a page from another site', async () => {
    const response = await listTools({ origin: 'https://elsewhere.example' });
    expect(response.status).toBe(403);
  });
});
```

#### The stdio entry point

To test `stdio.ts` the way a client launches it, build the application, and start it with the SDK's stdio transport:

```typescript
@@filename(test/stdio.e2e-spec)
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

it('serves the tools over stdio', async () => {
  const client = new Client({ name: 'stdio-e2e', version: '1.0.0' });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: ['dist/stdio.js'],
    }),
  );
  try {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toContain('find-order');
  } finally {
    await client.close();
  }
});
```

Closing the client closes the process's stdin, and the application shuts down, as it does when the assistant quits.
