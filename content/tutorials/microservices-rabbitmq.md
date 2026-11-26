### Build microservices in Node.js with RabbitMQ

Build microservices in Node.js and TypeScript with NestJS and RabbitMQ: events, request-response, retries, dead letters, and no lost messages.

The application is a small online shop split in two services. The **orders** service is an HTTP API that takes orders and keeps them in PostgreSQL. The **fulfillment** service is a worker with a database of its own: it prepares a shipment for every order. The services talk over [RabbitMQ](https://www.rabbitmq.com/), through the RabbitMQ transport of `@nestjs/microservices`. Sending a message is one call. The work is in what happens around it: the service that crashes halfway through a message, the message that fails every time, the message that arrives twice, the broker that is down when an order commits, and the service that doesn't answer.

By the end, the two services will:

- Live in one [Nest CLI monorepo](/cli/monorepo#monorepo-mode), and share their message contracts as Zod schemas from a [library](/cli/libraries), validated by the sender and by the receiver.
- Announce every order with an `order.placed` **event**, published through the [transactional outbox](/reliability/outbox): an order is never announced unless it committed, and never committed without being announced, even when RabbitMQ is down.
- Acknowledge each event only once it's handled, so a worker that crashes or throws loses nothing.
- Retry a failing event a bounded number of times, then move it to a dead-letter queue, and move a message that breaks its contract there at once.
- Handle each event once, although RabbitMQ delivers at least once.
- Ask the fulfillment service where an order's shipment is with a **request** that times out, and answer the HTTP client with a 503 when no answer comes.
- Share the events between several worker instances, and finish the events in flight when an instance shuts down.
- Prove all of it in tests against a real RabbitMQ and PostgreSQL.

The orders service has no sign-in, to keep this tutorial about services talking to each other. To add it, follow [Build a REST API with JWT authentication](/tutorials/rest-api-jwt-authentication#sign-users-in-with-jwts), whose conventions (Zod validation, configuration checked at startup, security headers, CORS, OpenAPI, JSON logs, health checks) both services follow.

These are the endpoints of the orders service, and the section that adds each one:

| Endpoint | Section |
| --- | --- |
| `POST /orders`, `GET /orders/:id`, `GET /health/live`, `GET /health/ready`, `GET /docs` | [Build the orders API](/tutorials/microservices-rabbitmq#build-the-orders-api) |
| `GET /orders/:id/shipment` | [Ask another service with request-response](/tutorials/microservices-rabbitmq#ask-another-service-with-request-response) |

> info **Hint** The finished application is on GitHub as [nestjs/example-microservices-rabbitmq](https://github.com/nestjs/example-microservices-rabbitmq), with its tests and a CI workflow.

And these are the messages between the services:

| Message | Style | Queue | Section |
| --- | --- | --- | --- |
| `order.placed` | Event, from orders to fulfillment | `fulfillment.events` | [Publish events with the transactional outbox](/tutorials/microservices-rabbitmq#publish-events-with-the-transactional-outbox) |
| `shipment.find` | Request-response, from orders to fulfillment | `fulfillment.requests` | [Ask another service with request-response](/tutorials/microservices-rabbitmq#ask-another-service-with-request-response) |

You need Node.js 22 or later, and Docker to run RabbitMQ and PostgreSQL.

#### Create the workspace

Create a project with the [Nest CLI](/cli/overview), then add a second application and a library to it. Adding a project converts the workspace to [monorepo mode](/cli/monorepo#monorepo-mode): each application moves to `apps/`, and the library goes to `libs/`, importable from both as `@app/contracts`:

```bash
$ npm i -g @nestjs/cli
$ nest new orders --directory shop
$ cd shop
$ nest generate app fulfillment
$ nest generate library contracts --prefix @app
```

`nest new` installs the [NestJS Observe SDK](/observability/sdk), `@nestjs/observe`, in the workspace's `package.json`, and wires it into the orders application it generates. `nest generate app` keeps the dependency, but doesn't wire the SDK into the application it adds. The services' own files below wire it into both, each with a `serviceId` of its own, so each service reports under its own name.

Both services build and run from the workspace's root, with the dependencies of its one `package.json`. Install the [Node adapter](/http/performance#node-adapter) and the packages of the JWT tutorial, then `@nestjs/microservices` with the two packages its RabbitMQ transport needs, and `@nestjs/outbox`. The Express adapter and supertest that the CLI installed aren't needed:

```bash
$ npm uninstall @nestjs/platform-express @types/express supertest @types/supertest
$ npm i --save @nestjs/platform-node zod @nestjs/config @nestjs/drizzle drizzle-orm@rc pg @nestjs/swagger @nestjs/terminus
$ npm i --save @nestjs/microservices amqplib amqp-connection-manager @nestjs/outbox
$ npm i --save-dev drizzle-kit@rc @types/pg
```

The CLI generated a sample controller, service and tests in each project. Remove them; every file this tutorial needs is listed below:

```bash
$ rm -r apps/orders/src apps/orders/test apps/fulfillment/src apps/fulfillment/test libs/contracts/src
```

Run RabbitMQ with its management UI, and PostgreSQL. Each service owns its data, so each gets a database of its own, and neither reads the other's tables:

```bash
$ docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:4-management
$ docker run -d --name shop-db -e POSTGRES_PASSWORD=shop -p 5432:5432 postgres:17
$ docker exec shop-db psql -U postgres -c "CREATE DATABASE orders" -c "CREATE DATABASE fulfillment"
```

The management UI is at `http://localhost:15672`, with the user `guest` and the password `guest`. It shows the queues, the messages in them and the consumers of each, which is the quickest way to see what the next sections do.

Each service reads its configuration from a `.env` file of its own. The orders service's is `apps/orders/.env`:

```bash
DATABASE_URL=postgres://postgres:shop@localhost:5432/orders
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

The fulfillment service's is `apps/fulfillment/.env`, with its own database:

```bash
DATABASE_URL=postgres://postgres:shop@localhost:5432/fulfillment
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

#### Share the message contracts

A message is an API between two services that are deployed separately, so its shape needs the same care as an HTTP endpoint's. The contracts live in the library, as Zod schemas: the orders service checks every event against them before it sends it, and the fulfillment service checks every message it receives.

The `order.placed` event, and the envelope the outbox wraps it in:

```typescript
@@filename(libs/contracts/src/orders.events)
import { z } from 'zod';

export const ORDER_PLACED = 'order.placed';

const item = z.object({
  sku: z.string().trim().min(1).max(64),
  quantity: z.number().int().min(1).max(100),
});

export const orderPlacedSchema = z.object({
  orderId: z.uuid(),
  customerEmail: z.email(),
  shippingAddress: z.string().trim().min(1).max(500),
  items: z.array(item).min(1).max(50),
  placedAt: z.iso.datetime(),
});
export type OrderPlaced = z.infer<typeof orderPlacedSchema>;

/**
 * What the outbox relay publishes: the message's id, which stays the same
 * when the message is published again, and the event itself as the payload.
 */
export const outboxEnvelope = <T extends z.ZodType>(payload: T) =>
  z.object({
    id: z.string().min(1),
    topic: z.string(),
    key: z.string().nullable(),
    headers: z.record(z.string(), z.string()),
    createdAt: z.number(),
    payload,
  });

export const orderPlacedEnvelopeSchema = outboxEnvelope(orderPlacedSchema);
export type OrderPlacedEnvelope = z.infer<typeof orderPlacedEnvelopeSchema>;
```

The request for a shipment, and its answer:

```typescript
@@filename(libs/contracts/src/fulfillment.requests)
import { z } from 'zod';

export const FIND_SHIPMENT = 'shipment.find';

export const findShipmentSchema = z.object({ orderId: z.uuid() });
export type FindShipment = z.infer<typeof findShipmentSchema>;

export const shipmentSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(['preparing', 'shipped']),
  items: z.array(z.object({ sku: z.string(), quantity: z.number() })),
  createdAt: z.iso.datetime(),
});
export type Shipment = z.infer<typeof shipmentSchema>;
```

The queues are part of the contract too. The RabbitMQ transport declares its queue on both sides: the consumer when it starts listening, and every producer when it connects, so a message sent before the consumer ever ran still has a queue to land in. RabbitMQ refuses a declaration whose options differ from the existing queue's (`PRECONDITION_FAILED`, and the channel closes), so both sides take them from here:

```typescript
@@filename(libs/contracts/src/queues)
import type { RmqOptions } from '@nestjs/microservices';

type QueueOptions = NonNullable<RmqOptions['options']>['queueOptions'];

/** How long the orders service waits for an answer from the fulfillment service. */
export const REQUEST_TIMEOUT_MS = 3_000;

export const FULFILLMENT_EVENTS_QUEUE = 'fulfillment.events';
export const FULFILLMENT_EVENTS_DEAD_LETTER_QUEUE = 'fulfillment.events.dead';

/**
 * The consumer and every producer declare the queue, with the same options:
 * RabbitMQ refuses a declaration that differs from the queue's.
 */
export const fulfillmentEventsQueueOptions: QueueOptions = {
  durable: true,
  arguments: {
    // Replicated across the cluster's nodes, and counts deliveries.
    'x-queue-type': 'quorum',
    // An event whose consumer dies before acknowledging it, 5 times over,
    // is dead-lettered: it's probably what kills the consumer.
    'x-delivery-limit': 5,
  },
  deadLetterExchange: '',
  deadLetterRoutingKey: FULFILLMENT_EVENTS_DEAD_LETTER_QUEUE,
};

export const FULFILLMENT_REQUESTS_QUEUE = 'fulfillment.requests';

export const fulfillmentRequestsQueueOptions: QueueOptions = {
  durable: true,
  // A request nobody took within the caller's timeout is dropped: the caller gave up.
  messageTtl: REQUEST_TIMEOUT_MS,
};
```

- **Two queues.** Events and requests go to queues of their own. A request in the events queue would wait behind every event ahead of it, and after a burst of orders it would time out.
- **A quorum queue for events.** Quorum queues are replicated across the nodes of a RabbitMQ cluster, and they count deliveries: after `x-delivery-limit` redeliveries, the broker dead-letters a message instead of delivering it again. RabbitMQ 4 counts a delivery when the consumer's connection drops before it acknowledged the message, not when the consumer requeues the message itself, so the limit catches an event that kills its consumer every time. The retries of an event that merely fails are counted by the worker, in [Retry, then dead-letter](/tutorials/microservices-rabbitmq#retry-then-dead-letter).
- **A dead-letter queue.** `deadLetterExchange: ''` is the default exchange, which routes by queue name, so the broker's dead letters go to `fulfillment.events.dead`, where the worker moves its own too.
- **A time to live for requests.** A request that waits in its queue longer than the caller's timeout is answered to nobody, so the broker drops it.

The library's entry file exports all three:

```typescript
@@filename(libs/contracts/src/index)
export * from './fulfillment.requests.js';
export * from './orders.events.js';
export * from './queues.js';
```

#### Build the orders API

The orders service is an HTTP API like the JWT tutorial's, on the Node adapter, with its configuration validated at startup. The broker's URL joins the database's:

```typescript
@@filename(apps/orders/src/config)
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.url(),
  RABBITMQ_URL: z.url({ protocol: /^amqps?$/ }),
  // The browser origins allowed to call the API, comma-separated. None by default.
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
    .pipe(z.array(z.url())),
});

export type Env = z.infer<typeof envSchema>;
```

An order keeps its items as JSON, the way the event carries them:

```typescript
@@filename(apps/orders/src/database/schema)
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export interface OrderItem {
  sku: string;
  quantity: number;
}

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerEmail: text('customer_email').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  items: jsonb('items').$type<OrderItem[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
```

Each service has its own `drizzle.config.ts` and migrations folder. drizzle-kit runs from the workspace's root, so the config loads the service's `.env` itself:

```typescript
@@filename(apps/orders/drizzle.config)
import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// Locally, the service's .env file; in CI and production, the environment.
if (existsSync('apps/orders/.env')) {
  process.loadEnvFile('apps/orders/.env');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './apps/orders/src/database/schema.ts',
  out: './apps/orders/drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Generate the first migration and apply it (see [Migrations](/data/drizzle#migrations)):

```bash
$ npx drizzle-kit generate --config apps/orders/drizzle.config.ts --name=orders
$ npx drizzle-kit migrate --config apps/orders/drizzle.config.ts
```

The request body is the event's schema without the fields the service sets, so the API can't accept an order that the event would reject:

```typescript
@@filename(apps/orders/src/orders/orders.schemas)
import { orderPlacedSchema } from '@app/contracts';
import type { z } from 'zod';

// The request body is the event without the fields the service sets.
export const placeOrderSchema = orderPlacedSchema.pick({ customerEmail: true, shippingAddress: true, items: true });
export type PlaceOrderDto = z.infer<typeof placeOrderSchema>;
```

The controller places and reads orders:

```typescript
@@filename(apps/orders/src/orders/orders.controller)
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { placeOrderSchema, type PlaceOrderDto } from './orders.schemas.js';
import { OrdersService } from './orders.service.js';

const orderId = { schema: z.uuid() };

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  place(@Body({ schema: placeOrderSchema }) dto: PlaceOrderDto) {
    return this.ordersService.place(dto);
  }

  @Get(':id')
  findOne(@Param('id', orderId) id: string) {
    return this.ordersService.findOne(id);
  }
}
```

The orders module registers it with the service, which the next section writes:

```typescript
@@filename(apps/orders/src/orders/orders.module)
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
```

The health checks are the JWT tutorial's, without the authentication decorators. Readiness checks the database. It doesn't check RabbitMQ, on purpose: while the broker is down, the service keeps taking orders, as the next section shows, so taking it out of the load balancer would only turn a delayed shipment into a failed order:

```typescript
@@filename(apps/orders/src/health/database.health)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { HealthIndicatorService } from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @InjectDrizzle() private readonly db: NodePgDatabase,
  ) {}

  isHealthy(key: string) {
    return this.healthIndicatorService
      .check(key)
      .attempt(async () => {
        await this.db.execute(sql`select 1`);
      })
      .withTimeout('1s');
  }
}
```

The controller exposes liveness and readiness:

```typescript
@@filename(apps/orders/src/health/health.controller)
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  // Not RabbitMQ: the transport reconnects by itself, and while the broker is
  // down, orders still commit, with their events kept in the outbox.
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([() => this.database.isHealthy('database')]);
  }
}
```

The health module imports Terminus:

```typescript
@@filename(apps/orders/src/health/health.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator],
})
export class HealthModule {}
```

`main.ts` sets the security headers, CORS from `CORS_ORIGINS`, JSON logs in production and the OpenAPI document, as in the JWT tutorial (see [Set security headers and CORS](/tutorials/rest-api-jwt-authentication#set-security-headers-and-cors)). It passes `ObserveInstrument`, which the root module of [the next section](/tutorials/microservices-rabbitmq#publish-events-with-the-transactional-outbox) exports, in the application options, the third argument with an adapter:

```typescript
@@filename(apps/orders/src/main)
import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule, ObserveInstrument } from './app.module.js';
import type { Env } from './config.js';

const app = await NestFactory.create<NestNodeApplication>(AppModule, new NodeAdapter(), {
  instrument: ObserveInstrument,
  // One JSON object per line in production; readable text in development.
  logger: new ConsoleLogger({ json: process.env.NODE_ENV === 'production' }),
});
app.useSecurityHeaders();
// On SIGTERM, the outbox relay finishes its publishes before the RabbitMQ client closes.
app.enableShutdownHooks();

const config = app.get<ConfigService<Env, true>>(ConfigService);
app.enableCors({ origin: config.get('CORS_ORIGINS', { infer: true }) });

const document = new DocumentBuilder().setTitle('Orders API').setVersion('1.0').build();
SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, document));

