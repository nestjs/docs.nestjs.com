### Outbox

When a customer places an order at an online store for cat food and supplies, the order API saves the order and announces it with an `OrderPlaced` event. Three things react to that event: a confirmation email goes out, stock is reserved, and a separate analytics service records the sale.

Saving the order and publishing the event are two writes to two different systems, and no transaction spans both:

- **Save, then publish.** If the process crashes or the broker is down between the two, the order exists but `OrderPlaced` is lost. The customer gets no email, the stock isn't reserved, and analytics undercounts.
- **Publish, then save.** If the insert fails, the customer is thanked for an order that doesn't exist.
- **Retry the publish on error.** A timeout after a successful send looks like a failure, so the retry sends it again and the customer gets two emails.

This is the dual-write problem. `ClientProxy.emit()`, `EventEmitter2` and the CQRS `EventBus` all publish from memory, so they all have it.

A transactional outbox removes it by turning the event into a row. `Outbox.add()` inserts the message into an outbox table in **the same database transaction as the order**, so both commit or neither does. A relay then publishes committed messages. It retries failures with backoff and moves messages that never succeed to a dead-letter table. Retries mean a consumer can see a message twice, so each consumer keeps an **inbox** of the message ids it has processed and skips repeats.

In this tutorial, you'll add the outbox to the store's order API, on PostgreSQL with Drizzle:

- `POST /orders` saves the order and its messages in one transaction.
- Two in-process handlers send the confirmation email and reserve stock.
- A separate analytics microservice, with a database of its own, receives order events over TCP, in order for each order.
- Failures are retried, and a small admin API lists, requeues and purges dead letters.
- Several instances of the API share the work safely.

#### Prerequisites

