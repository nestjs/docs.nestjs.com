### Tools

An agent function is a method of one of your providers that the model may call, with arguments it fills in, to look something up or to change something: the model reads what the method returns, then calls more functions or answers. You write an agent function; the model is offered it as a tool.

The store's assistant answers questions about orders, so its model must look orders up. In `@nestjs/ai`, the method that does it is decorated with `@AgentFunction()`, and it runs through the guards, interceptors, pipes and exception filters of its class and method, as the user the model acts for. It needs nothing beyond `@nestjs/ai`.

#### Define an agent function

`inputSchema` describes the function's arguments: the model is sent its JSON Schema, and every call is validated against it before the method runs. The model picks a function by its name and description, and fills the arguments in from their `.describe()` texts:

```typescript
@@filename(orders/orders.tools)
import { Injectable, NotFoundException } from '@nestjs/common';
import { AgentFunction } from '@nestjs/ai';
import * as z from 'zod';
import { OrdersService } from './orders.service';

@Injectable()
export class OrdersTools {
  constructor(private readonly orders: OrdersService) {}

  @AgentFunction({
    name: 'find-order',
    description: 'Find an order by its id, with its status',
    inputSchema: z.object({
      orderId: z.string().describe('The order id, such as ord_123'),
    }),
  })
  async find({ orderId }: { orderId: string }) {
    const order = await this.orders.findById(orderId);
    if (!order) {
      throw new NotFoundException(`There is no order ${orderId}`);
    }
    return { id: order.id, status: order.status, total: order.total };
  }
}
```

`@AgentFunction()` takes four options, all of them optional:

- **`name`**: what calls list the function by, and what the model calls it by. It defaults to the method's name, and must be 1 to 64 characters out of `A-Z a-z 0-9 _ -`, which is what model providers accept as a tool name.
- **`description`**: what the function does, for the model.
- **`inputSchema`**: its arguments, as an object schema. Without one, the function takes none.
- **`scopes`**: the scopes the caller must hold: see [Who the agent acts for](/ai/tools#who-the-agent-acts-for).

Register the class as a provider, as any other:

```typescript
@@filename(orders/orders.module)
@Module({
  providers: [OrdersService, OrdersTools],
  exports: [OrdersService],
})
export class OrdersModule {}
```

`AiModule` finds the agent functions of every module of the application; its own `include` option limits the search to the modules it lists.

#### Give a call its tools

A call lists, in `tools`, the agent functions its model may use, by name or by provider class (every agent function of the class), and says who it acts for with `caller`:

```typescript
@@filename(assistant/assistant.controller)
import { Body, Controller, Post, Req } from '@nestjs/common';
import { AiService } from '@nestjs/ai';
import type { Request } from 'express';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly ai: AiService) {}

  @Post('questions')
  async ask(@Body() body: { question: string }, @Req() request: Request) {
    const { text } = await this.ai.generateText({
      instructions:
        'You help customers of the cat store with their orders. ' +
        'Look an order up before you answer about it.',
      prompt: body.question,
      tools: ['find-order'],
      caller: { request },
    });
    return { answer: text };
  }
}
```

The model is offered the functions the call lists, as tools, and no other. When it calls one, the arguments are validated against the function's schema, the method runs, and what it returns is sent back to the model, which calls more functions or answers. Each of the model's answers is one model call, and `maxSteps`, 10 by default, caps how many a call makes: see [The agent loop](/ai/agents#the-agent-loop). Arguments the schema refuses never reach the method, nor its guards: the model is told what's wrong, and can try again.

Mistakes fail early:

- A call that lists an agent function that doesn't exist, or a class without any, is refused before anything is sent: `There is no agent function named "find-orders". Agent functions: find-order, change-address.`
- A name model providers refuse fails at startup, naming the method. So do two agent functions with one name, and an agent function on a request-scoped provider: pass what a call needs through `caller` instead.
- So does a schema that isn't a Standard Schema with JSON Schema, or doesn't describe an object.

The model reads what the method returns as JSON: a `Date` as its ISO string, and `undefined` as `null`. A method that also serves MCP clients may return an MCP `CallToolResult`: the model reads its `structuredContent`, or else its text blocks, joined. Images, audio and other blocks don't reach the model, and a warning in the log says so. A result with `isError: true` is a tool error, with its text.

#### The call context

An agent function is called with its arguments and an `AgentFunctionContext`, from `@nestjs/ai`:

| Property | What it is |
| --- | --- |
| `name` | The agent function's name |
| `request` | The HTTP request the call runs in, `caller.request`, with its headers and the `user` your authentication set on it |
| `user`, `scopes` | `caller.user` and `caller.scopes`: who the call acts for where there is no request, as in a queue job |
| `toolCallId` | The model's id for this tool call, to tie the function's logs to the conversation |
| `idempotencyKey` | In a [durable run](/ai/agents#durable-agent-runs), the same for every attempt of this call; `undefined` elsewhere |
| `messages` | The conversation the model had read when it called the function, without the system prompt |
| `signal` | An `AbortSignal`, aborted when the call is: pass it on to `fetch()` and your database |
| `reportProgress(progress, total?, message?)` | In a [streamed answer](/ai/agents#streaming-to-the-browser), sends the browser the call's progress; elsewhere, does nothing |

`change-address` lets the assistant change the delivery address of an order. It passes the call's `signal` on to the database, and a guard checks that the order is the customer's:

```typescript
@@filename(assistant/assistant.tools)
import { Injectable, UseGuards } from '@nestjs/common';
import { AgentFunction, type AgentFunctionContext } from '@nestjs/ai';
import * as z from 'zod';
import { OrdersService } from '../orders/orders.service';
import { OrderOwnerGuard } from './order-owner.guard';

@Injectable()
export class AssistantTools {
  constructor(private readonly orders: OrdersService) {}

  @AgentFunction({
    name: 'change-address',
    description:
      'Change the delivery address of an order that has not shipped yet',
    inputSchema: z.object({
      orderId: z.string().describe('The order id, such as ord_123'),
      address: z.string().min(10).describe('The full new address'),
    }),
  })
  @UseGuards(OrderOwnerGuard)
  async changeAddress(
    { orderId, address }: { orderId: string; address: string },
    ctx: AgentFunctionContext,
  ) {
    const order = await this.orders.changeAddress(orderId, address, {
      signal: ctx.signal,
    });
    return { id: order.id, address: order.address };
  }
}
```

#### Who the agent acts for

`caller` says who a call acts for, and the agent functions, their guards and the authentication packages read it from the context:

- **`request`**: in a route, the HTTP request of Express, Fastify or the Node adapter, as `@Req()` injects it. The functions see it as `ctx.request`, with the `user` your authentication set on it, as a route's guards do.
- **`user`** and **`scopes`**: where there is no request, as in a queue job or a scheduled task, who the call acts for and what they may do. They are `ctx.user` and `ctx.scopes`.

An agent function whose `@AgentFunction()` declares `scopes` runs only for a caller that holds them in `caller.scopes`: otherwise, the call is refused before any guard runs, and the model reads `Forbidden: this tool needs the scope(s) orders:refund`. A nightly job reviews the refund requests nobody answered, as the store's refund bot:

```typescript
@@filename(refunds/refund-review.service)
import { Injectable } from '@nestjs/common';
import { AiService } from '@nestjs/ai';

@Injectable()
export class RefundReviewService {
  constructor(private readonly ai: AiService) {}

  review(ticket: { body: string }) {
    return this.ai.generateText({
      label: 'refund-review',
      instructions:
        'Decide whether the refund request is justified, and refund the ' +
        'order if it is.',
      prompt: ticket.body,
      tools: ['find-order', 'refund'],
      caller: {
        user: { id: 'refund-bot', team: 'support' },
        scopes: ['orders:refund'],
      },
    });
  }
}
```

Nothing a caller lacks is made up: a call without `caller` runs its agent functions with no request, no user and no scopes.

#### Guards, interceptors, pipes and filters

Every agent function call runs through Nest's enhancers, bound on the class, on the method or globally, as for a route. Its execution context's type is `'ai'`, and `AiExecutionContext` reads the call. A customer may change their own orders only:

```typescript
@@filename(assistant/order-owner.guard)
import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { AiExecutionContext, type AiContextType } from '@nestjs/ai';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class OrderOwnerGuard implements CanActivate {
  constructor(private readonly orders: OrdersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType<AiContextType>() !== 'ai') {
      return false;
    }
    const call = AiExecutionContext.create(context);
    const { orderId } = call.getInput<{ orderId: string }>();
    const order = await this.orders.findById(orderId);
    return order?.customerId === call.getRequest()?.user?.id;
  }
}
```

`AiExecutionContext.create(context)` has `getType()`, `getInput()` (the arguments, also `switchToRpc().getData()`), `getContext()` (the `AgentFunctionContext`), `getName()` and `getRequest()`. An agent function call goes through these, in order:

1. The arguments are validated against the function's schema.
2. The function's `scopes` are checked against the caller's.
3. The guards run, global ones first, then the interceptors and the pipes, as around a route handler.
4. The method runs, with the arguments and the context.

Pipes see the arguments as the call's `body`, so a `ValidationPipe` validates a DTO class you type them with, after the function's schema has, and they see the context as a `custom` parameter, which `ValidationPipe` skips. Custom parameter decorators made with `createParamDecorator()` work after the arguments and the context: `changeAddress(input, ctx, @CurrentUser() user)`.

Interceptors see the method's return value before the model does. This one logs each call, with the id of the model's tool call:

```typescript
@@filename(common/tool-audit.interceptor)
import {
  Injectable,
  Logger,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { AiExecutionContext } from '@nestjs/ai';
import { tap, type Observable } from 'rxjs';

@Injectable()
export class ToolAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AgentFunctions');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const call = AiExecutionContext.create(context);
    const { toolCallId } = call.getContext();
    return next
      .handle()
      .pipe(tap(() => this.logger.log(`${call.getName()} (${toolCallId})`)));
  }
}
```

What an agent function throws reaches the model as an error it can recover from, and tell the user about: a guard's refusal as `Forbidden resource`, the message of an `HttpException` (a `BadRequestException('The address has no postcode')`), and `Internal server error` for any other error, which Nest's exception handler logs and whose message never reaches the model. An exception filter can answer instead: what it returns is the function's result.

> warning **Warning** Global guards, interceptors and filters (`APP_GUARD`, `app.useGlobalGuards()`) run on agent function calls too, as they do on MCP calls. An enhancer written for HTTP routes that reads `context.switchToHttp()` should check `context.getType() === 'http'` first.

#### Serving MCP clients too

The order API already has an [MCP server](/mcp/overview), whose clients, the support team's assistants, call `find-order` too. One method serves both consumers: it carries `@Tool()` from [`@nestjs/mcp`](/mcp/primitives#tools), for MCP clients, and `@AgentFunction()`, for the application's agents, each with options of its own. Neither decorator reads the other's: a method with `@Tool()` alone is no agent function, and one with `@AgentFunction()` alone is no MCP tool. A schema constant saves writing the schema twice:

```typescript
@@filename(orders/orders.tools)
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { AgentFunction } from '@nestjs/ai';
import { Tool } from '@nestjs/mcp';
import * as z from 'zod';
import { OrderVisibilityGuard } from './order-visibility.guard';
import { OrdersService } from './orders.service';

const FindOrderInput = z.object({
  orderId: z.string().describe('The order id, such as ord_123'),
});

@Injectable()
export class OrdersTools {
  constructor(private readonly orders: OrdersService) {}

  @Tool({
    name: 'find-order',
    description: 'Find an order by its id, with its status',
    inputSchema: FindOrderInput,
    annotations: { readOnlyHint: true },
  })
  @AgentFunction({
    name: 'find-order',
    description: 'Find an order by its id, with its status',
    inputSchema: FindOrderInput,
  })
  @UseGuards(OrderVisibilityGuard)
  async find({ orderId }: { orderId: string }) {
    const order = await this.orders.findById(orderId);
    if (!order) {
      throw new NotFoundException(`There is no order ${orderId}`);
    }
    return { id: order.id, status: order.status, total: order.total };
  }
}
```

Each consumer finds its own decorator: `McpModule` serves the `@Tool()` methods of the modules its `include` lists, and `AiModule` finds the `@AgentFunction()` methods:

```typescript
@@filename(app.module)
@Module({
  imports: [
    AiModule.forRoot({
      isGlobal: true,
      models: { default: anthropic('claude-opus-5-5') },
    }),
    McpModule.forRoot({
      name: 'cat-store',
      version: '1.0.0',
      include: [OrdersModule],
    }),
    OrdersModule,
    AssistantModule,
  ],
})
export class AppModule {}
```

MCP clients get `find-order`, and the assistant may call `find-order` and `change-address`, which has no `@Tool()`.

The two kinds of call have context types of their own: `'mcp'` for an MCP client's call, which `McpExecutionContext` reads, and `'ai'` for an agent's, which `AiExecutionContext` reads. The guards, interceptors and filters of a method that serves both see both, and tell them apart with `context.getType()`. `find-order` shows a customer only their own orders through the assistant, and the support team's MCP clients every order:

```typescript
@@filename(orders/order-visibility.guard)
import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { AiExecutionContext, type AiContextType } from '@nestjs/ai';
import type { McpContextType } from '@nestjs/mcp';
import { OrdersService } from './orders.service';

@Injectable()
export class OrderVisibilityGuard implements CanActivate {
  constructor(private readonly orders: OrdersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    switch (context.getType<AiContextType | McpContextType>()) {
      case 'mcp':
        return true;
      case 'ai': {
        const call = AiExecutionContext.create(context);
        const { orderId } = call.getInput<{ orderId: string }>();
        const order = await this.orders.findById(orderId);
        return !order || order.customerId === call.getRequest()?.user?.id;
      }
      default:
        return false;
    }
  }
}
```

The method's second argument is an `McpContext` for an MCP client's call, and an `AgentFunctionContext` for an agent's. Custom parameter decorators, made with `createParamDecorator()`, run for both kinds of call as well, and the `ExecutionContext` they receive has the type of the call they run for.

#### With `@nestjs/authentication` and `@nestjs/authorization`

[`@nestjs/authentication`](/security/authentication) and [`@nestjs/authorization`](/security/authorization) read agent function calls as they read MCP clients' calls: from their arguments, with the request the call runs in. In a route, the global authentication guard authenticates each call from the request it runs in (once: the route's result is reused), `@CurrentUser()` and `AuthenticationContext` work in agent functions, and `@Can()` policies decide each call. An agent function that declares no `@Can()` is denied, as a route is, and the model reads `Forbidden`:

```typescript
@@filename(orders/orders.tools)
@AgentFunction({
  name: 'cancel-order',
  description: 'Cancel an order that has not shipped yet',
  inputSchema: z.object({ orderId: z.string() }),
})
@Can(OrderPolicy, 'cancel')
cancel(
  { orderId }: { orderId: string },
  ctx: AgentFunctionContext,
  @CurrentUser() customer: Customer,
) {
  return this.orders.cancel(orderId, customer.id);
}
```

In a job, there is no request. `@Can()` finds the caller's `user` on the context, and the authentication guard treats the call as anonymous, as it does over stdio, so mark the providers of the agent functions that jobs call `@Public()`:

```typescript
@@filename(refunds/refund.tools)
@Injectable()
@Public()
export class RefundTools {
  constructor(private readonly orders: OrdersService) {}

  @AgentFunction({
    name: 'refund',
    description: 'Refund an order to the card it was paid with',
    inputSchema: z.object({ orderId: z.string() }),
    scopes: ['orders:refund'],
  })
  @Can(OrderPolicy, 'refund')
  refund({ orderId }: { orderId: string }) {
    return this.orders.refund(orderId);
  }
}
```

A refusal is Nest's `UnauthorizedException` or `ForbiddenException`, as on a route, and the model reads it as the tool's error: `Unauthorized`, or `Forbidden`.

> info **Hint** This needs `@nestjs/authentication` 0.1.4 and `@nestjs/authorization` 0.1.2 or later, the first versions that know the `'ai'` context type.

#### Tools in your own AI SDK calls

`AiTools` turns agent functions into the AI SDK's tools: `select()` takes the same list a call's `tools` does, and the `caller` their calls run as, for code that calls the AI SDK itself. The functions keep their schemas, scopes and enhancers:

```typescript
@@filename(support/summaries.service)
@Injectable()
export class SummariesService {
  constructor(
    @InjectModel('fast') private readonly model: LanguageModel,
    private readonly tools: AiTools,
  ) {}

  summarize(thread: string, request: Request) {
    return generateText({
      model: this.model,
      prompt: thread,
      tools: this.tools.select(['find-order'], { caller: { request } }),
      stopWhen: stepCountIs(3),
    });
  }
}
```

`stopWhen` and `stepCountIs()` are the AI SDK's: it runs its own loop here, as it does any of its calls.
