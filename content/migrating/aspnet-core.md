### Coming from ASP.NET Core

Nest is built on the ideas an ASP.NET Core developer already works with: a dependency injection container with lifetimes, constructor injection, attribute-routed controllers, a request pipeline of middleware and filters, and typed options. Validation, authentication, authorization, configuration, background jobs, health checks and OpenAPI come from first-party packages. What changes is the language, TypeScript, and the runtime, Node.js.

This page maps ASP.NET Core concepts to their Nest equivalents, with short code side by side. It ends with [what's different](/migrating/aspnet-core#whats-different), which matters more than the syntax.

#### At a glance

| ASP.NET Core | Nest | Read more |
| --- | --- | --- |
| `Program.cs`, `WebApplication.CreateBuilder()` | `main.ts`, `NestFactory.create()` | [First steps](/first-steps) |
| `builder.Services.AddScoped<T>()` and the other registrations | `@Injectable()` classes, listed in a module's `providers` | [Providers](/providers) |
| Service lifetimes: singleton, scoped, transient | Injection scopes: `DEFAULT`, `REQUEST`, `TRANSIENT` | [Injection scopes](/fundamentals/injection-scopes) |
| `AddXyz()` extension methods from a library | Dynamic modules, such as `ConfigModule.forRoot()` | [Dynamic modules](/fundamentals/dynamic-modules) |
| `[ApiController]`, `[Route]`, `[HttpGet]`, `[FromBody]` | `@Controller()`, `@Get()`, `@Body()` | [Controllers](/controllers) |
| Minimal APIs | A one-file project with `nest new --minimal` | [One-file projects](/cli/usages#one-file-projects) |
| Model binding and validation, Data Annotations, FluentValidation | Pipes, with class-validator DTOs or a Standard Schema such as Zod | [Validation](/application/validation) |
| Middleware (`app.Use()`) | Middleware | [Middleware](/middleware) |
| Authorization filters, `[Authorize]` | Guards | [Guards](/guards) |
| Action filters, result filters, endpoint filters | Interceptors | [Interceptors](/interceptors) |
| Exception filters, `UseExceptionHandler()`, `IExceptionHandler` | Exception filters | [Exception filters](/exception-filters) |
| Authentication handlers, ASP.NET Core Identity | `@nestjs/authentication` | [Authentication](/security/authentication) |
| Authorization policies, `IAuthorizationService` | `@nestjs/authorization` | [Authorization](/security/authorization) |
| `appsettings.json`, `IConfiguration`, `IOptions<T>` | `@nestjs/config` | [Configuration](/application/configuration) |
| Entity Framework Core | `@nestjs/typeorm`, `@nestjs/drizzle` and other ORMs | [Data](/data/overview) |
| `IHostedService`, `BackgroundService` | Lifecycle hooks, `@nestjs/schedule` and `@nestjs/bullmq` | [Task scheduling](/application/task-scheduling), [Queues](/application/queues) |
| `IHttpClientFactory`, typed clients | `@nestjs/http-client` | [HTTP client](/application/http-client) |
| Polly | `@nestjs/resilience` | [Resilience](/reliability/resilience) |
| Health checks (`AddHealthChecks()`, `MapHealthChecks()`) | `@nestjs/terminus` | [Health checks](/reliability/terminus) |
| Swashbuckle, NSwag, `Microsoft.AspNetCore.OpenApi` | `@nestjs/swagger` | [OpenAPI](/openapi/introduction) |
| `ILogger<T>` | `Logger` from `@nestjs/common` | [Logger](/application/logger) |
| `WebApplicationFactory<T>`, xUnit | `@nestjs/testing`, Supertest and Vitest | [Testing](/fundamentals/testing) |
| SignalR | Gateways, with Socket.IO or `ws` | [Gateways](/websockets/gateways) |
| gRPC services, MassTransit | `@nestjs/microservices` | [Microservices](/microservices/basics) |

#### Start a project

`dotnet new webapi` generates a project with a `Program.cs`. The Nest CLI does the same:

```bash
$ npm i -g @nestjs/cli
$ nest new orders-api
```

In ASP.NET Core, `Program.cs` registers services and builds the pipeline:

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddScoped<IOrdersService, OrdersService>();

var app = builder.Build();
app.MapControllers();
app.Run();
```

In Nest, services are registered in **modules**, and `main.ts` creates the application from the root module:

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

`npm run start:dev` starts the application and restarts it when a file changes, like `dotnet watch`. `nest generate` (or `nest g`) adds a module, controller or service with its test file, and `nest g resource orders` generates the whole CRUD slice. See [CLI usages](/cli/usages).

#### Registering services

ASP.NET Core registers services on `builder.Services`. Nest registers **providers** in a module. A provider is a class decorated with `@Injectable()`, and it receives its dependencies through the constructor, as in ASP.NET Core:

```csharp
// OrdersService.cs
public class OrdersService : IOrdersService
{
    private readonly OrdersRepository _ordersRepository;

    public OrdersService(OrdersRepository ordersRepository)
    {
        _ordersRepository = ordersRepository;
    }
}
```

```typescript
@@filename(orders/orders.service)
import { Injectable } from '@nestjs/common';
import { OrdersRepository } from './orders.repository.js';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}
}
```

`private readonly` in the constructor declares and assigns the field in one step, like a C# primary constructor.

```typescript
@@filename(orders/orders.module)
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersRepository } from './orders.repository.js';
import { OrdersService } from './orders.service.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
```

ASP.NET Core has one service collection for the whole application. Nest modules are also a boundary: a provider is visible only inside its own module, unless the module lists it in `exports` and another module adds the module to its `imports`. A feature's module is the place where an ASP.NET Core project would put an `AddOrders()` extension method, except that what it doesn't export stays private. See [Modules](/modules).

When a dependency can't be resolved, the application fails at startup with an error that names the class, the missing dependency and the module.

##### Interfaces and keyed services

`AddScoped<IOrdersService, OrdersService>()` registers a class for an interface. TypeScript interfaces are erased during compilation, so Nest can't see them at runtime. Use an **abstract class** as the contract instead. It exists at runtime, so it works as the injection token:

```typescript
@@filename(payments/payment-gateway)
export abstract class PaymentGateway {
  abstract charge(orderId: string, amountInCents: number): Promise<void>;
}
```

```typescript
@@filename(payments/payments.module)
import { Module } from '@nestjs/common';
import { PaymentGateway } from './payment-gateway.js';
import { StripePaymentGateway } from './stripe-payment-gateway.js';