- PostgreSQL, with [Drizzle ORM](https://orm.drizzle.team) on the `pg` driver, registered through [`@nestjs/drizzle`](/data/drizzle). The outbox's messages commit with your rows, so they live in the database your orders live in, on a database server that outlives any instance of the application. Using TypeORM, Prisma or MySQL? Follow the tutorial for what the application does: [Keep messages in your database](/reliability/outbox#keep-messages-in-your-database) shows the store with each of them.
- `@nestjs/microservices`, for the TCP link to the analytics service in [Publish to the analytics microservice](/reliability/outbox#publish-to-the-analytics-microservice).

Install the package:

```bash
$ npm i --save @nestjs/outbox
```

The example application, the online store's order API, keeps its products and orders in two tables of its own, which the later sections read and write. They're the example's data, not something the outbox needs: the outbox's tables belong to its store, which creates them, as [Keep messages in your database](/reliability/outbox#keep-messages-in-your-database) shows.

`products` is the catalog, and reserving stock for an order moves units from its `in_stock` to its `reserved`:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `text` | Primary key, such as `salmon-kibble-2kg` |
| `name` | `text` | The display name, such as `Salmon kibble, 2 kg` |
| `price` | `integer` | In cents |
| `in_stock` | `integer` | The units available to order |
| `reserved` | `integer` | The units held for placed orders. Defaults to `0` |

`orders` holds the orders that `POST /orders` saves:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `text` | Primary key |
| `user_id` | `text` | The customer who placed the order |
| `items` | `jsonb` | The order's lines, as a JSON array: each line's `productId`, `quantity` and unit `price` (in cents) |
| `total` | `integer` | In cents |
| `status` | `text` | `placed` or `cancelled` |

No column in either table is nullable.

The catalog has two products: `salmon-kibble-2kg`, at 2499 cents with 10 in stock, and `clumping-litter-10l`, at 1599 cents with one in stock.

#### Keep messages in your database

There's nothing to create for the outbox: no tables, entities or Prisma models. Register its store, and the store creates its own schema, `nest_outbox`, and migrates it: at startup in development and in tests, and in production with `npx nest-outbox migrate`, or with `migrationSql()` in your own migrations.

The outbox keeps its messages, its dead letters and the consumers' inboxes in the same database as your own tables, because they must commit with your rows. Until you register a store for them, the outbox keeps them in memory: fine for a first run, but a restart loses every message that wasn't published yet, two instances don't share them, and nothing joins your transactions.

> warning **Warning** With `NODE_ENV=production` and no store registered, startup fails, unless you set `allowInMemoryStorage: true`.

On PostgreSQL, register the package's store, `PostgresOutboxStore` from `@nestjs/outbox/postgres`. It runs its SQL through the database client your application already has, so it can join your transactions, and it keeps its tables in a schema of its own. It's an ordinary provider, registered once, in the root module, next to `OutboxModule`: both are application-wide, and every `outbox.add()` in any module goes through it. The root module creates it with a factory that injects the Drizzle database and the `OutboxStorage` registry, which the store registers itself with:

```typescript
@@filename(app.module)
{
  // Messages and inbox records in your database, in a schema of their own (nest_outbox)
  provide: PostgresOutboxStore,
  inject: [getDrizzleToken(), OutboxStorage],
  useFactory: (db: Database, outboxStorage: OutboxStorage) =>
    new PostgresOutboxStore({ executor: fromDrizzle(db) }, outboxStorage),
},
```

`fromDrizzle(db)` is the store's **executor**: it runs the store's statements through your Drizzle database, whichever driver it uses, such as `pg` or PGlite. `fromPg(pool)`, `fromTypeOrm(dataSource)`, `fromPrisma(prisma)` and `fromKysely(db)` do the same for a node-postgres pool, TypeORM, Prisma and Kysely. At startup, the module logs `OutboxStorage: PostgresOutboxStore`.

**The schema.** The store keeps its tables in a schema of its own, `nest_outbox` (the `schema` option names another). On MySQL, which has no schemas, they're tables of the connection's database, with the schema's name as their prefix: `nest_outbox_messages` and so on.

| Table | What it holds |
| --- | --- |
| `nest_outbox.messages` | Each message from `add()` until it's published or dead-lettered, with its attempts and lease |
| `nest_outbox.dead_letters` | The messages that failed, with the reason and the error of every attempt |
| `nest_outbox.inbox` | The ids of the messages each consumer has processed |
| `nest_outbox.migrations` | The versions of the store's schema applied |

They belong to the store: your migrations don't create them, your ORM's schema doesn't declare them, and your own tables can't collide with them. drizzle-kit and Prisma Migrate work on the `public` schema unless told otherwise, and TypeORM on its entities' tables, so their tools leave `nest_outbox` alone.

**Migrations.** The package ships the schema as versioned migrations, and the store applies them itself. With the `migrate` option, it applies the ones the schema hasn't had yet when the application starts, before the relay runs, in one transaction that holds an advisory lock: of several instances that start together, one migrates, and the others find nothing left to do. `migrate` defaults to `true`, except with `NODE_ENV=production`. So in development and in tests, the store creates its schema on the first start, and your migrations only create your own tables, here `products` and `orders`.

In production, apply the migrations before the new version of your application starts, as you apply your own, so that no instance changes the schema while it boots: in the middle of a rolling deploy, that would lock busy tables, and a least-privilege database user can't do it anyway. The package's command line does it from your deploy step, next to `npx drizzle-kit migrate`. It reads the database from `DATABASE_URL`, or from `--url`, and needs `pg` installed:

```bash
$ npx nest-outbox status
Schema "nest_outbox" is at version 0; this version of @nestjs/outbox needs version 1.
$ npx nest-outbox migrate
Migrated schema "nest_outbox" to version 1 (applied 1).
```

`status` exits with 1 while the schema is behind, which makes it a check for CI. To apply the migrations with your own migration tool instead, take their SQL from `npx nest-outbox sql`, or from `PostgresOutboxStore.migrationSql()` in code: the statements of every migration, one per paragraph, with the bookkeeping that records the version. Run them in one transaction, as TypeORM's and Drizzle's migrators do. With TypeORM, that's a migration of your own, next to the ones it generates for your entities:

```typescript
@@filename(typeorm/migrations/1790801276314-OutboxStore)
import { PostgresOutboxStore } from '@nestjs/outbox/postgres';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class OutboxStore1790801276314 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(PostgresOutboxStore.migrationSql());
  }

  // The store's migrations only ever add tables, columns and indexes: it has no down migrations.
  async down(): Promise<void> {}
}
```

With drizzle-kit, create a custom migration, and fill it with the SQL, a `--> statement-breakpoint` line between the statements: Drizzle's migrator then runs them one at a time, which PGlite requires. In code, `migrationSql()` with `statementBreakpoints: true` returns the same.

```bash
$ npx drizzle-kit generate --custom --name=outbox
$ npx nest-outbox sql --statement-breakpoints > drizzle/0002_outbox.sql
```

On MySQL, `MySqlOutboxStore.migrationStatements()` returns the statements one per string, and a TypeORM migration runs them one per call:

```typescript
@@filename(typeorm/mysql-migrations/1790801276314-OutboxStore)
for (const statement of MySqlOutboxStore.migrationStatements()) {
  await queryRunner.query(statement);
}
```

With `migrate` off, a store whose schema is behind fails the startup with an `OutboxSchemaError` that names these three ways, and fails every call the same way until the schema catches up, which it notices without a restart. Migrations only ever add tables, columns and indexes, so during a rolling deploy, the previous version of your application keeps running on the migrated schema. There are no down migrations.

**Transactions.** `outbox.add()` takes your transaction, as [Save the order and its messages in one transaction](/reliability/outbox#save-the-order-and-its-messages-in-one-transaction) shows, and so does a handler's `processInTransaction()`: with Drizzle, the `tx` that `db.transaction()` hands its callback. The store runs its statements on that transaction, so they commit or roll back with your writes. It refuses the database itself, whose statements would commit on their own, with an `OutboxTransactionRequiredError` that says what to pass. With the other executors, pass a node-postgres client after `BEGIN` (not the pool), TypeORM's `EntityManager` from `dataSource.transaction()`, Prisma's interactive transaction client, or a Kysely transaction.

**Isolation.** The store's own transactions (claims, dead-letter moves, requeues) rely on READ COMMITTED, PostgreSQL's default isolation level: at startup, the store checks the database's `default_transaction_isolation`, and fails if it's stricter. Yours may run at any level. `add()` first takes a lock per key on your transaction, so transactions that add messages with the same key take turns, and a key's messages are numbered in the order their transactions commit. Under REPEATABLE READ or SERIALIZABLE, two deliveries of one message that race to `processInTransaction()` can fail the second with a serialization error instead of skipping it as a duplicate: its handler fails, and the relay's retry finds the record.

**With TypeORM.** `TypeOrmModule` takes the place of `DrizzleModule` in the root module, and the store runs on the `DataSource` it provides, through `fromTypeOrm()`:

```typescript
@@filename(typeorm/app.module)
{
  // Messages and inbox records in your database, in a schema of their own (nest_outbox)
  provide: PostgresOutboxStore,
  inject: [DataSource, OutboxStorage],
  useFactory: (dataSource: DataSource, outboxStorage: OutboxStorage) =>
    new PostgresOutboxStore({ executor: fromTypeOrm(dataSource) }, outboxStorage),
},
```

Where the tutorial passes Drizzle's `tx` to `outbox.add()`, pass the `EntityManager` that `dataSource.transaction()` hands its callback, and type the outbox with it. The store refuses `dataSource.manager`, whose writes would commit on their own. This is the order service with TypeORM:

```typescript
@@filename(typeorm/orders.service)
@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly outbox: Outbox<EntityManager>,
  ) {}

  async placeOrder({ userId, items }: PlaceOrderDto): Promise<Order> {
    if (!items?.length) {
      throw new BadRequestException('An order needs at least one item');
    }

    const order = await this.dataSource.transaction(async (manager) => {
      // ... price the items through manager (an unknown product throws) and build the order
      await manager.insert(OrderEntity, order);

      // The transaction's EntityManager: the message commits or rolls back with the order.
      await this.outbox.add(manager, { topic: 'order.placed', payload: order });
      return order;
    });

    this.outbox.notify(); // publish now instead of at the next poll
    return order;
  }
}
```

**With Prisma.** Pass your `PrismaService` to `fromPrisma()` in the factory, and to `outbox.add()` the transaction client that `prisma.$transaction()` hands its callback. Only that interactive form has one to pass: the array form, `prisma.$transaction([query1, query2])`, can't include an `outbox.add()`. The store refuses the client itself, whose statements would commit on their own. Its own transactions wait up to 10 seconds for a connection and run for up to a minute, longer than Prisma's defaults: the second argument of `fromPrisma()` changes that, with `maxWait` and `timeout`.

**With MySQL.** For MySQL 8.4 LTS and 9.x, `@nestjs/outbox/mysql` has `MySqlOutboxStore`. Import the store and its executor from there: the provider is the same, and so are the options and the executors' names. This is the order API on MySQL, with Drizzle on the `mysql2` driver:

```typescript
@@filename(mysql/app.module)
import { Module } from '@nestjs/common';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';
import { OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { fromDrizzle, MySqlOutboxStore } from '@nestjs/outbox/mysql';
import { drizzle } from 'drizzle-orm/mysql2';
import { NotificationsModule } from '../notifications/notifications.module.js';
import type { Database } from './drizzle.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      // A mysql2 pool on DATABASE_URL (mysql://...), whose path names the database
      useFactory: () => ({ drizzle, connection: { uri: process.env.DATABASE_URL! } }),
    }),
    OutboxModule.forRoot({ relay: { pollInterval: '1s' } }),
    NotificationsModule,
  ],
  providers: [
    {
      // Messages and inbox records in your database, in tables of their own (nest_outbox_*)
      provide: MySqlOutboxStore,
      inject: [getDrizzleToken(), OutboxStorage],
      useFactory: (db: Database, outboxStorage: OutboxStorage) =>
        new MySqlOutboxStore({ executor: fromDrizzle(db) }, outboxStorage),
    },
    OrdersService,
  ],
})
export class AppModule {}
```

`fromMysql2(pool)`, `fromTypeOrm(dataSource)` for a data source of type `mysql`, `fromPrisma(prisma)` with the `@prisma/adapter-mariadb` driver adapter (the one that serves MySQL), and `fromKysely(db)` serve the other clients. What differs from PostgreSQL:

- **Tables, not a schema.** A MySQL database has no schemas, so the store keeps its tables in the connection's database, the one the URL's path names, and the `schema` option is their prefix: `nest_outbox_messages`, `nest_outbox_dead_letters` and `nest_outbox_inbox`, next to `nest_outbox_migrations` and `nest_outbox_locks`. It takes lowercase letters, digits and underscores, up to 40 characters. A connection without a database fails the startup.
- **Bounded keys.** Ids, topics, keys and consumer names are indexed columns of at most 255 characters, compared byte for byte: `order-1` and `Order-1` are two keys. A longer one is refused with a `RangeError`, before any statement: by `add()`, and by the inbox before it runs a handler.
- **Your isolation level.** Your transactions may run at REPEATABLE READ, MySQL's default, or at READ COMMITTED. A delivery that races another to `processInTransaction()` waits for it, then skips the handler as a duplicate, at either level.
- **Deadlocks reach your transaction.** `add()` locks a row per key in your transaction, one of 16,384 that the keys share, which the store creates when it starts: producers of two keys that share a row take turns, as producers of one key do, which slows an unrelated producer only rarely. When MySQL breaks a deadlock in your transaction (error 1213), it rolls the whole transaction back, and the store can't run your work again: the error reaches your code as your client's error, so run the transaction again. With those rows in place, two things can still cause one: three deliveries of one message that race to `processInTransaction()` while the first rolls back, and transactions of yours that take the same locks in different orders. The store's own transactions retry on deadlock by themselves.
- **Migrations that aren't transactional.** MySQL commits each DDL statement on its own, so `migrate` and `npx nest-outbox migrate --url mysql://...` apply the statements one at a time under a lock, and a run that stopped halfway resumes where it stopped. Your own tool must send one statement per call too, as the TypeORM migration in **Migrations** above does, and a drizzle-kit custom migration takes `npx nest-outbox sql --dialect mysql --statement-breakpoints`, since its MySQL migrator sends one statement per breakpoint.

#### Register the outbox

Register `OutboxModule` in the root module, next to `DrizzleModule`, which registers the Drizzle database, and with the store from [Keep messages in your database](/reliability/outbox#keep-messages-in-your-database). The feature modules it imports are built in the next steps:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientProxyTransport, OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { fromDrizzle, PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Database } from './database/drizzle.js';
import * as schema from './database/schema.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { OutboxAdminModule } from './outbox-admin/outbox-admin.module.js';

export const ANALYTICS_SERVICE = 'ANALYTICS_SERVICE';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      // A pg pool on DATABASE_URL, closed in onApplicationShutdown(), after the relay drained.
      useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL!, schema }),
    }),
    OutboxModule.forRootAsync({
      imports: [
        ClientsModule.registerAsync([
          {
            name: ANALYTICS_SERVICE,
            useFactory: () => ({
              transport: Transport.TCP,
              options: {
                host: process.env.ANALYTICS_HOST ?? '127.0.0.1',
                port: Number(process.env.ANALYTICS_PORT ?? 4001),
              },
            }),
          },
        ]),
      ],
      transports: { analytics: ClientProxyTransport(ANALYTICS_SERVICE) },
      useFactory: () => ({
        // Each message goes to exactly one transport; `local` runs @OnOutboxMessage() handlers.
        route: (message) => (message.topic.startsWith('analytics.') ? 'analytics' : 'local'),
        relay: {
          enabled: process.env.OUTBOX_RELAY !== 'off',
          pollInterval: '1s',
          lease: '30s',
          publishTimeout: '10s',
        },
        retry: {
          attempts: 10,
          backoff: { delay: '1s', maxDelay: '1m' },
        },
      }),
    }),
    OrdersModule,
    NotificationsModule,
    InventoryModule,
    OutboxAdminModule,
  ],
  providers: [
    {
      // Messages and inbox records in your database, in a schema of their own (nest_outbox)
      provide: PostgresOutboxStore,
      inject: [getDrizzleToken(), OutboxStorage],
      useFactory: (db: Database, outboxStorage: OutboxStorage) =>
        new PostgresOutboxStore({ executor: fromDrizzle(db) }, outboxStorage),
    },
  ],
})
export class AppModule {}
```

`ClientProxyTransport(ANALYTICS_SERVICE)` is a class that Nest instantiates inside `OutboxModule`, so `transports` sits next to `useFactory`, where classes go. The factory runs when the application starts and returns the rest of the options:

- `transports` and `route`: where each message is published. The `local` transport is built in and runs `@OnOutboxMessage()` handlers in this process ([Handle order.placed in-process](/reliability/outbox#handle-orderplaced-in-process)). `ClientProxyTransport(ANALYTICS_SERVICE)` publishes through the TCP client that `ClientsModule` registers under that name, which is why that module is in `imports` ([Publish to the analytics microservice](/reliability/outbox#publish-to-the-analytics-microservice)). `route` picks exactly one transport per message.
- `relay`: the background publisher. It polls every `pollInterval`, leases what it claims for `lease`, and gives up on a single publish after `publishTimeout`. Setting `OUTBOX_RELAY=off` turns it off in API-only instances ([Run several instances](/reliability/outbox#run-several-instances)).
- `retry`: 10 attempts, with exponential backoff that starts at 1 second and is capped at 1 minute ([Retries and the dead-letter queue](/reliability/outbox#retries-and-the-dead-letter-queue)).

> info **Hint** The tutorial reads `process.env` directly, to stay short. In an application, load the environment through [`@nestjs/config`](/application/configuration) with a validation schema, so a missing `DATABASE_URL` stops the application at startup, and read the values from `ConfigService` in the factories.

Durations are milliseconds or strings such as `'30s'` and `'1m'`. `OutboxModule` is global: `Outbox`, `OutboxStorage`, `OutboxRelay`, `OutboxEvents`, `OutboxDeadLetters` and `OutboxInbox` can be injected anywhere in the application.

#### Save the order and its messages in one transaction

This is the order model:

```typescript
@@filename(orders/order)
export interface OrderItem {
  productId: string;
  quantity: number;
  /** Unit price in cents, copied from the catalog when the order is placed. */
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  /** In cents. */
  total: number;
  status: 'placed' | 'cancelled';
}

