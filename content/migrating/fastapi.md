### Coming from FastAPI

Nest will feel closer to FastAPI than most Node.js frameworks do: routes are declared with decorators, request bodies are validated against a schema, dependencies are injected, the API is async from end to end, and the OpenAPI document is generated from the code. What changes is the language, TypeScript, and the shape of the code. FastAPI is a set of functions that declare their dependencies as parameters; Nest is a set of classes, grouped into modules, that receive their dependencies in the constructor. Sign-in, permissions, configuration, background jobs and the rest come from first-party packages.

This page maps FastAPI concepts to their Nest equivalents, with short code side by side. It ends with [what's different](/migrating/fastapi#whats-different), which matters more than the syntax.

#### At a glance

| FastAPI | Nest | Read more |
| --- | --- | --- |
| `uvicorn main:app --reload` | `npm run start:dev` | [First steps](/first-steps) |
| `APIRouter` and `include_router()` | Controllers, grouped into modules | [Controllers](/controllers), [Modules](/modules) |
| Path operations: `@router.get()`, `@router.post()` | Route decorators: `@Get()`, `@Post()` | [Controllers](/controllers) |
| Pydantic request models | A schema on `@Body()`, with Zod or another Standard Schema library | [Validation](/application/validation) |
| `response_model` | `StandardSchemaSerializerInterceptor` | [Serialization](/application/serialization) |
| `Depends()` | Providers, injected into constructors | [Providers](/providers) |
| Dependencies that read the request | Guards, pipes and parameter decorators | [Guards](/guards), [Custom decorators](/custom-decorators) |
| Dependencies with `yield` | Lifecycle hooks, or request-scoped providers | [Lifecycle events](/fundamentals/lifecycle-events) |
| `app.dependency_overrides` | `overrideProvider()` in a testing module | [Testing](/fundamentals/testing) |
| `HTTPException`, `@app.exception_handler()` | `HttpException`, exception filters | [Exception filters](/exception-filters) |
| Middleware, `CORSMiddleware` | Middleware, `app.enableCors()` | [Middleware](/middleware), [CORS](/security/cors) |
| `OAuth2PasswordBearer`, `Security()` with scopes | `@nestjs/authentication` and `@nestjs/authorization` | [Authentication](/security/authentication), [Authorization](/security/authorization) |
| pydantic-settings `BaseSettings` | `@nestjs/config` | [Configuration](/application/configuration) |
| SQLAlchemy or SQLModel, and Alembic | Drizzle or TypeORM, and their migration tools | [Drizzle](/data/drizzle), [TypeORM](/data/typeorm) |
| `BackgroundTasks`, Celery, ARQ | `@nestjs/bullmq` | [Queues](/application/queues) |
| `lifespan` | `onModuleInit()`, `onApplicationShutdown()` | [Lifecycle events](/fundamentals/lifecycle-events) |
| `StreamingResponse`, server-sent events | Async generators, `@Sse()` | [Streaming responses](/http/streaming-responses), [Server-Sent Events](/http/server-sent-events) |
| `@app.websocket()` | Gateways | [Gateways](/websockets/gateways) |
| `/docs` and `/openapi.json` | `@nestjs/swagger` | [OpenAPI](/openapi/introduction) |
| `TestClient` | `@nestjs/testing` and Supertest | [Testing](/fundamentals/testing) |

#### Start a project

A FastAPI project is often one `main.py` to begin with. The Nest CLI generates a project with a root module, a controller, a service and tests:

```bash
$ npm i -g @nestjs/cli
$ nest new orders-api
$ cd orders-api
$ npm run start:dev
```

`npm run start:dev` restarts the application when a file changes, like `uvicorn --reload`. `nest generate resource orders` adds a module with a controller, a service, DTOs and test files. See [CLI usages](/cli/usages).

The entry point is `main.ts`, which creates the application, the job of `app = FastAPI()` and the `uvicorn` command together:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

#### Routers become controllers and modules

A FastAPI router groups path operations under a prefix, and the application includes it:

```python
# orders/router.py
router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: UUID,
    user: User = Depends(get_current_user),
    orders: OrdersService = Depends(get_orders_service),
):
    order = await orders.find_one(user, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("", status_code=201, response_model=OrderOut)
async def create_order(
    body: CreateOrder,
    user: User = Depends(get_current_user),
    orders: OrdersService = Depends(get_orders_service),
):
    return await orders.place(user, body)

# main.py
app.include_router(orders.router)
```

In Nest, the router is a **controller** class. The prefix goes on `@Controller()`, each method is a path operation, and the dependencies that every operation needs are injected once, into the constructor:

```typescript
@@filename(orders/orders.controller)
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from '../users/user.js';
import { createOrderSchema, type CreateOrder } from './create-order.schema.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(user, id);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body({ schema: createOrderSchema }) body: CreateOrder,
  ) {
    return this.ordersService.place(user, body);
  }
}
```

The controller is listed in a **module**, with the providers it uses. The root module imports the feature modules, as `include_router()` adds the routers:

```typescript
@@filename(orders/orders.module)
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
```

The differences:

- Route parameters are written `:id`, where FastAPI puts the name in braces. A parameter's type annotation doesn't convert it: route and query parameters arrive as strings, and a pipe such as `ParseUUIDPipe` or `ParseIntPipe` converts and checks one.
- A `POST` handler answers `201 Created` by default, and every other method `200 OK`. `@HttpCode()` changes it, as `status_code` does.
- `raise HTTPException(404)` becomes `throw new NotFoundException()`, usually in the service. See [Exceptions](/migrating/fastapi#exceptions).
- `@CurrentUser()` comes from `@nestjs/authentication`, which also closes every route to anonymous requests by default. See [Security](/migrating/fastapi#security).
- To add a prefix to every route of a module, as `include_router(prefix=...)` does, use [`RouterModule`](/recipes/router-module), or `app.setGlobalPrefix('api')` for the whole application.

#### Pydantic models become schemas

FastAPI validates a request body against the Pydantic model in the function's signature:

```python
# orders/schemas.py
class OrderItem(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1, le=20)

class CreateOrder(BaseModel):
    items: list[OrderItem] = Field(min_length=1)
    note: str | None = Field(default=None, max_length=500)
```

The closest match in Nest is a [Standard Schema](https://standardschema.dev/) library such as Zod. The schema validates at runtime, and the TypeScript type is inferred from it, as a Pydantic model is both:

```typescript
@@filename(orders/create-order.schema)
import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.int().min(1).max(20),
      }),
    )
    .min(1),
  note: z.string().max(500).optional(),
});

export type CreateOrder = z.infer<typeof createOrderSchema>;
```

The controller above passes the schema with the `schema` option of `@Body()`. Bind `StandardSchemaValidationPipe` once for the whole application, and every parameter with a schema is validated:

```typescript
@@filename(main)
app.useGlobalPipes(new StandardSchemaValidationPipe());
```

An invalid body gets a `400 Bad Request` that lists every failed rule, where FastAPI answers `422`. Valibot and ArkType work the same way. If you prefer classes, DTOs with [class-validator](https://github.com/typestack/class-validator) decorators and `ValidationPipe` are the alternative. See [Validation](/application/validation).

> warning **Warning** This is the biggest change for a FastAPI developer. FastAPI validates because of the type annotation. In TypeScript, a type annotation exists only at compile time: `@Body() body: CreateOrder` without a schema receives whatever JSON the client sent, unchecked. Validation happens only where you pass a schema (or use a DTO class with `ValidationPipe`).

##### Response models

`response_model` filters what a path operation returns, so a field such as a password hash never leaves the API. Nest does the same with `StandardSchemaSerializerInterceptor`. The response schema is an allowlist: `z.object()` drops every property it doesn't declare:

```typescript
@@filename(orders/orders.controller)
import {
  SerializeOptions,
  StandardSchemaSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { orderResponseSchema } from './order-response.schema.js';

@Controller('orders')
@UseInterceptors(StandardSchemaSerializerInterceptor)
export class OrdersController {
  // constructor as above

  @Get(':id')
  @SerializeOptions({ schema: orderResponseSchema })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(user, id);
  }
}
```

When a handler returns an array, the schema applies to each element. Without the interceptor, a handler's return value is sent as JSON as it is. See [Schema-based serialization](/application/serialization#schema-based-serialization).

#### Depends becomes dependency injection

`Depends()` is FastAPI's dependency injection. A function declares what it needs as parameters, and FastAPI calls the dependency functions on every request. In Nest, the dependencies are **providers**: classes marked `@Injectable()`, created once when the application starts and passed to the constructors that ask for them.

```python
# orders/service.py
class OrdersService:
    def __init__(self, db: AsyncSession, mailer: Mailer):
        self.db = db
        self.mailer = mailer

def get_orders_service(
    db: AsyncSession = Depends(get_db),
    mailer: Mailer = Depends(get_mailer),
) -> OrdersService:
    return OrdersService(db, mailer)
```

In Nest, the class declares its dependencies in its constructor, and nothing else is needed. No factory function, no `Depends()` in every route:

```typescript
@@filename(orders/orders.service)
import { Injectable } from '@nestjs/common';
import { Mailer } from '@nestjs/mail';
import { OrdersRepository } from './orders.repository.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly mailer: Mailer,
  ) {}
}
```

Nest reads the constructor's parameter types and finds a provider for each. A provider is visible in its own module, and in other modules when its module lists it in `exports` and the other module adds the module to its `imports`. See [Providers](/providers) and [Modules](/modules).

Because providers are created once, they are the place for what FastAPI keeps in module-level globals or in `app.state`: database pools, HTTP clients, model clients. What depends on the request goes elsewhere:

| A FastAPI dependency that... | In Nest |
| --- | --- |
| Builds a service or a client | A provider, injected into constructors |
| Reads the current user from a token or a cookie | `@nestjs/authentication`, with `@CurrentUser()` |
| Rejects the request, such as a permission check | A [guard](/guards), or a policy with `@Can()` |
| Parses or checks one parameter | A [pipe](/pipes) |
| Extracts a value from the request | A [custom parameter decorator](/custom-decorators) |
| Opens and closes something per request, with `yield` | An [interceptor](/interceptors), or a [request-scoped provider](/fundamentals/injection-scopes) |
| Opens and closes something for the application's lifetime | A provider with `onModuleInit()` and `onApplicationShutdown()` |

The classic `get_db()` with `yield` usually needs no counterpart. A database module, such as `DrizzleModule`, holds a connection pool for the application's lifetime, and each query takes a connection from it and returns it. A request-scoped provider exists, but Nest creates it, and everything that injects it, again for every request, so keep it for the cases that need it. See [Injection scopes](/fundamentals/injection-scopes).

#### Exceptions

`HTTPException` becomes `HttpException` and its subclasses, such as `NotFoundException`, `ConflictException` and `ForbiddenException`. Throw one anywhere, in the controller or deep in a service, and Nest turns it into a JSON response with its status. Any other exception becomes a `500`.

`@app.exception_handler()` becomes an **exception filter**. `@Catch()` names the exception classes it handles:

```typescript
@@filename(common/order-not-found.filter)
import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { OrderNotFoundError } from '../orders/order-not-found.error.js';

@Catch(OrderNotFoundError)
export class OrderNotFoundFilter implements ExceptionFilter {
  catch(exception: OrderNotFoundError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    response.status(404).json({ detail: exception.message });
  }
}
```

Register it with `app.useGlobalFilters()`, or as an `APP_FILTER` provider when it injects other providers. See [Exception filters](/exception-filters).

#### Middleware and CORS

`@app.middleware("http")` becomes Nest middleware, which receives the request and the response before routing. Around the handler, Nest has more specific places, run in this order: [guards](/guards) decide whether the handler runs, [interceptors](/interceptors) wrap it and see its result, and [pipes](/pipes) check each argument. See [Request lifecycle](/faq/request-lifecycle).

`CORSMiddleware` becomes one call in `main.ts`:

```typescript
@@filename(main)
app.enableCors({ origin: ['https://shop.example.com'], credentials: true });
```

See [CORS](/security/cors).

#### Security

FastAPI gives you the building blocks: `OAuth2PasswordBearer` reads a bearer token, and a `get_current_user` dependency that you write decodes it and loads the user. Hashing passwords, issuing tokens and storing sessions are left to libraries you choose. `@nestjs/authentication` ships those parts:

- **Every route is closed** from the moment the module is registered. `@Public()` opens one. FastAPI is the other way round: a route is public until it depends on `get_current_user`.
- **`@CurrentUser()`** injects the user, as `Depends(get_current_user)` does.
- **Credential providers** read a bearer token, a session cookie or an API key, and load the user through your code. Users are your own table: the package asks for a user by id.
- **`TokenService`** issues short-lived access tokens and rotating refresh tokens, and **`PasswordHasher`** hashes passwords with scrypt: the jobs that FastAPI applications give to libraries such as PyJWT and passlib.
- Server-side sessions, email verification, password reset links, TOTP two-factor authentication, magic links, OpenID Connect and API keys come with it.

See [Authentication](/security/authentication).

OAuth2 scopes on `Security()` check what a token allows. `@nestjs/authorization` checks what a user may do with **policies**: classes whose methods decide, given the user and often the record:

```typescript
@@filename(orders/order.policy)
import { Policy } from '@nestjs/authorization';
import type { User } from '../users/user.js';
import type { Order } from './order.js';

@Policy()
export class OrderPolicy {
  view(user: User | null, order: Order) {
    if (!user) {
      return false;
    }
    return user.roles.includes('staff') || order.customerId === user.id;
  }

  refund(user: User | null) {
    return !!user?.roles.includes('staff');
  }
}
```

A check that needs only the user goes on the route, with `@Can(OrderPolicy, 'refund')`. A check that needs the record goes in the service, once the record is loaded, with `AuthorizationService.authorize(OrderPolicy, 'view', user, order)`, which throws when the policy denies. The authorization guard denies a route that declares no check. See [Authorization](/security/authorization).

#### Settings become configuration

A pydantic-settings class reads the environment and validates it:

```python
# settings.py
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    database_url: PostgresDsn
    openai_api_key: SecretStr
    debug: bool = False
```

`@nestjs/config` does the same with a schema, and stops the application at startup when a variable is missing or invalid:

```typescript
@@filename(app.module)
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: z.object({
        DATABASE_URL: z.url(),
        OPENAI_API_KEY: z.string().min(1),
        DEBUG: z.stringbool().default(false),
      }),
    }),
  ],
})
export class AppModule {}
```

Where FastAPI code calls `Depends(get_settings)`, a Nest provider injects `ConfigService` and calls `get()`, or `getOrThrow()` for a required value. See [Configuration](/application/configuration).

#### Databases and migrations

Nest has no ORM of its own. [Drizzle](/data/drizzle), whose schema is TypeScript and whose queries read like SQL, is the closest match to SQLAlchemy Core and its expression language. [TypeORM](/data/typeorm), with decorated entity classes, is closer to SQLModel. Alembic's `revision --autogenerate` becomes `npx drizzle-kit generate`, which writes SQL migrations from the changes to the schema, and `upgrade head` becomes `npx drizzle-kit migrate`.

The database is registered once and injected where it's needed:

```typescript
@@filename(orders/orders.repository)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { orders } from '../database/schema.js';

@Injectable()
export class OrdersRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async findForCustomer(id: string, customerId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.customerId, customerId)));
    return order;
  }
}
```

Every database driver in Node.js is asynchronous, so there's no sync and async variant to choose between, as there is with SQLAlchemy. A transaction is a callback, `this.db.transaction(async (tx) => ...)`, that commits when it resolves and rolls back when it throws. See [Drizzle transactions](/data/drizzle#drizzle-transactions).

#### Background work and lifespan

`BackgroundTasks` runs a function after the response is sent, in the same process. In Node.js, you could do the same by not awaiting a promise, but the work is lost if the process stops, and an error has nowhere to go. Send it to a queue instead. `@nestjs/bullmq` runs jobs on Redis, with retries, and plays the role of Celery or ARQ as well:

```typescript
@@filename(invoices/invoice.processor)
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

@Processor('invoices')
export class InvoiceProcessor extends WorkerHost {
  async process(job: Job<{ orderId: string }>) {
    // ...
  }
}
```

A service adds a job to the queue it injects, where FastAPI code calls `background_tasks.add_task()`:

```typescript
@@filename(orders/orders.service)
// constructor(@InjectQueue('invoices') private readonly invoices: Queue) {}
await this.invoices.add('generate', { orderId: order.id });
```

See [Queues](/application/queues). Scheduled jobs use `@Cron()` from `@nestjs/schedule`. See [Task scheduling](/application/task-scheduling).

The `lifespan` context manager becomes lifecycle hooks on any provider: `onModuleInit()` runs at startup, before the application listens, and `onApplicationShutdown()` runs on shutdown, once `app.enableShutdownHooks()` is called in `main.ts`. See [Lifecycle events](/fundamentals/lifecycle-events).

#### Streaming and server-sent events

`StreamingResponse` with an async generator becomes a handler that is an async generator. Each value it yields is sent as soon as the client can take it:

```typescript
@@filename(chat/chat.controller)
@Get('story')
async *story() {
  for await (const token of this.llm.stream('Tell me a story')) {
    yield token;
  }
}
```

A handler can also return a `ReadableStream`, or a web `Response`, such as the one the AI SDK's `toTextStreamResponse()` returns. For server-sent events, `@Sse()` sends each value of an `Observable` as an event. See [Streaming responses](/http/streaming-responses) and [Server-Sent Events](/http/server-sent-events).

#### WebSockets

`@app.websocket()` becomes a **gateway**: a class whose methods handle messages, with Socket.IO or the `ws` library. Gateways are providers, so they inject services, and guards, pipes and interceptors work on them as they do on routes. See [Gateways](/websockets/gateways).

#### AI backends

Many FastAPI applications serve language models. In Nest, `@nestjs/ai` registers models by name and injects `AiService`, with retries, timeouts, fallback models and answers validated by a schema, on top of the AI SDK, so Claude, GPT, Gemini and other providers work. A provider's methods marked `@AgentFunction()` become tools the model calls, through the same guards and pipes as your routes. `@nestjs/mcp` serves the same methods as an MCP server. See [AI](/ai/overview), [MCP](/mcp/overview) and the [AI chat backend tutorial](/tutorials/ai-chat-backend).

#### OpenAPI

FastAPI serves `/docs` and `/openapi.json` with no setup. In Nest, the document comes from `@nestjs/swagger`, and you set it up in `main.ts`:

```typescript
@@filename(main)
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder().setTitle('Orders API').build();
SwaggerModule.setup('docs', app, () =>
  SwaggerModule.createDocument(app, config),
);
```

Swagger UI is then at `/docs`. Zod schemas passed to `@Body()`, `@Query()` and `@Param()` become the document's request bodies and parameters, and the [CLI plugin](/openapi/cli-plugin) reads DTO classes and return types from the TypeScript source, so most routes need no extra decorators. Responses are documented with `@ApiResponse()` and its shorthands where the plugin can't infer them. See [OpenAPI](/openapi/introduction).

#### Testing

`TestClient` with `app.dependency_overrides` becomes a testing module with `overrideProvider()`, and [Supertest](https://github.com/ladjs/supertest) for the requests:

```typescript
@@filename(test/orders.e2e-spec)
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { OrdersRepository } from '../src/orders/orders.repository.js';

describe('Orders', () => {
  let app: INestApplication;
  const ordersRepository = { findForCustomer: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(OrdersRepository)
      .useValue(ordersRepository)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('answers 404 for an unknown order', async () => {
    ordersRepository.findForCustomer.mockResolvedValue(undefined);
    await request(app.getHttpServer())
      .get('/orders/7c9e6679-7425-40de-944b-e07fc1f90ae7')
      .expect(404);
  });
});
```

`overrideProvider()` replaces a provider everywhere it's injected, as an entry in `dependency_overrides` replaces a dependency. New projects use [Vitest](https://vitest.dev/) as the test runner, in place of pytest. See [Testing](/fundamentals/testing).

#### What's different

The mappings above hold for structure. These are the differences that change how you write code.

**Types don't validate.** FastAPI and Pydantic read type annotations at runtime, so a parameter's type is also its validation. TypeScript's types are erased when the code compiles. They check your code, not the data: a request body, a query parameter, a database row or a queue message is whatever was sent, until a schema checks it.

**Dependencies are resolved once, not per request.** FastAPI calls the dependency functions of every request. Nest creates its providers when the application starts, and passes the same instances to every request. That's cheaper, and it means a provider must not keep per-request state in its fields. Per-request values come from the parameters of the handler, from `@CurrentUser()`, or from `AsyncLocalStorage`. See [Async local storage](/recipes/async-local-storage).

**Classes and modules, not functions.** A FastAPI application can stay a flat set of functions. Nest expects controllers and providers as classes, grouped into modules that list what they contain and what they export. It's more structure up front, and it's what keeps a large application navigable.

**There's no thread pool for sync code.** FastAPI runs a `def` path operation in a thread pool, so blocking code doesn't stall the event loop. Node.js has no such escape: all of your code runs on the event loop, and CPU-heavy work, such as resizing an image or a long loop, stalls every request in the process. Move it to a [queue](/application/queues) or a worker thread. Waiting on I/O doesn't stall anything, since every driver is asynchronous.

**One process per core.** `uvicorn --workers 4` starts four processes. A Node.js process uses one core for your code too, so run several processes or containers behind the load balancer.

**Numbers are doubles.** JavaScript's `number` is a 64-bit float, and there's no `Decimal`. Keep money in integer cents, or use a decimal library and your database's `numeric` type, which most drivers return as a string.

**ES modules and npm.** Nest 12 packages are ES modules, and a project generated as ESM imports local files with a `.js` extension, even from `.ts` files, because that's the name of the compiled file. npm and `package.json` take the place of pip or uv and `pyproject.toml`, and `tsc` or [SWC](/recipes/swc) compiles the code before it runs. See [ESM packages](/migration-guide#esm-packages).
