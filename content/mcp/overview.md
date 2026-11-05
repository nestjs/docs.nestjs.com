### Model Context Protocol (MCP)

`@nestjs/mcp` turns a Nest application into a Model Context Protocol (MCP) server, whose tools, resources and prompts are methods of your providers.

The online store for cat food and supplies answers a lot of email: "where is my order?", "can I change the delivery address?", "is the salmon kibble back in stock?". The support team works in an AI assistant (Claude, ChatGPT, an agent in their help desk), and the assistant can only answer when it can see what the order API sees.

The [Model Context Protocol](https://modelcontextprotocol.io) (MCP) is how an assistant reaches an application. The application runs an **MCP server**, and exposes three kinds of things to the assistant, the **MCP client**:

- **Tools**, actions the model calls with arguments: look up an order, change its address.
- **Resources**, data the client reads by URI: the catalog, one order.
- **Prompts**, templates the user picks: "draft a reply about this order".

`@nestjs/mcp` turns methods of your providers into tools, resources and prompts with a decorator each. They run through the guards, interceptors, pipes and exception filters your routes use, and the server is served from the Nest application you already have: over Streamable HTTP for remote assistants, and over stdio for one that launches it as a local process.

In this tutorial, you'll give the store's order API an MCP server:

- [Tools](/mcp/primitives) to find an order and to change its delivery address, with schemas the model sees and the server validates.
- The catalog as a [resource](/mcp/primitives#resources), and each order as a resource template.
- A [prompt](/mcp/primitives#prompts) for drafting a reply.
- A [guard](/mcp/primitives#guards-interceptors-pipes-and-filters) that lets only the support team change orders, and an interceptor that logs each call.
- [OAuth 2.1](/mcp/primitives#authorization) on the HTTP endpoint, with the store's identity provider, and a scope for changing orders.
- The same server over [stdio](/mcp/transports#over-stdio), and [tests](/mcp/testing) that call it in memory.

#### Installation

Install the package, the MCP TypeScript SDK it builds on, and Zod, for the schemas:

```bash
$ npm i --save @nestjs/mcp @modelcontextprotocol/server zod
```

> info **Hint** The schemas can come from any [Standard Schema](https://standardschema.dev) library that produces JSON Schema: Zod 4.2 or later and ArkType as they are, Valibot through `toStandardJsonSchema()` from `@valibot/to-json-schema`, and a JSON Schema document you already have through `fromJsonSchema()` from `@modelcontextprotocol/server`. Zod 3 schemas are refused at startup: the SDK cannot turn them into JSON Schema.

#### Register the module

Import `McpModule` in the root module. `name` and `version` identify the server to clients; `instructions` tells the model how to use it:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { McpModule } from '@nestjs/mcp';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'cat-store',
      version: '1.0.0',
      instructions: 'Look orders up with find-order before changing them.',
    }),
    OrdersModule,
  ],
})
export class AppModule {}
```

The module looks for tools, resources and prompts on every provider of the application, at startup. `include: [OrdersModule]` limits the search to the modules you list.

Start the application as usual:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

The MCP endpoint is served at `http://localhost:3000/mcp`, next to the application's own routes. The same module can also be served over stdio, to an assistant that launches the application as a local process: see [Transports](/mcp/transports).

#### How a call is served

When the application starts, the module looks through its providers for methods decorated with `@Tool()`, `@Resource()`, `@ResourceTemplate()` and `@Prompt()`. It turns each schema into JSON Schema once, and fails at startup on what would otherwise only break later: two tools with one name, a tool name outside the MCP naming rules, a request-scoped provider, `scopes` without `auth`.

Each HTTP request to the endpoint is then served on its own. The module builds an MCP server for it from what it found at startup, the [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) speaks the protocol, and a call goes through these steps:

1. With `auth`, the access token is verified, and the call's scopes are checked.
2. The SDK validates the arguments against the schema. Arguments it refuses never reach your method: the model is told what's wrong, and can try again.
3. Your guards run, then your interceptors and pipes, as around a route handler.
4. The method runs, with the arguments and the call's context.
5. What it returns becomes the MCP result. What it throws goes through your exception filters, and becomes an error the client understands.

Nothing is kept between requests, so the server runs on as many instances as you like, behind any load balancer. Over stdio, one server serves the connection for as long as the process lives.

#### Async configuration

`forRootAsync()` takes the options from a factory, a `useClass` or a `useExisting` provider. `path`, `endpointVersion`, `decorators` and `imports` stay at the top level, because the module's routes are known when it is defined; a verifier from the factory is an instance:

```typescript
McpModule.forRootAsync({
  imports: [ConfigModule, AuthModule],
  inject: [ConfigService, IdentityProviderTokenVerifier],
  useFactory: (config: ConfigService, verifier: IdentityProviderTokenVerifier) => ({
    name: 'cat-store',
    version: config.get('VERSION'),
    auth: {
      verifier,
      resource: config.get('MCP_RESOURCE'),
      authorizationServers: [config.get('IDENTITY_PROVIDER_URL')],
    },
  }),
}),
```

#### Module options

| Option | Default | Description |
| --- | --- | --- |
| `name`, `version` | | Required. The server's identity, sent to clients |
| `title`, `description`, `websiteUrl`, `icons` | | More of it, for clients to show |
| `instructions` | | How the model should use the server |
| `include` | every module | The modules whose providers are searched for tools, resources and prompts |
| `path` | `'mcp'` | The HTTP endpoint's route. `false` for none. Top level of `forRootAsync()` |
| `endpointVersion` | | The endpoint's version, with versioning enabled. Top level of `forRootAsync()` |
| `decorators` | `[]` | Class decorators applied to the endpoint's controller. Top level of `forRootAsync()` |
| `imports` | `[]` | Modules whose exports a `verifier` class injects. Top level of `forRootAsync()` |
| `http.legacy` | `'stateless'` | `'reject'` serves the 2026-07-28 revision only |
| `http.responseMode` | `'auto'` | `'json'` or `'sse'` pin the response shape of 2026-07-28 requests |
| `http.allowedOrigins` | `localhost`, `127.0.0.1`, `[::1]` | The hostnames a request's `Origin` header may name; requests without one pass. A list replaces the default, `false` turns the check off |
| `http.allowedHosts` | not checked | The hostnames the `Host` header must name |
| `http.maxRequestBodySize` | 4 MiB | For bodies the platform did not parse |
| `auth.verifier` | | A class or an instance with `verifyAccessToken(token)` |
| `auth.resource` | | The server's canonical URL, and the audience of its tokens |
| `auth.authorizationServers` | | The issuers whose tokens are accepted |
| `auth.scopesSupported`, `auth.requiredScopes` | | Scopes advertised, and scopes every request needs |
| `auth.resourceName`, `auth.resourceDocumentation` | | More protected resource metadata |
| `stdio.legacy` | `'serve'` | `'reject'` refuses connections that open with the 2025 handshake |

#### Example

A working example is available [here](https://github.com/nestjs/mcp/tree/master/sample).