@Module({
  providers: [{ provide: PaymentGateway, useClass: StripePaymentGateway }],
  exports: [PaymentGateway],
})
export class PaymentsModule {}
```

A class that needs it declares `private readonly paymentGateway: PaymentGateway` in its constructor. Keyed services, registered with `AddKeyedSingleton()` and injected with `[FromKeyedServices]`, become string or `Symbol` tokens injected with `@Inject()`. See [Interfaces and abstract classes](/fundamentals/custom-providers#interfaces-and-abstract-classes).

##### Factories

A registration that builds the instance itself, such as `AddSingleton(sp => new S3Client(...))`, becomes a **factory provider**. `inject` lists the providers that are passed to the factory, in order:

```typescript
@@filename(storage/storage.module)
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

@Module({
  providers: [
    {
      provide: S3Client,
      useFactory: (config: ConfigService) =>
        new S3Client({ region: config.getOrThrow<string>('AWS_REGION') }),
      inject: [ConfigService],
    },
  ],
  exports: [S3Client],
})
export class StorageModule {}
```

The factory can be `async`, and Nest waits for it before it creates the providers that depend on it. See [Factory providers](/fundamentals/custom-providers#factory-providers-usefactory).

Libraries that ASP.NET Core registers with `AddXyz()` extension methods ship as **dynamic modules** in Nest, imported and configured in a module: `ConfigModule.forRoot()`, `TypeOrmModule.forRootAsync()`, `ScheduleModule.forRoot()`.

#### Lifetimes

| ASP.NET Core | Nest |
| --- | --- |
| `AddSingleton()` | `Scope.DEFAULT`, which is the default |
| `AddScoped()` | `Scope.REQUEST` |
| `AddTransient()` | `Scope.TRANSIENT`: a new instance for each class that injects it |

In ASP.NET Core you choose a lifetime for each service, and scoped is common, because a `DbContext` is scoped. In Nest, providers are **singletons** unless declared otherwise, and that's the right choice for almost all of them. ORM clients are singletons that hold a connection pool, so there's no per-request context to scope.

A request-scoped provider also behaves differently. ASP.NET Core's scope validation, on by default in the Development environment, rejects a scoped service injected into a singleton (a captive dependency). Nest instead makes the singleton request-scoped too, along with everything up to the controller, and creates the whole chain again for each request. When a provider needs something from the current request, such as the user or the tenant, read it from an `AsyncLocalStorage` store rather than making it request-scoped. `AsyncLocalStorage` flows through `await`s, as `AsyncLocal<T>` does in .NET, and plays the role of `IHttpContextAccessor`. See [Async local storage](/recipes/async-local-storage).

#### Controllers

An ASP.NET Core controller:

```csharp
// OrdersController.cs
[ApiController]
[Route("orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrdersService _ordersService;

    public OrdersController(IOrdersService ordersService)
    {
        _ordersService = ordersService;
    }

    [HttpGet]
    public Task<List<Order>> FindAll([FromQuery] int page = 0) => _ordersService.FindAllAsync(page);

    [HttpGet("{id}")]
    public async Task<ActionResult<Order>> FindOne(string id)
    {
        var order = await _ordersService.FindOneAsync(id);
        return order is null ? NotFound() : order;
    }

    [HttpPost]
    public async Task<ActionResult<Order>> Create(CreateOrderRequest request)
    {
        var order = await _ordersService.CreateAsync(request);
        return CreatedAtAction(nameof(FindOne), new { id = order.Id }, order);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Remove(string id)
    {
        await _ordersService.RemoveAsync(id);
        return NoContent();
    }
}
```

The same controller in Nest:

```typescript
@@filename(orders/orders.controller)
import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { CreateOrderDto } from './create-order.dto.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query('page', new ParseIntPipe({ optional: true })) page = 0) {
    return this.ordersService.findAll(page);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);
    if (!order) {
      throw new NotFoundException();
    }
    return order;
  }

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
```

The differences:

- Route parameters are written `:id`, where ASP.NET Core wraps the name in braces.
- Each parameter says where it comes from, with `@Body()`, `@Query()`, `@Param()` or `@Headers()`, as `[FromBody]` and `[FromQuery]` do. There are no binding source conventions.
- A `POST` handler answers `201 Created` by default, and every other method `200 OK`. `@HttpCode()` changes it. There's no `CreatedAtAction()`: set a `Location` header with `@Header()` when you need one.
- There's no `ActionResult<T>`. Return the body, and throw an exception for an error status, such as `throw new NotFoundException()`. See [Built-in HTTP exceptions](/exception-filters#built-in-http-exceptions).
- Handlers return a `Promise`, the counterpart of a `Task`, and Nest serializes the result as JSON with camelCase property names, because those are the names in your TypeScript code.

The controller is listed in its module's `controllers`, which takes the place of `AddControllers()` and `MapControllers()`.

##### Minimal APIs

Nest has no lambda-based route registration like `app.MapGet()`. The smallest Nest application is still a controller and a module, and `nest new orders-api --minimal` generates one in a single file, `src/main.ts`. It grows into the standard layout as you add modules. See [One-file projects](/cli/usages#one-file-projects).

#### Validation

With `[ApiController]`, an invalid model answers `400` before the action runs. Rules are Data Annotations on the request type:

```csharp
// CreateOrderRequest.cs
public record CreateOrderRequest(
    [Required] string CustomerId,
    [Required, MinLength(1)] List<OrderItem> Items,
    [MaxLength(500)] string? Note);
