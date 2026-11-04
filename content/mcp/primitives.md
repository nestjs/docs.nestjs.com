### Primitives

An MCP server exposes three primitives: **tools**, actions the model calls, **resources**, data the client reads, and **prompts**, templates the user picks. Each is a method of one of your providers, with a decorator, and runs through the same guards, interceptors, pipes and exception filters as your routes.

#### Tools

A tool is a method decorated with `@Tool()`. `inputSchema` describes its arguments: the SDK advertises it to the client as JSON Schema, and validates every call against it before the method runs. `.describe()` texts reach the model, which reads them to fill the arguments in:

```typescript
@@filename(orders/orders.tools)
import { Injectable, NotFoundException } from '@nestjs/common';
import { Tool, type McpContext } from '@nestjs/mcp';
import * as z from 'zod';
import { OrdersService } from './orders.service';

@Injectable()
export class OrdersTools {
  constructor(private readonly orders: OrdersService) {}

  @Tool({
    name: 'find-order',
    description:
      'Find an order by its id, or the latest orders of a customer by email',
    inputSchema: z.object({
      orderId: z.string().optional().describe('The order id, such as ord_123'),
      email: z.email().optional().describe("The customer's email address"),
    }),
    annotations: { readOnlyHint: true },
  })
  async find({ orderId, email }: { orderId?: string; email?: string }) {
    const orders = orderId
      ? [await this.orders.findById(orderId)]
      : await this.orders.latestFor(email!);
    if (orders.length === 0 || !orders[0]) {
      throw new NotFoundException('No such order');
    }
    return orders;
  }

  @Tool({
    name: 'change-address',
    description:
      'Change the delivery address of an order that has not shipped yet',
    inputSchema: z.object({ orderId: z.string(), address: z.string().min(10) }),
    outputSchema: z.object({
      orderId: z.string(),
      address: z.string(),
      status: z.string(),
    }),
  })
  async changeAddress(
    { orderId, address }: { orderId: string; address: string },
    ctx: McpContext,
  ) {
    const order = await this.orders.changeAddress(
      orderId,
      address,
      ctx.authInfo?.clientId,
    );
    return { orderId: order.id, address: order.address, status: order.status };
  }
}
```

Register the class as a provider, as any other:

```typescript
@@filename(orders/orders.module)
@Module({
  providers: [OrdersService, OrdersTools],
})
export class OrdersModule {}
```

The method is called with the validated arguments and the call's [context](/mcp/primitives#the-call-context). What it returns becomes the tool's result:

| The method returns | The client gets |
| --- | --- |
| A string | One text block |
| Another value, with an `outputSchema` | The value as `structuredContent` (validated against the schema), and as a JSON text block |
| Another value, without one | A JSON text block |
| A `CallToolResult` (`{{ '{' }} content, structuredContent?, isError? {{ '}' }}`) | It, as it is, for images, audio, embedded resources and links |
| `undefined` | An empty result |

The name defaults to the method's (`find`); tool names have 1 to 128 characters out of `A-Z a-z 0-9 _ - .`, and two tools with one name fail at startup. `annotations` are hints for the client, such as `readOnlyHint: true`, which lets it run the tool without asking the user first.

To return something other than text, such as a picture the model should look at, return a `CallToolResult` (from `@modelcontextprotocol/server`) yourself:

```typescript
@@filename(orders/orders.tools)
@Tool({
  name: 'product-photo',
  description:
    'Show the photo of a product, to compare it with what the customer describes',
  inputSchema: z.object({
    sku: z.string().describe('The product SKU, such as SKU-1042'),
  }),
  annotations: { readOnlyHint: true },
})
async photo({ sku }: { sku: string }): Promise<CallToolResult> {
  const photo = await this.catalog.photo(sku);
  return {
    content: [
      {
        type: 'image',
        data: photo.toString('base64'),
        mimeType: 'image/jpeg',
      },
    ],
  };
}
```

> info **Hint** The model picks a tool by its name and description, and fills the arguments in from their `.describe()` texts, so write them for the model: what the tool does and when to use it, what each argument means, with an example value. Say when a tool changes something.

#### Resources

