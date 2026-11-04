### Transports

The server is served over two transports: Streamable HTTP, from the Nest application you already have, for assistants that connect over the network, and stdio, from a standalone application context, for an assistant that launches the server as a local process. Both serve the same tools, resources and prompts.

#### The HTTP endpoint

The endpoint is a controller the module adds, at `path` (default `'mcp'`): the global prefix, versioning, middleware, CORS and HTTP guards apply to it as to any route, so with `app.setGlobalPrefix('api')` it's at `/api/mcp`, and `app.setGlobalPrefix('api', {{ '{' }} exclude: ['mcp'] {{ '}' }})` keeps it at `/mcp`. `endpointVersion` sets its version when versioning is on (`VERSION_NEUTRAL` keeps it at `/mcp` despite a `defaultVersion`), and `decorators` applies class decorators to it, such as `[Public()]` to exempt it from a global authentication guard, or `[UseGuards(ApiKeyGuard)]`.

A server that only your own agents call, rather than users through an assistant, can do without OAuth. A guard on the endpoint's route checks an API key instead, which clients that connect to remote servers let you send as a request header:

```typescript
@@filename(api-key.guard)
import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    return request.headers['x-api-key'] === process.env.MCP_API_KEY;
  }
}
```

```typescript
@@filename(app.module)
McpModule.forRoot({
  name: 'cat-store',
  version: '1.0.0',
  decorators: [UseGuards(ApiKeyGuard)],
}),
```

A request without the key gets 403 before any MCP message is read.

It serves every request statelessly: each request gets a server instance of its own, and nothing is kept between requests. Several instances of the application behind a load balancer need no session affinity and share nothing. Clients of the 2026-07-28 protocol revision and of the 2025 ones are served on the same endpoint; `http: {{ '{' }} legacy: 'reject' {{ '}' }}` makes it 2026-07-28 only.

A 2026-07-28 request is answered with a JSON body, or with a stream of server-sent events when the method sends something before its result, such as progress notifications. `http: {{ '{' }} responseMode: 'json' {{ '}' }}` never streams, and drops progress notifications; `'sse'` always streams.

A few settings matter in production:

- **Pages from other sites.** The endpoint checks the `Origin` header: a request from a web page on another site, made by a user's browser, gets 403. A request without an `Origin` header passes, so assistants, CLIs and hosted connectors, which aren't browsers and send none, are unaffected. By default, only pages on `localhost`, `127.0.0.1` and `[::1]` are let through. To serve a browser-based client, list its hostname, `http: {{ '{' }} allowedOrigins: ['support.catstore.example'] {{ '}' }}` (the list replaces the default), or turn the check off with `allowedOrigins: false`.
- **DNS rebinding.** A server bound to `localhost` can also be reached by a page whose own domain resolves to `127.0.0.1`: its requests name that domain as their `Host`. Name the hosts the server answers to, `http: {{ '{' }} allowedHosts: ['localhost', '127.0.0.1', '[::1]'] {{ '}' }}`, and requests with another `Host` header get 403. The `Host` header isn't checked unless you set `allowedHosts`.
- **Body size.** Tool arguments arrive in the request body, which your platform's body parser reads first: Express's default limit is 100 KB. Raise it with `app.useBodyParser('json', {{ '{' }} limit: '4mb' {{ '}' }})`.
- **CORS.** A browser-based client on another origin needs it listed in both places: in `allowedOrigins`, by hostname, and in your CORS configuration, which also allows the `Authorization`, `Content-Type`, `Mcp-Protocol-Version`, `Mcp-Method` and `Mcp-Name` request headers and exposes `WWW-Authenticate`: `app.enableCors({{ '{' }} origin: ['https://support.catstore.example'], exposedHeaders: ['WWW-Authenticate'] {{ '}' }})`.

For a support dashboard at `https://support.catstore.example` that calls the server from the browser, with larger tool arguments than Express allows by default:

```typescript
@@filename(app.module)
McpModule.forRoot({
  name: 'cat-store',
  version: '1.0.0',
  http: { allowedOrigins: ['support.catstore.example'] },
}),
```

```typescript
@@filename(main)
const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.useBodyParser('json', { limit: '4mb' });
app.enableCors({
  origin: ['https://support.catstore.example'],
  allowedHeaders: [
    'Authorization',
    'Content-Type',
    'Mcp-Protocol-Version',
    'Mcp-Method',
    'Mcp-Name',
  ],
  exposedHeaders: ['WWW-Authenticate'],
});
await app.listen(3000);
```

#### Over stdio

An assistant on the user's machine (Claude Desktop, Claude Code, an IDE) can launch the server as a local process, and talk to it over its stdin and stdout. Serve the same module from a standalone application context:

```typescript
@@filename(stdio)
import { NestFactory } from '@nestjs/core';
import { McpStdioLogger, McpStdioServer } from '@nestjs/mcp';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: new McpStdioLogger(),
  });
  await app.get(McpStdioServer).listen();
  await app.close();
}
bootstrap();
```

stdout carries the protocol, and Nest's default logger writes to it: `McpStdioLogger` writes every level to stderr, which clients show as the server's log. `listen()` resolves when the client closes stdin, and `app.close()` then lets the process exit. Over stdio, the spec takes credentials from the environment, not from OAuth, so `scopes` aren't checked there; guards still run. Set `path: false` in an application that serves stdio only.

The client starts the process from a command. Desktop assistants and IDEs take it in a configuration like this one, here with an environment variable for the server:

```json
{
  "mcpServers": {
    "cat-store": {
      "command": "node",
      "args": ["/path/to/cat-store/dist/stdio.js"],
      "env": { "CAT_STORE_API_KEY": "..." }
    }
  }
}
```

The process belongs to one user, on their machine, for as long as the client runs it. There is no OAuth there: what the server needs, such as an API key, comes from the environment the client passes, and your providers read it from `process.env`. Clients of both protocol eras are served; `stdio: {{ '{' }} legacy: 'reject' {{ '}' }}` refuses a connection that opens with the 2025 handshake.

One build can serve both transports: `main.ts` starts the HTTP application, and clients that launch the server run `stdio.ts`.

#### NestJS Observe

With [NestJS Observe](https://observe.nestjs.com) (`@nestjs/observe`) in the application, every MCP call names its operation, `tools/call find-order` or `resources/read orders://{{ '{' }}orderId{{ '}' }}`, instead of all of them being `POST /mcp`. There is nothing to configure.

#### Production checklist

- `auth` configured on a server reachable from the network, with `resource` its public URL.
- `allowedHosts` on a server bound to `localhost`.
- The browser-based clients that call the server, if any, in `allowedOrigins` and in your CORS origins: by default, only pages on localhost get through.
- The body parser's limit above your largest tool arguments.
- Tool descriptions and `.describe()` texts written for the model: they're all it knows about your tools.
- `annotations.readOnlyHint` on the tools that change nothing, so clients don't ask the user before each call.
- `McpStdioLogger` in the stdio entry point: anything else written to stdout breaks the protocol.