```

Nest validates with **pipes**. The closest match is `ValidationPipe` with a DTO class whose properties carry [class-validator](https://github.com/typestack/class-validator) decorators:

```typescript
@@filename(orders/create-order.dto)
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { OrderItemDto } from './order-item.dto.js';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @MaxLength(500)
  note?: string;
}
```

Bind the pipe once for the whole application, which gives you what `[ApiController]` does for every action:

```typescript
@@filename(main)
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

`whitelist` drops properties the DTO doesn't declare, and `transform` turns the body into an instance of the DTO class.

If you validate with FluentValidation, rules that live in code rather than on properties, the closer match is a [Standard Schema](https://standardschema.dev/) library such as Zod, where the parameter's type is inferred from the schema. Bind `StandardSchemaValidationPipe` globally, and pass the schema with the `schema` option of `@Body()`:

```typescript
@@filename(orders/create-order.schema)
import { z } from 'zod';

export const createOrderSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(z.object({ productId: z.string(), quantity: z.int().positive() })).min(1),
  note: z.string().max(500).optional(),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
```

```typescript
@@filename(orders/orders.controller)
@Post()
create(@Body({ schema: createOrderSchema }) dto: CreateOrderDto) {
  return this.ordersService.create(dto);
}
```

> warning **Warning** TypeScript types don't exist at runtime, so a type annotation alone validates nothing. Without a validation pipe, `@Body() dto: CreateOrderDto` receives whatever JSON the client sent. Bind one of the pipes globally, as above.

Both pipes answer an invalid body with a `400 Bad Request` whose body lists the failed rules as `message`, not with `ValidationProblemDetails`. To answer with problem details, write an exception filter, as below. See [Validation](/application/validation).

#### The request pipeline

ASP.NET Core has middleware and, for MVC, five kinds of filters. Nest has middleware and four kinds of components around a route handler, and runs them in this order:

| Nest | Runs | ASP.NET Core counterpart |
| --- | --- | --- |
| [Middleware](/middleware) | Before routing, with the raw request and response | Middleware registered with `app.Use()` |
| [Guards](/guards) | After routing, to decide whether the handler runs | Authorization filters, `[Authorize]` |
| [Interceptors](/interceptors) | Around the handler, with access to its result | Action filters, result filters, endpoint filters |
| [Pipes](/pipes) | On each argument, before the handler | Model binding and validation |
| [Exception filters](/exception-filters) | When anything above throws | Exception filters, `IExceptionHandler` |

Like filters, guards, interceptors, pipes and exception filters are bound to a handler, a controller or the whole application, with `@UseGuards()`, `@UseInterceptors()`, `@UsePipes()` and `@UseFilters()`, or as `APP_GUARD`, `APP_INTERCEPTOR`, `APP_PIPE` and `APP_FILTER` providers. See [Request lifecycle](/faq/request-lifecycle) for the full order.

An interceptor that logs how long each request took, the counterpart of an `IAsyncActionFilter`:

```typescript
@@filename(common/timing.interceptor)
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const started = performance.now();
    const handler = `${context.getClass().name}.${context.getHandler().name}`;
    return next
      .handle()
      .pipe(tap(() => this.logger.log(`${handler} took ${Math.round(performance.now() - started)} ms`)));
  }
}
```

`next.handle()` plays the role of `await next()`. It returns an RxJS `Observable` of the handler's result, which the interceptor can transform before it reaches the client. See [Interceptors](/interceptors).

##### Exception filters and problem details

An `IExceptionHandler` that turns a domain exception into problem details:

```csharp
// OrderNotFoundHandler.cs
public class OrderNotFoundHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        if (exception is not OrderNotFoundException) return false;
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        await context.Response.WriteAsJsonAsync(
            new ProblemDetails { Status = 404, Title = "Not Found", Detail = exception.Message }, ct);
        return true;
    }
}
```

In Nest, it's an **exception filter**. `@Catch()` names the exception classes it handles, so there's no type check to write:

```typescript
@@filename(common/order-not-found.filter)
import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { OrderNotFoundError } from '../orders/order-not-found.error.js';

@Catch(OrderNotFoundError)
export class OrderNotFoundFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: OrderNotFoundError, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const response = host.switchToHttp().getResponse();
    httpAdapter.setHeader(response, 'Content-Type', 'application/problem+json');
    httpAdapter.reply(
      response,
      { type: 'about:blank', title: 'Not Found', status: 404, detail: exception.message },
      404,
    );
  }
}
```

Register it for the whole application as an `APP_FILTER` provider in the root module, which lets it inject other providers:

```typescript
@@filename(app.module)
providers: [{ provide: APP_FILTER, useClass: OrderNotFoundFilter }],
```

`HttpException` and its subclasses, such as `NotFoundException` and `ConflictException`, are the exceptions Nest turns into responses by itself, with their status. Any other exception becomes a `500`. See [Exception filters](/exception-filters).

#### Authentication and authorization

With `@nestjs/authentication`, every route requires a signed-in user from the moment the module is registered, as with a fallback policy that requires an authenticated user. A credential provider, the counterpart of an authentication handler, reads a session cookie, a bearer token or an API key and loads the user. `@Public()` opens a route, like `[AllowAnonymous]`, and `@CurrentUser()` injects the user, where a controller would read `User`:

```csharp
// MeController.cs
[ApiController]
[Authorize]
[Route("me")]
public class MeController : ControllerBase
{
    [HttpGet]
    public IActionResult Me() => Ok(new { Id = User.FindFirstValue(ClaimTypes.NameIdentifier) });
}
```

```typescript
@@filename(users/me.controller)
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from './user.js';

@Controller('me')
export class MeController {
  @Get()
  me(@CurrentUser() user: User) {
    return user;
  }
}
```

The user is your own object, loaded by your code, rather than a `ClaimsPrincipal`. The package also covers much of what ASP.NET Core Identity and its endpoints do: sign-up and sign-in with hashed passwords, server-side sessions, email verification and password reset links, TOTP two-factor authentication, OpenID Connect sign-in, access and refresh tokens, and API keys. It keeps that state in your database through a store you write against documented interfaces, rather than through an Entity Framework schema. See [Authentication](/security/authentication).

`@nestjs/authorization` replaces authorization policies and requirement handlers with **policies**: classes whose methods decide whether a user may do something, type-checked against the routes that use them. Its guard denies by default, so a route that declares no check is closed:

```csharp
// ProductsController.cs
[HttpPost]
[Authorize(Policy = "Staff")]
public Task<Product> Create(CreateProductRequest request) => _productsService.CreateAsync(request);
```

```typescript
@@filename(products/product.policy)
import { Policy } from '@nestjs/authorization';
import type { User } from '../users/user.js';

@Policy()
export class ProductPolicy {
  create(user: User | null) {
    return !!user?.roles.includes('staff');
  }
}
```

```typescript
@@filename(products/products.controller)
@Post()
@Can(ProductPolicy, 'create')
create(@Body() dto: CreateProductDto) {
  return this.productsService.create(dto);
}
```

Resource-based authorization, which ASP.NET Core does with `IAuthorizationService.AuthorizeAsync(User, resource, policy)`, works the same way: inject `AuthorizationService` and call `authorize()` with the policy, the ability, the user and the record. See [Authorization](/security/authorization).

#### Configuration and options

ASP.NET Core reads `appsettings.json`, a file per environment such as `appsettings.Production.json`, and environment variables. `@nestjs/config` reads `.env` files and environment variables, with the environment winning over the files, and validates them at startup, like `ValidateOnStart()`:

```json
{
  "Orders": {
    "PageSize": 20,
    "PaymentsUrl": "https://payments.example.com"
  }
}
```

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import ordersConfig from './orders/orders.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      validationSchema: z.object({
        ORDERS_PAGE_SIZE: z.coerce.number().int().positive().default(20),
        PAYMENTS_URL: z.url(),
      }),
      load: [ordersConfig],
    }),
  ],
})
export class AppModule {}
```

With several files in `envFilePath`, the first one that defines a variable wins, so `.env.production` overrides `.env`, as `appsettings.Production.json` overrides `appsettings.json`. `NODE_ENV` plays the role of `ASPNETCORE_ENVIRONMENT`. Keep secrets out of committed files, as you would with user secrets.

`IConfiguration["Orders:PageSize"]` becomes `ConfigService.get()`, or `getOrThrow()` for a required value. For a typed group of settings, the counterpart of `IOptions<OrdersOptions>`, `registerAs()` declares a namespace, and `ConfigType` types it where it's injected:

```typescript
@@filename(orders/orders.config)
import { registerAs } from '@nestjs/config';