A resource is data the client reads, and shows the user or hands the model. `@Resource()` serves a fixed URI, `@ResourceTemplate()` every URI that matches an [RFC 6570](https://datatracker.ietf.org/doc/html/rfc6570) template, whose variables the method receives:

```typescript
@@filename(orders/orders.tools)
@Resource({
  uri: 'catalog://products',
  description: 'Every product and its stock',
  mimeType: 'application/json',
})
catalog() {
  return this.catalog.all();
}

@ResourceTemplate({
  uriTemplate: 'orders://{orderId}',
  description: 'One order',
  mimeType: 'application/json',
})
async order({ orderId }: { orderId: string }) {
  const order = await this.orders.findById(orderId);
  if (!order) {
    throw new NotFoundException();
  }
  return order;
}
```

A string is sent as text of the `mimeType`, a `Uint8Array` or `Buffer` as a binary blob, a `ReadResourceResult` (`{{ '{' }} contents: [...] {{ '}' }}`) as it is, and anything else as JSON. A `NotFoundException` is answered with the spec's resource-not-found error.

Resources suit content the client loads into the conversation as it is: the catalog, an order, the return policy. Clients decide when to read them, often when the user attaches one. To let the model look something up, with arguments, give it a tool.

#### Prompts

A prompt is a message template the user picks in the client. Its arguments are a schema too, and the client asks the user for each one:

```typescript
@@filename(orders/orders.tools)
@Prompt({
  name: 'draft-reply',
  description: 'Draft a reply to a customer about an order',
  argsSchema: z.object({
    orderId: z.string().describe('The order the customer wrote about'),
    tone: z.enum(['formal', 'friendly']).describe('How the reply sounds'),
  }),
})
async draftReply({
  orderId,
  tone,
}: {
  orderId: string;
  tone: 'formal' | 'friendly';
}) {
  const order = await this.orders.findById(orderId);
  return `Draft a ${tone} reply to the customer of order ${orderId}. The order: ${JSON.stringify(order)}`;
}
```

A string is one user message; an array of messages, or a `GetPromptResult` (`{{ '{' }} messages: [...] {{ '}' }}`), is sent as it is.

A prompt can also open the conversation with more than one message. This one attaches the order as an embedded resource, then asks the question:

```typescript
@@filename(orders/orders.tools)
@Prompt({
  name: 'review-complaint',
  description: 'Review a complaint about an order',
  argsSchema: z.object({
    orderId: z.string().describe('The order the complaint is about'),
  }),
})
async reviewComplaint({
  orderId,
}: {
  orderId: string;
}): Promise<PromptMessage[]> {
  const order = await this.orders.findById(orderId);
  return [
    {
      role: 'user',
      content: {
        type: 'resource',
        resource: {
          uri: `orders://${orderId}`,
          mimeType: 'application/json',
          text: JSON.stringify(order),
        },
      },
    },
    {
      role: 'user',
      content: {
        type: 'text',
        text: 'Is the complaint about this order justified? Answer in two sentences.',
      },
    },
  ];
}
```

`PromptMessage` is a type from `@modelcontextprotocol/server`.

#### Try it

Start the application, and the endpoint is at `http://localhost:3000/mcp`. The [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) lists and calls everything the server exposes:

```bash
$ npx @modelcontextprotocol/inspector
```

Choose **Streamable HTTP**, enter the URL, and **Connect**. Assistants that connect to remote MCP servers take the same URL.

#### The call context

The second argument of every MCP method is an `McpContext`:

| Property | What it is |
| --- | --- |
| `kind`, `name`, `uri` | `'tool'`, `'resource'` or `'prompt'`; the tool's or prompt's name, or the resource's; the URI being read |
| `authInfo` | The verified access token, with [authorization](/mcp/primitives#authorization): `clientId`, `scopes`, `expiresAt`, `extra` |
| `request` | The HTTP platform's request (Express, Fastify, the Node adapter), with its headers and whatever middleware set on it; for the in-memory test client, a plain `{{ '{' }} method, url, headers {{ '}' }}` object; `undefined` over stdio |
| `requestInfo` | The web-standard `Request` the SDK served |
| `transport`, `era` | `'http'` or `'stdio'`; `'modern'` (protocol revision 2026-07-28) or `'legacy'` (the 2025 revisions) |
| `signal` | An `AbortSignal`, aborted when the client cancels the call or goes away: pass it on to `fetch()` and your database |
| `reportProgress(progress, total?, message?)` | Sends a progress notification, when the client asked for them |
| `server` | The SDK's own request context, for the rest (`mcpReq.envelope`, `mcpReq.inputResponses`) |

```typescript
@Tool({
  name: 'export-orders',
  description: 'Export a month of orders as CSV',
})
async export(_input: unknown, ctx: McpContext) {
  const pages = await this.orders.pages();
  for (let page = 0; page < pages; page++) {
    ctx.signal.throwIfAborted();
    await this.orders.exportPage(page, { signal: ctx.signal });
    await ctx.reportProgress(page + 1, pages);
  }
  return 'Exported';
}
```

**Asking the user.** A tool that needs the user's confirmation, or a missing value, returns `inputRequired()` from `@modelcontextprotocol/server`: the client asks the user, and calls the tool again with the answer, which `acceptedContent()` reads and validates:

```typescript
@Tool({
  name: 'cancel-order',
  description: 'Cancel an order',
  inputSchema: z.object({ orderId: z.string() }),
})
cancel({ orderId }: { orderId: string }, ctx: McpContext) {
  const Confirmation = z.object({ confirm: z.boolean() });
  const answer = acceptedContent(
    ctx.server.mcpReq.inputResponses,
    'confirm',
    Confirmation,
  );
  if (!answer) {
    return inputRequired({
      inputRequests: {
        confirm: inputRequired.elicit({
          message: `Cancel order ${orderId}?`,
          requestedSchema: Confirmation,
        }),
      },
    });
  }
  return answer.confirm ? this.orders.cancel(orderId) : 'Kept the order';
}
```

> warning **Warning** Over HTTP, this works with clients of the 2026-07-28 revision. A client of a 2025 revision is asked through a request from the server, which needs a session, and the endpoint keeps none: the call ends with a tool error. Over stdio, both work.

#### Guards, interceptors, pipes and filters

Every call runs through Nest's enhancers, bound on the class, on the method or globally, as for a route. The execution context's type is `'mcp'`, and `McpExecutionContext` reads the call, as `GqlExecutionContext` does for a GraphQL resolver. Only the support team may change an order:

```typescript
@@filename(orders/support-team.guard)
import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { McpExecutionContext } from '@nestjs/mcp';

@Injectable()
export class SupportTeamGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const mcp = McpExecutionContext.create(context);
    return mcp.getAuthInfo()?.extra?.team === 'support';
  }
}
```

```typescript
@@filename(orders/orders.tools)
@Tool({ name: 'change-address', ... })
@UseGuards(SupportTeamGuard)
async changeAddress(...) {}
```

`McpExecutionContext.create(context)` has `getInput()` (the arguments), `getContext()` (the `McpContext`), `getKind()`, `getName()`, `getRequest()` and `getAuthInfo()`. Interceptors see the method's return value before it becomes the result, and can time, log or transform it. Pipes see the input as the call's `body`, so a global `ValidationPipe({{ '{' }} transform: true {{ '}' }})` validates a DTO class you type the input with, as it does for a route. Custom parameter decorators made with `createParamDecorator()` work after the input and the context, as on GraphQL resolvers: `add(input, ctx, @CurrentUser() user)`.

Interceptors work the same way. This one logs how long each call takes, with its kind and name:

```typescript
@@filename(orders/call-logging.interceptor)
import {
  Injectable,
  Logger,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { McpExecutionContext } from '@nestjs/mcp';
import { tap, type Observable } from 'rxjs';

@Injectable()
export class CallLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('MCP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const mcp = McpExecutionContext.create(context);
    const started = performance.now();
    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(
            `${mcp.getKind()} ${mcp.getName()} took ${Math.round(performance.now() - started)} ms`,
          ),
        ),
      );
  }
}
```

`@UseInterceptors(CallLoggingInterceptor)` on the `OrdersTools` class logs every tool, resource and prompt of the class.

> warning **Warning** Global guards, interceptors and filters (`app.useGlobalGuards()`, `APP_GUARD`) run on MCP calls too, as they do on GraphQL resolvers, and on the HTTP request that carries them. An enhancer written for HTTP routes that reads `context.switchToHttp().getRequest()` should check `context.getType() === 'http'` first.

#### Errors

What a tool throws becomes a result with `isError: true`, which the model reads and can recover from: the message of an `HttpException` (a `BadRequestException('The address has no postcode')`), and `Internal server error` for any other error, which Nest's exception handler logs and whose message never reaches the client. Resources and prompts answer with JSON-RPC errors: a `NotFoundException` as resource-not-found, a `BadRequestException` as invalid params, another `HttpException` as an internal error carrying its message and status. An exception filter can answer instead: what it returns is the result, and a `ProtocolError` (from `@modelcontextprotocol/server`) it throws is the JSON-RPC error.

```typescript
@Catch(PaymentProviderError)
export class PaymentProviderFilter implements ExceptionFilter {
  catch(exception: PaymentProviderError, host: ArgumentsHost) {
    if (host.getType<McpContextType>() !== 'mcp') {
      throw exception;
    }
    return {
      content: [
        {
          type: 'text',
          text: 'Payments are down; try again in a few minutes.',
        },
      ],
      isError: true,
    };
  }
}
```

#### Authorization

The order API's MCP server answers questions about customers, so it requires a signed-in user. In MCP, the server is an OAuth 2.1 **resource server**: the client gets an access token from the store's identity provider (Auth0, Keycloak, Entra ID, WorkOS, your own), and sends it with every request. The server verifies it, and never issues tokens. Configure `auth`:

```typescript
@@filename(app.module)
McpModule.forRoot({
  name: 'cat-store',
  version: '1.0.0',
  auth: {
    verifier: IdentityProviderTokenVerifier,
    resource: 'https://api.catstore.example/mcp',
    authorizationServers: ['https://auth.catstore.example'],
    scopesSupported: ['orders:read'],
  },
}),
```

- `resource` is the canonical URL of the MCP server. Clients ask the identity provider for a token for it, and the server accepts only tokens issued for it (their audience), as the spec requires.
- `authorizationServers` are the issuers whose tokens it accepts. The module serves them, with `scopesSupported`, as the [protected resource metadata](https://datatracker.ietf.org/doc/html/rfc9728) (RFC 9728) at `/.well-known/oauth-protected-resource/mcp`, where clients discover how to sign in.
- A request without a valid token gets 401 with a `WWW-Authenticate: Bearer` challenge that points at the metadata. That challenge is what starts the client's sign-in.

The **verifier** decides which tokens are valid. It's a class of yours with `verifyAccessToken(token)`, which returns the token's `AuthInfo`, or `null` to refuse it. Nest instantiates it, so it injects what it needs. For JWT access tokens, `JwtVerifier` from `@nestjs/authentication` checks the signature against the identity provider's keys, the issuer, the audience and the expiry:

```typescript
@@filename(auth/identity-provider-token.verifier)
import { Injectable } from '@nestjs/common';
import { JwtVerifier } from '@nestjs/authentication';
import type { McpTokenVerifier } from '@nestjs/mcp';
import type { AuthInfo } from '@modelcontextprotocol/server';

const RESOURCE = 'https://api.catstore.example/mcp';

@Injectable()
export class IdentityProviderTokenVerifier implements McpTokenVerifier {
  private readonly jwt = new JwtVerifier({
    jwks: 'https://auth.catstore.example/.well-known/jwks.json',
    issuer: 'https://auth.catstore.example',
    audience: RESOURCE,
    type: 'at+jwt',
  });

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    // A bad signature, an expired token or another audience throws a JwtError: answered with 401.
    const claims = await this.jwt.verify(token);
    return {
      token,
      clientId: String(claims.client_id ?? claims.sub),
      scopes: typeof claims.scope === 'string' ? claims.scope.split(' ') : [],
      expiresAt: claims.exp,
      resource: new URL(RESOURCE),
      extra: { team: claims.team },
    };
  }
}
```

An error with `status: 401` (`JwtError`, `UnauthorizedException`) refuses the token; any other error (the keys could not be fetched) is answered with 500. Opaque tokens go through your identity provider's introspection endpoint instead, behind the same method.

For opaque tokens, the verifier asks the identity provider's introspection endpoint ([RFC 7662](https://datatracker.ietf.org/doc/html/rfc7662)) instead:

```typescript
@@filename(auth/introspection-token.verifier)
import { Injectable } from '@nestjs/common';
import type { McpTokenVerifier } from '@nestjs/mcp';
import type { AuthInfo } from '@modelcontextprotocol/server';

const RESOURCE = 'https://api.catstore.example/mcp';

@Injectable()
export class IntrospectionTokenVerifier implements McpTokenVerifier {
  async verifyAccessToken(token: string): Promise<AuthInfo | null> {
    const credentials = btoa(
      `${process.env.INTROSPECTION_CLIENT_ID}:${process.env.INTROSPECTION_CLIENT_SECRET}`,
    );
    const response = await fetch(
      'https://auth.catstore.example/oauth/introspect',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({ token }),
      },
    );
    if (!response.ok) {
      // No verdict on the token: answered with 500.
      throw new Error(`Token introspection failed with ${response.status}`);
    }
    const claims = (await response.json()) as {
      active: boolean;
      aud?: string | string[];
      client_id: string;
      scope?: string;
      exp: number;
    };
    if (!claims.active || ![claims.aud].flat().includes(RESOURCE)) {
      return null; // Answered with 401.
    }
    return {
      token,
      clientId: claims.client_id,
      scopes: claims.scope ? claims.scope.split(' ') : [],
      expiresAt: claims.exp,
      resource: new URL(RESOURCE),
    };
  }
}
```

Whichever verifier you write, the module checks two things in what it returns: `resource` must be the `auth.resource` URL, and `expiresAt` must be set and in the future. A token that fails either is refused with 401.

**Scopes.** `scopes` on a tool, a resource or a prompt names what the token must carry for it. A call without them is answered, before the method runs, with 403 and the missing scopes in the challenge, and the client asks the user to grant them (step-up authorization). `requiredScopes` in `auth` requires scopes on every request:

```typescript
@Tool({ name: 'change-address', ..., scopes: ['orders:write'] })
```

Declaring `scopes` without `auth` fails at startup, because nothing would check them. The token is `ctx.authInfo` in methods, and `McpExecutionContext.create(context).getAuthInfo()` in guards, for decisions scopes don't express.

**With `@nestjs/authentication` and `@nestjs/authorization`.** Their global guards run on every MCP call. The authentication guard authenticates the call with your providers, from the HTTP request it arrived in: a `JwtBearerProvider` that accepts the identity provider's tokens accepts the MCP client's. `@CurrentUser()` and `AuthenticationContext` then work in tools, and `@Can()` policies decide each call:

```typescript
@@filename(orders/orders.tools)
@Tool({
  name: 'refund',
  description: 'Refund an order',
  inputSchema: z.object({ orderId: z.string() }),
})
@Can(OrderPolicy, 'refund')
refund(
  { orderId }: { orderId: string },
  ctx: McpContext,
  @CurrentUser() agent: Agent,
) {
  return this.orders.refund(orderId, agent);
}
```

Exempt the endpoint's route from the authentication guard with `decorators: [Public()]`, and let `auth` answer its unauthenticated requests: the guard's own challenge doesn't point MCP clients at the metadata. A refusal on a call is a tool error, `Unauthorized` or `Forbidden`, and a tool that declares no `@Can()` is denied, as a route is. Over stdio there is no request, so a call is anonymous unless a provider of your own authenticates it from the environment.

> info **Hint** This needs `@nestjs/authentication` 0.1.3 and `@nestjs/authorization` 0.1.1 or later, the first versions that know MCP calls (context type `'mcp'`). With earlier ones, the global guard finds no credentials on a call: mark the providers of your tools `@Public()`.

#### Decorators

| Decorator | Options | The method is called with |
| --- | --- | --- |
| `@Tool()` | `name`, `title`, `description`, `inputSchema`, `outputSchema`, `annotations`, `icons`, `_meta`, `scopes` | The validated arguments, the context |
| `@Resource()` | `uri`, `name`, `title`, `description`, `mimeType`, `size`, `annotations`, `icons`, `_meta`, `cacheHint`, `scopes` | `{{ '{' }}{{ '}' }}`, the context (`ctx.uri`) |
| `@ResourceTemplate()` | `uriTemplate`, and the same | The template's variables, the context |
| `@Prompt()` | `name`, `title`, `description`, `argsSchema`, `icons`, `_meta`, `scopes` | The validated arguments, the context |