await app.listen(config.get('PORT', { infer: true }));
```

The root module, with the outbox that the next section explains, is the last file of the orders service.

#### Publish events with the transactional outbox

When an order commits, the fulfillment service must hear about it. The obvious code saves the order, then calls `client.emit('order.placed', ...)`. Those are two writes to two systems, and no transaction spans them: if the process dies or RabbitMQ is down between the two, the order exists and no shipment is ever prepared. Emitting first is no better: if the insert then fails, a shipment is prepared for an order that doesn't exist.

[`@nestjs/outbox`](/reliability/outbox) turns the event into a row. `outbox.add()` inserts it in the **same transaction** as the order, so both commit or neither does. A relay then publishes committed messages, and retries until the broker takes them. Its `ClientProxyTransport` publishes through a `ClientProxy` with `emit()`, the same call you would make without an outbox, and the RabbitMQ client's `emit()` completes only once the broker has confirmed the message (publisher confirms), so "published" means RabbitMQ has it.

The service inserts the order and adds the event through the same `tx`:

```typescript
@@filename(apps/orders/src/orders/orders.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { Outbox } from '@nestjs/outbox';
import { ORDER_PLACED, orderPlacedSchema } from '@app/contracts';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { orders, type Order } from '../database/schema.js';
import type { PlaceOrderDto } from './orders.schemas.js';

type Transaction = Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];

