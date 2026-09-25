### Resilience

Sooner or later, every application that calls another system meets one that is slow or down. Without a plan, a slow dependency ties up your request handlers, your clients wait until their own timeouts fire, and retries from every layer pile even more load onto the service that is already struggling.

`@nestjs/resilience` gives you the usual tools as decorators: **retry**, **timeout**, **circuit breaker**, **bulkhead** and **fallback**. They apply to your application's **entrypoints**, which are controllers, GraphQL resolvers, microservice message handlers and WebSocket gateways. For code inside services, the same settings are available as policy objects. A single global interceptor applies the decorators, so they behave the same on every transport, and each failure becomes that transport's native error. Over HTTP, for example, a timeout answers `504 Gateway Timeout` and an open breaker answers `503 Service Unavailable` with a `Retry-After` header.

In this tutorial you'll harden the order API of an online store for cat food and supplies. Checkout asks the shipping carrier for quotes, and the carrier's quotes API is slow at the best of times and occasionally down. By the end, a slow carrier costs checkout about three seconds at most. Once the carrier is known to be down, checkout stops waiting for it altogether: customers see flat-rate shipping instead of an error, and a background job stops calling the carrier until it recovers.

#### Prerequisites

This tutorial assumes an `OrdersModule` that exports an `OrdersService`. The service needs these methods: `findOne(id)` (which throws `NotFoundException` for an unknown id), `findAll()`, `update(id, changes)` and `exportCsv()`. Orders look like this:

```typescript
@@filename(orders/order)
export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid' | 'shipped';
}

export function subtotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

Install the package:

```bash
$ npm i --save @nestjs/resilience
```

[Retry a POST safely](/reliability/resilience#retry-a-post-safely) also uses `@nestjs/idempotency` (see [Idempotency keys](/reliability/idempotency)).

#### Register the module

Import `ResilienceModule` into the root module. Configure field defaults and one named preset, `carrier`, that describes how the application should treat the carrier:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ResilienceModule } from '@nestjs/resilience';
import { OrdersModule } from './orders/orders.module.js';
import { ShippingModule } from './shipping/shipping.module.js';

@Module({
  imports: [
    ResilienceModule.forRoot({
      defaults: {
        timeout: '5s',
        retry: { attempts: 3, backoff: { delay: '200ms', maxDelay: '2s' } },
      },
      presets: {
        carrier: {
          timeout: '2s',
          retry: { attempts: 2 },
          circuitBreaker: { failureRateThreshold: 50, minimumCalls: 10, openDuration: '30s' },
        },
      },
    }),
    OrdersModule,
    ShippingModule,
  ],
})
export class AppModule {}
```

The two options do different jobs:

- `defaults` fills in the fields of any stage that a decorator or preset turns on. Defaults never turn a stage on themselves. Here, a retry first waits a random time between 0 and 200 ms (the `delay`), then up to 400 ms, doubling each time up to 2 s (the `maxDelay`). A bare `@Timeout()` means 5 seconds.
- `presets` holds named sets of stages, usually one per dependency. The `carrier` preset gives each attempt 2 seconds, makes at most 2 attempts, and adds a circuit breaker. That breaker is **shared under the name `carrier`** by every route, handler and service that uses the preset. The carrier is one dependency, so it gets one breaker.

Every time-valued option takes milliseconds or a string such as `'200ms'`, `'2s'` or `'30s'`.

The module is global, so import it once, in the root module. It registers one app-wide interceptor, which does nothing for handlers without resilience decorators apart from error mapping. It checks its configuration at bootstrap: an unknown preset name, an invalid duration or number (such as the `NaN` of an unset environment variable), a missing fallback method or one breaker name configured in two different ways fails the boot instead of the first request. Use `ResilienceModule.forRootAsync()` to build the options from configuration.

#### Put a time budget on the quotes route

Start with a client for the carrier. Every method takes an `AbortSignal` and hands it to `fetch()`:

```typescript
@@filename(shipping/carrier.client)
import { Injectable } from '@nestjs/common';
import type { Order } from '../orders/order.js';

export interface ShippingQuote {
  service: string;
  price: number;
  estimatedDays: number;
}

export interface Shipment {
  id: string;
  reference: string;
  trackingNumber: string;
}

export class CarrierError extends Error {
  constructor(readonly status: number) {
    super(`The carrier answered with status ${status}`);
  }
}

@Injectable()
export class CarrierClient {
  private readonly baseUrl = process.env.CARRIER_URL ?? 'https://api.carrier.example.com';

  getQuotes(order: Order, signal: AbortSignal): Promise<ShippingQuote[]> {
    return this.post('/v2/quotes', { reference: order.id, items: order.items }, signal);
  }

  /** The carrier returns the existing shipment when it has seen the reference before. */
  createShipment(order: Order, signal: AbortSignal): Promise<Shipment> {
    return this.post('/v2/shipments', { reference: order.id, items: order.items }, signal);
  }

  private async post<T>(path: string, body: unknown, signal: AbortSignal): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok) throw new CarrierError(response.status);
    return (await response.json()) as T;
  }
}
```