export class PlaceOrderDto {
  userId: string;
  items: { productId: string; quantity: number }[];
}
```

`OrdersService.placeOrder()` opens a Drizzle transaction, prices the items, inserts the order and adds the messages, all through the same `tx`:

```typescript
@@filename(orders/orders.service)
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { Outbox } from '@nestjs/outbox';
import type { Database, Transaction } from '../database/drizzle.js';
import { orders, products } from '../database/schema.js';
import type { Order, PlaceOrderDto } from './order.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly outbox: Outbox<Transaction>,
  ) {}

  async placeOrder({ userId, items }: PlaceOrderDto): Promise<Order> {
    if (!items?.length) {
      throw new BadRequestException('An order needs at least one item');
    }

    const order = await this.db.transaction(async (tx) => {
      // ... price the items through tx (an unknown product throws) and build the order
      await tx.insert(orders).values(order);

      // Drizzle's tx: the messages commit or roll back with the order.
      await this.outbox.add(tx, [
        { topic: 'order.placed', payload: order },
        { topic: 'analytics.order.placed', key: order.id, payload: order },
      ]);
      return order;
    });

    this.outbox.notify(); // publish now instead of at the next poll
    return order;
  }
}
```

`outbox.add()` takes the transaction handle first, then the message or an array of messages. With Drizzle, the handle is the `tx` that `db.transaction()` passes its callback, whose type the service gives the outbox: `Outbox<Transaction>`. The store inserts them through that `tx`, so the messages commit with the order, or roll back with it. The store is asynchronous, so await `add()` like any other query. Every API in the package that joins your transaction takes the handle as its first argument.

A few details:

- **One message per destination.** Each message goes to exactly one transport. The same event goes to the in-process handlers and to the analytics service, so the service adds two messages, `order.placed` and `analytics.order.placed`, in the same transaction.
- **Payloads are snapshots.** `add()` serializes the payload right away, so later changes to the `order` object aren't published.
- **Ids.** Every message gets a time-ordered UUIDv7 `id`. Consumers deduplicate by it.
- **`notify()`.** Nothing is published inside the transaction. After the commit, `notify()` wakes the relay. Without it, the message goes out at the next poll, up to `pollInterval` later.

If anything throws inside the transaction, the order and its messages roll back together, and the relay never sees them. That includes an unknown product, a failed insert, and anything that fails after `add()`. The [Testing](/reliability/outbox#testing) section proves it by failing the transaction after the messages were written.

Pass the transaction, never the database: `outbox.add(this.db, message)` would write the message on its own, in autocommit mode, which is exactly the dual write you're removing. The store refuses it with `OutboxTransactionRequiredError`, and so does `add()` itself when it gets no handle at all.

Expose the service over HTTP:

```typescript
@@filename(orders/orders.controller)
import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { PlaceOrderDto } from './order.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  place(@Body() dto: PlaceOrderDto) {
    return this.ordersService.placeOrder(dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }
}
```

#### Handle order.placed in-process

The confirmation email is a handler for `order.placed`. The mailer is a stand-in for your email provider's SDK:

```typescript
@@filename(notifications/mailer.service)
import { Injectable, Logger } from '@nestjs/common';
import type { Order } from '../orders/order.js';

/** Stand-in for your email provider's SDK. */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  async sendOrderConfirmation(order: Order): Promise<void> {
    this.logger.log(`Order confirmation for ${order.id} sent to ${order.userId}`);
  }
}
```

```typescript
@@filename(notifications/order-emails.handler)
import { Injectable } from '@nestjs/common';
import { OnOutboxMessage } from '@nestjs/outbox';
import type { Order } from '../orders/order.js';
import { MailerService } from './mailer.service.js';

@Injectable()
export class OrderEmailsHandler {
  constructor(private readonly mailerService: MailerService) {}

  // The consumer's inbox skips messages it has already handled.
  @OnOutboxMessage('order.placed', { consumer: 'order-confirmation-email' })
  async sendConfirmation(order: Order) {
    await this.mailerService.sendOrderConfirmation(order);
  }
}
```

`@OnOutboxMessage()` handlers are discovered on providers, so register `MailerService` and `OrderEmailsHandler` as providers of a `NotificationsModule`. They must be singletons: a handler on a request-scoped provider fails at startup. The handler gets the payload, here the order, and a context as its second argument. The context's `message` holds the message's `id`, `topic`, `key` and `headers`.

Every handler has an inbox, named by `consumer`. Before calling the handler, the local transport checks whether the `order-confirmation-email` consumer has already processed this message id. After the handler succeeds, it records the id. `consumer` is required, and it must stay stable: a new name makes every past message look new.

The inbox has a gap: if the process dies after the email is sent but before the id is recorded, the email is sent again on redelivery. That's acceptable for an email. It isn't for a stock reservation, which lives in the same database as the inbox. The reservation handler closes the gap by recording the id inside its own transaction:

```typescript
@@filename(inventory/stock-reservation.handler)
import { Injectable, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { NonRetryableMessageError, OnOutboxMessage, type OutboxHandlerContext } from '@nestjs/outbox';
import { and, eq, gte, sql } from 'drizzle-orm';
import type { Database, Transaction } from '../database/drizzle.js';
import { products } from '../database/schema.js';
import type { Order } from '../orders/order.js';

@Injectable()
export class StockReservationHandler {
  private readonly logger = new Logger(StockReservationHandler.name);

  constructor(@InjectDrizzle() private readonly db: Database) {}

  @OnOutboxMessage('order.placed', { consumer: 'stock-reservation' })
  async reserve(order: Order, ctx: OutboxHandlerContext<Transaction>) {
    await this.db.transaction(async (tx) => {
      // Records the message id through tx, then runs the callback only if this consumer
      // hasn't processed it yet. Await it: the record commits with the reservation.
      await ctx.processInTransaction(tx, async () => {
        for (const { productId, quantity } of order.items) {
          const reserved = await tx
            .update(products)
            .set({ inStock: sql`${products.inStock} - ${quantity}`, reserved: sql`${products.reserved} + ${quantity}` })
            .where(and(eq(products.id, productId), gte(products.inStock, quantity)))
            .returning({ id: products.id });
          if (reserved.length === 0) {
            // Retrying won't create stock: dead-letter it now and let a human decide.
            throw new NonRetryableMessageError(`Not enough stock for "${productId}" (order ${order.id})`);
          }
        }
        this.logger.log(`Reserved stock for order ${order.id}`);
      });
    });
  }
}
```

`ctx.processInTransaction(tx, work)` inserts the inbox record through the handler's transaction, then calls `work` only if this consumer hasn't processed the message yet. Otherwise it skips `work` and returns a result whose `duplicate` flag is `true`. The record and the stock update commit together, so the reservation happens exactly once: a redelivery finds the record and skips the handler, and if `work` throws, both roll back and the retry starts clean. Await it inside the transaction's callback, so the record is written before `COMMIT`; the duplicate check happens inside the call, so a missing `await` can't make it pass. Register the handler in an `InventoryModule`.

| Handler | Behavior | Guarantee |
| --- | --- | --- |
| Default | Skips the handler if its inbox has the id, records the id after the handler succeeds | Once, unless the process dies between the handler finishing and the record, or another instance delivers the same message at the same time |
| Calls `ctx.processInTransaction(tx, work)` | Records the id in the handler's own transaction, with its writes | Exactly once for writes to the same database |
| `inbox: false` | Every delivery runs the handler | At least once |

Both handlers run concurrently for each `order.placed` message. If one of them fails, the publish fails and the whole message is retried. On the retry, each handler that already succeeded is skipped by its inbox.

The relay gives the handlers `publishTimeout` (10 seconds here). If they take longer, the attempt counts as failed and the context's `signal` aborts: pass `ctx.signal` to the calls a handler makes, such as the `signal` option of `fetch()`, so they stop too. A handler that ignores it keeps running, and if the retry reaches the same process while it does, the inbox waits for it instead of running the handler a second time.

#### Publish to the analytics microservice

The API side is already wired. In `AppModule`, `ClientProxyTransport(ANALYTICS_SERVICE)` publishes through the `ClientProxy` that `ClientsModule` registered under that name, and `route` sends every `analytics.*` topic to it. The transport calls `client.emit(topic, envelope)`, the same call you'd make without an outbox. The envelope has the message's `id`, `topic`, `key`, `headers`, `createdAt` and `payload`.

Cancelling an order produces a second analytics event for the same order. Add a `cancelOrder()` method to `OrdersService`, and import `NotFoundException` and `ConflictException` from `@nestjs/common`:

```typescript
@@filename(orders/orders.service)
async cancelOrder(id: string): Promise<Order> {
  const order = await this.db.transaction(async (tx) => {
    const [row] = await tx.select().from(orders).where(eq(orders.id, id)).for('update');
    if (!row) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    if (row.status !== 'placed') {
      throw new ConflictException(`Order ${id} is ${row.status}`);
    }

    await tx.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, id));
    const order: Order = { ...row, status: 'cancelled' };
    await this.outbox.add(tx, { topic: 'analytics.order.cancelled', key: order.id, payload: order });
    return order;
  });

  this.outbox.notify();
  return order;
}
```

The orders controller already routes `POST /orders/:id/cancel` to it. The `SELECT ... FOR UPDATE` locks the order's row, so two cancellations of the same order take turns, and the second one sees `cancelled` and answers `409`. Both analytics messages use the order id as their `key`. Messages that share a key are published one at a time, in the order their transactions committed. While `analytics.order.placed` is being retried, `analytics.order.cancelled` waits behind it, so analytics doesn't see a cancellation before the order it cancels. Messages with other keys keep flowing. A key waits only as long as the retries last, though: once a message is dead-lettered (see the next section), the messages behind it go out.

The `order.placed` message for the in-process handlers has no key, on purpose. A key is shared by every message that carries it, whatever the topic or transport. If the email message used the order id as well, a mail outage would hold back the analytics events for that order.

The analytics service is a separate Nest application, and like any service it owns its data: a PostgreSQL database of its own, with its own schema and migrations. It never reads the order API's tables. It records each order event in a table of its own, again the example's data:

`order_events` has one row per order event, and the revenue is the sum of its `amount` column:

| Column | Type | Notes |
| --- | --- | --- |
| `seq` | `bigint`, generated identity | Primary key, in arrival order |
| `order_id` | `text` | Indexed |
| `event` | `text` | `placed` or `cancelled` |
| `amount` | `integer` | The change to revenue, in cents: the order's total when it's placed, minus it when it's cancelled |
| `recorded_at` | `timestamptz` | Defaults to `now()` |

Being an application of its own, it has its own root module, `AppModule`, which registers `OutboxModule` and the store once, as the order API's does. The service only consumes, so the relay is turned off, and the store runs on the service's own database. `OutboxInbox` keeps the service's inbox there, next to `order_events`, so an event and the record that it was processed commit together. The store's tables for messages stay empty, and with the relay off, nothing polls them:

```typescript
@@filename(analytics-service/app.module)
import { Module } from '@nestjs/common';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';
import { OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { fromDrizzle, PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AnalyticsController } from './analytics.controller.js';
import type { Database } from './database/drizzle.js';
import * as schema from './database/schema.js';
import { OrderStatsService } from './order-stats.service.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      // This service's own database, not the order API's.
      useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL!, schema }),
    }),
    // Consumer only: no relay runs.
    OutboxModule.forRoot({ relay: { enabled: false } }),
  ],
  controllers: [AnalyticsController],
  providers: [
    {
      // This service's inbox, in its own database (the store's tables for messages stay empty)
      provide: PostgresOutboxStore,
      inject: [getDrizzleToken(), OutboxStorage],
      useFactory: (db: Database, outboxStorage: OutboxStorage) =>
        new PostgresOutboxStore({ executor: fromDrizzle(db) }, outboxStorage),
    },
    OrderStatsService,
  ],
})
export class AppModule {}
```

`OrderStatsService` records an event and returns the revenue so far. It opens a transaction and calls `inbox.processInTransaction(tx, 'analytics', messageId, work)`: the inbox record and the `order_events` row commit together, so a redelivered event changes nothing, even if the service crashes halfway:

```typescript
@@filename(analytics-service/order-stats.service)
import { Injectable, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { OutboxInbox } from '@nestjs/outbox';
import type { Database, Transaction } from './database/drizzle.js';
import { orderEvents } from './database/schema.js';

/** The fields of the order API's `Order` that this service reads. */
export interface OrderSnapshot {
  id: string;
  total: number;
}

export type OrderEvent = 'placed' | 'cancelled';

@Injectable()
export class OrderStatsService {
  private readonly logger = new Logger(OrderStatsService.name);

  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly outboxInbox: OutboxInbox,
  ) {}

  /**
   * Records an order event once per message id. The inbox record and the event commit in
   * one transaction, so a redelivered message changes nothing. `false` for a duplicate.
   */
  async record(messageId: string, event: OrderEvent, order: OrderSnapshot): Promise<boolean> {
    const outcome = await this.db.transaction(async (tx) =>
      // Records the message id through tx, then runs the callback only if it is new here.
      this.outboxInbox.processInTransaction(tx, 'analytics', messageId, async () => {
        const amount = event === 'placed' ? order.total : -order.total;
        await tx.insert(orderEvents).values({ orderId: order.id, event, amount });
        return this.revenue(tx);
      }),
    );
    if (outcome.duplicate) {
      return false;
    }
    this.logger.log(`Order ${order.id} ${event}, revenue is now ${outcome.result}`);
    return true;
  }

  /** Total revenue in cents. */
  async revenue(db: Database | Transaction = this.db): Promise<number> {
    // ... the sum of amount in order_events, read through db
  }

  // ...
}
```

```typescript
@@filename(analytics-service/analytics.controller)
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { OutboxEnvelope } from '@nestjs/outbox';
import { OrderStatsService, type OrderEvent, type OrderSnapshot } from './order-stats.service.js';