@Injectable()
export class OrdersService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly outbox: Outbox<Transaction>,
  ) {}

  async place(dto: PlaceOrderDto): Promise<Order> {
    const order = await this.db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values(dto).returning();
      // Checked against the contract the consumer validates with: a payload it
      // would reject fails this request, and rolls the order back.
      const event = orderPlacedSchema.parse({
        orderId: order.id,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        items: order.items,
        placedAt: order.createdAt.toISOString(),
      });
      // Through tx: the message commits with the order, or not at all.
      await this.outbox.add(tx, { topic: ORDER_PLACED, key: order.id, payload: event });
      return order;
    });
    this.outbox.notify(); // publish now, instead of at the relay's next poll
    return order;
  }

  async findOne(id: string): Promise<Order> {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, id));
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
```

- **The event is validated in the transaction.** `orderPlacedSchema.parse()` throws on an event the fulfillment service would reject, and the order rolls back with it. A bug in the producer fails one request with a 500, instead of sending a message that can never be processed.
- **The key is the order's id.** Messages with the same key are published one at a time, in the order their transactions committed, so a later event about the same order (a cancellation) never overtakes this one on its way to the broker.
- **`notify()` after the commit** wakes the relay, so the event goes out at once instead of at the next poll.

The root module registers the outbox with its store, and the RabbitMQ client it publishes through:

```typescript
@@filename(apps/orders/src/app.module)
import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { createObserveModule } from '@nestjs/observe';
import { ClientProxyTransport, OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { fromDrizzle, PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { FULFILLMENT_EVENTS_QUEUE, fulfillmentEventsQueueOptions } from '@app/contracts';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { envSchema, type Env } from './config.js';
import { HealthModule } from './health/health.module.js';
import { OrdersModule } from './orders/orders.module.js';

export const FULFILLMENT_EVENTS = 'FULFILLMENT_EVENTS';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'orders',
    }),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'apps/orders/.env', validationSchema: envSchema }),
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        drizzle,
        connection: config.get('DATABASE_URL', { infer: true }),
      }),
    }),
    OutboxModule.forRootAsync({
      imports: [
        ClientsModule.registerAsync([
          {
            name: FULFILLMENT_EVENTS,
            inject: [ConfigService],
            useFactory: (config: ConfigService<Env, true>) => ({
              transport: Transport.RMQ,
              options: {
                urls: [config.get('RABBITMQ_URL', { infer: true })],
                queue: FULFILLMENT_EVENTS_QUEUE,
                queueOptions: fulfillmentEventsQueueOptions,
                // Written to disk by the broker, so a broker restart keeps them.
                persistent: true,
              },
            }),
          },
        ]),
      ],
      // Publishes with the client's emit(), which resolves once the broker confirmed the message.
      transports: { fulfillment: ClientProxyTransport(FULFILLMENT_EVENTS) },
      useFactory: () => ({
        relay: { pollInterval: '1s', publishTimeout: '10s' },
        // Retries for 30 to 60 minutes, through a broker outage, before dead-lettering.
        retry: { attempts: 70, backoff: { delay: '1s', maxDelay: '1m' } },
      }),
    }),
    OrdersModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    {
      // The outbox's messages, in this service's database (schema nest_outbox).
      provide: PostgresOutboxStore,
      inject: [getDrizzleToken(), OutboxStorage],
      useFactory: (db: NodePgDatabase, outboxStorage: OutboxStorage) =>
        new PostgresOutboxStore({ executor: fromDrizzle(db) }, outboxStorage),
    },
  ],
})
export class AppModule {}
```

- **`PostgresOutboxStore`** keeps the outbox's messages in the orders database, in a schema of its own, `nest_outbox`, which it creates and migrates at startup in development (see [Keep messages in your database](/reliability/outbox#keep-messages-in-your-database)). Your migrations don't create it.
- **The client takes the shared queue and its options**, so it declares `fulfillment.events` exactly as the worker does. `persistent: true` asks the broker to keep each message on disk: the client's default is `false`.
- **`ClientsModule` is in the outbox's `imports`**, because `ClientProxyTransport(FULFILLMENT_EVENTS)` is a class that Nest instantiates inside `OutboxModule`, where it injects the client by its name.
- **`retry`** keeps a message for 30 to 60 minutes of attempts, enough for a broker restart or a short outage. After that, the message moves to the outbox's own dead letters, where `OutboxDeadLetters` can requeue it (see [Retries and the dead-letter queue](/reliability/outbox#retries-and-the-dead-letter-queue)).
- **`ObserveModule` comes first** in `imports`, as the [SDK's quick start](/observability/sdk#quick-start) does: modules shut down in reverse order, so it stops last, and sends what the others recorded (see [Shutdown](/observability/sdk#shutdown)). `createObserveModule()` returns it with `ObserveInstrument`, which `main.ts` passes to Nest.
- **The key pair is empty until you link the project.** Without one, the SDK sends nothing, and says so at startup. `npx @nestjs/observe link`, run in the workspace's root, writes `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` into the root `.env`, and adds `--env-file .env` to the `nest start` scripts, so they're in the environment before `AppModule` is imported, when the SDK reads them: `ConfigModule` loads `apps/orders/.env` too late for that (see [Linking from the terminal](/observability/sdk#linking-from-the-terminal)). Keys are scoped to a project, so the fulfillment service, started by the same script, uses the same pair (see [First project](/observability/overview#first-project)).

Start the orders service. It's the workspace's default project, so `nest start` without a name starts it:

```bash
$ npm run start
```

At startup, the outbox logs its store, which created its schema:

```bash
LOG [OutboxModule] OutboxStorage: PostgresOutboxStore
LOG [OutboxModule] PostgresOutboxStore: migrated schema "nest_outbox" to version 1.
```

Place an order. It commits, and its event waits in `fulfillment.events` for a worker, which the next section adds (the management UI shows one message ready in that queue):

```bash
$ curl localhost:3000/orders --json '{"customerEmail":"ada@example.com","shippingAddress":"1 Analytical Way, London","items":[{"sku":"KB-01","quantity":2}]}'
{"id":"0e32101b-33a4-483b-84fc-e2f438df69f9","customerEmail":"ada@example.com","shippingAddress":"1 Analytical Way, London","items":[{"sku":"KB-01","quantity":2}],"createdAt":"2026-11-23T19:41:15.833Z"}
```

#### Consume events in the fulfillment worker

The fulfillment service has its own configuration, with one more setting: how many events an instance handles at the same time.

```typescript
@@filename(apps/fulfillment/src/config)
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3001),
  DATABASE_URL: z.url(),
  RABBITMQ_URL: z.url({ protocol: /^amqps?$/ }),
  // How many events one instance handles at the same time.
  PREFETCH_COUNT: z.coerce.number().int().min(1).max(100).default(10),
});