The service passes the signal through. It also has a flat-rate price list and a booking method, which the circuit breaker and the retried POST use below:

```typescript
@@filename(shipping/shipping.service)
import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service.js';
import { CarrierClient, type Shipment, type ShippingQuote } from './carrier.client.js';

@Injectable()
export class ShippingService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly carrierClient: CarrierClient,
  ) {}

  async getQuotes(orderId: string, signal: AbortSignal): Promise<ShippingQuote[]> {
    const order = await this.ordersService.findOne(orderId);
    return this.carrierClient.getQuotes(order, signal);
  }

  flatRateQuotes(): ShippingQuote[] {
    return [{ service: 'flat-rate', price: 4.99, estimatedDays: 5 }];
  }

  async createShipment(orderId: string, signal: AbortSignal): Promise<Shipment> {
    const order = await this.ordersService.findOne(orderId);
    return this.carrierClient.createShipment(order, signal);
  }
}
```

Now the route. `@Resilience('carrier')` applies the preset, and `@Signal()` injects the current attempt's `AbortSignal`:

```typescript
@@filename(shipping/shipping.controller)
import { Controller, Get, Query } from '@nestjs/common';
import { Resilience, Signal, Timeout } from '@nestjs/resilience';
import { ShippingService } from './shipping.service.js';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('quotes')
  @Resilience('carrier')
  @Timeout('1.5s')
  getQuotes(@Query('orderId') orderId: string, @Signal() signal: AbortSignal) {
    return this.shippingService.getQuotes(orderId, signal);
  }
}
```

Register `CarrierClient` and `ShippingService` as providers, and `ShippingController` as a controller, of a `ShippingModule` that imports `OrdersModule`.

Checkout can't wait long, so `@Timeout('1.5s')` gives this route a tighter budget than the preset's. Settings resolve **stage by stage**: a decorator on the handler wins over the preset for its own stage, and the preset still supplies the retry and the breaker. A bare `@Timeout()` would take the preset's 2 seconds, and fall back to `defaults.timeout` only where no preset or class-level `@Timeout()` sets a duration.

When an attempt runs out of time, three things happen:

1. The attempt is rejected with a `ResilienceTimeoutError`.
2. The signal is aborted with that same error. `fetch()` rejects and closes the connection, so nothing keeps waiting for an answer nobody will read. Cancellation is cooperative: code that ignores the signal keeps running in the background, and its result is dropped.
3. Because `GET` is a safe method, the preset's retry makes a second attempt. Only the pipes, inner interceptors and handler run again. Guards and middleware run once per request.

If the second attempt times out as well, the client gets a `504`:

```json
{
  "statusCode": 504,
  "error": "Gateway Timeout",
  "message": "The operation timed out",
  "code": "TIMEOUT"
}
```

The timeout applies **per attempt**, so a carrier that hangs costs this route about 3.2 seconds: two attempts of 1.5 s plus up to 200 ms of backoff. The status is 504 rather than 408 on purpose. A 408 claims that the _client_ was too slow to send its request, and some clients and proxies repeat 408s automatically, even for `POST` requests.

Client errors are not failures. A request for an unknown order throws `NotFoundException` before the carrier is called. It answers 404, and it is neither retried nor counted by the breaker.

> info **Hint** Code that can't take the signal as a parameter can inject `ResilienceContext` and read its `signal` and `attempt`. It reads the current attempt from `AsyncLocalStorage`, so it works in any service the handler calls, on every transport. A policy object used inside the attempt inherits its signal too, so the route's timeout also stops that policy's retries.

#### Fail fast with a circuit breaker

The preset's breaker records the outcome of every attempt. The `carrier` breaker opens once it has seen at least `minimumCalls` (10) calls, and at least `failureRateThreshold` (50%) of them failed. By default it looks at the last 20 calls. Every error counts as a failure, timeouts included, except client errors and rejections from other policies. A client error is a 4xx `HttpException`, or any other error with a 4xx `status` or `statusCode` property. That covers `CarrierError`: when the carrier answers `422` to a malformed request, it isn't down, so the breaker ignores the error and the retry doesn't repeat it. A `408` or `429` is the exception, because it means the carrier is pushing back, so it counts like a `5xx`. To change what counts, pass a `recordIf` function in the breaker options.

While the breaker is **open**, calls fail immediately and the carrier is not called at all. The client gets a `503` with a `Retry-After` header: the number of seconds until the breaker lets a probe call through. The retry wraps the breaker, so a rejection is never retried.

After `openDuration` (30 s), the breaker is **half-open**. It lets one probe call through (see `halfOpenMaxCalls`). If the probe succeeds, the breaker closes and starts over with an empty window. If it fails, the breaker opens for another 30 seconds. The breaker doesn't use a timer for this. It checks the state on the next call.

A 503 is correct, but checkout can do better. Add a fallback that serves flat-rate quotes while the carrier is known to be down (import `Fallback` and `CircuitOpenError` from `@nestjs/resilience`):

