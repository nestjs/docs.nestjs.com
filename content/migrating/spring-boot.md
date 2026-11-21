### Coming from Spring Boot

Nest is built on the ideas a Spring Boot developer already works with: a dependency injection container, constructor injection, controllers and services, configuration classes, and decorators that read like annotations. Configuration, validation, security, scheduling, health checks and OpenAPI come from first-party packages. What changes is the language, TypeScript, and the runtime, Node.js.

This page maps Spring Boot concepts to their Nest equivalents, with short code side by side. It ends with [what's different](/migrating/spring-boot#whats-different), which matters more than the syntax.

#### At a glance

| Spring Boot | Nest | Read more |
| --- | --- | --- |
| `@SpringBootApplication`, `SpringApplication.run()` | A root module and `NestFactory.create()` | [First steps](/first-steps) |
| `@Component`, `@Service`, `@Repository` | `@Injectable()` classes, listed in a module's `providers` | [Providers](/providers) |
| `@Configuration` and `@Bean` | Modules and factory providers (`useFactory`) | [Custom providers](/fundamentals/custom-providers) |
| Auto-configuration and starters | Dynamic modules, such as `ConfigModule.forRoot()` | [Dynamic modules](/fundamentals/dynamic-modules) |
| Bean scopes: singleton, prototype, request | Injection scopes: `DEFAULT`, `TRANSIENT`, `REQUEST` | [Injection scopes](/fundamentals/injection-scopes) |
| `@PostConstruct`, `@PreDestroy`, `ApplicationRunner` | `onModuleInit()`, `onApplicationShutdown()`, `onApplicationBootstrap()` | [Lifecycle events](/fundamentals/lifecycle-events) |
| `@RestController`, `@GetMapping`, `@PathVariable` | `@Controller()`, `@Get()`, `@Param()` | [Controllers](/controllers) |
| Bean Validation (`@Valid`, `@NotBlank`) | Pipes, with class-validator DTOs or a Standard Schema such as Zod | [Validation](/application/validation) |
| `@ControllerAdvice`, `@ExceptionHandler` | Exception filters | [Exception filters](/exception-filters) |
| Servlet filters | Middleware | [Middleware](/middleware) |
| `HandlerInterceptor`, `@Around` advice | Interceptors and guards | [Interceptors](/interceptors), [Guards](/guards) |
| Spring Security | `@nestjs/authentication` and `@nestjs/authorization` | [Authentication](/security/authentication), [Authorization](/security/authorization) |
| `application.yml`, `@Value`, `@ConfigurationProperties`, profiles | `@nestjs/config` | [Configuration](/application/configuration) |
| Spring Data JPA | `@nestjs/typeorm`, `@nestjs/drizzle` and other ORMs | [Data](/data/overview) |
| `@Scheduled` | `@nestjs/schedule` | [Task scheduling](/application/task-scheduling) |
| ShedLock | `@nestjs/locks` | [Distributed locks](/reliability/locks) |
| `ApplicationEventPublisher`, `@EventListener` | `@nestjs/event-emitter` | [Events](/application/events) |
| `RestClient`, `WebClient` | `@nestjs/http-client` | [HTTP client](/application/http-client) |
| Resilience4j | `@nestjs/resilience` | [Resilience](/reliability/resilience) |
| Actuator health endpoints | `@nestjs/terminus` | [Health checks](/reliability/terminus) |
| springdoc-openapi | `@nestjs/swagger` | [OpenAPI](/openapi/introduction) |
| SLF4J and Logback | `Logger` from `@nestjs/common` | [Logger](/application/logger) |
| `@SpringBootTest`, `@WebMvcTest`, MockMvc, `@MockitoBean` | `@nestjs/testing` and Supertest | [Testing](/fundamentals/testing) |
| Spring WebSocket | Gateways | [Gateways](/websockets/gateways) |
| Spring for Apache Kafka, Spring AMQP | `@nestjs/microservices` | [Microservices](/microservices/basics) |

#### Start a project

Spring Initializr generates a project with a main class. The Nest CLI does the same:

```bash
$ npm i -g @nestjs/cli
$ nest new orders-api
```

The entry point of a Spring Boot application:

```java
// OrdersApplication.java
@SpringBootApplication
public class OrdersApplication {
  public static void main(String[] args) {
    SpringApplication.run(OrdersApplication.class, args);
  }
}
```

The entry point of a Nest application:

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

`npm run start:dev` starts the application and restarts it when a file changes, like Spring Boot DevTools. `nest generate` (or `nest g`) adds a module, controller or service with its test file, and `nest g resource orders` generates the whole CRUD slice. See [CLI usages](/cli/usages).

#### Beans become providers

A Spring bean is a class the container creates and injects. In Nest, it's a **provider**: a class decorated with `@Injectable()`. Constructor injection works the same way, and needs no `@Autowired`:

```java
// OrdersService.java
@Service
public class OrdersService {
  private final OrdersRepository ordersRepository;

  public OrdersService(OrdersRepository ordersRepository) {
    this.ordersRepository = ordersRepository;
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

`private readonly` in the constructor declares and assigns the field in one step, so the class body stays empty.

There's no component scanning. Spring finds `@Service` classes on the classpath; Nest creates only the providers a module lists. Every provider belongs to a **module**:

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

Modules are also a boundary that Spring's application context doesn't have. A provider is visible only inside its own module, unless the module lists it in `exports` and another module adds the module to its `imports`. `@Import` in Spring merges configuration into one context; `imports` in Nest makes the exported providers of another module available, and nothing else. See [Modules](/modules).

When a dependency can't be resolved, the application fails at startup with an error that names the class, the missing dependency and the module, much as Spring fails on an unsatisfied dependency.

##### Interfaces and qualifiers

In Spring, a constructor can ask for an interface, and the container finds the bean that implements it. TypeScript interfaces are erased during compilation, so Nest can't see them at runtime. Use an **abstract class** as the contract instead. It exists at runtime, so it works as the injection token:

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

A class that needs it declares `private readonly paymentGateway: PaymentGateway` in its constructor, as with any other provider. Where Spring uses `@Qualifier` to pick one of several beans of the same type, Nest uses a string or `Symbol` token and the `@Inject()` decorator. See [Interfaces and abstract classes](/fundamentals/custom-providers#interfaces-and-abstract-classes).

#### `@Configuration` and `@Bean` become factory providers

A `@Bean` method builds an object that isn't a class you own, or that needs setup:

```java
// StorageConfig.java
@Configuration
public class StorageConfig {
  @Bean
  public S3Client s3Client(StorageProperties properties) {
    return S3Client.builder().region(Region.of(properties.region())).build();
  }
}
```

In Nest, it's a **factory provider**. `inject` lists the providers that are passed to the factory, in order:

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

The factory can be `async`, and Nest waits for it before it creates the providers that depend on it. See [Factory providers](/fundamentals/custom-providers#factory-providers-usefactory) and [Asynchronous providers](/fundamentals/async-providers).

Spring Boot starters configure themselves from the classpath and properties. Nest packages ship **dynamic modules** that you import and configure explicitly: `ConfigModule.forRoot()`, `TypeOrmModule.forRootAsync()`, `ScheduleModule.forRoot()`. Nothing is configured by being installed.

#### Scopes and lifecycle

| Spring | Nest |
| --- | --- |
| Singleton (default) | `Scope.DEFAULT` (default) |
| `@Scope("prototype")` | `Scope.TRANSIENT`: a new instance for each class that injects it |
| `@RequestScope` | `Scope.REQUEST` |
| `@PostConstruct` | `onModuleInit()` |
| `ApplicationRunner`, `ApplicationReadyEvent` | `onApplicationBootstrap()` |
| `@PreDestroy` | `onModuleDestroy()`, `onApplicationShutdown()` |

A request-scoped bean in Spring is injected into singletons through a proxy. Nest has no proxies: a provider that injects a request-scoped provider becomes request-scoped too, up to the controller, and each request creates the whole chain again. Keep providers singletons. When a provider needs something from the current request, such as the user or the tenant, read it from an `AsyncLocalStorage` store, which plays the role of a `ThreadLocal`. See [Async local storage](/recipes/async-local-storage).

Spring Boot registers a JVM shutdown hook, so `@PreDestroy` methods run on `SIGTERM` without any setup. Nest runs `onModuleDestroy()` and `onApplicationShutdown()` on a signal only after you call `app.enableShutdownHooks()` in `main.ts`. See [Application shutdown](/fundamentals/lifecycle-events#application-shutdown).

#### Controllers

A Spring controller:

```java
// OrdersController.java
@RestController
@RequestMapping("/orders")
public class OrdersController {
  private final OrdersService ordersService;

  public OrdersController(OrdersService ordersService) {
    this.ordersService = ordersService;
  }

  @GetMapping
  public List<Order> findAll(@RequestParam(defaultValue = "0") int page) {
    return ordersService.findAll(page);
  }

  @GetMapping("/{id}")
  public Order findOne(@PathVariable String id) {
    return ordersService.findOne(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Order create(@Valid @RequestBody CreateOrderRequest request) {
    return ordersService.create(request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void remove(@PathVariable String id) {
    ordersService.remove(id);
  }
}
```

The same controller in Nest:

```typescript
@@filename(orders/orders.controller)
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
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
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
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

- Route parameters are written `:id`, where Spring wraps the name in braces.
- A `POST` handler answers `201 Created` by default, and every other method `200 OK`. `@HttpCode()` changes it.
- Handlers can be `async` and return a `Promise`. Nest waits for it and serializes the result as JSON, as Spring does with Jackson.
- Query and route parameters arrive as strings. `ParseIntPipe` converts and validates one, as Spring's type conversion does.
- There's no `ResponseEntity`. Return the body, set headers with `@Header()`, and throw an exception for an error status, such as `throw new NotFoundException()`. See [Built-in HTTP exceptions](/exception-filters#built-in-http-exceptions).

The controller is listed in its module's `controllers`, not discovered.

#### Validation

Spring validates a `@Valid` request body with Bean Validation annotations:

```java
// CreateOrderRequest.java
public record CreateOrderRequest(
  @NotBlank String customerId,
  @NotEmpty List<@Valid OrderItem> items,
  @Size(max = 500) String note
) {}
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

Bind the pipe once for the whole application, the equivalent of `@Valid` on every body:

```typescript
@@filename(main)
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

`whitelist` drops properties the DTO doesn't declare, and `transform` turns the body into an instance of the DTO class. An invalid body gets a `400 Bad Request` that lists every failed rule.

Alternatively, describe the body with a [Standard Schema](https://standardschema.dev/) library such as Zod, and the parameter's type is inferred from the schema. Bind `StandardSchemaValidationPipe` globally, and pass the schema with the `schema` option of `@Body()`:

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

See [Validation](/application/validation) for both pipes.

#### Exception handling

A `@RestControllerAdvice` maps exceptions to responses:

```java
// ApiExceptionHandler.java
@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(OrderNotFoundException.class)
  public ProblemDetail handle(OrderNotFoundException exception) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
  }
}
```

In Nest, it's an **exception filter**. `@Catch()` names the exception classes it handles:

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

`HttpException` and its subclasses, such as `NotFoundException` and `ConflictException`, play the role of `ResponseStatusException`: throw one anywhere, and the built-in filter turns it into a JSON response with its status. Any other exception becomes a `500`. See [Exception filters](/exception-filters).

#### Filters, interceptors and aspects

Spring has servlet filters, `HandlerInterceptor`s and AOP advice. Nest has four kinds of components around a route handler, and runs them in this order:

| Nest | Runs | Spring counterpart |
| --- | --- | --- |
| [Middleware](/middleware) | Before routing, with the raw request and response | Servlet `Filter`, `OncePerRequestFilter` |
| [Guards](/guards) | After routing, to decide whether the handler runs | The authorization part of the security filter chain, `HandlerInterceptor.preHandle()` returning `false` |
| [Interceptors](/interceptors) | Around the handler, with access to its result | `HandlerInterceptor`, `@Around` advice on controllers |
| [Pipes](/pipes) | On each argument, before the handler | Type conversion and validation |
| [Exception filters](/exception-filters) | When anything above throws | `@ControllerAdvice` |

An interceptor that logs how long each request took:

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

Interceptors wrap route handlers (and message and event handlers in microservices and gateways), not arbitrary methods. There's no general-purpose AOP: no `@Transactional`, `@Cacheable` or `@Retryable` on a method of any bean. Nest packages cover those cases on route handlers, such as `CacheInterceptor` in [Caching](/data/caching) and `@Retry()` in [Resilience](/reliability/resilience), and with an explicit API inside services, such as Resilience's policy objects and the transaction callback in [Data access](/migrating/spring-boot#data-access) below.

#### Security

With `@nestjs/authentication`, every route requires a signed-in user from the moment the module is registered, as with Spring Security's `anyRequest().authenticated()`. A credential provider, the counterpart of an `AuthenticationProvider`, reads a session cookie, a bearer token or an API key and loads the user. `@Public()` opens a route, like `permitAll()`, and `@CurrentUser()` injects the user, like `@AuthenticationPrincipal`:

```java
// MeController.java
@RestController
public class MeController {
  @GetMapping("/me")
  public User me(@AuthenticationPrincipal User user) {
    return user;
  }
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

Besides server-side sessions, password hashing and OpenID Connect sign-in, the package ships flows that Spring applications usually write themselves, such as sign-up, email verification and password reset links, TOTP two-factor authentication, rotating refresh tokens and API keys that users create and revoke. See [Authentication](/security/authentication).

For method security, `@nestjs/authorization` replaces `@PreAuthorize` expressions with **policies**: classes whose methods decide whether a user may do something, type-checked against the routes that use them. Like the authentication guard, its guard denies by default, so a route that declares no check is closed:

```java
// ProductsController.java
@PostMapping
@PreAuthorize("hasRole('STAFF')")
public Product create(@Valid @RequestBody CreateProductRequest request) {
  return productsService.create(request);
}
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

Checks that depend on a record, such as "customers see only their own orders", go in the service with `AuthorizationService.authorize()`, much like `@PostAuthorize`. See [Authorization](/security/authorization).

#### Configuration and profiles

Spring Boot reads `application.yml`, profile-specific files and environment variables. `@nestjs/config` reads `.env` files and environment variables, with the environment winning over the files, and validates them at startup:

```yaml
# application.yml
orders:
  page-size: 20
  payments-url: https://payments.example.com
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

With several files in `envFilePath`, the first one that defines a variable wins, so `.env.production` overrides `.env`, as `application-prod.yml` overrides `application.yml`. Nest has no profiles of its own; `NODE_ENV` is the usual switch.

`@Value` becomes `ConfigService.get()`, or `getOrThrow()` for a required value. For a typed group of settings, the counterpart of a `@ConfigurationProperties` class, `registerAs()` declares a namespace, and `ConfigType` types it where it's injected:

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

`@ConditionalOnProperty` has a counterpart in `ConditionalModule.registerWhen()`, which imports a module only when an environment variable allows it. See [Configuration](/application/configuration).

#### Data access

Spring Data JPA's entities and repositories map most directly to TypeORM, through `@nestjs/typeorm`. An entity is a decorated class, and the module registers a repository for it:

```java
// Order.java
@Entity
@Table(name = "orders")
public class Order {
  @Id @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String customerId;

  @Enumerated(EnumType.STRING)
  private OrderStatus status;
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

There are no derived query methods: `findByCustomerIdAndStatus()` becomes `findBy()` with an object of conditions, and anything more complex goes through TypeORM's query builder. `@InjectRepository(Order)` names the entity because generic type arguments don't exist at runtime, so Nest can't tell `Repository<Order>` from `Repository<Customer>` by the type alone.

There's no `@Transactional` either. Run the queries of a transaction inside a callback, and they commit when it resolves and roll back when it throws:

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

If you'd rather write typed SQL than map entities, [Drizzle](/data/drizzle) is the other first-party option, closer to jOOQ than to JPA. [Prisma](/data/prisma), [MikroORM](/data/mikroorm), whose unit of work is the closest to a JPA persistence context, and [Mongoose](/data/mongodb) work too. Flyway and Liquibase migrations become the ORM's own migration tool. See [Data](/data/overview).

#### Scheduling, events and background work

`@Scheduled` becomes `@Cron()`, `@Interval()` or `@Timeout()` from `@nestjs/schedule`. Both use six-field cron expressions with seconds first, although in Nest the seconds field is optional:

```java
// InvoiceJobs.java
@Scheduled(cron = "0 0 2 * * *")
public void exportInvoices() { ... }
```

```typescript
@@filename(invoices/invoice.jobs)
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class InvoiceJobs {
  @Cron('0 0 2 * * *')
  async exportInvoices() {
    // ...
  }
}
```

A scheduled job runs on every instance of the application, as `@Scheduled` does. Where Spring applications use ShedLock, add `@OnOneInstance()` from `@nestjs/locks`. See [Task scheduling](/application/task-scheduling) and [Distributed locks](/reliability/locks).

`ApplicationEventPublisher` and `@EventListener` become `EventEmitter2.emit()` and `@OnEvent()` from `@nestjs/event-emitter`. `@Async` has no counterpart, because I/O in Node.js is already asynchronous: an `async` method that awaits a database or an HTTP call doesn't hold a thread while it waits. Work that should leave the request entirely, such as sending emails or generating reports, goes to a queue with `@nestjs/bullmq`. See [Events](/application/events) and [Queues](/application/queues).

#### Calling other services

`RestClient` and `WebClient` become `HttpClient` from `@nestjs/http-client`, built on Node's `fetch`, with base URLs, timeouts, retries and named clients. Resilience4j's timeouts, retries, circuit breakers and bulkheads become decorators from `@nestjs/resilience`. See [HTTP client](/application/http-client) and [Resilience](/reliability/resilience).

#### Health checks and observability

Actuator's health endpoints become a controller that uses `@nestjs/terminus`, with indicators for databases, HTTP dependencies, disk and memory:

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

`@Public()` is only needed with `@nestjs/authentication`, which closes every route by default. See [Health checks](/reliability/terminus). For traces, errors and metrics of the running application, the role Micrometer and an APM agent play in Spring, see [NestJS Observe](/observability/overview).

#### OpenAPI

springdoc-openapi becomes `@nestjs/swagger`, which builds the document from controllers and DTOs and serves Swagger UI:

```typescript
@@filename(main)
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder().setTitle('Orders API').setVersion('1.0').build();
SwaggerModule.setup('api', app, () => SwaggerModule.createDocument(app, config));
```

Swagger UI is then at `/api`. The [CLI plugin](/openapi/cli-plugin) reads property types and optionality from the TypeScript source at build time, so DTOs don't need an `@ApiProperty()` on every field. Zod and other Standard Schema schemas describe the document too. See [OpenAPI](/openapi/introduction).

#### Testing

A testing module with [Supertest](https://github.com/ladjs/supertest) takes the place of MockMvc. Like `@WebMvcTest`, the test below creates only the controller, with a fake service in place of the real one:

```java
// OrdersControllerTest.java
@WebMvcTest(OrdersController.class)
class OrdersControllerTest {
  @Autowired MockMvc mvc;
  @MockitoBean OrdersService ordersService;

  @Test
  void returnsAnOrder() throws Exception {
    when(ordersService.findOne("42")).thenReturn(new Order("42", "c-1", OrderStatus.PENDING));
    mvc.perform(get("/orders/42")).andExpect(status().isOk()).andExpect(jsonPath("$.id").value("42"));
  }
}
```

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

For the counterpart of `@SpringBootTest`, import `AppModule` instead, and replace providers with `overrideProvider()`, as `@MockitoBean` does. New projects use [Vitest](https://vitest.dev/) as the test runner, in place of JUnit and Mockito. Unit tests can also create the class under test with `new` and pass fakes to its constructor, since a provider is a plain class. See [Testing](/fundamentals/testing).

#### What's different

The mappings above hold for structure. These are the differences that change how you write code.

**One thread, an event loop, no thread pool.** A Spring MVC application gives each request a thread, and a blocked thread blocks only its own request. Node.js runs your code on one thread, and while a request waits for the database, others run. That makes I/O cheap: thousands of concurrent requests need no thread pool tuning, much like WebFlux or virtual threads. But CPU-heavy work in a handler, such as hashing a large file or a long synchronous loop, stalls every other request in the process. Move it to a [queue](/application/queues) or a worker thread, and run several processes or containers to use several cores. Database drivers and HTTP clients are asynchronous, so I/O code is `await`ed rather than blocking.

**No `ThreadLocal`.** Requests share one thread, so per-request state lives in `AsyncLocalStorage`, which follows the request through `await`s. See [Async local storage](/recipes/async-local-storage).

**Dependency injection runs on decorator metadata.** The TypeScript compiler records the constructor parameter types of decorated classes (`emitDecoratorMetadata`), and Nest reads them when the application starts. There's no classpath scanning, no bytecode generation and no proxies. Interfaces and generic type arguments don't survive compilation, which is why injection uses classes, abstract classes or tokens. The upside of having no proxies is that there's no self-invocation trap: a method calling another method of the same class behaves like any method call.

**Types are a compile-time check.** Jackson creates the class a handler declares and Bean Validation checks it. In Nest, a request body is plain JSON, and only a [validation pipe](/application/validation) checks and converts it. The same applies to anything that crosses a process boundary: a database row, a queue message, the response of another service.

**Decorators are functions.** A Java annotation is passive metadata that a framework reads by reflection. A TypeScript decorator is a function that runs when the class is defined, and Nest's decorators use it to record the metadata it reads later. Nest uses TypeScript's `experimentalDecorators`, which generated projects enable for you.

**Numbers are doubles.** JavaScript's `number` is a 64-bit float, and there's no `BigDecimal`. Keep money in integer cents, or use a decimal library and your database's `numeric` type, which most drivers return as a string.

**ES modules and npm.** Nest 12 packages are ES modules, and a project generated as ESM imports local files with a `.js` extension, even from `.ts` files, because that's the name of the compiled file. npm and `package.json` take the place of Maven or Gradle, `tsc` or [SWC](/recipes/swc) the place of `javac`, and the build output is plain JavaScript that runs on Node.js, with no JVM to tune. See [ESM packages](/migration-guide#esm-packages).

**Fewer decisions are made for you by the classpath.** Nothing is configured because a package is installed. Each module you use is imported and configured in code, so what an application does at startup can be read from its modules.