export default registerAs('orders', () => ({
  pageSize: Number(process.env.ORDERS_PAGE_SIZE ?? 20),
  paymentsUrl: process.env.PAYMENTS_URL!,
}));
```

```typescript
@@filename(orders/orders.service)
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import ordersConfig from './orders.config.js';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ordersConfig.KEY)
    private readonly config: ConfigType<typeof ordersConfig>,
  ) {}
}
```

See [Configuration](/application/configuration).

#### Data access

Entity Framework Core's entities map most directly to TypeORM, through `@nestjs/typeorm`. An entity is a decorated class, and the module registers a repository for it:

```csharp
// Order.cs
public class Order
{
    public Guid Id { get; set; }
    public required string CustomerId { get; set; }
    public OrderStatus Status { get; set; }
}
```

```typescript
@@filename(orders/order.entity)
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'paid' | 'shipped';
}
```

```typescript
@@filename(orders/orders.module)
@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
```

```typescript
@@filename(orders/orders.service)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity.js';

@Injectable()
export class OrdersService {
  constructor(@InjectRepository(Order) private readonly orders: Repository<Order>) {}

  findPending(customerId: string) {
    return this.orders.findBy({ customerId, status: 'pending' });
  }
}
```

There's no `DbContext` and no LINQ. A repository per entity takes the place of a `DbSet<T>`, queries take an object of conditions or go through a query builder, and there's no `SaveChanges()` that flushes tracked changes: `save()`, `insert()` and `update()` write when you call them. `@InjectRepository(Order)` names the entity because generic type arguments don't exist at runtime, so Nest can't tell `Repository<Order>` from `Repository<Customer>` by the type alone.

A transaction runs its queries inside a callback, and commits when the callback resolves and rolls back when it throws, as a `using var transaction = ...` block with `CommitAsync()` would:

```typescript
@@filename(orders/orders.service)
// constructor(private readonly dataSource: DataSource) {}, from 'typeorm'
async place(dto: CreateOrderDto) {
  return this.dataSource.transaction(async (manager) => {
    const order = await manager.save(Order, { customerId: dto.customerId });
    await manager.insert(OrderItem, dto.items.map((item) => ({ ...item, orderId: order.id })));
    return order;
  });
}
```

If you'd rather write typed SQL with inferred result types, [Drizzle](/data/drizzle) is the other first-party option. [Prisma](/data/prisma), [MikroORM](/data/mikroorm), whose unit of work and identity map are the closest to EF Core's change tracking, and [Mongoose](/data/mongodb) work too. `dotnet ef migrations` becomes the ORM's own migration tool. See [Data](/data/overview).

#### Background work

A `BackgroundService` runs alongside the web server. Nest covers its uses with three tools:

- **Work at startup and shutdown.** A provider implements `onApplicationBootstrap()` and `onApplicationShutdown()`, the counterparts of `StartAsync()` and `StopAsync()`. Nest runs the shutdown hooks on `SIGTERM` only after you call `app.enableShutdownHooks()` in `main.ts`, where the .NET host stops hosted services by default. See [Lifecycle events](/fundamentals/lifecycle-events).
- **Work on a timer.** `@Cron()`, `@Interval()` and `@Timeout()` from `@nestjs/schedule` replace a loop with a `PeriodicTimer`, and the recurring jobs of Hangfire or Quartz.NET.
- **Work handed off by a request.** `@nestjs/bullmq` puts jobs on a queue that workers consume, with retries and delays, as Hangfire's background jobs do.

```csharp
// InvoiceExportService.cs
public class InvoiceExportService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            // ...
        }
    }
}
```

```typescript
@@filename(invoices/invoice.jobs)
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class InvoiceJobs {
  @Cron(CronExpression.EVERY_HOUR)
  async exportInvoices() {
    // ...
  }
}
```

A scheduled job runs on every instance of the application. To run it on one instance only, add `@OnOneInstance()` from `@nestjs/locks`. See [Task scheduling](/application/task-scheduling), [Queues](/application/queues) and [Distributed locks](/reliability/locks).

In-process events, the role MediatR notifications often play, come from `@nestjs/event-emitter`, with `EventEmitter2.emit()` and `@OnEvent()`. For commands and queries in MediatR's style, see [CQRS](/recipes/cqrs).

#### Calling other services

`IHttpClientFactory` and typed clients become `HttpClient` from `@nestjs/http-client`, built on Node's `fetch`, with base URLs, timeouts, retries and named clients registered per module. Polly's timeouts, retries, circuit breakers and bulkheads become decorators from `@nestjs/resilience`. See [HTTP client](/application/http-client) and [Resilience](/reliability/resilience).

#### Health checks and observability

`AddHealthChecks()` and `MapHealthChecks()` become a controller that uses `@nestjs/terminus`, with indicators for databases, HTTP dependencies, disk and memory:

```typescript
@@filename(health/health.controller)
import { Controller, Get } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
```

`@Public()` is only needed with `@nestjs/authentication`, which closes every route by default. See [Health checks](/reliability/terminus).

`ILogger<OrdersService>` becomes `new Logger(OrdersService.name)`, and `ConsoleLogger` with the `json` option writes structured JSON logs. See [Logger](/application/logger). For traces, errors and metrics of the running application, the role Application Insights plays for many ASP.NET Core applications, see [NestJS Observe](/observability/overview).

#### OpenAPI

Swashbuckle, NSwag and `Microsoft.AspNetCore.OpenApi` become `@nestjs/swagger`, which builds the document from controllers and DTOs and serves Swagger UI:

```typescript
@@filename(main)
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder().setTitle('Orders API').setVersion('1.0').build();
SwaggerModule.setup('api', app, () => SwaggerModule.createDocument(app, config));
```

Swagger UI is then at `/api`. The [CLI plugin](/openapi/cli-plugin) reads property types and optionality from the TypeScript source at build time, as the C# compiler gives Swashbuckle the types by reflection, so DTOs don't need an `@ApiProperty()` on every field. Zod and other Standard Schema schemas describe the document too. See [OpenAPI](/openapi/introduction).

#### Testing

`WebApplicationFactory<Program>` becomes a testing module, and the `HttpClient` it creates becomes [Supertest](https://github.com/ladjs/supertest). A testing module that imports `AppModule` starts the whole application, and `overrideProvider()` replaces a provider in it, as `ConfigureTestServices()` does:

```csharp
// OrdersTests.cs
public class OrdersTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task ReturnsAnOrder()
    {
        var client = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
            services.AddSingleton<IOrdersService>(new FakeOrdersService()))).CreateClient();

        var order = await client.GetFromJsonAsync<Order>("/orders/42");
        Assert.Equal("42", order!.Id);
    }
}
```

```typescript
const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(OrdersService)
  .useValue(new FakeOrdersService())
  .compile();