```typescript
@@filename(shipping/shipping.controller)
@Get('quotes')
@Resilience('carrier')
@Timeout('1.5s')
@Fallback('flatRateQuotes', {
  handleIf: (error) => error instanceof CircuitOpenError,
})
getQuotes(@Query('orderId') orderId: string, @Signal() signal: AbortSignal) {
  return this.shippingService.getQuotes(orderId, signal);
}

flatRateQuotes() {
  return this.shippingService.flatRateQuotes();
}
```

`@Fallback()` takes the name of a method on the same class, or a function. TypeScript checks that the class has a method with that name. The fallback is called with the error and the `ExecutionContext`, and whatever it returns becomes the response. It can be a value, a `Promise` or an `Observable`. Fallback is the outermost stage, so it also sees the breaker's rejections.

By default, a fallback replaces every error except client errors. The `handleIf` option narrows that down. Flat rates cost the store money on heavy parcels, such as bags of litter, so here they're a last resort: they're served only when the breaker says the carrier is down, and a single slow answer still gets a 504.

> info **Hint** To look at a breaker from your own code, inject `ResilienceService` and call `circuitBreaker('carrier')`. The breaker exposes `state` and `stats`, and you can force it open or closed with `trip()` and `reset()`.

#### Cap concurrent CSV exports with a bulkhead

The back office downloads all orders as a CSV file. Building the file reads every order and is heavy on both the database and the CPU. Two exports at a time are fine, but twenty would slow checkout down for everyone. A bulkhead caps how many run at the same time:

```typescript
@@filename(orders/orders.controller)
import { Controller, Get, Header } from '@nestjs/common';
import { Bulkhead } from '@nestjs/resilience';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Bulkhead({ maxConcurrent: 2, maxQueue: 3, queueTimeout: '10s' })
  export() {
    return this.ordersService.exportCsv();
  }
}
```

Two exports run at a time. Up to three more wait for a slot, for at most 10 seconds each. A sixth request gets a `503` right away, and so does a waiting request once its 10 seconds are up:

```json
{
  "statusCode": 503,
  "error": "Service Unavailable",
  "message": "Server is at capacity",
  "code": "BULKHEAD_FULL"
}
```

This 503 has no `Retry-After` header, because nobody knows when a slot will free up. The status is 503 rather than 429 because a 429 blames the client's request rate, while a full bulkhead means the server is at capacity for everyone.

A slot stays taken until the handler finishes, or until a timeout on the route gives up on the attempt. A handler that ignores its signal then keeps running in the background, outside the bulkhead's count, which is one more reason to pass the signal to every call that takes one. A bulkhead without a name belongs to its handler, and is registered under the handler's name. To read its load, inject `ResilienceService` and look at `bulkhead('OrdersController.export')`, which has `active` and `queued` counts. Give the bulkhead a `name` to share one pool of slots between several handlers.

#### Retry a POST safely

So far, retries have only happened on `GET`. That's deliberate. On HTTP, a retry applies only to the safe methods `GET`, `HEAD` and `OPTIONS`, and on GraphQL only to queries. Running a `POST` twice might create two shipments, and the package can't know whether that's harmless. So a preset's retry is simply skipped on a `POST`. A `@Retry()` decorator placed directly on a `POST` handler is skipped too, and bootstrap warns about it:

```bash
WARN [ResilienceModule] @Retry() on ShippingController.createShipment() is inactive: it only re-runs safe operations (GET, HEAD, OPTIONS, GraphQL queries). If the handler is safe to repeat, use @Retry({ idempotent: true }).
```

Booking a shipment _is_ safe to repeat, because the carrier deduplicates shipments by `reference`, which is the order id. That matters for another reason too: a booking that timed out may still have gone through on the carrier's side, so the retry has to be safe anyway. Setting `idempotent: true` on `@Retry()` is how you state that running the handler twice within one request is fine:

```typescript
@@filename(shipping/shipping.controller)
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Idempotent } from '@nestjs/idempotency';
import { CircuitOpenError, Fallback, Resilience, Retry, Signal, Timeout } from '@nestjs/resilience';
import { ShippingService } from './shipping.service.js';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('quotes')
  @Resilience('carrier')
  @Timeout('1.5s')
  @Fallback('flatRateQuotes', {
    handleIf: (error) => error instanceof CircuitOpenError,
  })
  getQuotes(@Query('orderId') orderId: string, @Signal() signal: AbortSignal) {
    return this.shippingService.getQuotes(orderId, signal);
  }

  flatRateQuotes() {
    return this.shippingService.flatRateQuotes();
  }

  @Post('shipments')
  @Idempotent()
  @Resilience('carrier')
  @Retry({ idempotent: true })
  createShipment(@Body('orderId') orderId: string, @Signal() signal: AbortSignal) {
    return this.shippingService.createShipment(orderId, signal);
  }
}
```

A handler-level `@Retry()` merges into the preset's retry, field by field. The fields you set win, and the rest come from the preset, then from `defaults.retry`. So this route keeps the preset's 2 attempts and adds only `idempotent: true`. The preset's 2-second timeout and its breaker still apply. Only a decorator can say `idempotent: true`: a preset can't declare every handler that uses it safe to repeat.

`idempotent: true` and `@Idempotent()` solve two different problems:

- `idempotent: true` lets the **server** re-run the handler within one request.
- `@Idempotent()` deduplicates the **client's** retries of the whole request. When a client repeats a request with the same `Idempotency-Key` header, it gets the stored response back and the handler doesn't run again.

Register `IdempotencyModule` **before** `ResilienceModule`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { IdempotencyModule } from '@nestjs/idempotency';
import { ResilienceModule } from '@nestjs/resilience';
import { OrdersModule } from './orders/orders.module.js';
import { ShippingModule } from './shipping/shipping.module.js';

@Module({
  imports: [
    // Import order matters: the first global interceptor runs outermost.
    IdempotencyModule.forRoot({}),
    ResilienceModule.forRoot({
      defaults: {
        timeout: '5s',
        retry: { attempts: 3, backoff: { delay: '200ms', maxDelay: '2s' } },
      },
      presets: {
        carrier: {
          timeout: '2s',
          retry: { attempts: 2 },
          circuitBreaker: { failureRateThreshold: 50, minimumCalls: 10, openDuration: '30s' },
        },
      },
    }),
    OrdersModule,
    ShippingModule,
  ],
})
export class AppModule {}
```

Both modules register a global interceptor, and the one imported first runs outermost. With this order:

- A replay, or a `409` for a key that is still in flight, is answered before any retry, breaker or timeout runs. A booking that already succeeded replays even while the breaker is open.
- All the retries of one request happen under a single claimed key.
- The stored response is the final outcome, after retries and any fallback.
- A `503` or `504` is a 5xx response, so the key is released and the client can try again later with the same key.

#### Use the same policies inside services

Pending orders include a shipping estimate in their `total`. Every 15 minutes, a background job re-quotes them. The job isn't an entrypoint, so it uses a **policy object**, which you get from `ResilienceService`:

```typescript
@@filename(shipping/repricing.service)
import { Injectable, Logger } from '@nestjs/common';
import { CircuitOpenError, ResilienceService, type ResiliencePolicy } from '@nestjs/resilience';
import { subtotal } from '../orders/order.js';
import { OrdersService } from '../orders/orders.service.js';
import { CarrierClient } from './carrier.client.js';

@Injectable()
export class RepricingService {
  private readonly logger = new Logger(RepricingService.name);
  private readonly resiliencePolicy: ResiliencePolicy;

  constructor(
    resilience: ResilienceService,
    private readonly ordersService: OrdersService,
    private readonly carrierClient: CarrierClient,
  ) {
    this.resiliencePolicy = resilience.preset('carrier');
  }

  /** Refreshes the shipping part of every pending order's total. */
  async repricePendingOrders(): Promise<number> {
    const pending = (await this.ordersService.findAll()).filter((order) => order.status === 'pending');
    let repriced = 0;
    for (const order of pending) {
      try {
        const quotes = await this.resiliencePolicy.execute(
          ({ signal }) => this.carrierClient.getQuotes(order, signal),
          { source: 'RepricingService.repricePendingOrders' },
        );
        const shipping = Math.min(...quotes.map((quote) => quote.price));
        await this.ordersService.update(order.id, { total: subtotal(order) + shipping });
        repriced++;
      } catch (error) {
        if (error instanceof CircuitOpenError) {
          this.logger.warn(`The carrier is unavailable, stopping after ${repriced} of ${pending.length} orders`);
          break;
        }
        this.logger.error(`Could not reprice order ${order.id}`, (error as Error).stack);
      }
    }
    return repriced;
  }
}
```

Add `RepricingService` to the providers of `ShippingModule`, and call `repricePendingOrders()` from a scheduled job (see [Task scheduling](/application/task-scheduling#declarative-cron-jobs)).

`resilience.preset('carrier')` returns the preset as one policy. Its breaker is the **same instance** that the routes use, so the job and checkout share what they learn about the carrier in both directions:

- While the breaker is open, the job gets a `CircuitOpenError` immediately and stops, instead of spending a timeout on every order.
- If the job is the first to find the carrier failing, its failures open the breaker, and checkout serves flat rates without waiting on timeouts first.

A few details differ from entrypoints:

- `execute()` passes your function the attempt's `signal` and `attempt` number. The `source` option labels the events this call emits.
- A policy object has no `GET` or `POST` to look at, so the preset's retry **always** applies. Only wrap calls that are safe to repeat (a quote is).
- The route's `@Timeout('1.5s')` belongs to the route. The job gets the preset's 2 seconds.
- Create the policy once, for example in the constructor, not on every call. For options that aren't a preset, use `resilience.create(options, name)`.

Why not put `@Retry()` on `repricePendingOrders()`? Resilience decorators are metadata that the global interceptor reads, and interceptors only run around entrypoints. On a provider method, a decorator would do nothing, so bootstrap warns instead:

```bash
WARN [ResilienceModule] Resilience decorators on RepricingService.repricePendingOrders() have no effect: RepricingService is not a controller, resolver or gateway. They apply to entrypoints only. Inside services, use a policy object (ResilienceService.preset() or create(), or new RetryPolicy() etc.).
```

This is a deliberate choice, for three reasons:

- Wrapping arbitrary provider methods would miss request-scoped and transient instances, which Nest creates after bootstrap.
- Retries hidden deep inside services multiply. A route that makes 3 attempts, calling a service that makes 3 attempts, calling an SDK that makes 3 attempts, sends up to 27 requests to a dependency that is already struggling.
- A policy object is visible at the call site, where you can see what it does.

> info **Hint** An entrypoint without decorators still maps resilience errors. If a service throws a `CircuitOpenError` inside a plain route, the client gets a `503` with `Retry-After`. Set `mapErrors: false` in the module options to turn this off.

#### Other transports

The same decorators work on microservice handlers. The warehouse service asks for quotes over TCP when it re-packs an order:

```typescript
@@filename(shipping/shipping.handlers)
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Resilience, Retry, Signal } from '@nestjs/resilience';
import { ShippingService } from './shipping.service.js';