export type Env = z.infer<typeof envSchema>;
```

Its table holds one shipment per order. The order's id is the primary key, which is what makes a second delivery of the same event harmless, as [Handle each event once](/tutorials/microservices-rabbitmq#handle-each-event-once) shows:

```typescript
@@filename(apps/fulfillment/src/database/schema)
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const shipments = pgTable('shipments', {
  // One shipment per order: the key that makes a second delivery a no-op.
  orderId: uuid('order_id').primaryKey(),
  status: text('status', { enum: ['preparing', 'shipped'] }).notNull().default('preparing'),
  customerEmail: text('customer_email').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  items: jsonb('items').$type<{ sku: string; quantity: number }[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});
```

Its drizzle-kit config is the orders service's, with its own paths:

```typescript
@@filename(apps/fulfillment/drizzle.config)
import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// Locally, the service's .env file; in CI and production, the environment.
if (existsSync('apps/fulfillment/.env')) {
  process.loadEnvFile('apps/fulfillment/.env');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './apps/fulfillment/src/database/schema.ts',
  out: './apps/fulfillment/drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Generate its migration, and apply it to its own database:

```bash
$ npx drizzle-kit generate --config apps/fulfillment/drizzle.config.ts --name=shipments
$ npx drizzle-kit migrate --config apps/fulfillment/drizzle.config.ts
```

##### Acknowledge after the work is done

By default, the RabbitMQ transport doesn't acknowledge messages at all (`noAck` is `true`): the broker deletes a message the moment it hands it to the worker. A worker that crashes in the middle of an event loses it. With `noAck: false`, the broker keeps each message until the worker acknowledges it with `channel.ack()`, and redelivers it, to this instance or another one, if the worker's connection drops first (see [Message acknowledgement](/microservices/rabbitmq#message-acknowledgement)).

Manual acknowledgement has a trap: when a handler throws, Nest logs the error and does nothing else. The message stays unacknowledged, neither retried nor dead-lettered, holding one of the instance's prefetch slots until the channel closes, and then it comes back. A message that fails validation in a pipe never reaches the handler's body at all, so a `try`/`catch` there can't settle it either. An [interceptor](/interceptors) sees both, because the pipes and the handler run inside its `next.handle()`:

```typescript
@@filename(apps/fulfillment/src/messaging/rmq-ack.interceptor)
import { Injectable, Logger, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { RmqContext } from '@nestjs/microservices';
import { FULFILLMENT_EVENTS_DEAD_LETTER_QUEUE, FULFILLMENT_EVENTS_QUEUE } from '@app/contracts';
import type { ConfirmChannel, Message } from 'amqplib';
import { setTimeout } from 'node:timers/promises';
import { from, lastValueFrom, type Observable } from 'rxjs';
import { InvalidMessageException } from './invalid-message.exception.js';

/** How many times an event is tried before it's dead-lettered. */
const MAX_ATTEMPTS = 5;

/** The wait before each retry: 1, 2, 4, then 8 seconds. */
const backoff = (attempt: number) => Math.min(1_000 * 2 ** (attempt - 1), 16_000);

/**
 * Acknowledges an event once its handler succeeded, and only then. A failed
 * event is retried, after a backoff, up to MAX_ATTEMPTS times, then moved to
 * the dead-letter queue with its error. An invalid message is moved there at once.
 */
@Injectable()
export class RmqAckInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RmqAckInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<void> {
    const rmq = context.switchToRpc().getContext<RmqContext>();
    // The transport's channels confirm publishes (amqp-connection-manager's default).
    const channel = rmq.getChannelRef() as ConfirmChannel;
    const message = rmq.getMessage() as Message;
    const pattern = rmq.getPattern();
    // Counted here, in a header: RabbitMQ 4 doesn't count a nack() with requeue as an attempt.
    const attempt = Number(message.properties.headers?.['x-attempt'] ?? 1);

    /** Publishes a copy to `queue`, waits for the broker to confirm it, then acknowledges the original. */
    const moveTo = async (queue: string, headers: Record<string, unknown>) => {
      channel.sendToQueue(queue, message.content, {
        ...message.properties,
        headers: { ...message.properties.headers, ...headers },
      });
      await channel.waitForConfirms();
      channel.ack(message);
    };

    const settle = async () => {
      try {
        // Runs the pipes and the handler: a failed validation lands below too.
        await lastValueFrom(next.handle(), { defaultValue: undefined });
      } catch (error) {
        if (!(error instanceof InvalidMessageException) && attempt < MAX_ATTEMPTS) {
          const delay = backoff(attempt);
          this.logger.warn(`Attempt ${attempt} of ${pattern} failed, retrying in ${delay} ms: ${error}`);
          await setTimeout(delay);
          return moveTo(FULFILLMENT_EVENTS_QUEUE, { 'x-attempt': attempt + 1 });
        }
        const reason = error instanceof InvalidMessageException ? JSON.stringify(error.getError()) : String(error);
        this.logger.error(`Dead-lettered ${pattern} after ${attempt} attempt(s): ${reason}`);
        return moveTo(FULFILLMENT_EVENTS_DEAD_LETTER_QUEUE, { 'x-attempts': attempt, 'x-error': reason.slice(0, 1_000) });
      }
      channel.ack(message);
    };

    return from(
      settle().catch((error) => {
        // The channel closed meanwhile: the broker gives the event to another consumer.
        this.logger.warn(`Could not settle ${pattern}: ${error}`);
      }),
    );
  }
}
```

- **`ack()` only after the handler resolved.** The handler writes to the database and resolves after the commit, so an acknowledged event is always a committed shipment. A crash before `ack()` leaves the event in the queue.
- **A retry is a copy.** After a failure, the interceptor publishes the message again, to the back of the queue, with its attempt number in an `x-attempt` header, waits for the broker to confirm the copy, and only then acknowledges the original. Returning the message with `nack(message, false, true)` would be shorter, but RabbitMQ 4 doesn't count such a requeue against the delivery limit, and the message carries no attempt number: one that fails every time would loop forever. A crash between the copy and the `ack()` leaves two copies, which [Handle each event once](/tutorials/microservices-rabbitmq#handle-each-event-once) makes harmless.
- **The last attempt goes to the dead-letter queue**, the same way, with the error in an `x-error` header, so whoever reads the dead letter sees why it failed.
- **The backoff holds the message.** Waiting before the retry keeps one of the instance's prefetch slots busy. When the database is down, that's what you want: the worker slows down instead of burning through its attempts in milliseconds. A delay queue (a queue with a message TTL that dead-letters back into `fulfillment.events`) frees the slot instead, at the cost of more queues to declare.
- **A closed channel is caught.** If the connection dropped while the handler ran, `ack()` throws, and the broker has already put the message back for another consumer.

> info **Hint** If dead-lettering a failed message straight away is enough, without retries, the transport can do it for you: the `nackOnInternalError` option of `@nestjs/microservices` 12.6.1 and later rejects a message, without requeue, when its handler fails with an internal error (see [Message acknowledgement](/microservices/rabbitmq#message-acknowledgement)). This service retries an event first, so it settles messages itself.

A validation failure is a different kind of failure: retrying a message that breaks its contract can't fix it. The validation pipe throws this exception, which the interceptor moves to the dead-letter queue at once:

```typescript
@@filename(apps/fulfillment/src/messaging/invalid-message.exception)
import { RpcException } from '@nestjs/microservices';

interface Issue {
  message: string;
  path?: readonly (PropertyKey | { key: PropertyKey })[];
}

/** A message that breaks its contract: no retry will make it valid. */
export class InvalidMessageException extends RpcException {
  constructor(issues: readonly Issue[]) {
    const path = (issue: Issue) =>
      issue.path?.map((segment) => String(typeof segment === 'object' ? segment.key : segment)).join('.');
    super({ message: 'Invalid message', issues: issues.map((issue) => `${path(issue)}: ${issue.message}`) });
  }
}
```

##### Retry, then dead-letter

A message that fails every time, a poison message, must not loop forever. The interceptor tries an event 5 times (`MAX_ATTEMPTS`), with 15 seconds of backoff in all, then moves it to `fulfillment.events.dead`. A message that kills the worker before the interceptor can catch anything, with an out-of-memory error for example, comes back each time the broker sees the worker's connection drop. The quorum queue's delivery limit dead-letters that one, after 5 redeliveries.

The transport declares only the queue it consumes, and RabbitMQ silently drops a message routed to a queue that doesn't exist, dead letters included. So the worker declares the dead-letter queue itself, at startup, before it consumes anything:

```typescript
@@filename(apps/fulfillment/src/messaging/dead-letter-queue)
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FULFILLMENT_EVENTS_DEAD_LETTER_QUEUE } from '@app/contracts';
import { connect } from 'amqplib';
import type { Env } from '../config.js';

/**
 * The transport declares only the queue it consumes. RabbitMQ drops a dead
 * letter whose queue doesn't exist, so declare it before the first event.
 */
@Injectable()
export class DeadLetterQueue implements OnApplicationBootstrap {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async onApplicationBootstrap() {
    const connection = await connect(this.config.get('RABBITMQ_URL', { infer: true }));
    try {
      const channel = await connection.createChannel();
      await channel.assertQueue(FULFILLMENT_EVENTS_DEAD_LETTER_QUEUE, {
        durable: true,
        arguments: { 'x-queue-type': 'quorum' },
      });
    } finally {
      await connection.close();
    }
  }
}
```

If RabbitMQ can't be reached when the worker starts, this declaration fails, and so does the startup: the platform restarts the worker until the broker answers. Once the worker runs, the transport reconnects by itself whenever its connection drops.

A dead letter keeps its body. One the worker moved there has the `x-attempts` and `x-error` headers; one the broker moved after the delivery limit has `x-death` headers instead, with the reason `delivery_limit`. Read them in the management UI's **Get messages** panel of `fulfillment.events.dead`, fix the cause, and move the messages back with a [shovel](https://www.rabbitmq.com/docs/shovel), the management UI's **Move messages**, once the plugin is enabled.

##### Handle each event once

RabbitMQ delivers at least once. A worker that commits a shipment and dies before `ack()` gets the event again, and so does the outbox relay's retry of a publish whose confirmation was lost. The consumer has to make the second delivery a no-op.

Here, the shipment's primary key is the order's id, and the insert is one statement that does nothing on conflict:

```typescript
@@filename(apps/fulfillment/src/shipments/shipments.service)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { OrderPlaced, Shipment } from '@app/contracts';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { shipments } from '../database/schema.js';

@Injectable()
export class ShipmentsService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  /** Creates the order's shipment. `false` when it exists: this delivery is a duplicate. */
  async createFor(event: OrderPlaced): Promise<boolean> {
    // One statement: two deliveries of the same event, on two instances at the
    // same moment, can't both insert. A SELECT before the INSERT could let both through.
    const created = await this.db
      .insert(shipments)
      .values({
        orderId: event.orderId,
        customerEmail: event.customerEmail,
        shippingAddress: event.shippingAddress,
        items: event.items,
      })
      .onConflictDoNothing({ target: shipments.orderId })
      .returning({ orderId: shipments.orderId });
    return created.length === 1;
  }

  async find(orderId: string): Promise<Shipment | null> {
    const [shipment] = await this.db.select().from(shipments).where(eq(shipments.orderId, orderId));
    if (!shipment) {
      return null;
    }
    const { status, items, createdAt } = shipment;
    return { orderId, status, items, createdAt: createdAt.toISOString() };
  }
}
```

`createFor()` answers whether this delivery created the shipment, from what the `INSERT` returned. A service that first selects the shipment, then inserts it when it isn't there, has a gap between the two: two copies of the event that run at the same time, on two instances or on one with a prefetch count above one, both find nothing, and the second insert fails with a unique violation, which the interceptor then retries. The [tests](/tutorials/microservices-rabbitmq#test-it) catch exactly that.

> info **Hint** When an event's effect isn't a row with a natural key, for example an email, record the message's `id` from the envelope in a table of processed messages, with a primary key on it, in the same transaction as the effect. `OutboxInbox` from `@nestjs/outbox` is such a table, as the outbox chapter's [analytics service](/reliability/outbox#publish-to-the-analytics-microservice) shows.

The controller handles the event. The pipe validates the envelope against the contract, and the interceptor acknowledges it:

```typescript
@@filename(apps/fulfillment/src/shipments/shipments.controller)
import { Controller, Logger, StandardSchemaValidationPipe, UseInterceptors, UsePipes } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ORDER_PLACED, orderPlacedEnvelopeSchema, type OrderPlacedEnvelope } from '@app/contracts';
import { InvalidMessageException } from '../messaging/invalid-message.exception.js';
import { RmqAckInterceptor } from '../messaging/rmq-ack.interceptor.js';
import { ShipmentsService } from './shipments.service.js';

@Controller()
@UsePipes(new StandardSchemaValidationPipe({ exceptionFactory: (issues) => new InvalidMessageException(issues) }))
export class ShipmentsController {
  private readonly logger = new Logger(ShipmentsController.name);

  constructor(private readonly shipmentsService: ShipmentsService) {}

  @EventPattern(ORDER_PLACED)
  @UseInterceptors(RmqAckInterceptor)
  async onOrderPlaced(@Payload({ schema: orderPlacedEnvelopeSchema }) envelope: OrderPlacedEnvelope) {
    const created = await this.shipmentsService.createFor(envelope.payload);
    if (created) {
      this.logger.log(`Shipment created for order ${envelope.payload.orderId}`);
    } else {
      this.logger.log(`Skipped duplicate ${envelope.topic} ${envelope.id}`);
    }
  }
}
```

The shipments module registers the controller and the service:

```typescript
@@filename(apps/fulfillment/src/shipments/shipments.module)
import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller.js';
import { ShipmentsService } from './shipments.service.js';

@Module({
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
})
export class ShipmentsModule {}
```

##### Start the worker

The worker listens on two queues: events, with manual acknowledgement, and requests, which [the next section](/tutorials/microservices-rabbitmq#ask-another-service-with-request-response) uses. The options of both servers live in one file, which the tests use too:

```typescript
@@filename(apps/fulfillment/src/messaging/transport)
import { Transport, type RmqOptions } from '@nestjs/microservices';
import {
  FULFILLMENT_EVENTS_QUEUE,
  FULFILLMENT_REQUESTS_QUEUE,
  fulfillmentEventsQueueOptions,
  fulfillmentRequestsQueueOptions,
} from '@app/contracts';
import type { Env } from '../config.js';

type Config = Pick<Env, 'RABBITMQ_URL' | 'PREFETCH_COUNT'>;

/** Events: acknowledged once handled, so a crash or an error loses none of them. */
export const eventsServer = (config: Config): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [config.RABBITMQ_URL],
    queue: FULFILLMENT_EVENTS_QUEUE,
    queueOptions: fulfillmentEventsQueueOptions,
    noAck: false,
    // At most this many unacknowledged events on this instance at a time.
    prefetchCount: config.PREFETCH_COUNT,
    // On shutdown: stop taking events, then wait for the ones in flight.
    gracefulShutdown: true,
    gracePeriod: 20_000,
  },
});

/** Requests: their own queue, so they never wait behind a backlog of events. */
export const requestsServer = (config: Config): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [config.RABBITMQ_URL],
    queue: FULFILLMENT_REQUESTS_QUEUE,
    queueOptions: fulfillmentRequestsQueueOptions,
    gracefulShutdown: true,
    gracePeriod: 5_000,
  },
});
```

- **`prefetchCount`** is how many unacknowledged events the broker sends one instance at a time, and so how many it handles at once. The transport's default is `0`, no limit: the first instance to connect would take every message in the queue, and the others would sit idle.
- **`gracefulShutdown`** makes closing the server cancel its consumer first, then wait up to `gracePeriod` for the events being handled, before it closes the channel. See [Run several workers](/tutorials/microservices-rabbitmq#run-several-workers).
- **Requests are acknowledged automatically** (`noAck` keeps its default). A request lost in a crash costs nothing: its caller times out and can ask again. An event lost in a crash is a shipment that never happens.

The worker's root module registers an `ObserveModule` of its own, its database and the dead-letter queue. Its `health/` folder is a copy of the orders service's, since both check their own database:

```bash
$ cp -r apps/orders/src/health apps/fulfillment/src/health
```

Its root module:

```typescript
@@filename(apps/fulfillment/src/app.module)
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { createObserveModule } from '@nestjs/observe';
import { drizzle } from 'drizzle-orm/node-postgres';
import { envSchema, type Env } from './config.js';
import { HealthModule } from './health/health.module.js';
import { DeadLetterQueue } from './messaging/dead-letter-queue.js';
import { ShipmentsModule } from './shipments/shipments.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'fulfillment',
    }),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'apps/fulfillment/.env', validationSchema: envSchema }),
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        drizzle,
        connection: config.get('DATABASE_URL', { infer: true }),
      }),
    }),
    ShipmentsModule,
    HealthModule,
  ],
  providers: [DeadLetterQueue],
})
export class AppModule {}
```

The worker is a [hybrid application](/faq/hybrid-application): an HTTP server for the platform's health checks, and the two RabbitMQ servers. `listen()` comes before `startAllMicroservices()`, so every module has finished initializing, and the dead-letter queue exists, before the first message arrives. `instrument` goes in the options of `NestFactory.create()`, the call that creates the application, which `connectMicroservice()` then adds the RabbitMQ servers to:

```typescript
@@filename(apps/fulfillment/src/main)
import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { AppModule, ObserveInstrument } from './app.module.js';
import type { Env } from './config.js';
import { eventsServer, requestsServer } from './messaging/transport.js';

const app = await NestFactory.create<NestNodeApplication>(AppModule, new NodeAdapter(), {
  instrument: ObserveInstrument,
  logger: new ConsoleLogger({ json: process.env.NODE_ENV === 'production' }),
});
// On SIGTERM: stop consuming, finish the messages in flight, then close the pool.
app.enableShutdownHooks();

const config = app.get<ConfigService<Env, true>>(ConfigService);
const rabbitmq = {
  RABBITMQ_URL: config.get('RABBITMQ_URL', { infer: true }),
  PREFETCH_COUNT: config.get('PREFETCH_COUNT', { infer: true }),
};
app.connectMicroservice(eventsServer(rabbitmq));
app.connectMicroservice(requestsServer(rabbitmq));

// The HTTP server (health checks) first: every module is initialized before a message arrives.
await app.listen(config.get('PORT', { infer: true }));
await app.startAllMicroservices();
```

Start the worker from another terminal, on port 3001:

```bash
$ npm run start -- fulfillment
```

It takes the order that was waiting in the queue:

```bash
LOG [NestApplication] Nest application successfully started
LOG [NestMicroservice] Nest microservice successfully started
LOG [NestMicroservice] Nest microservice successfully started
LOG [ShipmentsController] Shipment created for order 0e32101b-33a4-483b-84fc-e2f438df69f9
```

#### Ask another service with request-response

Events are the default between services: the orders service doesn't wait for the fulfillment service, doesn't need it to be up, and doesn't know who else listens. Some questions need an answer now, though, because an HTTP client is waiting for it. `GET /orders/:id/shipment` asks the fulfillment service where the order's shipment is, with `send()` and `@MessagePattern()`, request-response over RabbitMQ.

The worker answers from its database. Add the handler to its controller:

```typescript
@@filename(apps/fulfillment/src/shipments/shipments.controller)
import { Controller, Logger, StandardSchemaValidationPipe, UseInterceptors, UsePipes } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  FIND_SHIPMENT,
  ORDER_PLACED,
  findShipmentSchema,
  orderPlacedEnvelopeSchema,
  type FindShipment,
  type OrderPlacedEnvelope,
} from '@app/contracts';
import { InvalidMessageException } from '../messaging/invalid-message.exception.js';
import { RmqAckInterceptor } from '../messaging/rmq-ack.interceptor.js';
import { ShipmentsService } from './shipments.service.js';

@Controller()
@UsePipes(new StandardSchemaValidationPipe({ exceptionFactory: (issues) => new InvalidMessageException(issues) }))
export class ShipmentsController {
  private readonly logger = new Logger(ShipmentsController.name);

  constructor(private readonly shipmentsService: ShipmentsService) {}

  @EventPattern(ORDER_PLACED)
  @UseInterceptors(RmqAckInterceptor)
  async onOrderPlaced(@Payload({ schema: orderPlacedEnvelopeSchema }) envelope: OrderPlacedEnvelope) {
    const created = await this.shipmentsService.createFor(envelope.payload);
    if (created) {
      this.logger.log(`Shipment created for order ${envelope.payload.orderId}`);
    } else {
      this.logger.log(`Skipped duplicate ${envelope.topic} ${envelope.id}`);
    }
  }

  @MessagePattern(FIND_SHIPMENT)
  find(@Payload({ schema: findShipmentSchema }) { orderId }: FindShipment) {
    return this.shipmentsService.find(orderId);
  }
}
```

The request is validated by the same pipe. An invalid one gets an error reply instead of a dead letter, since requests aren't acknowledged.

On the orders side, a small client sends the request, and waits for the answer for at most `REQUEST_TIMEOUT_MS`:

```typescript
@@filename(apps/orders/src/orders/fulfillment.client)
import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FIND_SHIPMENT, REQUEST_TIMEOUT_MS, shipmentSchema, type Shipment } from '@app/contracts';
import { firstValueFrom, timeout } from 'rxjs';

export const FULFILLMENT_REQUESTS = 'FULFILLMENT_REQUESTS';

/** Asks the fulfillment service, and waits for its answer. */
@Injectable()
export class FulfillmentClient {
  private readonly logger = new Logger(FulfillmentClient.name);

  constructor(@Inject(FULFILLMENT_REQUESTS) private readonly client: ClientProxy) {}

  async findShipment(orderId: string): Promise<Shipment | null> {
    let reply: unknown;
    try {
      reply = await firstValueFrom(
        // A request waits in the queue until a worker takes it: no answer is
        // an answer too, after the timeout.
        this.client.send(FIND_SHIPMENT, { orderId }).pipe(timeout(REQUEST_TIMEOUT_MS)),
      );
    } catch (error) {
      this.logger.warn('The fulfillment service did not answer', { orderId, error: String(error) });
      throw new ServiceUnavailableException('The fulfillment service is unavailable, try again later');
    }
    return shipmentSchema.nullable().parse(reply);
  }
}
```

- **A timeout is required.** Over RabbitMQ, `send()` doesn't fail when the fulfillment service is down: the request waits in `fulfillment.requests` for a consumer, and `send()` has no timeout of its own, so the HTTP request would hang. The RxJS `timeout()` operator ends the wait (see [Handling timeouts](/microservices/basics#handling-timeouts)).
- **No answer is a 503.** Unmapped, the `TimeoutError` would reach the client as a 500, which says the orders service is broken. `503 Service Unavailable` says a dependency is, and that the same request may work later.
- **The request doesn't outlive its caller.** The queue's message TTL is the same timeout, so a request nobody took in time is dropped, rather than answered to a client that has given up when the worker comes back.
- **The answer is validated too**, with the contract's `shipmentSchema`, so a fulfillment service that changed its answer fails here, loudly.
- **Never call `send()` inside a database transaction.** It holds the transaction, and its connection, open for as long as the other service takes to answer.

The controller returns the shipment, or a 404 while the worker hasn't prepared it yet:

```typescript
@@filename(apps/orders/src/orders/orders.controller)
import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { FulfillmentClient } from './fulfillment.client.js';
import { placeOrderSchema, type PlaceOrderDto } from './orders.schemas.js';
import { OrdersService } from './orders.service.js';

const orderId = { schema: z.uuid() };

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly fulfillmentClient: FulfillmentClient,
  ) {}

  @Post()
  place(@Body({ schema: placeOrderSchema }) dto: PlaceOrderDto) {
    return this.ordersService.place(dto);
  }

  @Get(':id')
  findOne(@Param('id', orderId) id: string) {
    return this.ordersService.findOne(id);
  }

  @Get(':id/shipment')
  async findShipment(@Param('id', orderId) id: string) {
    const order = await this.ordersService.findOne(id);
    const shipment = await this.fulfillmentClient.findShipment(order.id);
    if (!shipment) {
      throw new NotFoundException('No shipment yet');
    }
    return shipment;
  }
}
```

The orders module registers the request client, on the requests queue with its shared options:

```typescript
@@filename(apps/orders/src/orders/orders.module)
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FULFILLMENT_REQUESTS_QUEUE, fulfillmentRequestsQueueOptions } from '@app/contracts';
import type { Env } from '../config.js';
import { FULFILLMENT_REQUESTS, FulfillmentClient } from './fulfillment.client.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: FULFILLMENT_REQUESTS,
        inject: [ConfigService],
        useFactory: (config: ConfigService<Env, true>) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get('RABBITMQ_URL', { infer: true })],
            queue: FULFILLMENT_REQUESTS_QUEUE,
            queueOptions: fulfillmentRequestsQueueOptions,
          },
        }),
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, FulfillmentClient],
})
export class OrdersModule {}
```

The client replies through RabbitMQ's direct reply-to (`amq.rabbitmq.reply-to`), its default `replyQueue`: no reply queue to declare or clean up.

#### Run several workers

Start a second instance of the worker, on another port. RabbitMQ hands each event to one of the queue's consumers, so the instances share the work, **competing consumers**, with no coordination between them:

```bash
$ PORT=3002 npm run start -- fulfillment
```

Each instance holds at most `PREFETCH_COUNT` unacknowledged events, so a slow instance doesn't hoard messages that an idle one could handle. Raise it for throughput while the handler mostly waits on the database, and keep it at the pool size or below, since each event in flight holds a connection while it writes.

Events for different orders can now be handled at the same time, on different instances, and in any order. That's fine for `order.placed`, which is the only event of its order. Once an order has more events, a cancellation can be handled before the placement it cancels: write each handler so that it doesn't depend on the order of arrival (a cancellation that finds no shipment records one as cancelled, and the placement's `INSERT ... ON CONFLICT DO NOTHING` then leaves it so), or give the order's events to one consumer.

##### Shut down without losing an event

A deploy sends `SIGTERM`. With `enableShutdownHooks()`, the worker closes its servers. With `gracefulShutdown`, each server first cancels its consumer, so the broker sends this instance nothing more, then waits for the handlers in flight, up to `gracePeriod`, and closes its channel only then. The events in flight finish, and are acknowledged. An event whose handler outlasts the grace period is still unacknowledged when the channel closes, so the broker gives it to another instance: it's handled twice, which the insert makes harmless. Give the platform's shutdown timeout (Kubernetes' `terminationGracePeriodSeconds`) more than `gracePeriod`, so the process isn't killed while it waits.

The orders service drains too. On `SIGTERM`, the outbox relay stops claiming messages, finishes the publishes in flight, and releases the rest for another instance, before the RabbitMQ client closes. A message whose publish was cut short is still in the outbox, and goes out from the next instance.

#### Try it

With both services and two worker instances running, place an order and ask for its shipment:

```bash
$ curl localhost:3000/orders --json '{"customerEmail":"grace@example.com","shippingAddress":"7 Compiler Street, Arlington","items":[{"sku":"KB-01","quantity":1},{"sku":"MS-02","quantity":1}]}'
{"id":"c384ae0e-0577-42b1-9e88-32f106eb55dc","customerEmail":"grace@example.com","shippingAddress":"7 Compiler Street, Arlington","items":[{"sku":"KB-01","quantity":1},{"sku":"MS-02","quantity":1}],"createdAt":"2026-11-23T19:42:23.739Z"}
$ curl localhost:3000/orders/c384ae0e-0577-42b1-9e88-32f106eb55dc/shipment
{"orderId":"c384ae0e-0577-42b1-9e88-32f106eb55dc","status":"preparing","items":[{"sku":"KB-01","quantity":1},{"sku":"MS-02","quantity":1}],"createdAt":"2026-11-23T19:42:23.768Z"}
```

One of the two workers logs it. Place a few more, and both workers' logs show some of them:

```bash
LOG [ShipmentsController] Shipment created for order c384ae0e-0577-42b1-9e88-32f106eb55dc
```

Stop RabbitMQ, and place an order. The orders service still accepts it, in a few milliseconds: the order and its event commit together, and the relay keeps trying:

```bash
$ docker stop rabbitmq
$ curl -i localhost:3000/orders --json '{"customerEmail":"ada@example.com","shippingAddress":"1 Analytical Way, London","items":[{"sku":"KB-01","quantity":1}]}'
HTTP/1.1 201 Created
...
{"id":"4b41b558-e7d9-42dc-bfa8-6b2932396d13","customerEmail":"ada@example.com","shippingAddress":"1 Analytical Way, London","items":[{"sku":"KB-01","quantity":1}],"createdAt":"2026-11-23T19:42:39.505Z"}
```

The orders service logs each attempt, with a growing wait:

```bash
ERROR [ClientProxy] Disconnected from RMQ. Trying to reconnect.
WARN [OutboxRelay] Retrying order.placed 01a209ee-9195-7167-9b4f-2048f3cc3e6e in 885ms (attempt 1 of 70 failed): Error: Connection lost. Trying to reconnect...
WARN [OutboxRelay] Retrying order.placed 01a209ee-9195-7167-9b4f-2048f3cc3e6e in 1572ms (attempt 2 of 70 failed): Error: Connection lost. Trying to reconnect...
WARN [OutboxRelay] Retrying order.placed 01a209ee-9195-7167-9b4f-2048f3cc3e6e in 3403ms (attempt 3 of 70 failed): Error: Connection lost. Trying to reconnect...
WARN [OutboxRelay] Retrying order.placed 01a209ee-9195-7167-9b4f-2048f3cc3e6e in 5309ms (attempt 4 of 70 failed): Error: Connection lost. Trying to reconnect...
WARN [OutboxRelay] Retrying order.placed 01a209ee-9195-7167-9b4f-2048f3cc3e6e in 15601ms (attempt 5 of 70 failed): Error: Connection lost. Trying to reconnect...
WARN [OutboxRelay] Retrying order.placed 01a209ee-9195-7167-9b4f-2048f3cc3e6e in 19064ms (attempt 6 of 70 failed): Error: Connection lost. Trying to reconnect...
```

Start RabbitMQ again. The client reconnects, the relay's next attempt publishes the event, and a worker prepares the shipment:

```bash
$ docker start rabbitmq
LOG [ClientProxy] Successfully connected to RMQ broker
LOG [ShipmentsController] Shipment created for order 4b41b558-e7d9-42dc-bfa8-6b2932396d13
```

Now stop both workers, and ask for a shipment. The request waits in its queue until the timeout, and three seconds later the client gets a 503:

```bash
$ curl -i localhost:3000/orders/4b41b558-e7d9-42dc-bfa8-6b2932396d13/shipment
HTTP/1.1 503 Service Unavailable
...
{"message":"The fulfillment service is unavailable, try again later","error":"Service Unavailable","statusCode":503}
```

Finally, start a worker again, and publish a message that breaks the contract, the way a buggy producer would. The management API publishes it to the default exchange, which routes it to `fulfillment.events`:

```bash
$ curl -u guest:guest localhost:15672/api/exchanges/%2F/amq.default/publish --json '{"routing_key":"fulfillment.events","properties":{},"payload":"{\"pattern\":\"order.placed\",\"data\":{\"id\":\"x\",\"payload\":{\"orderId\":\"not-a-uuid\"}}}","payload_encoding":"string"}'
{"routed":true}
```

The worker moves it to the dead-letter queue at once, without a retry:

```bash
ERROR [RmqAckInterceptor] Dead-lettered order.placed after 1 attempt(s): {"message":"Invalid message","issues":["topic: Invalid input: expected string, received undefined",...,"payload.orderId: Invalid UUID",...]}
```

`fulfillment.events.dead` now holds it, with `x-attempts: 1` and the validation issues in `x-error`.

#### Test it

The guarantees on this page are about crashes, redeliveries, timeouts and outages, which a mock broker can't reproduce. The tests run against a real RabbitMQ and PostgreSQL, with a virtual host and two databases of their own, since they purge the queues and truncate the tables. They start the services in the test process, and send HTTP requests with `app.inject()`, which the Node adapter provides.

Add the test settings to the `vitest.config.e2e.ts` the CLI generated. The tests take the broker and the databases from `TEST_*` variables:

```typescript
@@filename(vitest.config.e2e)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // The test files share one broker and its queues.
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 30_000,
    env: {
      DATABASE_URL: 'postgres://unused-in-tests',
      RABBITMQ_URL: process.env.TEST_RABBITMQ_URL ?? 'amqp://unused-in-tests',
    },
  },
});
```

The helpers start worker instances, read the dead-letter queue, and run a TCP proxy in front of the broker. Closing the proxy cuts every connection through it, the way a crash or a network outage does, without stopping the broker for the other connections:

```typescript
@@filename(apps/fulfillment/test/support)
import { createServer, connect as connectTcp, type Server, type Socket } from 'node:net';
import { fileURLToPath } from 'node:url';
import { getDrizzleToken } from '@nestjs/drizzle';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import {
  FULFILLMENT_EVENTS_DEAD_LETTER_QUEUE,
  FULFILLMENT_EVENTS_QUEUE,
  FULFILLMENT_REQUESTS_QUEUE,
  fulfillmentEventsQueueOptions,
  fulfillmentRequestsQueueOptions,
} from '@app/contracts';
import { connect } from 'amqplib';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { AppModule } from '../src/app.module.js';
import { eventsServer, requestsServer } from '../src/messaging/transport.js';

export const rabbitmqUrl = process.env.TEST_RABBITMQ_URL!;
export const fulfillmentDatabaseUrl = process.env.TEST_FULFILLMENT_DATABASE_URL!;

/** The fulfillment database, migrated. */
export async function fulfillmentDatabase() {
  const db = drizzle({ client: new Pool({ connectionString: fulfillmentDatabaseUrl }) });
  await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
  return db;
}

/** Empties the fulfillment queues, so a test sees only its own messages. */
export async function purgeQueues() {
  const connection = await connect(rabbitmqUrl);
  const channel = await connection.createChannel();
  const queues = [
    [FULFILLMENT_EVENTS_QUEUE, fulfillmentEventsQueueOptions],
    [FULFILLMENT_EVENTS_DEAD_LETTER_QUEUE, { durable: true, arguments: { 'x-queue-type': 'quorum' } }],
    [FULFILLMENT_REQUESTS_QUEUE, fulfillmentRequestsQueueOptions],
  ] as const;
  for (const [queue, options] of queues) {
    await channel.assertQueue(queue, options);
    await channel.purgeQueue(queue);
  }
  await connection.close();
}

/** The messages in the dead-letter queue, taken out of it. */
export async function takeDeadLetters() {
  const connection = await connect(rabbitmqUrl);
  const channel = await connection.createChannel();
  const letters = [];
  for (let message; (message = await channel.get(FULFILLMENT_EVENTS_DEAD_LETTER_QUEUE, { noAck: true })); ) {
    letters.push({ body: JSON.parse(message.content.toString()), headers: message.properties.headers ?? {} });
  }
  await connection.close();
  return letters;
}

/** Starts an instance of the fulfillment worker, with a pool of its own. */
export async function startWorker(options: { rabbitmqUrl?: string; prefetchCount?: number; gracePeriod?: number } = {}) {
  const db = drizzle({ client: new Pool({ connectionString: fulfillmentDatabaseUrl }) });
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(getDrizzleToken())
    .useValue(db)
    .compile();
  const app = moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter(), { logger: process.env.TEST_LOGS ? undefined : false });
  const config = { RABBITMQ_URL: options.rabbitmqUrl ?? rabbitmqUrl, PREFETCH_COUNT: options.prefetchCount ?? 10 };
  const events = eventsServer(config);
  if (options.gracePeriod !== undefined) {
    events.options!.gracePeriod = options.gracePeriod;
  }
  app.connectMicroservice(events);
  app.connectMicroservice(requestsServer(config));
  await app.init();
  await app.startAllMicroservices();
  return app;
}

/** A TCP proxy to the broker: closing it cuts every connection through it, as a crash or an outage would. */
export async function brokerProxy() {
  const target = new URL(rabbitmqUrl);
  const sockets = new Set<Socket>();
  let server: Server | undefined;
  let port = 0;
  const open = async () => {
    server = createServer((client) => {
      const upstream = connectTcp(Number(target.port || 5672), target.hostname);
      for (const socket of [client, upstream]) {
        sockets.add(socket);
        socket.on('close', () => sockets.delete(socket));
        socket.on('error', () => {
          client.destroy();
          upstream.destroy();
        });
      }
      client.pipe(upstream).pipe(client);
    });
    await new Promise<void>((resolve) => server!.listen(port, '127.0.0.1', resolve));
    port = (server.address() as { port: number }).port;
  };
  await open();
  const url = new URL(rabbitmqUrl);
  url.hostname = '127.0.0.1';
  url.port = String(port);
  return {
    url: url.toString(),
    open,
    close: async () => {
      for (const socket of sockets) {
        socket.destroy();
      }
      await new Promise((resolve) => server?.close(resolve));
    },
  };
}

/** Polls `check` until it returns a truthy value. */
export async function eventually<T>(check: () => Promise<T>, timeout = 20_000): Promise<NonNullable<T>> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await check();
    if (value) {
      return value;
    }
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for the condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
```

The worker's tests publish events the way the orders service does, and cover the consumer's guarantees. `vi.mock()` shortens the interceptor's backoff, so the five attempts take milliseconds:

```typescript
@@filename(apps/fulfillment/test/shipments.e2e-spec)
import { randomUUID } from 'node:crypto';
import type { NestNodeApplication } from '@nestjs/platform-node';
import { ClientProxyFactory, Transport, type ClientProxy } from '@nestjs/microservices';
import {
  FULFILLMENT_EVENTS_QUEUE,
  ORDER_PLACED,
  fulfillmentEventsQueueOptions,
  type OrderPlacedEnvelope,
} from '@app/contracts';
import { eq, sql } from 'drizzle-orm';
import { lastValueFrom } from 'rxjs';
import { shipments } from '../src/database/schema.js';
import { ShipmentsService } from '../src/shipments/shipments.service.js';
import {
  brokerProxy,
  eventually,
  fulfillmentDatabase,
  fulfillmentDatabaseUrl,
  purgeQueues,
  rabbitmqUrl,
  startWorker,
  takeDeadLetters,
} from './support.js';

// The retry backoff, shortened: the broker's delivery limit is what's under test.
vi.mock('node:timers/promises', async (importOriginal) => {
  const timers = await importOriginal<typeof import('node:timers/promises')>();
  return { ...timers, setTimeout: (ms: number) => timers.setTimeout(Math.min(ms, 20)) };
});

describe.skipIf(!rabbitmqUrl || !fulfillmentDatabaseUrl)('Fulfillment worker (e2e)', () => {
  let db: Awaited<ReturnType<typeof fulfillmentDatabase>>;
  let producer: ClientProxy;
  const workers: NestNodeApplication[] = [];

  beforeAll(async () => {
    db = await fulfillmentDatabase();
    // Publishes the way the orders service does: to the events queue, persistent, confirmed.
    producer = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: FULFILLMENT_EVENTS_QUEUE,
        queueOptions: fulfillmentEventsQueueOptions,
        persistent: true,
      },
    });
  });

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE shipments`);
    await purgeQueues();
  });

  afterEach(async () => {
    await Promise.all(workers.splice(0).map((worker) => worker.close()));
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await producer.close();
    await db.$client.end();
  });

  async function worker(options?: Parameters<typeof startWorker>[0]) {
    const app = await startWorker(options);
    workers.push(app);
    return { app, createFor: vi.spyOn(app.get(ShipmentsService), 'createFor') };
  }

  function orderPlaced(): OrderPlacedEnvelope {
    const orderId = randomUUID();
    return {
      id: randomUUID(),
      topic: ORDER_PLACED,
      key: orderId,
      headers: {},
      createdAt: Date.now(),
      payload: {
        orderId,
        customerEmail: 'ada@example.com',
        shippingAddress: '1 Analytical Way, London',
        items: [{ sku: 'KB-01', quantity: 1 }],
        placedAt: new Date().toISOString(),
      },
    };
  }

  const publish = (data: unknown) => lastValueFrom(producer.emit(ORDER_PLACED, data), { defaultValue: undefined });
  const shipmentCount = async () => (await db.select({ orderId: shipments.orderId }).from(shipments)).length;

  it('creates one shipment per order, and acknowledges a redelivered copy as a duplicate', async () => {
    const { app, createFor } = await worker();
    const service = app.get(ShipmentsService);
    // Both copies reach the database at the same time, as they can on two instances.
    let release!: () => void;
    const bothArrived = new Promise<void>((resolve) => (release = resolve));
    createFor.mockImplementation(async (event) => {
      if (createFor.mock.calls.length === 2) {
        release();
      }
      await bothArrived;
      return ShipmentsService.prototype.createFor.call(service, event);
    });
    const event = orderPlaced();

    await publish(event);
    await publish(event); // the outbox republishes a message whose confirmation it missed

    await eventually(async () => createFor.mock.calls.length === 2);
    const created = await Promise.all(createFor.mock.results.map((result) => result.value));
    expect(created.sort()).toEqual([false, true]); // one of them created the shipment
    expect(await shipmentCount()).toBe(1);
    expect(await takeDeadLetters()).toEqual([]);
  });

  it('dead-letters a message that breaks the contract, without retrying it', async () => {
    const { createFor } = await worker();

    await publish({ id: randomUUID(), payload: { orderId: 'not-a-uuid' } });

    const letter = await eventually(async () => (await takeDeadLetters()).at(0));
    expect(letter.body.data.payload).toEqual({ orderId: 'not-a-uuid' });
    expect(letter.headers).toMatchObject({ 'x-attempts': 1, 'x-error': expect.stringContaining('Invalid UUID') });
    expect(createFor).not.toHaveBeenCalled();
  });

  it('retries a failed event, and creates the shipment once it succeeds', async () => {
    const { createFor } = await worker();
    createFor.mockRejectedValueOnce(new Error('Connection terminated unexpectedly'));
    const event = orderPlaced();

    await publish(event);

    await eventually(async () => (await shipmentCount()) === 1);
    expect(createFor).toHaveBeenCalledTimes(2);
  });

  it('dead-letters an event that keeps failing, with its error, after its last attempt', async () => {
    const { createFor } = await worker();
    createFor.mockRejectedValue(new Error('Bug: column "items" does not exist'));
    const event = orderPlaced();

    await publish(event);

    const letter = await eventually(async () => (await takeDeadLetters()).at(0));
    expect(letter.body.data.id).toBe(event.id);
    expect(letter.headers).toMatchObject({ 'x-attempts': 5, 'x-error': 'Error: Bug: column "items" does not exist' });
    expect(createFor).toHaveBeenCalledTimes(5); // MAX_ATTEMPTS
  });

  it('delivers an event again when the worker handling it crashes before acknowledging it', async () => {
    const proxy = await brokerProxy();
    const crashing = await worker({ rabbitmqUrl: proxy.url, gracePeriod: 200 });
    crashing.createFor.mockReturnValue(new Promise(() => {})); // never finishes
    const event = orderPlaced();

    await publish(event);
    await eventually(async () => crashing.createFor.mock.calls.length === 1);
    const survivor = await worker();
    await proxy.close(); // the crashing worker's connection drops, with the event unacknowledged

    await eventually(async () => (await shipmentCount()) === 1);
    expect(survivor.createFor).toHaveBeenCalledTimes(1);
  });

  it('shares events between workers, each handled once', async () => {
    const first = await worker({ prefetchCount: 1 });
    const second = await worker({ prefetchCount: 1 });
    const events = Array.from({ length: 20 }, orderPlaced);

    await Promise.all(events.map(publish));

    await eventually(async () => (await shipmentCount()) === 20);
    expect(first.createFor.mock.calls.length).toBeGreaterThan(0);
    expect(second.createFor.mock.calls.length).toBeGreaterThan(0);
    expect(first.createFor.mock.calls.length + second.createFor.mock.calls.length).toBe(20);
  });

  it('finishes the event in flight when it shuts down', async () => {
    const stopping = await worker();
    const service = stopping.app.get(ShipmentsService);
    stopping.createFor.mockImplementation(async (event) => {
      await new Promise((resolve) => setTimeout(resolve, 1_000)); // a slow handler
      return ShipmentsService.prototype.createFor.call(service, event);
    });
    const event = orderPlaced();

    await publish(event);
    await eventually(async () => stopping.createFor.mock.calls.length === 1);
    await stopping.app.close(); // waits for the handler, which commits and acknowledges
    workers.splice(workers.indexOf(stopping.app), 1);

    const [shipment] = await db.select().from(shipments).where(eq(shipments.orderId, event.payload.orderId));
    expect(shipment).toBeDefined();
    const next = await worker();
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(next.createFor).not.toHaveBeenCalled(); // nothing was requeued
  });

  it('requeues the event in flight when the grace period runs out', async () => {
    const stopping = await worker({ gracePeriod: 200 });
    stopping.createFor.mockReturnValue(new Promise(() => {})); // outlives the grace period
    const event = orderPlaced();

    await publish(event);
    await eventually(async () => stopping.createFor.mock.calls.length === 1);
    await stopping.app.close();
    workers.splice(workers.indexOf(stopping.app), 1);
    const next = await worker();

    await eventually(async () => (await shipmentCount()) === 1);
    expect(next.createFor).toHaveBeenCalledTimes(1);
  });
});
```

- **The crash test** blocks the first worker's handler, so the event is in flight and unacknowledged, then cuts its connection. The broker gives the event to the second worker, which creates the shipment.
- **The shutdown tests** close a worker with an event in flight: within the grace period, the handler finishes and nothing is redelivered; past it, the event goes to the next worker.

The end-to-end tests run both services. The orders service reaches the broker through the proxy, so a test can take RabbitMQ away from it alone:

```typescript
@@filename(apps/orders/test/orders.e2e-spec)
import { fileURLToPath } from 'node:url';
import { getDrizzleToken } from '@nestjs/drizzle';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Outbox, OutboxRelay } from '@nestjs/outbox';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import { FULFILLMENT_EVENTS_QUEUE, fulfillmentEventsQueueOptions } from '@app/contracts';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { shipments } from '../../fulfillment/src/database/schema.js';
import {
  brokerProxy,
  eventually,
  fulfillmentDatabase,
  purgeQueues,
  rabbitmqUrl,
  startWorker,
} from '../../fulfillment/test/support.js';
import { AppModule, FULFILLMENT_EVENTS } from '../src/app.module.js';
import { orders } from '../src/database/schema.js';

const ordersDatabaseUrl = process.env.TEST_ORDERS_DATABASE_URL;

describe.skipIf(!rabbitmqUrl || !ordersDatabaseUrl)('Orders to fulfillment (e2e)', () => {
  const ordersDb = drizzle({ client: new Pool({ connectionString: ordersDatabaseUrl }) });
  let fulfillmentDb: Awaited<ReturnType<typeof fulfillmentDatabase>>;
  let proxy: Awaited<ReturnType<typeof brokerProxy>>;
  let app: NestNodeApplication;
  let worker: NestNodeApplication | undefined;

  beforeAll(async () => {
    await migrate(ordersDb, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    fulfillmentDb = await fulfillmentDatabase();
    await purgeQueues();
    await ordersDb.execute(sql`TRUNCATE orders`);
    await fulfillmentDb.execute(sql`TRUNCATE shipments`);
    // The orders service reaches the broker through a proxy the tests can cut.
    proxy = await brokerProxy();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(ordersDb) // the outbox's store runs on it too
      .overrideProvider(FULFILLMENT_EVENTS)
      .useValue(
        ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [proxy.url],
            queue: FULFILLMENT_EVENTS_QUEUE,
            queueOptions: fulfillmentEventsQueueOptions,
            persistent: true,
          },
        }),
      )
      .compile();
    app = moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter(), { logger: process.env.TEST_LOGS ? undefined : false });
    await app.init();
    worker = await startWorker();
  });

  afterAll(async () => {
    await worker?.close();
    await app.close(); // closes the orders pool too
    await proxy.close();
    await fulfillmentDb.$client.end();
  });

  const placeOrder = () =>
    app.inject({
      method: 'POST',
      url: '/orders',
      payload: {
        customerEmail: 'ada@example.com',
        shippingAddress: '1 Analytical Way, London',
        items: [{ sku: 'KB-01', quantity: 2 }],
      },
    });
  const shipmentCount = async () => (await fulfillmentDb.select({ orderId: shipments.orderId }).from(shipments)).length;

  it('places an order, and the fulfillment service ships it', async () => {
    const placed = await placeOrder();
    expect(placed.statusCode).toBe(201);
    const { id } = placed.json<{ id: string }>();

    const shipment = await eventually(async () => {
      const res = await app.inject({ method: 'GET', url: `/orders/${id}/shipment` });
      return res.statusCode === 200 && res.json();
    });
    expect(shipment).toMatchObject({ orderId: id, status: 'preparing', items: [{ sku: 'KB-01', quantity: 2 }] });
  });

  it('publishes nothing when the order rolls back', async () => {
    const before = await shipmentCount();
    const outbox = app.get(Outbox);
    const add = outbox.add.bind(outbox);
    vi.spyOn(outbox, 'add').mockImplementationOnce(async (tx, messages) => {
      await add(tx, messages); // the message is written...
      throw new Error('Connection terminated unexpectedly'); // ...then the transaction fails
    });

    expect((await placeOrder()).statusCode).toBe(500);
    expect(await app.get(OutboxRelay).stats()).toMatchObject({ pending: 0 });

    // The next order goes out alone: the rolled-back one never existed.
    expect((await placeOrder()).statusCode).toBe(201);
    await eventually(async () => (await shipmentCount()) === before + 1);
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    expect(await shipmentCount()).toBe(before + 1);
    expect(await ordersDb.$count(orders)).toBe(before + 1);
  });

  it('accepts orders while the broker is down, and publishes them once it is back', async () => {
    const before = await shipmentCount();
    await proxy.close();

    const placed = await placeOrder();
    expect(placed.statusCode).toBe(201);
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    expect(await shipmentCount()).toBe(before);
    expect(await app.get(OutboxRelay).stats()).toMatchObject({ pending: 1 });

    await proxy.open();
    await eventually(async () => (await shipmentCount()) === before + 1, 40_000);
    expect(await app.get(OutboxRelay).stats()).toMatchObject({ pending: 0, deadLetters: 0 });
  });

  it('answers 503 when the fulfillment service does not answer in time', async () => {
    const { id } = (await placeOrder()).json<{ id: string }>();
    await worker!.close();
    worker = undefined;

    const started = Date.now();
    const res = await app.inject({ method: 'GET', url: `/orders/${id}/shipment` });

    expect(res.statusCode).toBe(503);
    expect(Date.now() - started).toBeGreaterThanOrEqual(2_900); // the request's timeout
  });
});
```

The rollback test lets `outbox.add()` write the event, then fails the transaction, as a lost database connection would: the order and its event disappear together, and the next order is the only one that ships. The outage test places an order with the broker unreachable, checks that nothing was shipped while the event waits in the outbox, and that it ships once the broker is back.

Create the test databases and the virtual host once, then run both files:

```bash
$ docker exec shop-db psql -U postgres -c "CREATE DATABASE orders_test" -c "CREATE DATABASE fulfillment_test"
$ docker exec rabbitmq rabbitmqctl add_vhost test
$ docker exec rabbitmq rabbitmqctl set_permissions -p test guest ".*" ".*" ".*"
$ export TEST_RABBITMQ_URL=amqp://guest:guest@localhost:5672/test
$ export TEST_ORDERS_DATABASE_URL=postgres://postgres:shop@localhost:5432/orders_test
$ export TEST_FULFILLMENT_DATABASE_URL=postgres://postgres:shop@localhost:5432/fulfillment_test
$ npm run test:e2e

 Test Files  2 passed (2)
      Tests  12 passed (12)
```

Replace the insert in `createFor()` with a `SELECT` followed by an `INSERT`, and the first test fails: it holds both copies of the event until both have arrived, as two instances would run them, and the second insert hits the primary key. Remove `@UseInterceptors(RmqAckInterceptor)`, and the invalid message is never dead-lettered: it stays unacknowledged in the worker until the worker stops.

#### Production checklist

The JWT tutorial's [checklist](/tutorials/rest-api-jwt-authentication#production-checklist) applies to the orders service. For the services and the broker:

- **Run the migrations as a release step**, for each service against its own database, and the outbox's with `npx @nestjs/outbox migrate` in the orders service's: with `NODE_ENV=production`, the outbox store doesn't migrate at startup.
- **Run RabbitMQ as a cluster of three nodes.** A quorum queue replicates its messages to a majority of the nodes, and keeps working while one is down. Give the services every node's URL in `urls`, so they connect to another node when one goes away.
- **Give each service a broker user of its own.** The image's `guest` user has a password everyone knows. Create a user per service, with permissions on the queues it uses only, and connect with `amqps://` across networks.
- **Alert on the dead-letter queue.** A message in `fulfillment.events.dead` is an order without a shipment. Alert on its length, read the `x-error` and `x-death` headers, and move the messages back once the cause is fixed.
- **Watch the queue's depth and the outbox's lag.** A growing `fulfillment.events` means the workers can't keep up: add instances. A growing `lagMs` from `OutboxRelay.stats()` means the orders service can't publish (see [Run several instances](/reliability/outbox#run-several-instances)).
- **Version the contracts.** During a rolling deploy, old and new versions of both services exchange messages. Add fields as optional, remove them only once no producer sends them, and give a breaking change a new topic, such as `order.placed.v2`.
- **Size `gracePeriod` below the platform's shutdown timeout**, and keep handlers well under it.
- **Give production its own Observe key pair**, from the project's **API Keys** page, as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in each service's environment on the platform: `start:prod` doesn't load `.env`. With [NestJS Observe](/observability/overview) in both services, the RabbitMQ transport carries the trace id in each message's headers, so `GET /orders/:id/shipment` and the fulfillment service's answer show up as one trace (see [Distributed tracing](/observability/distributed-tracing#tcp-redis-nats-and-other-microservice-transports)).

#### What's next

- Add sign-in, and show customers only their own orders: [Build a REST API with JWT authentication](/tutorials/rest-api-jwt-authentication#sign-users-in-with-jwts).
- Take stock and payments in the orders service: [Build an e-commerce backend](/tutorials/ecommerce-backend) and [Accept payments with webhooks](/tutorials/payments-webhooks).
- Route events to several services with an exchange and `wildcards`, or set message options with `RmqRecordBuilder`: [RabbitMQ](/microservices/rabbitmq).
- Handle events in-process too, with retries and dead letters in your own database: [Outbox](/reliability/outbox#handle-orderplaced-in-process).
- Validate payloads, guard handlers and map errors in a microservice: [Pipes](/microservices/pipes), [Guards](/microservices/guards) and [Exception filters](/microservices/exception-filters).