```

A testing module can also hold just the parts a test needs. The test below creates only the controller, with a fake service in place of the real one, so it needs no database:

```typescript
@@filename(src/orders/orders.controller.spec)
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { vi } from 'vitest';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

describe('OrdersController', () => {
  let app: INestApplication;
  const ordersService = { findOne: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('returns an order', async () => {
    ordersService.findOne.mockResolvedValue({ id: '42', customerId: 'c-1', status: 'pending' });
    const response = await request(app.getHttpServer()).get('/orders/42').expect(200);
    expect(response.body.id).toBe('42');
  });
});
```

New projects use [Vitest](https://vitest.dev/) as the test runner, in place of xUnit and Moq. Unit tests can also create the class under test with `new` and pass fakes to its constructor, since a provider is a plain class. See [Testing](/fundamentals/testing).

#### What's different

The mappings above hold for structure. These are the differences that change how you write code.

**One thread, an event loop, no thread pool.** `async` and `await` look the same in TypeScript and C#, and I/O works the same way: while a request awaits the database, others run. The difference is what runs your code. ASP.NET Core schedules continuations on a thread pool, so CPU-bound work in one request takes one thread. Node.js runs all of your JavaScript on one thread, so CPU-heavy work in a handler, such as hashing a large file or a long synchronous loop, stalls every other request in the process. There's no `Task.Run()` to push it elsewhere: move it to a [queue](/application/queues) or a worker thread, and run several processes or containers to use several cores. There's also no `SynchronizationContext` and no `ConfigureAwait(false)` to think about.

**No `CancellationToken` by default.** ASP.NET Core binds `HttpContext.RequestAborted` to a `CancellationToken` parameter. A Nest handler gets no cancellation signal unless it asks for one. The JavaScript counterpart is an `AbortSignal`: `@Signal()` from [`@nestjs/resilience`](/reliability/resilience) injects one that aborts when the route's time budget runs out, `@SseSignal()` injects one for a [Server-Sent Events](/http/server-sent-events) stream, and the [HTTP client](/application/http-client) and `fetch()` accept it.

**Dependency injection runs on decorator metadata.** The TypeScript compiler records the constructor parameter types of decorated classes (`emitDecoratorMetadata`), and Nest reads them when the application starts. Interfaces and generic type arguments don't survive compilation, which is why injection uses classes, abstract classes or tokens, and why a repository is injected with `@InjectRepository(Order)` rather than by its generic type.

**Types are a compile-time check.** System.Text.Json creates the type an action declares, and model binding validates it. In Nest, a request body is plain JSON, and only a [validation pipe](/application/validation) checks and converts it. The same applies to anything that crosses a process boundary: a database row, a queue message, the response of another service.

**Decorators are functions.** A C# attribute is passive metadata that the framework reads by reflection. A TypeScript decorator is a function that runs when the class is defined, and Nest's decorators use it to record the metadata it reads later. Nest uses TypeScript's `experimentalDecorators`, which generated projects enable for you.

**Numbers are doubles.** JavaScript's `number` is a 64-bit float, and there's no `decimal`. Keep money in integer cents, or use a decimal library and your database's `numeric` type, which most drivers return as a string.

**ES modules and npm.** Nest 12 packages are ES modules, and a project generated as ESM imports local files with a `.js` extension, even from `.ts` files, because that's the name of the compiled file. npm and `package.json` take the place of NuGet and the `.csproj`, `tsc` or [SWC](/recipes/swc) the place of the C# compiler, and the build output is plain JavaScript that runs on Node.js. See [ESM packages](/migration-guide#esm-packages).