@Controller()
export class ShippingHandlers {
  constructor(private readonly shippingService: ShippingService) {}

  @MessagePattern('shipping.quotes')
  @Resilience('carrier')
  @Retry({ attempts: 3 })
  getQuotes(@Payload() data: { orderId: string }, @Signal() signal: AbortSignal) {
    return this.shippingService.getQuotes(data.orderId, signal);
  }
}
```

Add `ShippingHandlers` to the `controllers` of `ShippingModule`.

A message has no `GET` or `POST` to tell whether it's safe to repeat, so on message, event and WebSocket handlers, only a `@Retry()` on the handler itself turns retries on. A preset's retry, or a class-level `@Retry()` without `idempotent: true`, doesn't apply there on its own, so reusing the `carrier` preset can't silently re-run a handler with side effects. Here the handler's `@Retry()` opts in, and its `attempts: 3` raises the preset's 2 attempts to 3. Only use it on handlers that are safe to run twice. Errors reach the caller as an `RpcException` with a structured payload:

```json
{ "status": "error", "code": "CIRCUIT_OPEN", "statusCode": 503, "message": "Service temporarily unavailable", "retryAfter": 30 }
```

A timeout has `"code": "TIMEOUT"` and `"statusCode": 504`, and no `retryAfter`. In a hybrid application, connect the microservice with `inheritAppConfig: true`, or the global interceptor won't reach its handlers (see [Hybrid application](/faq/hybrid-application#sharing-configuration)):

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>(
    { transport: Transport.TCP, options: { port: 3001 } },
    { inheritAppConfig: true },
  );
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

GraphQL resolvers work the same way. If your application serves GraphQL, add a resolver to `ShippingModule`'s providers:

```typescript
@@filename(shipping/shipping.resolver)
import { Args, Field, Float, Int, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { Resilience, Signal, Timeout } from '@nestjs/resilience';
import { ShippingService } from './shipping.service.js';

@ObjectType('ShippingQuote')
export class ShippingQuoteModel {
  @Field() service: string;
  @Field(() => Float) price: number;
  @Field(() => Int) estimatedDays: number;
}

@Resolver(() => ShippingQuoteModel)
export class ShippingResolver {
  constructor(private readonly shippingService: ShippingService) {}

  @Query(() => [ShippingQuoteModel], { nullable: true })
  @Resilience('carrier')
  @Timeout('1.5s')
  shippingQuotes(@Args('orderId') orderId: string, @Signal() signal: AbortSignal) {
    return this.shippingService.getQuotes(orderId, signal);
  }
}
```

Queries are retried, while mutations need `idempotent: true`, just like `POST` requests. A failure fails only its own field. The response still has status 200, and the error carries the code in `extensions`:

```graphql
{ shippingQuotes(orderId: "1001") { service price } }
```

```json
{
  "errors": [
    {
      "message": "The operation timed out",
      "locations": [{ "line": 1, "column": 3 }],
      "path": ["shippingQuotes"],
      "extensions": { "code": "TIMEOUT", "httpStatus": 504 }
    }
  ],
  "data": { "shippingQuotes": null }
}
```

An open breaker reports `"code": "CIRCUIT_OPEN"`, `"httpStatus": 503` and `"retryAfter"` in seconds. The package sets `httpStatus` rather than Apollo's `extensions.http`, because Apollo would apply `extensions.http` to the whole response, although only one field failed.

#### Observe breaker transitions

Every policy emits typed events: `retry`, `timeout`, `circuit-open`, `circuit-half-open`, `circuit-closed`, `circuit-rejected`, `bulkhead-rejected`, `rate-limited` and `fallback`. Each event carries the `policy` name, and its `source` when there is one: the entrypoint (such as `ShippingController.getQuotes`) or the label passed to `execute()`. Inject `ResilienceEvents` to get them: its `events$` is an RxJS stream of every event from this application's policies. Log the ones someone should see:

```typescript
@@filename(resilience.logger)
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ResilienceEvents } from '@nestjs/resilience';

@Injectable()
export class ResilienceLogger implements OnModuleInit {
  private readonly logger = new Logger('Resilience');

  constructor(private readonly resilienceEvents: ResilienceEvents) {}