@Controller()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);
  /** The last event handled for each key: one order's events run one at a time. */
  private readonly queues = new Map<string, Promise<void>>();

  constructor(private readonly orderStatsService: OrderStatsService) {}

  @EventPattern('analytics.order.placed')
  onPlaced(@Payload() envelope: OutboxEnvelope<OrderSnapshot>) {
    return this.apply('placed', envelope);
  }

  @EventPattern('analytics.order.cancelled')
  onCancelled(@Payload() envelope: OutboxEnvelope<OrderSnapshot>) {
    return this.apply('cancelled', envelope);
  }

  private apply(event: OrderEvent, envelope: OutboxEnvelope<OrderSnapshot>) {
    // Events arrive in the order the relay published them, but handlers are asynchronous:
    // without a queue, a cancellation could commit before the placement it follows.
    return this.inOrder(envelope.key ?? envelope.id, async () => {
      // The envelope id is the outbox message id: stable across redeliveries.
      const recorded = await this.orderStatsService.record(envelope.id, event, envelope.payload);
      if (!recorded) {
        this.logger.warn(`Skipped duplicate ${envelope.topic} ${envelope.id}`);
      }
    });
  }

  private inOrder(key: string, work: () => Promise<void>): Promise<void> {
    const next = (this.queues.get(key) ?? Promise.resolve()).then(work, work);
    this.queues.set(key, next);
    const forget = () => {
      if (this.queues.get(key) === next) {
        this.queues.delete(key);
      }
    };
    next.then(forget, forget);
    return next;
  }
}
```

The events for an order arrive in the order the relay published them, but the handlers are asynchronous: two of them can run at once, and a cancellation could commit before the placement it follows. The controller runs one key's events one at a time, in arrival order, and different orders in parallel.

```typescript
@@filename(analytics-service/main)
import { NestFactory } from '@nestjs/core';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: Number(process.env.PORT ?? 4001) },
  });
  app.enableShutdownHooks();
  await app.listen();
}
await bootstrap();
```

`inbox.processInTransaction()` is what an `@OnOutboxMessage()` handler gets with `ctx.processInTransaction()`: exactly once for writes to the consumer's own database. When a consumer's side effect is outside its database, such as an email, use `inbox.process(consumer, id, work)` instead: it skips `work` if the consumer has seen this id, and records it after `work` succeeds.

> warning **Warning** Over TCP, "published" only means the bytes left the order API. If the analytics service crashes after receiving an event but before processing it, the event is lost. For events you can't lose, use a transport whose broker acknowledges receipt: Kafka, RabbitMQ with publisher confirms, or NATS JetStream. `ClientProxyTransport` accepts a `toPacket` option that maps a message to that transport's record, with its own key and headers.

#### Retries and the dead-letter queue

When a publish fails, because a handler threw, the TCP connection was refused, or the publish took longer than `publishTimeout`, the relay reschedules the message:

- Each retry waits longer: 1 s, 2 s, 4 s and so on, capped at `maxDelay` (1 minute here). Each wait is randomized between half and the full value, so retries don't arrive in lockstep.
- Each failure is logged as a warning, with the attempt number and the wait before the next one.
- After `retry.attempts` failures (10 here), the message moves to the dead-letter table with the reason `exhausted` and the error of every attempt.
- A `NonRetryableMessageError` skips the retries. The message is dead-lettered at once with the reason `rejected`. So is any error for which the optional `retry.retryIf(error, attempt, message)` function returns `false`. When several handlers fail, the message is rejected only if all of them threw `NonRetryableMessageError`. Otherwise it's retried, the handlers that succeeded are skipped, and it's rejected once only the permanent failures remain.
- A topic with no `@OnOutboxMessage()` handler is retried, not dead-lettered. During a rolling deploy, an old instance's relay can see a topic that only the new version handles.
- A dead-lettered message no longer holds back its key: the later messages with that key are published without it. Size `retry` so that the outages you expect don't use it up.

The stock handler throws `NonRetryableMessageError` when there isn't enough stock. Retrying won't create stock, so the message goes straight to the dead-letter table, where a person can decide what to do.

`OutboxDeadLetters` lists, inspects, requeues and purges dead letters. The package doesn't mount any HTTP routes, so expose it behind your own guard. The same controller serves the outbox's stats, from the `OutboxMetrics` service built in the next section:

```typescript
@@filename(outbox-admin/outbox-admin.controller)
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OutboxDeadLetters } from '@nestjs/outbox';
import { AdminGuard } from './admin.guard.js';
import { OutboxMetrics } from './outbox-metrics.service.js';

@Controller('admin/outbox')
@UseGuards(AdminGuard)
export class OutboxAdminController {
  constructor(
    private readonly outboxDeadLetters: OutboxDeadLetters,
    private readonly outboxMetrics: OutboxMetrics,
  ) {}

  @Get('dead-letters')
  list(@Query('topic') topic?: string) {
    return this.outboxDeadLetters.list({ topic });
  }

  @Post('dead-letters/:id/requeue')
  @HttpCode(HttpStatus.OK)
  async requeue(@Param('id') id: string) {
    return { requeued: await this.outboxDeadLetters.requeue(id) };
  }

  @Delete('dead-letters/:id')
  async purge(@Param('id') id: string) {
    return { purged: await this.outboxDeadLetters.purge(id) };
  }

  @Get('stats')
  stats() {
    return this.outboxMetrics.snapshot();
  }
}
```

```typescript
@@filename(outbox-admin/admin.guard)
import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';

type HttpRequest = { headers: Record<string, string | string[] | undefined> };