  onModuleInit() {
    this.resilienceEvents.events$.subscribe((event) => {
      switch (event.type) {
        case 'circuit-open':
        case 'circuit-half-open':
        case 'circuit-closed':
          this.logger.warn(`Circuit "${event.policy}" went from ${event.from} to ${event.to}`);
          break;
        case 'bulkhead-rejected':
          this.logger.warn(`${event.source} is at capacity (${event.active} running, ${event.queued} queued)`);
          break;
        case 'fallback':
          this.logger.log(`${event.source} answered with its fallback`);
          break;
      }
    });
  }
}
```

Add `ResilienceLogger` to the `providers` array of `AppModule`.

Every policy also publishes each event on a [diagnostics channel](https://nodejs.org/api/diagnostics_channel.html) of its own, such as `nestjs:resilience:timeout` or `nestjs:resilience:circuit-open`, including policies created without the module. Metrics and tracing tools can subscribe without any dependency on this package. `ResilienceTimeoutEvent` is the type of one channel's messages, and `ResilienceEvent` the union of them all:

```typescript
import { subscribe } from 'node:diagnostics_channel';
import type { ResilienceTimeoutEvent } from '@nestjs/resilience';

const timeouts = new Map<string, number>();

subscribe('nestjs:resilience:timeout', (message) => {
  const { policy } = message as ResilienceTimeoutEvent;
  timeouts.set(policy, (timeouts.get(policy) ?? 0) + 1);
});
```

[NestJS Observe](/observability/overview#what-it-offers) already reads outbound HTTP from Node's diagnostics channels (see [Database queries and outbound HTTP](/observability/sdk#database-queries-and-outbound-http)). It doesn't subscribe to the `nestjs:resilience` channels yet. Once it does, it can attach retries and timeouts to the request's span, chart breaker state per name, and alert on bulkhead rejections, with no code in either package that depends on the other.

#### Try it

Start the application with `CARRIER_URL` pointing at a carrier stub you control, such as a mock server or a few lines of `node:http`. While the carrier answers, checkout gets live quotes:

```bash
$ curl "localhost:3000/shipping/quotes?orderId=1001"
[{"service":"ground","price":6.9,"estimatedDays":4},{"service":"express","price":14.5,"estimatedDays":1}]
```

Now make the stub hang. The same request answers `504` after about 3 seconds, and the stub sees both of its requests cancelled:

```bash
$ curl "localhost:3000/shipping/quotes?orderId=1001"
{"statusCode":504,"error":"Gateway Timeout","message":"The operation timed out","code":"TIMEOUT"}
```

Keep sending it. Each request records two failed attempts. On the fifth slow request, the breaker has 10 calls in its window and 9 of them failed. The breaker opens, the request's second attempt is rejected, and the fallback answers. The application logs:

```bash
WARN [Resilience] Circuit "carrier" went from closed to open
LOG [Resilience] ShippingController.getQuotes answered with its fallback
```

From now on, booking a shipment fails fast without calling the carrier:

```bash
$ curl -i -X POST localhost:3000/shipping/shipments \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: 5f1c2a9e-shipment-1001" \
    -d '{"orderId":"1001"}'
HTTP/1.1 503 Service Unavailable
Retry-After: 30

{"statusCode":503,"error":"Service Unavailable","message":"Service temporarily unavailable","code":"CIRCUIT_OPEN"}
```

Quotes, meanwhile, answer immediately with the flat rate:

```bash
$ curl "localhost:3000/shipping/quotes?orderId=1002"
[{"service":"flat-rate","price":4.99,"estimatedDays":5}]
```

Let the stub answer again and wait 30 seconds. The next quote request is the probe. It succeeds, so the breaker closes and checkout shows live quotes again:

```bash
WARN [Resilience] Circuit "carrier" went from open to half-open
WARN [Resilience] Circuit "carrier" went from half-open to closed
```

Repeating the booking with the same `Idempotency-Key` now creates the shipment and returns `201`. The earlier 503 released the key.

#### Testing

Resilience behavior is worth testing, but not by waiting 30 seconds for a breaker. Replace `CarrierClient` with a fake, and use Vitest's fake timers for the clock. Fake only `setTimeout`, `clearTimeout` and `Date`, so that the HTTP server and supertest keep working with real I/O:

```typescript
@@filename(test/shipping.e2e-spec)
import type { INestApplication } from '@nestjs/common';
import { ResilienceService } from '@nestjs/resilience';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { CarrierClient } from '../src/shipping/carrier.client.js';

const liveQuotes = [{ service: 'ground', price: 6.9, estimatedDays: 4 }];

/** A carrier call that only ends when its signal aborts. */
const hang = (_order: unknown, signal: AbortSignal) =>
  new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason)));

describe('Shipping quotes', () => {
  let app: INestApplication;
  const carrier = { getQuotes: vi.fn(), createShipment: vi.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CarrierClient)
      .useValue(carrier)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0, '127.0.0.1');
    // Fake only timers and Date: the HTTP server and supertest keep real I/O.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.resetAllMocks();
    await app.close();
  });

  it('answers 504 and cancels the carrier call when the carrier hangs', async () => {
    carrier.getQuotes.mockImplementation(hang);

    // .then() sends the request now; the clock only moves when we advance it.
    const response = request(app.getHttpServer())
      .get('/shipping/quotes?orderId=1001')
      .then((res) => res);
    await vi.waitFor(() => expect(carrier.getQuotes).toHaveBeenCalled());
    await vi.advanceTimersByTimeAsync(5_000); // two attempts of 1.5 s, plus backoff

    expect((await response).status).toBe(504);
    expect(carrier.getQuotes).toHaveBeenCalledTimes(2);
    const [, signal] = carrier.getQuotes.mock.calls[0];
    expect(signal.aborted).toBe(true);
  });

  it('serves flat rates while the breaker is open, then recovers', async () => {
    carrier.getQuotes.mockResolvedValue(liveQuotes);
    const breaker = app.get(ResilienceService).circuitBreaker('carrier');
    breaker.trip();

    const fallback = await request(app.getHttpServer()).get('/shipping/quotes?orderId=1001');
    expect(fallback.body).toEqual([
      { service: 'flat-rate', price: 4.99, estimatedDays: 5 },
    ]);
    expect(carrier.getQuotes).not.toHaveBeenCalled();

    vi.advanceTimersByTime(30_000); // openDuration: the next call is a probe
    const live = await request(app.getHttpServer()).get('/shipping/quotes?orderId=1001');
    expect(live.body).toEqual(liveQuotes);
    expect(breaker.state).toBe('closed');
  });
});
```

A few things make this work:

- `vi.waitFor()` waits until the request has actually reached the carrier. Only then are there timers to advance. With fake timers enabled, `vi.waitFor()` also moves the clock by its polling interval (50 ms), which stays well within the 1.5-second budget.
- `vi.advanceTimersByTimeAsync()` fires the timeouts and the backoff in order, and lets the promises in between settle.
- `trip()` opens the breaker directly, so you don't have to produce ten failures to test the open state. Because the breaker checks `openDuration` against `Date` on the next call, moving the fake clock forward is enough to make that call a probe.
- Breakers, bulkheads and outbound rate limits belong to the application that created them, so every test application starts with fresh state.
- To test with different settings, such as a shorter `openDuration`, override the module's options with `overrideProvider(RESILIENCE_MODULE_OPTIONS)`.

See [End-to-end testing](/fundamentals/testing#end-to-end-testing) for the testing basics.

#### Production checklist

- **Budget time end to end.** Time per attempt times the number of attempts, plus backoff, must fit inside your client's timeout and your load balancer's. For the quotes route, that's about 3.2 seconds.
- **Retry only what is safe.** Set `idempotent: true` only when a second run within the same request is harmless. Pair it with `@Idempotent()` to handle client retries.
- **Pass the signal to every I/O call.** Without it, timed-out work keeps running in the background, unseen by the bulkhead that admitted it.
- **Retry at one layer.** Retry at the entrypoint or in the service policy, not both, and turn off retries in SDKs and HTTP clients underneath.
- **Tune each breaker to its dependency.** Make `minimumCalls` high enough that two errors at night don't open it, set `openDuration` close to how long the dependency usually takes to recover, and use `recordIf` to leave out errors that aren't outages.
- **Give every breaker a timeout.** A breaker learns only from calls that finish. A call that hangs is never counted, and a hanging probe keeps a half-open breaker rejecting everything else.
- **Remember that state is per process.** With several instances, each one has its own breakers, bulkheads and outbound rate limits, and a restart starts them fresh. Each breaker opens on its own, bulkhead limits apply per instance, and an outbound rate limit allows `limit` calls per instance.
- **Keep fallbacks cheap and independent.** A fallback must never call the dependency it stands in for.
- **Alert on transitions.** A breaker opening and bulkheads rejecting requests are the signals to page on.
- **Register an idempotency store.** Without one, `@Idempotent()` keeps its records in each process's memory, lost on every restart or deploy, and production refuses to start. See [Store keys in PostgreSQL](/reliability/idempotency#store-keys-in-postgresql) in the idempotency tutorial.
- **Wire the modules correctly.** Import `ResilienceModule` once, in the root module, and `IdempotencyModule` before it. Use `inheritAppConfig: true` for hybrid applications.
- **Honor Retry-After in your clients.** It tells them when trying again can succeed.

#### Reference

##### Module options

`ResilienceModule.forRoot()` takes these options. `forRootAsync()` builds the same object from a factory, a class implementing `ResilienceOptionsFactory`, or an existing provider.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `defaults` | `ResilienceDefaults` | none | Field defaults for `retry`, `timeout`, `circuitBreaker` and `bulkhead`. They fill in stages that a decorator or preset turns on, and never turn a stage on. See [Register the module](/reliability/resilience#register-the-module). |
| `presets` | `Record<string, ResiliencePreset>` | none | Named sets of stages: `retry`, `timeout`, `circuitBreaker`, `bulkhead`, `outboundRateLimit` and `fallback`. A preset's breaker, bulkhead and outbound rate limit are shared under the preset's name. |
| `mapErrors` | `boolean` | `true` | Turns resilience errors thrown by any handler, with or without decorators, into the transport's error, as listed under Errors below. |
| `isGlobal` | `boolean` | `true` | Registers the module globally. Register it once, in the root module. |

Every time-valued option takes milliseconds or a string such as `'200ms'`, `'2s'` or `'15m'`. The options' injection token is `RESILIENCE_MODULE_OPTIONS`.

##### Decorators

Each decorator works on a handler or on a class, except `@Signal()`, which is a parameter decorator.

| Decorator | Options (default) |
| --- | --- |
| `@Retry(options)` | `attempts` (3, including the first; `Infinity` retries until the signal aborts), `backoff`, `retryIf(error, attempt)` (every error except client errors), `idempotent` (see [Retry a POST safely](/reliability/resilience#retry-a-post-safely)). `@Retry(5)` sets `attempts`, and `@Retry(false)` turns off an inherited retry. |
| `backoff` (of `@Retry()`) | `delay` (`'200ms'`), `factor` (2), `maxDelay` (`'30s'`), `jitter`: `'full'`, `'equal'` or `'none'` (`'full'`, or `'none'` when `factor` is 1). Or a function of the failed attempt and its error that returns a duration. |
| `@Timeout(duration)` | Budget per attempt. Without an argument, the preset's or class's timeout, then `defaults.timeout`. |
| `@CircuitBreaker(options)` | `name`, `failureRateThreshold` (50, a percentage), `minimumCalls` (10), `slidingWindow` (the last 20 calls: `type` is `'count'` or `'time'`, with a `size`), `openDuration` (`'30s'`), `halfOpenMaxCalls` (1), `recordIf(error)` (every error except client errors). A string is a breaker name. See [Fail fast with a circuit breaker](/reliability/resilience#fail-fast-with-a-circuit-breaker). |
| `@Bulkhead(options)` | `name`, `maxConcurrent` (10), `maxQueue` (0), `queueTimeout` (no limit). A string is a bulkhead name. See [Cap concurrent CSV exports with a bulkhead](/reliability/resilience#cap-concurrent-csv-exports-with-a-bulkhead). |
| `@Fallback(method, options)` | A method name on the same class, or a function, called with the error and the `ExecutionContext`. `handleIf(error)` (every error except client errors). |
| `@Resilience(preset)` | Applies a preset from `presets`, stage by stage. |
| `@Signal()` | The current attempt's `AbortSignal`. |

A preset's `outboundRateLimit` takes `limit` (calls per `interval`), `interval` and `maxWait` (0: reject right away).

`ResilienceService` provides `preset(name)`, `create(options, name)`, `circuitBreaker(name)`, `bulkhead(name)`, `circuitBreakers()` and `bulkheads()`. See [Use the same policies inside services](/reliability/resilience#use-the-same-policies-inside-services).

##### Events

Every event is published on `ResilienceEvents.events$` and on the diagnostics channel `nestjs:resilience:<type>`. Each payload has `type`, `policy` and, when there is one, `source` (see [Observe breaker transitions](/reliability/resilience#observe-breaker-transitions)).

| Type | Payload type | Other fields |
| --- | --- | --- |
| `retry` | `ResilienceRetryEvent` | `attempt` (the one that failed, 1-based), `delayMs` (the wait before the next one), `error` |
| `timeout` | `ResilienceTimeoutEvent` | `timeoutMs` |
| `circuit-open` | `ResilienceCircuitOpenEvent` | `from`, `to` |
| `circuit-half-open` | `ResilienceCircuitHalfOpenEvent` | `from`, `to` |
| `circuit-closed` | `ResilienceCircuitClosedEvent` | `from`, `to` |
| `circuit-rejected` | `ResilienceCircuitRejectedEvent` | `retryAfterMs` |
| `bulkhead-rejected` | `ResilienceBulkheadRejectedEvent` | `reason` (`'full'` or `'queue-timeout'`), `active`, `queued` |
| `rate-limited` | `ResilienceRateLimitedEvent` | `retryAfterMs` |
| `fallback` | `ResilienceFallbackEvent` | `error` |

A breaker's state (`from` and `to`) is `'closed'`, `'open'` or `'half-open'`. `ResilienceEvent` is the union of all payload types.

##### Errors

All errors extend `ResilienceError`, which has a `code` and the `policy` name.

| Error | Code | HTTP | Message sent to clients | Fields |
| --- | --- | --- | --- | --- |
| `ResilienceTimeoutError` | `TIMEOUT` | 504 | The operation timed out | `timeoutMs` |
| `CircuitOpenError` | `CIRCUIT_OPEN` | 503, with `Retry-After` | Service temporarily unavailable | `retryAfterMs` |
| `BulkheadFullError` | `BULKHEAD_FULL` | 503 | Server is at capacity | `reason` |
| `OutboundRateLimitError` | `RATE_LIMITED` | 503, with `Retry-After` | Rate limit of a dependency exceeded | `retryAfterMs` |

On microservice and WebSocket handlers, the error is an `RpcException` or `WsException` whose payload has `status`, `code`, `statusCode`, `message` and, for rejections that know it, `retryAfter` in seconds. On GraphQL, the field's error has `code`, `httpStatus` and `retryAfter` in `extensions` (see [Other transports](/reliability/resilience#other-transports)).