/** Placeholder: protect these routes with your application's real authorization. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<HttpRequest>();
    const token = process.env.ADMIN_TOKEN;
    const given = request.headers['x-admin-token'];
    return !!token && typeof given === 'string' && sameSecret(given, token);
  }
}

/** Compares in constant time, so response times don't give the token away. */
function sameSecret(given: string, expected: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}
```

> info **Hint** `AdminGuard` is a placeholder. Dead letters contain full payloads, customer data included, so protect these routes with your application's real [authorization](/security/authorization).

`requeue()` moves a dead letter back to the outbox with a fresh retry budget and **the same id**. Consumers that already processed it skip it through their inbox. So after you restock, requeueing the out-of-stock order reserves the stock without sending a second confirmation email. `requeue()` and `purge()` also accept an array of ids, or a filter by `topic`, `key` or `failedBefore`. They refuse an empty filter; pass `all: true` to target every dead letter.

#### Run several instances

Every instance of the order API runs its relay against the same tables, on any number of hosts. The database decides who gets what:

- **Claims.** A relay claims a batch of messages by writing a lease on them for `lease` (30 s), with a random token for that claim. Claims take turns under the store's claim lock, and `SKIP LOCKED` passes over rows another relay is writing, so two relays never get the same message. They publish their batches in parallel.
- **Fencing.** Every later write for a message (published, rescheduled, dead-lettered) must present the lease token, so a relay that stalled past its lease can't overwrite the work of the relay that took over.
- **Order across instances.** A key's messages go out in the order their transactions committed, whichever instance added them: `add()` makes the transactions adding the same key take turns. Keep transactions that add keyed messages short.
- **Exactly-once reservations.** Two deliveries of the same message that run at the same time, on different instances, meet at the inbox's primary key: the second waits for the first transaction, then skips the handler if it committed.
- **Crashes.** If an instance dies while holding a lease, its messages are published by another instance once the lease expires. If it died after publishing but before recording that, the message is published a second time, and the consumers' inboxes drop the duplicate. Nothing is lost with the instance, because nothing lives on it: the messages are rows in the database.
- **Lease budget.** A relay never starts a publish with less than `publishTimeout` (10 s) of lease left. It releases the rest of the batch instead. Keep `publishTimeout` well below `lease`.
- **Clocks.** Leases use the relay's clock, so keep the hosts' clocks synchronized with NTP, well within `lease`.
- **API-only instances.** Start an instance with `OUTBOX_RELAY=off` to make it produce messages without publishing them. `notify()` wakes only the relay of the instance that added the message, so a relay instance picks the messages up within one `pollInterval`.
- **Relay-only workers.** The reverse also works: a worker started with `NestFactory.createApplicationContext(AppModule)` and no HTTP server publishes what the API instances add. The relay's poll timer keeps that process alive until a shutdown hook stops it.

Graceful shutdown needs shutdown hooks:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // On SIGTERM the relay stops claiming, finishes in-flight publishes and releases its leases.
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

On `SIGTERM`, the relay stops claiming and waits for in-flight publishes to finish, each for at most `publishTimeout`. It then releases the leases on messages it claimed but hasn't started, so another instance can take them at once instead of waiting out the lease. This happens in `onModuleDestroy()`, before `ClientsModule` closes the TCP client in `onApplicationShutdown()`.

To watch the outbox, subscribe to `OutboxEvents` and read `relay.stats()`:

```typescript
@@filename(outbox-admin/outbox-metrics.service)
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { OutboxEvents, OutboxRelay } from '@nestjs/outbox';

@Injectable()
export class OutboxMetrics implements OnModuleInit {
  readonly counters = { published: 0, retried: 0, deadLettered: 0, leaseLost: 0 };
  /** Time from add() to a successful publish, for the latest message. */
  lastPublishLagMs = 0;

  constructor(
    private readonly outboxEvents: OutboxEvents,
    private readonly outboxRelay: OutboxRelay,
  ) {}

  onModuleInit() {
    this.outboxEvents.events$.subscribe((event) => {
      switch (event.type) {
        case 'published':
          this.counters.published++;
          this.lastPublishLagMs = Date.now() - event.message.createdAt;
          break;
        case 'retry-scheduled':
          this.counters.retried++;
          break;
        case 'dead-lettered':
          this.counters.deadLettered++;
          break;
        case 'lease-lost':
          this.counters.leaseLost++;
          break;
      }
    });
  }

  async snapshot() {
    // pending, ready, leased, deadLetters, lagMs (how long the longest-waiting message has waited)...
    const stats = await this.outboxRelay.stats();
    return { ...stats, ...this.counters, lastPublishLagMs: this.lastPublishLagMs };
  }
}
```

`relay.stats()` reports `lagMs`, how long the longest-waiting message has waited. It grows while a downstream is down, which makes it the number to alert on, along with `deadLetters`. A message scheduled with `delay` doesn't count until it is due. The `published` event carries the message, so `Date.now() - message.createdAt` is the end-to-end publish lag. `OutboxEvents` emits the four events the `switch` counts. `lease-lost` means another relay took a message over while this one was publishing it, so that message may reach its consumers twice. Register `OutboxAdminController`, `AdminGuard` and `OutboxMetrics` in an `OutboxAdminModule`.

Each event is also published on a [`node:diagnostics_channel`](https://nodejs.org/api/diagnostics_channel.html) channel, `nestjs:outbox:published` and so on. Tracing and metrics libraries can subscribe to those without any Nest code, and they see every Nest application in the process.

The example application runs this section against a PostgreSQL server: two relays sharing 20 orders, three instances (one of them API-only) placing and cancelling 12 orders with every message published once and each order's events in order, a transaction that waits for another instance's lock on the same key, an instance that crashes holding a lease, and a graceful shutdown.

#### Try it

Create the two databases, `store` for the order API and `analytics` for the analytics service, and apply each service's own migrations: the order API's create its tables and products from [Prerequisites](/reliability/outbox#prerequisites), and the analytics service's create `order_events`.

Start the analytics service (TCP port 4001) on `analytics`, and the order API (port 3000) on `store`, with `ADMIN_TOKEN=s3cret` in the API's environment. Each logs the store it registered, and the store creates its schema on the first start:

```bash
[Nest] 52654  - 09/30/2026, 6:45:43 PM     LOG [OutboxModule] OutboxStorage: PostgresOutboxStore
[Nest] 52654  - 09/30/2026, 6:45:43 PM     LOG [OutboxModule] PostgresOutboxStore: migrated schema "nest_outbox" to version 1.
[Nest] 52743  - 09/30/2026, 6:45:59 PM     LOG [OutboxModule] OutboxStorage: PostgresOutboxStore
[Nest] 52743  - 09/30/2026, 6:46:00 PM     LOG [OutboxModule] PostgresOutboxStore: migrated schema "nest_outbox" to version 1.
```

Place an order:

```bash
$ curl -X POST localhost:3000/orders \
    -H 'Content-Type: application/json' \
    -d '{"userId":"user-42","items":[{"productId":"salmon-kibble-2kg","quantity":2}]}'
{"id":"07fafff6-9892-4298-aeef-dc2c3d5d6bf5","userId":"user-42","items":[{"productId":"salmon-kibble-2kg","quantity":2,"price":2499}],"total":4998,"status":"placed"}
```

The API's log shows the two in-process handlers:

```bash
[Nest] 52743  - 09/30/2026, 6:46:07 PM     LOG [MailerService] Order confirmation for 07fafff6-9892-4298-aeef-dc2c3d5d6bf5 sent to user-42
[Nest] 52743  - 09/30/2026, 6:46:07 PM     LOG [StockReservationHandler] Reserved stock for order 07fafff6-9892-4298-aeef-dc2c3d5d6bf5
```

And the analytics service's log shows the TCP consumer:

```bash
[Nest] 52654  - 09/30/2026, 6:46:07 PM     LOG [OrderStatsService] Order 07fafff6-9892-4298-aeef-dc2c3d5d6bf5 placed, revenue is now 4998
```

An order for an unknown product fails validation inside the transaction. The response is a `400`, and nothing reaches the outbox:

```bash
$ curl -X POST localhost:3000/orders \
    -H 'Content-Type: application/json' \
    -d '{"userId":"user-42","items":[{"productId":"catnip-mouse","quantity":1}]}'
{"message":"Unknown product \"catnip-mouse\"","error":"Bad Request","statusCode":400}
```

Now order two bags of clumping litter (`clumping-litter-10l`), which has one in stock. The API accepts the order, because stock is reserved asynchronously. The confirmation email goes out, and the reservation is dead-lettered on its first attempt:

```bash
$ curl -X POST localhost:3000/orders \
    -H 'Content-Type: application/json' \
    -d '{"userId":"user-7","items":[{"productId":"clumping-litter-10l","quantity":2}]}'
{"id":"bf4b8bb3-fd47-4c03-9650-ee991cce3dbe","userId":"user-7","items":[{"productId":"clumping-litter-10l","quantity":2,"price":1599}],"total":3198,"status":"placed"}
```

```bash
[Nest] 52743  - 09/30/2026, 6:46:15 PM     LOG [MailerService] Order confirmation for bf4b8bb3-fd47-4c03-9650-ee991cce3dbe sent to user-7
[Nest] 52743  - 09/30/2026, 6:46:15 PM    WARN [OutboxRelay] Dead-lettered order.placed 01a0f335-aae8-7027-b795-ca9dab21e44d after 1 attempt(s) (rejected): NonRetryableMessageError: Not enough stock for "clumping-litter-10l" (order bf4b8bb3-fd47-4c03-9650-ee991cce3dbe)
```

Inspect the dead-letter queue. Without the `x-admin-token` header, the guard answers `403`:

```bash
$ curl localhost:3000/admin/outbox/dead-letters -H 'x-admin-token: s3cret'
```

```json
[
  {
    "id": "01a0f335-aae8-7027-b795-ca9dab21e44d",
    "topic": "order.placed",
    "payload": {
      "id": "bf4b8bb3-fd47-4c03-9650-ee991cce3dbe",
      "items": [{ "price": 1599, "quantity": 2, "productId": "clumping-litter-10l" }],
      "total": 3198,
      "status": "placed",
      "userId": "user-7"
    },
    "headers": {},
    "key": null,
    "createdAt": 1790786775784,
    "attempts": 1,
    "lastError": "NonRetryableMessageError: Not enough stock for \"clumping-litter-10l\" (order bf4b8bb3-fd47-4c03-9650-ee991cce3dbe)",
    "history": [
      {
        "at": 1790786775809,
        "error": "NonRetryableMessageError: Not enough stock for \"clumping-litter-10l\" (order bf4b8bb3-fd47-4c03-9650-ee991cce3dbe)",
        "attempt": 1,
        "transport": "local"
      }
    ],
    "reason": "rejected",
    "failedAt": 1790786775809
  }
]
```

The payload is stored as `jsonb`, which keeps its own key order, so it comes back with its keys in a different order than they were added.

Restock, then requeue the message by its id:

```bash
$ psql postgres://localhost:5432/store -c "UPDATE products SET in_stock = in_stock + 5 WHERE id = 'clumping-litter-10l'"
UPDATE 1
$ curl -X POST localhost:3000/admin/outbox/dead-letters/01a0f335-aae8-7027-b795-ca9dab21e44d/requeue \
    -H 'x-admin-token: s3cret'
{"requeued":1}
```

The reservation goes through. The email handler's inbox already has this message id, so no second email is sent:

```bash
[Nest] 52743  - 09/30/2026, 6:46:24 PM     LOG [StockReservationHandler] Reserved stock for order bf4b8bb3-fd47-4c03-9650-ee991cce3dbe
```

Finally, stop the analytics service with `Ctrl+C`, then place an order and cancel it:

```bash
$ curl -X POST localhost:3000/orders \
    -H 'Content-Type: application/json' \
    -d '{"userId":"user-42","items":[{"productId":"salmon-kibble-2kg","quantity":1}]}'
{"id":"908139a7-2bab-4dd8-988a-bdde8c087074","userId":"user-42","items":[{"productId":"salmon-kibble-2kg","quantity":1,"price":2499}],"total":2499,"status":"placed"}
$ curl -X POST localhost:3000/orders/908139a7-2bab-4dd8-988a-bdde8c087074/cancel
{"id":"908139a7-2bab-4dd8-988a-bdde8c087074","userId":"user-42","items":[{"price":2499,"quantity":1,"productId":"salmon-kibble-2kg"}],"total":2499,"status":"cancelled"}
$ curl localhost:3000/admin/outbox/stats -H 'x-admin-token: s3cret'
{"pending":2,"ready":0,"leased":0,"deadLetters":0,"oldestDueAt":1790786821554,"lagMs":3351,"inFlight":0,"published":5,"retried":3,"deadLettered":1,"leaseLost":0,"lastPublishLagMs":62}
```

Both analytics messages are pending. `lagMs` grows while the outage lasts, and `retried` counts the failed attempts. `ready` is 0: the placement is waiting for its next retry, and the cancellation is due but waits behind it, because they share a key. The API logs each failed attempt:

```bash
[Nest] 52743  - 09/30/2026, 6:47:01 PM    WARN [OutboxRelay] Retrying analytics.order.placed 01a0f336-5db2-72ad-80c8-17c07908dfa1 in 546ms (attempt 1 of 10 failed): Error: connect ECONNREFUSED 127.0.0.1:4001
[Nest] 52743  - 09/30/2026, 6:47:02 PM    WARN [OutboxRelay] Retrying analytics.order.placed 01a0f336-5db2-72ad-80c8-17c07908dfa1 in 1617ms (attempt 2 of 10 failed): Error: connect ECONNREFUSED 127.0.0.1:4001
[Nest] 52743  - 09/30/2026, 6:47:04 PM    WARN [OutboxRelay] Retrying analytics.order.placed 01a0f336-5db2-72ad-80c8-17c07908dfa1 in 2084ms (attempt 3 of 10 failed): Error: connect ECONNREFUSED 127.0.0.1:4001
```

Start the analytics service again. At its next retry, the relay publishes the placement, then the cancellation. The revenue picks up where it was, because it lives in the service's database, not in its memory:

```bash
[Nest] 53368  - 09/30/2026, 6:47:29 PM     LOG [OrderStatsService] Order 908139a7-2bab-4dd8-988a-bdde8c087074 placed, revenue is now 10695
[Nest] 53368  - 09/30/2026, 6:47:29 PM     LOG [OrderStatsService] Order 908139a7-2bab-4dd8-988a-bdde8c087074 cancelled, revenue is now 8196
```

#### Testing

In an e2e test, run PostgreSQL in-process with [PGlite](https://pglite.dev) and your real migrations, turn the poll loop off, and drive the relay yourself. `relay.runOnce()` claims and processes one batch, and resolves when the batch is done:

```typescript
@@filename(test/orders.e2e-spec)
import { PGlite } from '@electric-sql/pglite';
import { getDrizzleToken } from '@nestjs/drizzle';
import { Outbox, OutboxRelay } from '@nestjs/outbox';
import { Test, type TestingModule } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { fileURLToPath } from 'node:url';
import { of } from 'rxjs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_SERVICE, AppModule } from '../src/app.module.js';
import * as schema from '../src/database/schema.js';
import { MailerService } from '../src/notifications/mailer.service.js';
import { OrdersService } from '../src/orders/orders.service.js';

describe('OrdersService (outbox)', () => {
  const client = new PGlite(); // PostgreSQL, in-process
  const db = drizzle(client, { schema });
  const mailer = { sendOrderConfirmation: vi.fn() };
  const analytics = { emit: vi.fn(() => of(undefined)) };
  let moduleRef: TestingModule;
  let orders: OrdersService;
  let relay: OutboxRelay;

  beforeAll(async () => {
    // Your migrations: the order tables. The outbox's store creates its schema in init().
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    process.env.OUTBOX_RELAY = 'off'; // no poll loop: the test drives the relay
    moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(db) // the outbox's store runs on it too
      .overrideProvider(MailerService)
      .useValue(mailer)
      .overrideProvider(ANALYTICS_SERVICE)
      .useValue(analytics)
      .compile();
    await moduleRef.init();
    orders = moduleRef.get(OrdersService);
    relay = moduleRef.get(OutboxRelay);
  });

  afterAll(async () => {
    await moduleRef.close();
    await client.close();
  });

  it('publishes order events only after the order commits', async () => {
    const order = await orders.placeOrder({ userId: 'user-42', items: [{ productId: 'salmon-kibble-2kg', quantity: 1 }] });
    expect(mailer.sendOrderConfirmation).not.toHaveBeenCalled();

    await relay.runOnce(); // claim and publish one batch

    expect(mailer.sendOrderConfirmation).toHaveBeenCalledWith(order);
    expect(analytics.emit).toHaveBeenCalledWith(
      'analytics.order.placed',
      expect.objectContaining({ key: order.id, payload: order }),
    );
    expect(await relay.stats()).toMatchObject({ pending: 0, deadLetters: 0 });
  });

  it('publishes nothing when the transaction rolls back', async () => {
    const outbox = moduleRef.get(Outbox);
    const add = outbox.add.bind(outbox);
    vi.spyOn(outbox, 'add').mockImplementationOnce(async (tx, messages) => {
      await add(tx, messages); // the messages are written...
      throw new Error('Connection terminated unexpectedly'); // ...then the transaction fails
    });

    await expect(
      orders.placeOrder({ userId: 'user-42', items: [{ productId: 'salmon-kibble-2kg', quantity: 1 }] }),
    ).rejects.toThrow('Connection terminated unexpectedly');

    expect(await relay.stats()).toMatchObject({ pending: 0 });
    expect(await relay.runOnce()).toMatchObject({ claimed: 0 });
  });
});
```

- The outbox, its store, the migrations and the in-process dispatch are real. Only the mailer and the analytics client are stubbed.
- Override the database `DrizzleModule` registers, whose token `getDrizzleToken()` returns, with the PGlite one. The store's factory injects the same token, so the orders and the outbox share the database, as they share the pool in production, and the store creates its schema there when the module initializes. The module still opens its `pg` pool, which never connects.
- The rollback test lets `outbox.add()` write the messages, then fails the transaction. The order and its messages disappear together, and `runOnce()` finds nothing to claim.
- For behavior that depends on time, such as backoff and lease expiry, move `Date.now()` forward with `vi.spyOn(Date, 'now')`. The relay takes the time from it, for itself and for the store, and real timers keep running for sockets and HTTP.
- PGlite has a single connection, so it runs transactions one at a time. Test races between instances against a PostgreSQL server, the same major version as production, as the example does for [several instances](/reliability/outbox#run-several-instances).
- To keep the outbox out of a test, replace the store: `overrideProvider(PostgresOutboxStore).useValue(new InMemoryOutboxStore())`. A plain instance doesn't register itself, so the outbox falls back to its in-memory store, and the store's schema isn't created. It can't join your Drizzle transactions, though: a rolled-back message is still published, and the store logs a warning the first time it gets your transaction.

#### Delivery guarantees

The overall guarantee is **at least once**, with consumer inboxes absorbing the duplicates.

| Situation | Outcome |
| --- | --- |
| The order transaction rolls back | The message never existed and is never published |
| The order transaction commits | Published eventually, or dead-lettered with its error history |
| A relay dies after claiming | Published by another instance once its lease expires |
| A relay dies after publishing, before recording it | Published twice. Inboxes drop the duplicate |
| A publish or handler fails | Retried with backoff, then dead-lettered (`exhausted`) |
| A publish or handler outlives `publishTimeout` | Counted as a failed attempt, and `ctx.signal` aborts. A handler that ignores it keeps running; a retry in the same process waits for it |
| `NonRetryableMessageError`, or `retryIf` returns `false` | Dead-lettered at once (`rejected`) |
| Messages share a `key` | Published in the order they were added. A retrying message holds back the rest of its key |
| A message is dead-lettered | Its key is unblocked, so later messages with that key overtake it |
| TCP, Redis or core NATS transport | "Published" means the write left the process. A consumer crash after that loses the message |

Order within a key is the order in which the store numbered the messages, not their ids: an id comes from its instance's clock, and clocks differ. PostgreSQL runs transactions concurrently, so the store makes the transactions that add messages with the same key take turns, and the numbering follows commit order (see [Keep messages in your database](/reliability/outbox#keep-messages-in-your-database)).

#### Production checklist

- Register a store on your application's database, on a database server: `PostgresOutboxStore`, `MySqlOutboxStore`, or one of your own ([The store contract](/reliability/outbox#the-store-contract)). Never keep the outbox on the instance itself, in memory or in a file database such as SQLite on its disk: a container's filesystem goes away when the task is replaced, and every message that hadn't been published goes with it. The production guard refuses to start without a store; set `allowInMemoryStorage` only for a process whose messages you can afford to lose.
- Apply the store's migrations before a new version starts, with `npx nest-outbox migrate` or your migration tool, and check them in CI with `npx nest-outbox status`. With `NODE_ENV=production`, the store doesn't migrate at startup: a schema that's behind fails it instead.
- On PostgreSQL, keep the database's default isolation level at READ COMMITTED, the default: the store refuses a stricter one at startup.
- Alert on `lagMs` and `deadLetters` from `relay.stats()`, and on `dead-lettered` events, from `OutboxEvents` or the `nestjs:outbox:dead-lettered` diagnostics channel.
- Size `retry` to how long your downstreams can be down. The package default is 20 attempts, about 30 to 60 minutes in total. This tutorial's 10 attempts capped at 1 minute give up after 2 to 4 minutes, and then a key's later messages overtake the dead-lettered one.
- Keep `consumer` names stable. Inbox entries are keyed by them, so a renamed consumer sees every past message as new.
- Prune inboxes. Nothing calls `OutboxInbox.prune()` for you. Run it from a [cron job](/application/task-scheduling#declarative-cron-jobs), for example `inbox.prune('30d')`, with a window longer than any redelivery, requeues included.
- Keep handlers shorter than `publishTimeout`, and pass `ctx.signal` to the calls they make. A slower handler counts as a failed attempt; leases aren't extended.
- Call `app.enableShutdownHooks()`, so deploys drain the relay instead of leaving messages leased. `DrizzleModule` ends the pool after that, in `onApplicationShutdown()`.
- Protect the dead-letter routes. They expose full payloads.
- Version payloads. A message added by the previous release can still be delivered after a deploy.
- Give each ordered stream its own key, and don't share a key between messages for different transports.
- Keep transactions that call `outbox.add()` short. The per-key lock makes transactions adding messages with the same key take turns. Prisma's interactive transactions time out after 5 seconds by default (`transactionOptions` on the client, or per call).
- On MySQL, run a transaction that calls `outbox.add()` again when it fails with a deadlock (error 1213): MySQL rolled all of it back.
- Size the connection pool for both your requests and the relay: each claim holds a connection for one short transaction.
- Run the contract suites with `concurrent: true` in CI against a store of your own, on a pool, against the database engine and major version you run in production.

#### The store contract

`PostgresOutboxStore` and `MySqlOutboxStore` implement the package's two storage interfaces: `OutboxStore` for the messages and dead letters, and `OutboxInboxStore` for the consumers' inboxes. For another database, implement them in a provider of your own. The JSDoc of each method on those interfaces says what it must do, and which race each rule prevents.

**Registration.** The store is an ordinary singleton provider that calls `registerSource()` on the injectable `OutboxStorage` in its constructor, for the contracts it implements, by name: `messages` and `inbox`. A service that only consumes may register an inbox store alone. The registry checks the shape at once (every method is a function), refuses a second registration unless it passes `replace: true`, and locks when `OutboxModule` initializes, logging the store in use. A request-scoped provider, a provider in a lazy-loaded module, or a lifecycle hook registers too late, and throws.

With nothing registered, the outbox runs on its in-memory store, and says so at startup:

```bash
[Nest] 19039  - 09/23/2026, 11:28:45 AM     LOG [OutboxModule] OutboxStorage: InMemoryOutboxStore (the default: state is lost on restart and not shared between instances)
```

That is more than a lost-on-restart shortcut. An in-memory store can't join your transaction, so it applies `add()` at once, and warns the first time it receives a transaction handle. In this run, the order's transaction added its message and then failed, and the confirmation email went out anyway:

```bash
[Nest] 19039  - 09/23/2026, 11:28:45 AM    WARN [OutboxModule] InMemoryOutboxStore.add() received your transaction handle, and can't join it: the write applies at once, so a rolled-back transaction won't undo it. Register a store for your database with OutboxStorage.registerSource(). (Logged once.)
[Nest] 19039  - 09/23/2026, 11:28:46 AM     LOG [MailerService] Order confirmation for 7435d418-5d9a-48a0-b186-6cfd2e34b9f4 sent to user-7
```

With `NODE_ENV=production`, the same application doesn't start:

```bash
Error: OutboxStorage: no store is registered for `messages` (OutboxStore) and `inbox` (OutboxInboxStore), and NODE_ENV is "production": in memory, messages and inbox records would be lost on restart and not shared between instances. Register a store on your database: PostgresOutboxStore (@nestjs/outbox/postgres), MySqlOutboxStore (@nestjs/outbox/mysql), or your own OutboxStore and OutboxInboxStore in a provider that injects OutboxStorage and calls `storage.registerSource({ messages: this, inbox: this })` in its constructor. Or set `allowInMemoryStorage: true` in the OutboxModule options to run in memory anyway.
```

`allowInMemoryStorage: true` in the module's options is the deliberate way out, for a single instance that may lose its state.

**Atomicity.** Producers, relays and deliveries race each other through the store. `add()` must number a key's messages in the order their transactions commit, `claim()` must never lease a message to two relays or run ahead of an older message of its key, a relay's later writes must apply only while its lease holds, and two deliveries of one message must meet at `recordInbox()`. So every method that changes state is one conditional statement, or one transaction with the right lock, never a read followed by a write. `add()` and `recordInbox()` receive your transaction object untouched: they must write through it, and refuse anything that isn't one, such as the database itself, with `OutboxTransactionRequiredError`.

**Test it** with the suites from `@nestjs/outbox/testing`. `outboxStoreContract()` and `outboxInboxStoreContract()` return the contracts as test cases for any test runner: each case is a `name` and a `run()` function that throws on failure. The tutorial's tests run them against `PostgresOutboxStore` through Drizzle, as you would against yours, with a function that returns the store on emptied tables, a way to open one of your transactions, and `notATransaction`, a handle the store must refuse:

```typescript
@@filename(test/drizzle-outbox.store.e2e-spec)
/** A store on emptied tables, built the way Nest builds it: with the database and a registry. */
async function freshStore(db: Database): Promise<OutboxStoreHarness<Transaction> & { store: PostgresOutboxStore }> {
  await db.execute(sql`TRUNCATE nest_outbox.messages, nest_outbox.dead_letters, nest_outbox.inbox RESTART IDENTITY`);
  return {
    store: new PostgresOutboxStore({ executor: fromDrizzle(db) }, new OutboxStorage()),
    transaction: (work) => db.transaction(work),
    notATransaction: db,
  };
}

describe('PostgresOutboxStore through fromDrizzle on PGlite: the store contract', () => {
  // ...
  // The concurrency cases run too; with one connection, PGlite runs them one transaction at a time.
  for (const c of outboxStoreContract(() => freshStore(db), { concurrent: true })) {
    it(c.name, c.run);
  }
  describe('the inbox contract', () => {
    for (const c of outboxInboxStoreContract(() => freshStore(db), { concurrent: true })) {
      it(c.name, c.run);
    }
  });
});
```

`concurrent: true` adds the races a naive store fails: producers of a key whose transactions overlap, relays claiming side by side, producers and relays racing, a stale relay's writes racing a takeover, and two deliveries of one message. On PGlite they pass one transaction at a time, so run them against a server with a pool too, where the transactions really overlap, on the database engine and major version you run in production. The tutorial runs both suites through each of its clients: Drizzle on PGlite and on PostgreSQL, TypeORM and Prisma on PostgreSQL, and Drizzle on MySQL, against `MySqlOutboxStore`. The package's own tests run them against stores written by hand with Drizzle, TypeORM and Prisma too, as the proof that a store written against the interfaces passes them.

Other packages' stores can live elsewhere: the idempotency store fits Redis. The outbox's store can't, because its messages must commit with your rows, in your database.

#### Using BullMQ on Postgres instead

BullMQ 6 has a PostgreSQL backend, so it's fair to ask whether its job table could be the outbox. The package's research into BullMQ 6.3.x (from reading its published code, not a live run) says: not today.

- `Queue.add()` always runs on BullMQ's own connection pool, in autocommit mode. The backend interface deliberately exposes no connection or transaction type, so an `add()` can't join the transaction that inserts your order.
- The enqueue itself is one SQL function, `bullmq.add_job(...)`. Calling it on your own transaction would be atomic, but the function is internal, its signature changes with BullMQ's schema migrations, and every transaction that calls it would take Postgres's global NOTIFY lock at commit.
- `@nestjs/bullmq` 12.0.0 can't select the Postgres backend for a single queue. The only way is BullMQ's process-wide `setDefaultBackendFactory()`.

What's needed is an upstream option to run `add()` on a caller-supplied client (so the job commits with the order), plus a backend option in `@nestjs/bullmq`. With both, the job table would be the outbox, and BullMQ's workers would provide the claims, retries and failed set with no relay in between. Until then, use this outbox and publish to BullMQ from an `OutboxTransport` that calls `queue.add(topic, payload)` with the outbox message `id` as the `jobId`, so a republished message is ignored while the job still exists.

#### Example

A working example is available in the [37-outbox sample](https://github.com/nestjs/nest/tree/master/sample/37-outbox): the order API on PostgreSQL with Drizzle, its in-process handlers, the analytics microservice with a database of its own, the dead-letter admin API, and the tests.

#### Reference

##### Module options

`OutboxModule.forRoot()` takes these options. `forRootAsync()` takes `transports` classes, `imports` and `isGlobal` at its top level, and the rest from `useFactory`, `useClass` or `useExisting` (a class implementing `OutboxOptionsFactory`), as in [Register the outbox](/reliability/outbox#register-the-outbox). The options token is `OUTBOX_MODULE_OPTIONS`. The store isn't an option: register it as a provider, as in [Keep messages in your database](/reliability/outbox#keep-messages-in-your-database). Durations are milliseconds, or strings such as `'30s'` and `'1m'`.

| Option | Default | Meaning |
| --- | --- | --- |
| `transports` | None | Named `OutboxTransport` classes or instances. `local`, the `@OnOutboxMessage()` handlers, is built in and reserved |
| `imports` | None | Modules whose exports the transport classes inject |
| `route` | The only destination | `(message) => name`: the one transport a message goes to. Required with handlers and transports, or several transports |
| `relay.enabled` | `true` | `false` in instances that only produce or only consume |
| `relay.pollInterval` | `'1s'` | The wait between polls when idle |
| `relay.batchSize` | `100` | Messages per claim |
| `relay.lease` | `'30s'` | How long a claim is exclusive |
| `relay.concurrency` | `10` | Key groups published in parallel within a batch |
| `relay.publishTimeout` | A third of `lease` | A slower publish counts as a failed attempt, and its `signal` aborts |
| `retry.attempts` | `20` | Total attempts, including the first, before the message is dead-lettered. `retry: 5` means 5 attempts; `retry: false`, a single attempt |
| `retry.backoff` | `'1s'` doubling up to `'5m'`, equal jitter | An object with `delay`, `factor`, `maxDelay` and `jitter` (`'equal'`, `'full'` or `'none'`), or a function `(attempt, error, message) => duration` |
| `retry.retryIf` | Every error | `(error, attempt, message) => boolean`: `false` dead-letters the message at once |
| `allowInMemoryStorage` | `false` | With `NODE_ENV=production` and no registered store, startup fails; `true` runs on the in-memory store anyway |
| `isGlobal` | `true` | Registers the module globally |

##### Stores

`new PostgresOutboxStore(options, outboxStorage)`, from `@nestjs/outbox/postgres`, and `new MySqlOutboxStore(options, outboxStorage)`, from `@nestjs/outbox/mysql`, take these options. Without `outboxStorage`, the store registers nowhere, which suits a script or a test.

| Option | Default | Meaning |
| --- | --- | --- |
| `executor` | Required | How the store reaches the database: one of the executors below, from the same entry point as the store. The other dialect's doesn't compile |
| `schema` | `'nest_outbox'` | On PostgreSQL, the schema of its tables, which its first migration creates: letters, digits and underscores, not starting with a digit, at most 63 characters. On MySQL, the prefix of its tables in the connection's database: lowercase letters, digits and underscores, not starting with a digit, at most 40 characters |
| `migrate` | `true`, except with `NODE_ENV=production` | Apply the pending migrations when the application starts. With `false`, startup fails with an `OutboxSchemaError` while the schema is behind |

Each executor takes your database client, and its own kind of transaction object, which `outbox.add()` and `processInTransaction()` then take:

| Executor | Takes | Transaction object |
| --- | --- | --- |
| `fromDrizzle(db)` | A Drizzle database: on PostgreSQL, whichever its driver; on MySQL, `mysql2` | The `tx` that `db.transaction()` hands its callback |
| `fromTypeOrm(dataSource)` | A `DataSource` of type `postgres` or `mysql` | The `EntityManager` that `dataSource.transaction()` hands its callback, or a `QueryRunner` after `startTransaction()` |
| `fromPrisma(prisma, options)` | A Prisma client, through a driver adapter such as `@prisma/adapter-pg`, or `@prisma/adapter-mariadb` for MySQL. `maxWait` (default `'10s'`) and `timeout` (default `'1m'`) limit the store's own transactions | The transaction client that `prisma.$transaction()` hands its callback |
| `fromKysely(db)` | A `Kysely` instance with a PostgreSQL or MySQL dialect | The transaction that `db.transaction().execute()` hands its callback |
| `fromPg(pool)` | PostgreSQL: a node-postgres `Pool`, or a connected `Client` | A client, such as one from `pool.connect()`, after `BEGIN` |
| `fromMysql2(pool)` | MySQL: a `mysql2/promise` pool, or a connection | A connection, such as one from `pool.getConnection()`, after `beginTransaction()` |

The store's `migrate()` method applies the pending migrations at once, whatever the `migrate` option says, and resolves with the versions it applied. The static `migrationSql()` returns their SQL, with the bookkeeping, and `MySqlOutboxStore.migrationStatements()` returns the same statements, one per string. They take the `schema`, the versions to go `from` (default `0`, a new database) and `to` (default: the one the package needs), and `migrationSql()` takes `statementBreakpoints` too. From version 0 on PostgreSQL, the SQL starts with `CREATE SCHEMA IF NOT EXISTS`, which needs the CREATE privilege on the database: leave it out if someone created the schema for you. The static `schemaVersion` is the version the package needs.

The command line, `npx nest-outbox`, takes `--url` (default `DATABASE_URL`) and `--schema` (default `nest_outbox`). A `mysql://` URL picks `MySqlOutboxStore`'s migrations, and needs `mysql2` installed:

| Command | What it does |
| --- | --- |
| `migrate` | Applies the pending migrations, as `migrate: true` does at startup |
| `status` | Prints the schema's version and the one the package needs, and exits with 1 while the schema is behind |
| `sql` | Prints the SQL of `migrationSql()`, from `--from` to `--to`, without a database: PostgreSQL's, or MySQL's with `--dialect mysql`. `--statement-breakpoints` separates the statements for a drizzle-kit custom migration |

On MySQL, the store needs MySQL 8.4 LTS or 9.x with a strict `sql_mode`, MySQL's default: a lax `sql_mode`, or MariaDB, fails the startup.

##### Messages and handlers

A message passed to `outbox.add(tx, message)` ([Save the order and its messages in one transaction](/reliability/outbox#save-the-order-and-its-messages-in-one-transaction)) has these fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `topic` | Yes | What `route` and the handlers match on |
| `payload` | Yes | Serialized to JSON when `add()` runs |
| `key` | No | The ordering key: messages that share it are published one at a time, in commit order |
| `headers` | No | String headers, passed to transports |
| `id` | No | Your own unique id. The default is a UUIDv7; consumers deduplicate by it |
| `delay` or `availableAt` | No | Publish no earlier than this long from now, or than this point in time. Not both |

- `@OnOutboxMessage(topic, options)` takes `consumer` (required: the name of the handler's inbox) and `inbox` (default `true`; `false` runs every delivery). [Handle order.placed in-process](/reliability/outbox#handle-orderplaced-in-process)
- A handler's context has `message`, `consumer`, `attempt`, `signal` and `processInTransaction(tx, work)`.
- `ClientProxyTransport(token, options)` emits the topic with an envelope of `id`, `topic`, `key`, `headers`, `createdAt` and `payload` (`OutboxEnvelope`). Its `toPacket(message, envelope)` option returns your own `pattern` and `data`. [Publish to the analytics microservice](/reliability/outbox#publish-to-the-analytics-microservice)

##### Services

| Service | Methods |
| --- | --- |
| `Outbox` | `add(tx, messages)`, `notify()` |
| `OutboxRelay` | `stats()`: `pending`, `ready`, `leased`, `deadLetters`, `oldestDueAt`, `lagMs`, `inFlight`. `runOnce()`: `claimed`, `published`, `retried`, `deadLettered`, `released`, `leaseLost`. Also `notify()`, `start()` and `stop()` |
| `OutboxDeadLetters` | `list(query)` (by `topic`, `key`, `limit`, `offset`; newest first), `get(id)`, `requeue(target)`, `purge(target)`. A target is an id, an array of ids, or a filter by `ids`, `topic`, `key`, `failedBefore`, or `all: true`. [Retries and the dead-letter queue](/reliability/outbox#retries-and-the-dead-letter-queue) |
| `OutboxInbox` | `process(consumer, id, work)`, `processInTransaction(tx, consumer, id, work)`, `prune(olderThan)`. Both `process` methods resolve `duplicate`, and `result` when `work` ran |

##### Events

`OutboxEvents.events$` emits each event, and publishes it on its `node:diagnostics_channel` channel. Every payload has `type` and the `message`. [Run several instances](/reliability/outbox#run-several-instances) counts them.

| Event | Channel | Other fields | When |
| --- | --- | --- | --- |
| `published` | `nestjs:outbox:published` | `transport`, `durationMs` | A transport accepted the message |
| `retry-scheduled` | `nestjs:outbox:retry-scheduled` | `transport`, `error`, `attempt`, `delayMs` | A publish failed and will be retried |
| `dead-lettered` | `nestjs:outbox:dead-lettered` | `transport`, `error`, `attempt`, `reason` | The message moved to the dead letters. Alert on it |
| `lease-lost` | `nestjs:outbox:lease-lost` | None | Another relay took the message over mid-publish, so it may be published twice |

A dead letter's `reason` is `exhausted` (the retries ran out) or `rejected` (a `NonRetryableMessageError`, or `retryIf` returned `false`).

##### Errors

None of them carries an HTTP status. `OutboxError` is the base class of the four that the package throws.

| Error | Raised when |
| --- | --- |
| `OutboxTransactionRequiredError` | `add()` or `processInTransaction()` got no transaction handle, or a store refused a handle that isn't a transaction |
| `OutboxPublishTimeoutError` | A publish outlived `relay.publishTimeout` (`timeoutMs`). Counted as a failed attempt |
| `OutboxNoHandlerError` | No `@OnOutboxMessage()` handler for the topic in this process (`topic`). Retried |
| `OutboxSchemaError` | The store's schema is behind the package's migrations while `migrate` is off, or applying them failed (`cause`): startup and every call fail until it's fixed. With the `schema`, its `version` and the `requiredVersion`. From `@nestjs/outbox/postgres` and `@nestjs/outbox/mysql` |
| `NonRetryableMessageError` | You throw it from a handler or transport to dead-letter the message without retrying |
