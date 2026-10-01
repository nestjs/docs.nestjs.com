### Durable workflows

Some business processes take days and span several systems. In an online store for cat food and supplies, fulfilling an order means:

1. Charge the customer's card with the payment provider.
2. Reserve the items in the warehouse.
3. Wait up to 3 days for the carrier's `shipment.delivered` webhook.
4. If it never arrives, or the carrier brings the parcel back, refund the charge and release the stock. Otherwise, wait 7 days and ask the customer for a review.

The process must survive deploys and crashes, charge exactly once, undo its work when it fails, and tell support where every order stands. With `@nestjs/workflows` you write it as one `async` method on an injectable class. Each side effect runs in a journaled **step**. After a restart, the method runs again from the top, and completed steps return their recorded results instead of running twice. Waits and sleeps park the instance in your own database, where any process on any host can pick it up when it's due. There is no workflow server to run.

#### Workflows, queues or sagas?

Nest already has two tools for work that happens later, and each stays the right choice for its job:

- **[BullMQ](/application/queues#bullmq-installation)** runs one unit of background work at a time, such as sending an email or transcoding a video, with concurrency limits, rate limits, priorities, and delayed or repeatable jobs. A process with a single delayed action ("cancel the order if it isn't paid within an hour") is a delayed job plus a status column.
- **[CQRS sagas](/recipes/cqrs#sagas)** turn events into commands inside one process. They fit reactions where losing in-flight state on a restart is acceptable. Where it isn't, the same events can start and signal workflows: see [With CQRS](/reliability/workflows#with-cqrs).
- **Workflows** fit a process with several steps that waits hours or days for timers or outside events, must survive restarts and deploys, and must undo its completed steps when it fails or is cancelled. They have concurrency limits, rate limits, priorities and schedules of their own, and a step can still hand heavy work to a BullMQ queue.

A workflow instance is a row in your application's database, so starting one can be part of the transaction that saves the order: pass the transaction to `start()` as its `transaction` option. The order and its fulfilment commit together or not at all. A job queue writes through its own connection (Redis, or BullMQ's own PostgreSQL pool), so saving an order and enqueueing its job are two writes, and a crash between them loses one. The same goes for signals: a webhook can update the order and wake its workflow in one transaction.

The tutorial below shows where queues and sagas run out: code that continues after a durable wait ([Sleep for a week, then ask for a review](/reliability/workflows#sleep-for-a-week-then-ask-for-a-review)), an event racing a deadline ([Wait for the delivery webhook](/reliability/workflows#wait-for-the-delivery-webhook)), and compensation that survives a crash ([Let customer support cancel an order](/reliability/workflows#let-customer-support-cancel-an-order)).

#### Installation

To get started, install the required dependency:

```bash
$ npm i --save @nestjs/workflows
```

The tutorial keeps its workflows in PostgreSQL, with the package's own store, and uses Drizzle, registered through [`@nestjs/drizzle`](/data/drizzle). [Keep workflows in your database](/reliability/workflows#keep-workflows-in-your-database) shows the store with TypeORM too, and the package's MySQL store. The tests on this page use [PGlite](https://pglite.dev), so they need no server.

Orders live in the example application's own table, `orders`. The tutorial uses in-memory stand-ins for the payment provider's SDK (`PaymentProviderClient`), the stock table (`InventoryService`) and the mail provider (`MailService`). Like the real systems, they deduplicate requests by idempotency key. Orders have this shape:

```typescript
@@filename(orders/order)
export interface OrderItem {
  productId: string;
  quantity: number;
  /** Unit price in cents. */
  price: number;
}

/** How the carrier ships it. Express orders are fulfilled first. */
export type Shipping = 'standard' | 'express';

export type OrderStatus = 'placed' | 'delivered' | 'returned' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  shipping: Shipping;
  /** In cents. */
  total: number;
  status: OrderStatus;
}

export class PlaceOrderDto {
  userId: string;
  items: OrderItem[];
  /** Default 'standard'. */
  shipping?: Shipping;
}

export interface FulfilmentResult {
  chargeId: string;
  trackingNumber: string;
}
```

##### Register the module

Import `WorkflowsModule` once, in the root module, next to [`DrizzleModule`](/data/drizzle), which registers the Drizzle database that `@InjectDrizzle()` injects. Workflow classes are ordinary providers, so they go in `providers` next to the services they inject. This is the finished module: the workflows and the controllers it lists are written in the following sections, and the first provider is the package's PostgreSQL store, which [Keep workflows in your database](/reliability/workflows#keep-workflows-in-your-database) explains.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';
import { WorkflowsModule, WorkflowStorage } from '@nestjs/workflows';
import { fromDrizzle, PostgresWorkflowStore } from '@nestjs/workflows/postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Database } from './database/drizzle.js';
import * as schema from './database/schema.js';
import { InventoryService } from './inventory/inventory.service.js';
import { InvoiceBatchWorkflow } from './invoices/invoice-batch.workflow.js';
import { InvoicesController } from './invoices/invoices.controller.js';
import { InvoicesService } from './invoices/invoices.service.js';
import { MailService } from './mail/mail.service.js';
import { OrderFulfilmentWorkflow } from './orders/order-fulfilment.workflow.js';
import { OrdersController } from './orders/orders.controller.js';
import { OrdersService } from './orders/orders.service.js';
import { PaymentProviderClient } from './payments/payment-provider.client.js';
import { PaymentsService } from './payments/payments.service.js';
import { CarrierWebhookController } from './shipping/carrier-webhook.controller.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      // Drizzle on PostgreSQL: a pg pool on DATABASE_URL, closed after the worker handed its instances back
      useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL!, schema }),
    }),
    WorkflowsModule.forRoot({
      worker: {
        concurrency: 10, // instances this process executes at once
        leaseDuration: '30s', // how long a crashed process keeps its instances
        shutdownTimeout: '10s', // how long a deploy waits for running steps
      },
    }),
  ],
  controllers: [OrdersController, CarrierWebhookController, InvoicesController],
  providers: [
    {
      // Instances and journals in your database, in a schema of their own (nest_workflows)
      provide: PostgresWorkflowStore,
      inject: [getDrizzleToken(), WorkflowStorage],
      useFactory: (db: Database, workflowStorage: WorkflowStorage) =>
        new PostgresWorkflowStore({ executor: fromDrizzle(db) }, workflowStorage),
    },
    OrdersService,
    PaymentProviderClient,
    PaymentsService,
    InventoryService,
    MailService,
    InvoicesService,
    OrderFulfilmentWorkflow,
    InvoiceBatchWorkflow,
  ],
})
export class AppModule {}
```

> info **Hint** The tutorial reads `process.env` directly, to stay short. In an application, load the environment through [`@nestjs/config`](/application/configuration) with a validation schema, so a missing `DATABASE_URL` stops the application at startup, and read it from `ConfigService` in the factory.

Every option is optional: `WorkflowsModule.forRoot()` works as is. To read them from `ConfigService`, use `forRootAsync()` with a factory, or with a `useClass` class that implements `WorkflowsOptionsFactory` and its `createWorkflowsOptions()` method.

The `worker` runs inside your application process. It polls for due instances every second, and a local `start()` or `signal()` wakes it immediately. It claims due instances under a lease and renews the lease every third of `leaseDuration`. If the process dies, its instances are claimable again once the lease expires. Set `worker: false` on processes that should only start, signal and inspect workflows, such as API pods. A step gets 3 attempts by default, with a backoff that starts at 1 second and doubles up to 5 minutes. A `retry` option here changes that default.

In `main.ts`, enable shutdown hooks. On `SIGTERM` the worker stops claiming, aborts the `signal` of running steps, waits up to `shutdownTimeout`, and hands the instances it stopped back to the store. Another process then picks them up at once instead of waiting for the lease.

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // On SIGTERM, stop claiming work and hand running instances back.
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

##### Keep workflows in your database

Workflow instances, their journals, the signals they wait for and the signals sent live in a **store**. Until you register one, the module keeps them in memory: fine for a first run, but a restart loses every running order, and two processes don't share them.

> warning **Warning** With `NODE_ENV=production` and no store registered, startup fails, unless you set `allowInMemoryStorage: true`.

On PostgreSQL, register the package's store, `PostgresWorkflowStore` from `@nestjs/workflows/postgres`. It runs its SQL through the database client your application already has, so it can join your transactions. It's an ordinary provider, registered once, in the root module, next to `WorkflowsModule`: both are application-wide. In `AppModule` above, it's the first provider: a factory that injects the Drizzle database and the `WorkflowStorage` registry, which the store registers itself with.

`fromDrizzle(db)` is the store's **executor**: it runs the store's statements through your Drizzle database, whichever driver it uses, such as `pg` or PGlite. `fromPg(pool)`, `fromTypeOrm(dataSource)`, `fromPrisma(prisma)` and `fromKysely(db)` do the same for a node-postgres pool, TypeORM, Prisma and Kysely. At startup, the module logs `WorkflowStorage: PostgresWorkflowStore`.

**The schema.** There's nothing to create for workflows: no tables, entities or Prisma models. The store keeps its tables in a schema of its own, `nest_workflows` (the `schema` option names another), and creates and migrates it itself. On MySQL, which has no schemas, they're tables of the connection's database, with the schema's name as their prefix: `nest_workflows_instances` and so on.

| Table | What it holds |
| --- | --- |
| `nest_workflows.instances` | Each workflow instance: its input, status, output or error, when it's due, and its lease |
| `nest_workflows.journal` | Each instance's recorded steps, sleeps, waits and compensations, with their results |
| `nest_workflows.waits` | The signals a suspended instance waits for |
| `nest_workflows.signals` | The signals sent, until `purge()` deletes the ones no instance can take any more |
| `nest_workflows.schedules` | The schedules, with their spec, state and next run |
| `nest_workflows.rate_limits` | The rate-limit windows, per workflow and key |
| `nest_workflows.migrations` | The versions of the store's schema applied |

They belong to the store: your migrations don't create them, and your own tables can't collide with them.

**Migrations.** The package ships the schema as versioned migrations, and the store applies them itself. With the `migrate` option, it applies the ones the schema hasn't had yet at startup, before the worker runs, in one transaction that holds an advisory lock: of several processes that start together, one migrates, and the others find nothing left to do. `migrate` defaults to `true`, except with `NODE_ENV=production`. So in development and in tests, the store creates its schema on the first start, and your migrations only create your own tables, here `orders`.

In production, apply the migrations before the new version of your application starts, as you apply your own, so that no process changes the schema while it boots: in the middle of a rolling deploy, that would lock busy tables, and a least-privilege database user can't do it anyway. The package's command line does it from your deploy step, next to `npx drizzle-kit migrate`. It reads the database from `DATABASE_URL`, or from `--url`, and needs `pg` installed:

```bash
$ npx nest-workflows status
Schema "nest_workflows" is at version 0; this version of @nestjs/workflows needs version 1.
$ npx nest-workflows migrate
Migrated schema "nest_workflows" to version 1 (applied 1).
```

`status` exits with 1 while the schema is behind, which makes it a check for CI. To apply the migrations with your own migration tool instead, take their SQL from `npx nest-workflows sql`, or from `PostgresWorkflowStore.migrationSql()` in code: the statements of every migration, one per paragraph, with the bookkeeping that records the version. Run them in one transaction, as TypeORM's and Drizzle's migrators do. With TypeORM, that's a migration of your own, next to the ones it generates for your entities:

```typescript
@@filename(typeorm/migrations/1790801342207-WorkflowStore)
import { PostgresWorkflowStore } from '@nestjs/workflows/postgres';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkflowStore1790801342207 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(PostgresWorkflowStore.migrationSql());
  }

  async down(): Promise<void> {
    throw new Error('The workflow store has no down migrations.');
  }
}
```

With drizzle-kit, create a custom migration, and fill it with the SQL, a `--> statement-breakpoint` line between the statements: Drizzle's migrator then runs them one at a time, which PGlite requires. In code, `migrationSql()` with `statementBreakpoints: true` returns the same.

```bash
$ npx drizzle-kit generate --custom --name=workflows
$ npx nest-workflows sql --statement-breakpoints > drizzle/0001_workflows.sql
```

On MySQL, `MySqlWorkflowStore.migrationStatements()` returns the statements one per string, and a TypeORM migration runs them one per call:

```typescript
@@filename(typeorm/mysql-migrations/1790801342207-WorkflowStore)
for (const statement of MySqlWorkflowStore.migrationStatements()) {
  await queryRunner.query(statement);
}
```

With `migrate` off, a store whose schema is behind fails the startup with a `WorkflowSchemaError` that names these three ways, and fails every call the same way until the schema catches up, which it notices without a restart. Migrations only ever add tables, columns and indexes, so during a rolling deploy, the previous version of your application keeps running on the migrated schema. There are no down migrations.

**Transactions.** `start()` and `signal()` take your transaction as their `transaction` option: with Drizzle, the `tx` that `db.transaction()` hands its callback, as [Start it with the order](/reliability/workflows#start-it-with-the-order) shows. The store runs its statements on that transaction, so they commit or roll back with your writes. It refuses the database itself, whose statements would commit on their own, with a `TypeError` that says what to pass. With the other executors, pass a node-postgres client after `BEGIN` (not the pool), TypeORM's `EntityManager` from `dataSource.transaction()`, Prisma's interactive transaction client, or a Kysely transaction.

**Isolation.** The store relies on READ COMMITTED, PostgreSQL's default isolation level: its statements race each other, and under a stricter level they would fail with serialization errors. At startup, it checks the database's `default_transaction_isolation`, and fails if it's stricter. A `signal()` in your transaction needs a READ COMMITTED transaction too, or its wake-ups could miss waits committed after the transaction's snapshot: it's refused with a `TypeError` otherwise.

**With TypeORM.** `TypeOrmModule` takes the place of `DrizzleModule` in `AppModule`, and the store runs on the `DataSource` it provides, through `fromTypeOrm()`:

```typescript
@@filename(typeorm/app.module)
{
  // Instances and journals in your database, in a schema of their own (nest_workflows)
  provide: PostgresWorkflowStore,
  inject: [DataSource, WorkflowStorage],
  useFactory: (dataSource: DataSource, workflowStorage: WorkflowStorage) =>
    new PostgresWorkflowStore({ executor: fromTypeOrm(dataSource) }, workflowStorage),
},
```

Where the tutorial passes Drizzle's `tx` to `start()` and `signal()`, pass the `EntityManager` that `dataSource.transaction()` hands its callback. The store refuses `dataSource.manager`, whose writes would commit on their own. This is the order service's `place()`, from [Start it with the order](/reliability/workflows#start-it-with-the-order), with TypeORM:

```typescript
@@filename(typeorm/orders.service)
return this.dataSource.transaction(async (manager) => {
  await manager.insert(OrderEntity, order);
  // Same transaction: the fulfilment exists if and only if the order does.
  const fulfilment = await this.workflowClient.start(OrderFulfilmentWorkflow, order, {
    id: fulfilmentId(order.id),
    transaction: manager,
  });
  return { ...order, fulfilment };
});
```

> info **Hint** With Prisma, pass the client to `fromPrisma()`, and as `transaction`, the transaction client that `prisma.$transaction()` hands its callback. The store's own transactions wait up to 10 seconds for a connection and run for up to a minute, longer than Prisma's defaults: the second argument of `fromPrisma()` changes that, with `maxWait` and `timeout`. If your application signals in bursts, give its own transactions a longer `maxWait` too, since signals queue behind each other.

**With MySQL.** The package has a store for MySQL 8.4 LTS and 9.x too, `MySqlWorkflowStore` from `@nestjs/workflows/mysql`, with executors of the same names. MariaDB isn't supported yet: the store refuses it at startup. The provider is the same, with the MySQL store's class and executor. This is `AppModule` with Drizzle on a mysql2 pool, where `mode: 'default'` is Drizzle's setting for a schema on MySQL:

```typescript
@@filename(mysql/app.module)
import { fromDrizzle, MySqlWorkflowStore } from '@nestjs/workflows/mysql';
import { drizzle } from 'drizzle-orm/mysql2';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      // Drizzle on MySQL: a mysql2 pool on DATABASE_URL (mysql://...), whose path names the database
      useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL!, schema, mode: 'default' as const }),
    }),
    // ...
  ],
  providers: [
    {
      // Instances and journals in your database, in tables of their own (nest_workflows_*)
      provide: MySqlWorkflowStore,
      inject: [getDrizzleToken(), WorkflowStorage],
      useFactory: (db: Database, workflowStorage: WorkflowStorage) =>
        new MySqlWorkflowStore({ executor: fromDrizzle(db) }, workflowStorage),
    },
    // ...
  ],
})
export class AppModule {}
```

`fromMysql2(pool)`, `fromTypeOrm(dataSource)`, `fromPrisma(prisma)` and `fromKysely(db)` do the same for a mysql2 pool, TypeORM, Prisma (through `@prisma/adapter-mariadb`) and Kysely. `start()` and `signal()` take the same transaction objects as on PostgreSQL, and with mysql2, a connection after `beginTransaction()`. What differs from PostgreSQL:

- **The tables.** MySQL has no schemas inside a database, so the store keeps its tables in the connection's database, the one the URL's path names, and the `schema` option is the prefix of their names: `nest_workflows_instances`, `nest_workflows_signals` and so on, next to `nest_workflows_migrations` and `nest_workflows_locks`, which hold its versions and its locks.
- **Bounded keys.** Ids, names and keys are indexed columns of limited length. An instance id, a workflow or signal name, a signal's `key` and `id`, and a concurrency or rate-limit key hold 255 characters, a schedule id 230, and a step, sleep or wait name 512. `start()` and `signal()` reject a longer one with a `RangeError` before anything is written. Keys still compare exactly, as on PostgreSQL.
- **Your transactions.** `start()` and `signal()` with the `transaction` option work at REPEATABLE READ, MySQL's default, and at READ COMMITTED: the wake-up reads the waits with a locking read, which also sees those committed after your transaction's snapshot. Avoid SERIALIZABLE, where MySQL turns plain reads into locking ones: a `start()` in such a transaction would hold every signal up until the transaction ends.
- **Deadlocks.** MySQL breaks a deadlock by rolling back one of the transactions, with error 1213 (`ER_LOCK_DEADLOCK`). The store runs its own transactions again. In yours, the rollback also took your writes, so the error reaches your code: run the transaction again. A transaction that writes an order and then signals, while another one signals and then writes the same order, deadlocks that way.
- **Migrations.** MySQL commits each DDL statement on its own, so the migrations can't run in one transaction. The store and `npx nest-workflows migrate` apply them one statement at a time, under a lock (`GET_LOCK()`), so processes that start together still migrate once, and a run that stopped halfway resumes where it stopped. The command line takes a `mysql://` URL and then needs `mysql2`, and `npx nest-workflows sql --dialect mysql` prints the SQL. With your own tool, apply the statements in order, each once, one per call, as the TypeORM migration above does: for drizzle-kit, whose MySQL migrator sends one statement per breakpoint, add `--statement-breakpoints`.

For another database, write a store of your own: [The store contract](/reliability/workflows#the-store-contract) says what it must do.

#### Write the workflow

Every side effect needs an idempotency key. A step runs **at least once**: if the process dies after the payment provider charged the card but before the result reached the journal, the step runs again. The engine hands each step an `idempotencyKey` that stays the same across attempts and processes (`<instance id>:<step name>`). Pass it to the system you call, and the effect happens once:

```typescript
@@filename(payments/payments.service)
import { Injectable } from '@nestjs/common';
import { NonRetryableStepError } from '@nestjs/workflows';
import type { Order } from '../orders/order.js';
import { PaymentProviderClient } from './payment-provider.client.js';

export interface Charge {
  chargeId: string;
  amount: number;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly paymentProviderClient: PaymentProviderClient) {}

  async charge(order: Order, idempotencyKey: string): Promise<Charge> {
    // The payment provider answers a repeated Idempotency-Key with the first response,
    // so a retried step never charges the card twice.
    const charge = await this.paymentProviderClient.createCharge(
      { amount: order.total, currency: 'USD', reference: order.id },
      { idempotencyKey },
    );
    if (charge.status === 'declined') {
      // Retrying won't help. Fail the step now.
      throw new NonRetryableStepError(`The payment provider declined the card for order ${order.id}.`);
    }
    return { chargeId: charge.id, amount: charge.amount };
  }

  async refund(chargeId: string, idempotencyKey: string): Promise<void> {
    await this.paymentProviderClient.createRefund({ chargeId }, { idempotencyKey });
  }
}
```

`InventoryService.reserve()` follows the same idea without an external API: it uses the key as the reservation's primary key, so a retry finds the reservation it already made. It throws `NonRetryableStepError` when a product is out of stock. `MailService` passes the key to the mail provider as the message id.

Now the workflow. Decorate a class with `@Workflow()`, give it a name, and implement `run()`:

```typescript
@@filename(orders/order-fulfilment.workflow)
import { Workflow, type WorkflowContext, type WorkflowRunner } from '@nestjs/workflows';
import { InventoryService } from '../inventory/inventory.service.js';
import { MailService } from '../mail/mail.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { shipmentDelivered } from '../shipping/carrier-event.js';
import type { FulfilmentResult, Order } from './order.js';

/** One fulfilment per order: the order id is the workflow instance id. */
export const fulfilmentId = (orderId: string) => `order-${orderId}`;

@Workflow('order-fulfilment')
export class OrderFulfilmentWorkflow implements WorkflowRunner<Order, FulfilmentResult> {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly inventoryService: InventoryService,
    private readonly mailService: MailService,
  ) {}

  async run(ctx: WorkflowContext, order: Order): Promise<FulfilmentResult> {
    const charge = await ctx.step(
      'charge-payment',
      ({ idempotencyKey }) => this.paymentsService.charge(order, idempotencyKey),
      {
        retry: { attempts: 5, backoff: { delay: '2s' } },
        compensate: (charge, { idempotencyKey }) => this.paymentsService.refund(charge.chargeId, idempotencyKey),
      },
    );

    await ctx.step(
      'reserve-stock',
      ({ idempotencyKey }) => this.inventoryService.reserve(order.items, idempotencyKey),
      { compensate: ({ reservationId }) => this.inventoryService.release(reservationId) },
    );

    // ...the delivery wait and the review request continue here
  }
}
```

`ctx.step()` runs the function once and writes its result to the journal. Whenever the instance runs again (after a wait, a sleep or a crash), `run()` starts from the top and `charge-payment` returns the journaled charge without calling the payment provider. Results must be JSON-serializable, and they come back in their JSON form, on the first run too: a `Date` is a string. The return type says so (`Journaled<Charge>`), so TypeScript flags code that treats a journaled value as a live object.

- **`retry`**: `attempts` counts the first attempt too, and `backoff` sets the wait before each retry: a `delay`, a growth `factor`, a `maxDelay` cap and optional `jitter`. A number is shorthand for the attempts, and `false` means a single attempt. A failed attempt parks the instance until the backoff has elapsed, so a retry survives a restart too. A `NonRetryableStepError`, such as a declined card, fails the step at once.
- **`compensate`**: registered when the step completes. If the workflow later fails or is cancelled, the compensations of completed steps run in reverse order. Each is journaled and retried like a step, with its own idempotency key. If `reserve-stock` fails because an item is out of stock, the charge is refunded. [Sleep for a week, then ask for a review](/reliability/workflows#sleep-for-a-week-then-ask-for-a-review) shows how to end this once the order is delivered.

Steps can also run in parallel. To reserve each item on its own, start one step per item and wait for them together. Each step has its own name, with the item's index in it, and so its own idempotency key and compensation:

```typescript
@@filename(orders/order-fulfilment.workflow)
// One step per item, all at once: each reserves its item under its own key, and
// releases it if the order is undone.
await Promise.all(
  order.items.map((item, i) =>
    ctx.step(
      `reserve-item-${i}`,
      ({ idempotencyKey }) => this.inventoryService.reserve([item], idempotencyKey),
      { compensate: ({ reservationId }) => this.inventoryService.release(reservationId) },
    ),
  ),
);
```

If one item is out of stock, its step fails, the others finish, and the compensations of the ones that completed run: the reservations are released, then the charge is refunded. Compensations run in the reverse order of the `ctx.step()` calls, whichever step finished first. The rest of the tutorial keeps the single `reserve-stock` step.

The class is a singleton shared by every running order, and constructor injection works as usual. Keep per-order state in local variables, never on `this`.

#### Start the workflow

##### Start it with the order

An order and its fulfilment belong together: an order that nothing fulfils is as bad as a fulfilment charging for an order that was never saved. So `OrdersService` saves the order and starts the workflow in one Drizzle transaction. `WorkflowClient` starts instances; pass it the transaction's `tx`:

```typescript
@@filename(orders/orders.service)
import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { WorkflowClient } from '@nestjs/workflows';
import { eq } from 'drizzle-orm';
import type { Database } from '../database/drizzle.js';
import { orders } from '../database/schema.js';
import { fulfilmentId, OrderFulfilmentWorkflow } from './order-fulfilment.workflow.js';
import type { Order, PlaceOrderDto } from './order.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly workflowClient: WorkflowClient,
  ) {}

  async place(dto: PlaceOrderDto) {
    const total = dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order: Order = {
      id: randomUUID().slice(0, 8),
      userId: dto.userId,
      items: dto.items,
      shipping: dto.shipping ?? 'standard',
      total,
      status: 'placed',
    };

    return this.db.transaction(async (tx) => {
      await tx.insert(orders).values(order);
      // Same transaction: the fulfilment exists if and only if the order does.
      const fulfilment = await this.workflowClient.start(OrderFulfilmentWorkflow, order, {
        id: fulfilmentId(order.id),
        transaction: tx,
      });
      return { ...order, fulfilment };
    });
  }

  async findOne(id: string): Promise<Order> {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, id));
    if (!order) {
      throw new NotFoundException(`Order ${id} not found.`);
    }
    return order;
  }

  // ...markDelivered() is added in the next section
}
```

With `transaction`, the store creates the instance through the transaction your ORM handed the callback, so it commits with the order, or rolls back with it if anything later in the callback fails. The worker only ever sees committed instances: it picks this one up at its next poll after the commit. Pass the transaction, not the database, which the store refuses: `start()` without the option writes on its own, which is the dual write the option removes. With TypeORM, pass the transaction's `EntityManager`, and with Prisma, the transaction client, as [Keep workflows in your database](/reliability/workflows#keep-workflows-in-your-database) shows.

The instance id comes from the order id, which makes `start()` idempotent. Starting the same id with the same input returns the existing instance with `created: false`, and a different input throws `WorkflowIdConflictError`. A reconciliation job can call it again for an order without charging twice.

##### Report its status

The controller places orders and reports where their fulfilment stands:

```typescript
@@filename(orders/orders.controller)
import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { WorkflowClient } from '@nestjs/workflows';
import { fulfilmentId } from './order-fulfilment.workflow.js';
import { PlaceOrderDto } from './order.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly workflowClient: WorkflowClient,
  ) {}

  @Post()
  place(@Body() dto: PlaceOrderDto) {
    return this.ordersService.place(dto);
  }

  @Get(':id/fulfilment')
  async fulfilment(@Param('id') id: string) {
    const instance = await this.workflowClient.getStatus(fulfilmentId(id), { journal: true });
    if (!instance) {
      throw new NotFoundException(`Order ${id} not found.`);
    }
    return {
      status: instance.status,
      stage: instance.customStatus,
      waitingFor: instance.waits.map((wait) => wait.signal),
      wakeAt: instance.wakeAt === null ? null : new Date(instance.wakeAt).toISOString(),
      steps: Object.fromEntries(instance.journal.map((entry) => [entry.name, entry.status])),
      error: instance.error?.message ?? null,
    };
  }

  // ...cancel() is added for customer support, below
}
```

`getStatus()` returns the instance: its `status`, `wakeAt`, the signals it `waits` for, its `error` or `output`, and, with the `journal` option, every step. The statuses are `pending`, `running`, `suspended`, `compensating`, `completed`, `failed`, `cancelled` and `compensation_failed`; [What each status means](/reliability/workflows#what-each-status-means) says what each one means and what to do about it. The endpoint maps the instance to a small view. Don't return the raw instance to customers, because it includes the input and lease details.

The `stage` comes from the workflow. `ctx.setStatus()` sets the instance's **custom status**, a JSON value of up to 16 KiB that `getStatus()` and `list()` return as `customStatus`: here, a word for where the order stands. Set it in `run()` as the order moves on, and to `delivered` once the carrier has delivered it (in [Sleep for a week, then ask for a review](/reliability/workflows#sleep-for-a-week-then-ask-for-a-review)):

```typescript
@@filename(orders/order-fulfilment.workflow)
const charge = await ctx.step(
  'charge-payment',
  // ...the charge, as above
);
ctx.setStatus('paid');

await ctx.step(
  'reserve-stock',
  // ...the reservation, as above
);
ctx.setStatus('awaiting-delivery');
```

The status isn't journaled. Every execution replays `run()`, and with it the `setStatus()` calls, so each execution sets the status again on its way through, and a status set in a loop doesn't grow the journal. The workflow never reads it back, so nothing it decides depends on it. It's written with the instance's next write: when the next step starts, when the instance parks, or when it ends. So the endpoint shows `paid` while `reserve-stock` waits for a retry, and `awaiting-delivery` once the instance parks for the carrier. A status the workflow no longer changes stays, such as `awaiting-delivery` on a cancelled order: `status` tells what happened. A value that isn't JSON, or takes more than 16 KiB as JSON, fails the instance with a `TypeError`, and `undefined` clears the status. Each written change is emitted as a `custom-status` event.

#### Wait for signals and timers

##### Wait for the delivery webhook

Next, the workflow waits for the carrier. The webhook and the workflow share a signal: a name and the type of its payload, defined once, so neither side can misspell the name or send the wrong shape:

```typescript
@@filename(shipping/carrier-event)
import { WorkflowSignal } from '@nestjs/workflows';

/** The body the carrier POSTs to our webhook. */
export interface CarrierEvent {
  type: 'shipment.in_transit' | 'shipment.delivered' | 'shipment.returned';
  /** The store's order id. */
  reference: string;
  trackingNumber: string;
  occurredAt: string;
}

/** Sent by the webhook, awaited by the fulfilment workflow. The order id is its key. */
export const shipmentDelivered = new WorkflowSignal<CarrierEvent>('shipment.delivered');
```

Add this to `run()`, after `reserve-stock`:

```typescript
@@filename(orders/order-fulfilment.workflow)
const delivery = await ctx.waitForSignal('await-delivery', shipmentDelivered, {
  key: order.id,
  timeout: '3d',
});
if (!delivery) {
  ctx.fail(`Order ${order.id} was not delivered within 3 days.`);
}
```

`waitForSignal()` records the wait and parks the instance: its status becomes `suspended` and `wakeAt` is the deadline. No memory, timer or worker is held for those 3 days. It resolves with the signal's payload, typed as a `CarrierEvent`, or with `null` once the timeout passes. `ctx.fail()` then fails the instance, and the compensations run in reverse: the stock is released, then the charge is refunded. A `match` option filters the signals further by payload, such as `match: (event) => event.trackingNumber !== ''`; it runs again on every replay, so it must be a pure function of the payload.

The webhook marks the order as delivered and sends the signal. Both happen in a new `OrdersService.markDelivered()` method, in one transaction, so the order's status and the signal commit together. Add it, and the import of the signal:

```typescript
@@filename(orders/orders.service)
import { shipmentDelivered, type CarrierEvent } from '../shipping/carrier-event.js';

async markDelivered(event: CarrierEvent): Promise<void> {
  await this.db.transaction(async (tx) => {
    const updated = await tx
      .update(orders)
      .set({ status: 'delivered' })
      .where(eq(orders.id, event.reference))
      .returning({ id: orders.id });
    if (updated.length === 0) {
      throw new NotFoundException(`Order ${event.reference} not found.`);
    }
    // The order's new status and the signal commit together.
    await this.workflowClient.signal(shipmentDelivered, event, { key: event.reference, transaction: tx });
  });
}
```

The controller verifies the callback and hands it over:

```typescript
@@filename(shipping/carrier-webhook.controller)
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service.js';
import type { CarrierEvent } from './carrier-event.js';

@Controller('webhooks/carrier')
export class CarrierWebhookController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(200)
  async handle(@Body() event: CarrierEvent) {
    // Verify the carrier's signature header before trusting the body.
    if (event.type === 'shipment.delivered') {
      await this.ordersService.markDelivered(event);
    }
    return { received: true };
  }
}
```

`signal()` stores the signal with a correlation `key` and wakes the instances waiting for that signal and key. Keys match exactly, so the order id keeps one order's delivery from waking another, and a wait without a key only takes signals sent without one. Signals are durable. A webhook that arrives before the workflow reaches the wait still counts, and each signal is consumed at most once per instance, so the carrier's retries are harmless. They still store a signal each, unless you pass an `id`, such as the tracking number: a signal with the same name and `id` is stored once, and a repeat returns the first one's `signalId` with `created: false`. A delivery recorded after the deadline loses to the timeout, even if no worker was running when the deadline passed.

The controller answers `200` only after the transaction has committed. A delivery for an order the store doesn't know rolls back with a `404`, leaving no signal behind, and if the database fails, the carrier gets an error and delivers the webhook again. Signals sent in a transaction queue behind each other until it ends, so keep such transactions short. On PostgreSQL, the transaction must use the default READ COMMITTED isolation; the store refuses a stricter one, which could miss a wait registered while it ran. On MySQL, the default REPEATABLE READ works as well.

##### Wait for whichever comes first

The carrier doesn't always deliver. When it can't, it brings the parcel back to the warehouse and reports `shipment.returned`. Declare a second signal, next to the first:

```typescript
@@filename(shipping/carrier-event)
/** Sent by the webhook when the carrier brings the parcel back to the warehouse. The order id is its key. */
export const shipmentReturned = new WorkflowSignal<CarrierEvent>('shipment.returned');
```

The webhook sends it as it sends the delivery. A new `OrdersService.markReturned()` sets the order's status to `returned` and sends the signal, in one transaction, like `markDelivered()`:

```typescript
@@filename(shipping/carrier-webhook.controller)
if (event.type === 'shipment.returned') {
  await this.ordersService.markReturned(event);
}
```

The workflow now waits for the delivery, the return or 3 days, whichever comes first. Replace the `waitForSignal()` call with `ctx.waitForAny()`:

```typescript
@@filename(orders/order-fulfilment.workflow)
const outcome = await ctx.waitForAny('await-delivery', {
  delivered: ctx.signalWait(shipmentDelivered, { key: order.id }),
  returned: ctx.signalWait(shipmentReturned, { key: order.id }),
  timedOut: ctx.timer('3d'),
});
if (outcome.key === 'returned') {
  ctx.fail(`The carrier returned order ${order.id} to the warehouse.`);
}
if (outcome.key === 'timedOut') {
  ctx.fail(`Order ${order.id} was not delivered within 3 days.`);
}
const delivery = outcome.value;
```

`ctx.signalWait()` and `ctx.timer()` only describe a condition, and `waitForAny()` waits for them together. It parks the instance once, with every signal it waits for and the earliest deadline, and resolves with the `key` of the condition that happened first and its `value`: a signal's payload, or `null` for a timer. Checking `key` narrows `value`, so after the two checks `delivery` is a `CarrierEvent`. A returned parcel fails the instance, and the compensations release the stock, which is back in the warehouse, and refund the charge. The status endpoint's `waitingFor` lists both signals while the instance waits.

The outcome is journaled as one entry under the wait's name, so every later execution gets the same winner. When several conditions are ready at once, the signal recorded first wins, whichever condition it matched. A signal sent after a timer's deadline doesn't count, as with `waitForSignal()`'s `timeout`, and timers count from when the wait is first reached. Only the winning signal is taken: a return reported after the delivery would stay for a later wait of the same instance. To wait for all of several signals instead, await several `waitForSignal()` calls with `Promise.all()`: each is journaled on its own, and the instance parks once for all of them. A child workflow can be a condition too, as [Start child workflows](/reliability/workflows#start-child-workflows) shows.

##### Sleep for a week, then ask for a review

Finish `run()` with the point of no return, a durable timer and the last step:

```typescript
@@filename(orders/order-fulfilment.workflow)
// Point of no return: the parcel arrived, so nothing from here on refunds
// the charge or releases the stock, not a failure and not a cancel.
ctx.commit('delivered');
ctx.setStatus('delivered');

await ctx.sleep('before-review-request', '7d');
await ctx.step('send-review-request', ({ idempotencyKey }) =>
  this.mailService.sendReviewRequest(order, idempotencyKey),
);

return { chargeId: charge.chargeId, trackingNumber: delivery.trackingNumber };
```

`ctx.sleep()` stores a wake-up time and parks the instance, like the wait. After 7 days, any worker resumes it: never early, and usually within a poll interval of the deadline. When it resumes, `run()` replays from the top: `charge-payment` and `await-delivery` return their journaled values, so `charge` and `delivery` are in scope a week later. A delayed job can't give you that continuation. To sleep until a point in time instead, pass an object with `until`, a `Date` or epoch milliseconds, computed from journaled values such as `ctx.now()`.

`ctx.commit()` marks the point of no return. Once the parcel is delivered, refunding the charge would be wrong, whatever happens next. `commit()` discards the compensations registered so far. If the review email then fails for good, the instance ends as `failed` with the step's error, and nothing is refunded or released. A cancel past this point doesn't undo anything either. Only the steps after `commit()` register compensations that can still run. The commit point is journaled under its name, so it replays like a step, and the status endpoint lists it as `delivered`.

##### Time out the whole workflow

A wait's `timeout` bounds one wait, and a step's `timeout` one attempt. To bound a whole instance, give the workflow a run timeout:

```typescript
@Workflow('order-fulfilment', { timeout: '30d' })
```

The deadline is the instance's start plus the timeout, stored with the instance as its `deadline`, so it holds across restarts and deploys, and a parked instance wakes for it even when its sleep or wait would end later. Once it passes, the instance stops at its next `ctx` call (a step that is running finishes first), its compensations run, and it ends as `failed` with a `WorkflowTimeoutError`. Compensations aren't bound by the deadline. Here the wait gives up after 3 days and the sleep takes 7, so 30 days is a safety net. `start()` takes a `timeout` option too, which overrides the decorator's for that instance.

#### Cancel and operate workflows

##### Let customer support cancel an order

Add a `cancel()` route to `OrdersController`, and `ConflictException` and `HttpCode` to its `@nestjs/common` import. `OrdersService.markCancelled()` sets the order's status:

```typescript
@@filename(orders/orders.controller)
// Customer support only: protect it with your staff guard.
@Post(':id/cancel')
@HttpCode(202)
async cancel(@Param('id') id: string, @Body('reason') reason: string) {
  const order = await this.ordersService.findOne(id);
  if (order.status === 'delivered') {
    throw new ConflictException(`Order ${id} was delivered. Start a return instead.`);
  }
  // accepted is false if the fulfilment already ended or was already cancelled.
  const { accepted } = await this.workflowClient.cancel(fulfilmentId(id), reason);
  if (accepted) {
    await this.ordersService.markCancelled(id);
  }
  return { accepted };
}
```

`cancel()` sets a flag. A parked instance wakes at once. A running one lets its current step finish and stops at its next `ctx` call. (A running instance in another process notices the flag on its next lease renewal, within a third of `leaseDuration`.) Either way, the compensations of the completed steps run in reverse, and the instance ends as `cancelled` with the reason as its error message. `cancel()` returns the instance with an `accepted` flag. It's `false` when the instance had already completed or failed, when it is already compensating a failure, or when a cancel or a terminate was already requested. A second cancel changes nothing, and the first reason is kept.

Once the carrier has reported the delivery, the route answers `409`, because support should start a return instead. The workflow doesn't rely on that check. A cancel that reaches it after `ctx.commit('delivered')` stops the review request and refunds nothing. A cancel it sees before it has consumed the delivery event still refunds, because it hasn't reached its point of no return yet.

##### What each status means

An instance's `status` says what it's doing, and whether it needs you:

| Status | What it means | What to do |
| --- | --- | --- |
| `pending` | Started, and not yet claimed by a worker. One that stays `pending` waits for a concurrency slot or room in a rate-limit window, or is of a version no running worker registers | Nothing while a limit holds it. Otherwise, deploy a worker with that version, or delete the instance |
| `running` | A worker holds its lease and executes it | Nothing. `cancel()` stops it at its next `ctx` call, and `terminate()` without compensating |
| `suspended` | Parked on a sleep, a wait or a retry's backoff, until `wakeAt` or a signal | Nothing. A signal or `cancel()` wakes it |
| `compensating` | Undoing its completed steps after a failure or a cancel | Nothing: it ends as `failed`, `cancelled` or `compensation_failed`. `terminate()` stops the undo |
| `completed` | Done, with the result of `run()` as its `output` | Nothing, until retention purges it |
| `cancelled` | Cancelled, after its compensations ran, or terminated without them (`error.name` is `WorkflowTerminatedError`). `error.message` is the reason | Nothing, until retention purges it |
| `failed` | A step gave up, `ctx.fail()` was called, the run timeout passed or the journal hit its limit, and then its compensations ran. Or a definition error, such as a deploy that broke replay, failed it without compensating | If no compensation ran, fix the cause and retry it. Otherwise it's done: its completed steps were undone |
| `compensation_failed` | An undo gave up halfway. `error` is the original failure, with the compensation's own error as `error.compensation` | Fix the cause, such as a warehouse API that was down, and retry it. Or finish the undo by hand and delete the instance |

##### Retry, delete or terminate

`WorkflowClient` has the actions for the table's last column. Call them from a staff-only route or a script:

```typescript
await this.workflowClient.retry(fulfilmentId(orderId));
await this.workflowClient.delete(fulfilmentId(orderId));
await this.workflowClient.terminate(fulfilmentId(orderId), 'Refunded by hand after a chargeback.');
```

- **`retry()`** runs a `failed` instance again from its journal: completed steps return their results, the step that gave up gets its attempts back, and sleeps and waits the instance left behind start over. A deploy that broke replay is retried once the fixed code runs. It refuses an instance whose compensations ran, since resuming would build on undone work: start a new instance instead. An instance past its run timeout needs a new one, as the `timeout` option (counted from now), or `false` for none. A `compensation_failed` instance runs the compensations that didn't complete again, each with its attempts back, and ends as it would have: `failed` or `cancelled`.
- **`delete()`** removes a finished instance with its journal. An unfinished one needs the `force` option, and goes without running its compensations: use it for an instance no worker can run any more, such as one of a version you no longer deploy.
- **`cancel()`**, as above, stops an instance that is still running, and runs its compensations.
- **`terminate()`** stops an instance without running its compensations, for one whose undo mustn't or can't run, such as an order support has already refunded by hand. A parked instance stops at once, a running one at its next `ctx` call, and a compensating one after the compensation it's running. It ends as `cancelled`, with a `WorkflowTerminatedError` whose message is the reason (`Terminated.` without one). It's accepted after a `cancel()` too, which it replaces, and a `cancel()` after it is refused. Its children get their `parentClose`, as for any end.

`retry()` and `delete()` throw a `WorkflowStateError`, whose `status` is `409`, for a status where they make no sense, and when another change to the instance races them. A retry is journaled as `$retry:1`, `$retry:2` and so on, with the status and error it retried, and both actions are emitted, as `workflow-retried` and `workflow-deleted`.

##### Purge finished instances

Finished instances stay, with their journals, until you purge them. `purge()` deletes the ones that finished longer ago than its `olderThan` option, a batch at a time, and the signals no instance can take any more. An instance only takes signals sent after it started, so once every unfinished instance started after a signal, and the signal is older than `olderThan`, it goes; the newest signal always stays. `compensation_failed` instances wait for a person, so they're purged only when you list them in the `status` option. Run it every night, on one instance of your application, with `@Cron()` from `@nestjs/schedule` and `@OnOneInstance()` from [`@nestjs/locks`](/reliability/locks):

```typescript
@Injectable()
export class WorkflowRetentionJob {
  constructor(private readonly workflowClient: WorkflowClient) {}

  @Cron('30 3 * * *')
  @OnOneInstance({ key: 'workflows:purge' })
  async purge() {
    return this.workflowClient.purge({ olderThan: '30d' });
  }
}
```

`purge()` resolves with the number of `instances` and `signals` it deleted, and of the rate-limit windows that ended (`rateLimits`). A signal's `id` deduplicates for as long as the signal is stored, so keep `olderThan` longer than any sender's redelivery window, such as your carrier's webhook retries.

#### Limits, children and batch work

##### Limit how many run at once

A worker runs every due instance it has room for. Three options decide what runs, and in what order, across every worker: a concurrency limit, a rate limit and a priority. The fulfilment sets the first two in `@Workflow()`:

```typescript
@@filename(orders/order-fulfilment.workflow)
@Workflow('order-fulfilment', {
  // One execution per customer at a time, so two of their orders never charge their card at once.
  concurrency: { limit: 1, key: (order: Order) => order.userId },
  // Each execution sends the payment provider one request at most: a charge, or a refund.
  rateLimit: { max: 10, duration: '1s' },
})
```

**Concurrency.** `concurrency` caps how many instances run at once: a `limit` for the workflow, or a `limit` per key with a `key` function, here the customer's id. An array takes one of each. An instance holds a slot only while an execution runs it, compensations included, not while it sleeps or waits: a limit protects what the steps call, and an order parked for days holds up nobody. A process that crashes frees its slots once its leases expire. Instances past a limit stay due and wait for a slot, most overdue first, and a full key is passed over, so one busy customer never holds back another's order. The key is computed from the input when the instance starts, and `start()`'s `concurrencyKey` option sets another, for a workflow whose limit has a key.

**Rate limits.** `rateLimit` caps how many executions start per window: `max` per `duration` for the workflow, or per key with a `key` function, which `start()`'s `rateLimitKey` option overrides. Every execution counts, the first one and each resumption after a sleep, a signal, a retry's backoff or a cancel, because each can call what the limit protects. The fulfilment sends the payment provider one request per execution at most, so this caps its requests, and the executions that send none too. A window opens with the first execution after the previous one ended, and admits `max` executions until it closes, so two windows back to back can admit twice `max` within one `duration`. Say the payment provider allows 20 requests a second: allow 10.

**Priorities.** `start()`'s `priority` option decides what is claimed first: the lowest priority, then the most overdue. It's an integer from 1 to 2,097,151, and instances started without one go before every prioritized one. Express orders go first:

```typescript
@@filename(orders/orders.service)
const fulfilment = await this.workflowClient.start(OrderFulfilmentWorkflow, order, {
  id: fulfilmentId(order.id),
  transaction: tx,
  // Lower runs first: express orders before standard ones.
  priority: order.shipping === 'express' ? 1 : 2,
});
```

Since instances without a priority go first, once orders have one, other work needs one to go after them: the invoice batch's schedule gives it 10, in [Run workflows on a schedule](/reliability/workflows#run-workflows-on-a-schedule). An instance keeps its priority for every execution, and children inherit their parent's. Priorities are strict: a steady stream of express orders holds the standard ones back. `@StartOn()` takes the same option, as [With CQRS](/reliability/workflows#with-cqrs) shows.

Limits come from the highest registered version of the workflow and apply to all its versions, and each process applies the limits of the code it runs, so deploy a change to them everywhere. Claims never admit more than the limits allow, but can admit less for a moment: workers polling at the same time can take a few polls to fill a short window, and with both a concurrency key and a rate-limit key, a candidate that one kind of key passes over waits for the next claim. Claims also sort the due instances by priority, which the index on `wake_at` doesn't give them: cheap while few instances are due, noticeable with a large backlog. `drain()` stops when nothing left can start.

##### Start child workflows

Shipping grows: book the carrier's pickup, cancel it if the order is undone, then wait for the delivery or the return. It's a process of its own, with its own steps, retries and status, so give it a workflow of its own, and run it as a **child** of the fulfilment:

```typescript
@@filename(shipping/shipment.workflow)
import { Workflow, type WorkflowContext, type WorkflowRunner } from '@nestjs/workflows';
import type { Order } from '../orders/order.js';
import { shipmentDelivered, shipmentReturned, type CarrierEvent } from './carrier-event.js';
import { CarrierClient } from './carrier.client.js';

/** Books the carrier's pickup, and waits for the delivery: a child of the order's fulfilment. */
@Workflow('shipment')
export class ShipmentWorkflow implements WorkflowRunner<Order, CarrierEvent> {
  constructor(private readonly carrierClient: CarrierClient) {}

  async run(ctx: WorkflowContext, order: Order): Promise<CarrierEvent> {
    await ctx.step(
      'book-pickup',
      ({ idempotencyKey }) => this.carrierClient.bookPickup(order, idempotencyKey),
      { compensate: ({ pickupId }) => this.carrierClient.cancelPickup(pickupId) },
    );

    const outcome = await ctx.waitForAny('await-delivery', {
      delivered: ctx.signalWait(shipmentDelivered, { key: order.id }),
      returned: ctx.signalWait(shipmentReturned, { key: order.id }),
      timedOut: ctx.timer('3d'),
    });
    if (outcome.key === 'returned') {
      ctx.fail(`The carrier returned order ${order.id} to the warehouse.`);
    }
    if (outcome.key === 'timedOut') {
      ctx.fail(`Order ${order.id} was not delivered within 3 days.`);
    }
    return outcome.value;
  }
}
```

`CarrierClient` is a stand-in for the carrier's booking API, which, like the payment provider, answers a repeated idempotency key with the first booking. In the fulfilment, the child takes the place of the wait:

```typescript
@@filename(orders/order-fulfilment.workflow)
// Starts the shipment, and waits for it to end: its delivery, or a ChildWorkflowFailedError.
const delivery = await ctx.executeChild(ShipmentWorkflow, order);
```

Register `ShipmentWorkflow` and `CarrierClient` as providers, next to the fulfilment. The carrier's webhook doesn't change: it signals the order's id, and the shipment is now the instance waiting for it.

- **`ctx.executeChild()`** starts the child and waits for its end. Both are journaled, as `$child:<id>` and `$result:<id>`, so a replay gets the same child back instead of starting another, and the fulfilment parks in the meantime. `ctx.startChild()` only starts it, and returns a handle: its `result()` waits for the child, and the handle is a condition of `waitForAny()`, to race the child against a timer or a signal.
- **Ids.** A child's id defaults to its parent's id, the workflow's name and a count of that workflow's children in this run, such as `order-71e1973d/shipment#1`. Give children started from parallel branches an `id` option derived from your data, so that a replay, which can reach them in another order, finds each one.
- **Failures.** If the child fails, is cancelled or is terminated, `executeChild()` throws a `ChildWorkflowFailedError`, with its `status` and its error as `cause`. Left uncaught, it fails the fulfilment like any error: a returned parcel fails the shipment, whose compensation cancels its booking, and then the fulfilment, whose compensations refund the charge and release the stock. Catch it to try something else, such as another carrier.
- **`parentClose`** decides what happens to a child that is still running when its parent ends or starts compensating: `'cancel'`, the default, cancels it, and its compensations run; `'terminate'` stops it without them; `'abandon'` leaves it running. When support cancels the order, the shipment is cancelled with it, and the pickup with the shipment.
- A child inherits its parent's priority, unless `startChild()` gets one, and takes `concurrencyKey` and `rateLimitKey` options as `start()` does. `getStatus()` with the `children` option lists an instance's children, each with its `parentId`, and `list()` pages through them by `parentId`.

##### Long-running steps

A step can run for hours. While it runs, the worker keeps renewing the lease in the background. For long batch work, checkpoint progress so a crash doesn't restart the job from zero. Here, a monthly batch renders invoices one page at a time:

```typescript
@@filename(invoices/invoice-batch.workflow)
import { Workflow, type WorkflowContext, type WorkflowRunner, type WorkflowStepContext } from '@nestjs/workflows';
import { InvoicesService } from './invoices.service.js';

interface Checkpoint {
  cursor: number | null;
  rendered: number;
}

@Workflow('invoice-batch')
export class InvoiceBatchWorkflow implements WorkflowRunner<{ month: string }, { rendered: number }> {
  constructor(private readonly invoicesService: InvoicesService) {}

  async run(ctx: WorkflowContext, { month }: { month: string }) {
    return ctx.step(
      'render-invoices',
      async ({ progress, heartbeat, signal }: WorkflowStepContext<Checkpoint>) => {
        // After a crash, the next attempt starts from the last checkpoint.
        let { cursor, rendered } = progress ?? { cursor: 0, rendered: 0 };
        while (cursor !== null) {
          const page = await this.invoicesService.renderPage(month, cursor, signal);
          cursor = page.nextCursor;
          rendered += page.rendered;
          await heartbeat({ cursor, rendered });
        }
        return { rendered };
      },
      { heartbeatTimeout: '2m' },
    );
  }
}
```

- `heartbeat(progress)` writes the checkpoint to the journal. If the attempt dies, the next one receives it as `progress`. Annotating the parameter as `WorkflowStepContext<Checkpoint>` types both. The page that was in flight is rendered again, so `renderPage()` must overwrite rather than append.
- `heartbeatTimeout` fails an attempt that stops calling `heartbeat()`, such as one stuck on a hung socket, while the process is still alive. A `timeout` option caps the attempt's total duration.
- `signal` is aborted on shutdown, on a lost lease and on those timeouts. Pass it to your I/O.

A schedule, below, starts the batch every month. When the work belongs on processes of its own, such as a pool of PDF renderers, hand it to a [BullMQ](/application/queues) queue from a step, and wait for the job to report back with a signal. The job id is the step's `idempotencyKey`, so a retried step doesn't enqueue it twice:

```typescript
await ctx.step('enqueue-render', async ({ idempotencyKey }) => {
  await this.invoicesQueue.add('render', { month }, { jobId: idempotencyKey });
});
const rendered = await ctx.waitForSignal('await-render', invoicesRendered, { key: month, timeout: '6h' });
```

The queue's processor reports back when the job is done:

```typescript
await this.workflowClient.signal(invoicesRendered, result, { key: job.data.month, id: job.id });
```

The `id` stores the signal once when BullMQ runs the job again, and a job that finishes before the workflow reaches the wait still counts, because signals are durable.

##### Run workflows on a schedule

The invoices are due on the 1st of every month. Instead of a cron job that starts the batch, declare a schedule on the workflow:

```typescript
@@filename(invoices/invoice-batch.workflow)
import { Workflow, type WorkflowContext, type WorkflowRunner, type WorkflowStepContext } from '@nestjs/workflows';

/** The month before the one `at` falls in, in UTC ('2026-09' in October 2026): 02:00 on the 1st in New York is the 1st in UTC too. */
const lastMonth = (at: number) => new Date(new Date(at).setUTCDate(0)).toISOString().slice(0, 7);

@Workflow('invoice-batch', {
  schedules: [
    {
      id: 'monthly-invoices',
      // At 02:00 on the 1st of every month, in the store's time zone: last month's invoices.
      cron: '0 2 1 * *',
      tz: 'America/New_York',
      // A deploy or an outage at 02:00 delays the batch instead of skipping a month.
      missed: 'once',
      // After the orders (express 1, standard 2): without a priority, it would go before them.
      priority: 10,
      input: ({ at }) => ({ month: lastMonth(at) }),
    },
  ],
})
export class InvoiceBatchWorkflow implements WorkflowRunner<{ month: string }, { rendered: number }> {
  // ...as before
}
```

Every worker whose code declares the schedule starts its occurrences, and each occurrence starts one instance, however many workers there are: its id is the schedule's id and the occurrence's time, such as `monthly-invoices@2026-10-01T06:00:00.000Z`. The `input` function receives the occurrence, its schedule's `id` and its time `at`, and so does the instance, as `ctx.schedule`, which is `null` for an instance started otherwise.

- **When.** `cron` takes 5 fields, or 6 with the seconds first, `every` a fixed interval, and `rrule` an RFC 5545 recurrence rule. Times are wall-clock times in `tz`, UTC by default, so the batch starts at 02:00 in New York before and after the clocks change. `startAt`, `endAt` and `limit` bound a schedule.
- **`missed`** says what happens to occurrences no worker was up to start, during a deploy or an outage. `'skip'`, the default, starts one only if a worker finds it within a minute of its time; `'once'` starts the latest of them; `'all'` starts each of them, the latest 100 at most, and needs `overlap: 'allow'`. The occurrences it passes over are reported in a `schedule-skipped` event.
- **`overlap`** says what an occurrence does while an instance the schedule started is unfinished: `'skip'`, the default, passes it over, with a `schedule-skipped` event; `'allow'` starts it anyway; `'cancel-previous'` cancels the running one; `'buffer-one'` starts it once the running one ends.

A declared schedule belongs to the code, also while a rolling deploy runs the old and the new code side by side. Each process saves the schedules that its workflows declare when it starts, and confirms them every minute while its worker runs. A process leaves a schedule as it is while another process confirms it, if its own code doesn't declare it or a newer version of the workflow declares it differently. Once no process has confirmed it for five minutes, a process deletes a schedule that its code doesn't declare, whether or not it runs the schedule's workflow, and replaces another declaration with its own. So an old pod that restarts mid-rollout leaves alone the schedules that the new code adds or a new version changes, a schedule that a deploy drops goes about five minutes after the last process of the old code stopped, also when the deploy removes its workflow, and a rollback brings the old declaration back.

Processes of other code on the same database, such as the workers of other workflows, also delete a schedule when no worker whose code declares it has run for five minutes, as while those workers are scaled to zero. The next process whose code declares it saves it again as it starts, and the schedule starts over: from its next occurrence, unpaused, with its runs counted from zero.

`WorkflowClient.schedules`, also injectable as `WorkflowSchedules`, handles schedules at runtime. `trigger('monthly-invoices')` starts an occurrence now, whatever `overlap` says and even while the schedule is paused, with its time as `at`. `pause()` stops the occurrences until `resume()`, which starts again from the first one after now. `preview()` returns the next occurrences, in epoch milliseconds, and `get()` and `list()` read the schedules. A schedule that isn't in the code, such as one per customer, is saved with `upsert()`, and `remove()` deletes it, leaving the instances it started running:

```typescript
await this.workflowClient.schedules.upsert(`reorder-reminder-${user.id}`, {
  workflow: ReorderReminderWorkflow,
  // Every 4 weeks, on Saturdays at 09:00 in the customer's time zone
  rrule: 'FREQ=WEEKLY;INTERVAL=4;BYDAY=SA;BYHOUR=9;BYMINUTE=0',
  tz: user.timeZone,
  input: { userId: user.id },
});
```

`upsert()` and `remove()` refuse a declared schedule, which you change in the code.

##### Wait for a result

Most callers start a workflow and move on. Some need its result: an accountant who wants a month's invoices now, before the schedule renders them, calls a route that renders them and answers with the count. `startAndWait()` starts the instance and waits for it to end:

```typescript
@@filename(invoices/invoices.controller)
import { Controller, HttpCode, Param, Post, Res } from '@nestjs/common';
import { WorkflowClient, WorkflowResultTimeoutError } from '@nestjs/workflows';
import type { Response } from 'express';
import { InvoiceBatchWorkflow } from './invoice-batch.workflow.js';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly workflowClient: WorkflowClient) {}

  // Accounting only: protect it with your staff guard.
  @Post(':month')
  @HttpCode(200)
  async render(@Param('month') month: string, @Res({ passthrough: true }) response: Response) {
    try {
      // One batch per month: calling again, while it runs or after it ended, waits for the same one.
      return await this.workflowClient.startAndWait(InvoiceBatchWorkflow, { month }, { id: `invoices-${month}` }, { timeout: '30s' });
    } catch (error) {
      if (!(error instanceof WorkflowResultTimeoutError)) {
        throw error;
      }
      // The batch keeps running: answer now, and let the accountant call again later.
      response.status(202);
      return { rendering: true };
    }
  }
}
```

- `startAndWait()` is `start()`, then `result()`, which waits for an instance to end and resolves with its output. For an id that has an instance already, it waits for that one, so the accountant calling the route again, while the batch runs or after it ended, gets the same batch. The wait's options are the fourth argument: the third one's `timeout` stays the instance's run timeout.
- Past the wait's `timeout`, in wall-clock time rather than the module's clock, it rejects with `WorkflowResultTimeoutError`, and the instance keeps running: the route answers `202`. A `signal` option stops the wait when it's aborted, as when the caller goes away.
- On shutdown, a wait lasts while the worker finishes its running steps, up to `shutdownTimeout`, so an instance that ends meanwhile still answers with its result. Then the wait rejects with an `Error`, before Nest closes the HTTP server, and the route answers at once, here with a `500`, instead of holding up the shutdown until its wait's `timeout`.
- An instance that failed, was cancelled or terminated rejects with a `WorkflowFailedError`, whose `status` says how it ended and whose `cause` is its error. Here, that's a `500`.
- `result()` waits for an instance by its id, such as the one `trigger()` started, whichever process runs it. `startAndWait()` refuses the `transaction` option, since the instance only exists once your transaction commits: call `start()` in the transaction, and `result()` after the commit.

#### Deploy changes safely

The journal is keyed by name, so step, sleep and wait names are a contract with every instance that is still running. The name is also part of the idempotency key.

Suppose you rename `charge-payment` to `charge-card` and deploy. An order that was waiting for the carrier resumes, finds no `charge-card` entry in its journal, and would charge the card again, under a key the payment provider has never seen. Before the first new step of an execution runs, the engine checks that the code reached every step in the journal. Here it didn't, so the instance fails without charging:

```text
Instance "order-6d0f8c06" of workflow "order-fulfilment@1" does not match its journal:
"charge-payment", "reserve-stock", "await-delivery" were recorded by an earlier run but not
reached before the new step "charge-card". A deployed change renamed, removed or reordered steps.
Ship such changes as a new version (@Workflow(name, { version })) and keep the old class
registered until its instances finish.
```

Its compensations don't run either, because they're defined by the code that no longer matches. The instance is left for a person to handle. The check doesn't see a step whose name stayed the same but whose body now does something different.

Some changes don't need a new version:

- changing a step's body without changing what it means,
- adding steps after the last step, sleep or wait that any running instance has reached,
- changing retry options and timeouts.

Anything else ships as a new version. Say marketing wants an order confirmation right after payment. Inserting a step before `reserve-stock` changes what a replay sees, so copy the class and bump its version:

```typescript
@@filename(orders/order-fulfilment-v2.workflow)
@Workflow('order-fulfilment', {
  version: 2,
  // The limits of the highest registered version apply to every version: keep them.
  concurrency: { limit: 1, key: (order: Order) => order.userId },
  rateLimit: { max: 10, duration: '1s' },
})
export class OrderFulfilmentWorkflowV2 implements WorkflowRunner<Order, FulfilmentResult> {
  // ...same constructor as version 1

  async run(ctx: WorkflowContext, order: Order): Promise<FulfilmentResult> {
    const charge = await ctx.step(
      'charge-payment',
      // ...unchanged
    );
    ctx.setStatus('paid');

    await ctx.step('send-order-confirmation', ({ idempotencyKey }) =>
      this.mailService.sendOrderConfirmation(order, idempotencyKey),
    );

    // ...the rest is unchanged from version 1
  }
}
```

Register both classes. An instance keeps the version it started on, and a worker only claims versions it has registered, so old and new pods can run side by side during a rolling deploy. New instances start on the highest registered version, even when the controller still passes `OrderFulfilmentWorkflow`, because the class only identifies the workflow's name. To pin one, add `version: 1` to the `start()` options. Remove version 1 once `list()` with the workflow's name, `version: 1` and the unfinished statuses (`pending`, `running`, `suspended` and `compensating`) comes back empty.

##### Rules for workflow code

`run()` executes again from the top every time an instance resumes. Code between steps runs on every execution, so it must make the same decisions each time:

- Put anything that touches or reads the outside world in a step: HTTP calls, database reads and writes, feature flags.
- Outside steps, use `ctx.now()`, `ctx.random()` and `ctx.uuid()` instead of `Date.now()`, `Math.random()` and `randomUUID()`. They're journaled.
- In `run()`, only `await` `ctx` operations and pure computation. Never wait on a real timer.
- Step, sleep and wait names must be unique within a run. In a loop, add the index to the name, such as `remind-1` and `remind-2`. Give children started from parallel branches an `id` of their own.
- Don't call `ctx` methods inside a step's function. The function runs once and replays only see its result, so the engine fails the instance when a step calls `ctx`. Throw a `NonRetryableStepError` from a step instead of calling `ctx.fail()` there.
- If you catch errors in `run()`, rethrow what you don't handle. `isWorkflowInterrupt()` identifies the engine's control flow. The engine doesn't depend on it: after a swallowed interrupt no step runs, `commit()` throws again, and a cancel still cancels. But `finally` blocks run at every suspension, so keep side effects out of them.
- `Promise.all()` over steps is fine, and a step in the same `Promise.all()` as a sleep or wait starts after it. `Promise.race()` and `Promise.any()` are not replay-safe.
- Inputs, step results and signal payloads must be JSON-serializable. A `Date` comes back as a string, on the first run and on every replay, and the `Journaled` types of results and payloads say so.
- Keep no per-run state on `this`: one instance of the class serves every order.

#### Try it and test it

##### Try it

Create the database, apply your migrations, and start the application with `DATABASE_URL` pointing at the database:

```bash
$ npm run start:dev
...
[Nest] 33662  - 09/30/2026, 1:28:30 PM     LOG [WorkflowsModule] WorkflowStorage: PostgresWorkflowStore
[Nest] 33662  - 09/30/2026, 1:28:30 PM     LOG [WorkflowsModule] PostgresWorkflowStore: migrated schema "nest_workflows" to version 1.
[Nest] 33662  - 09/30/2026, 1:28:30 PM     LOG [NestApplication] Nest application successfully started +8ms
```

The log names the store in use, not the in-memory default, and says that the store created its schema: your migrations created `orders`, and the store its own tables. Place an order, then ask where it is:

```bash
$ curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" \
    -d '{"userId": "u_42", "items": [{"productId": "salmon-kibble-2kg", "quantity": 1, "price": 2499}]}'
{"id":"f7e1e1eb","userId":"u_42","items":[{"productId":"salmon-kibble-2kg","quantity":1,"price":2499}],"shipping":"standard","total":2499,"status":"placed","fulfilment":{"id":"order-f7e1e1eb","workflow":"order-fulfilment","version":1,"created":true,"status":"pending"}}

$ curl http://localhost:3000/orders/f7e1e1eb/fulfilment
{"status":"suspended","stage":"awaiting-delivery","waitingFor":["shipment.delivered","shipment.returned"],"wakeAt":"2026-10-03T11:28:42.251Z","steps":{"charge-payment":"completed","reserve-stock":"completed","await-delivery":"pending"},"error":null}
```

The order and its fulfilment were committed together, the worker picked the instance up, the card is charged, the kibble is reserved, and the instance is parked until the carrier reports the delivery or the return, or the 3-day deadline in `wakeAt` passes.

Now play the carrier and report the delivery:

```bash
$ curl -X POST http://localhost:3000/webhooks/carrier -H "Content-Type: application/json" \
    -d '{"type": "shipment.delivered", "reference": "f7e1e1eb", "trackingNumber": "TRK123456789", "occurredAt": "2026-09-30T14:05:00Z"}'
{"received":true}

$ curl http://localhost:3000/orders/f7e1e1eb/fulfilment
{"status":"suspended","stage":"delivered","waitingFor":[],"wakeAt":"2026-10-07T11:28:58.885Z","steps":{"charge-payment":"completed","reserve-stock":"completed","await-delivery":"completed","delivered":"completed","before-review-request":"pending"},"error":null}
```

The instance passed its point of no return and is sleeping until the review request is due in 7 days. Support can no longer cancel the order, and a delivery for an order the store doesn't know is refused:

```bash
$ curl -X POST http://localhost:3000/orders/f7e1e1eb/cancel -H "Content-Type: application/json" -d '{"reason": "Changed my mind."}'
{"message":"Order f7e1e1eb was delivered. Start a return instead.","error":"Conflict","statusCode":409}

$ curl -X POST http://localhost:3000/webhooks/carrier -H "Content-Type: application/json" \
    -d '{"type": "shipment.delivered", "reference": "nope", "trackingNumber": "TRK1", "occurredAt": "2026-09-30T14:05:00Z"}'
{"message":"Order nope not found.","error":"Not Found","statusCode":404}
```

Place a second order (it gets id `58b424f5` here) and cancel it while it waits for the carrier:

```bash
$ curl -X POST http://localhost:3000/orders/58b424f5/cancel -H "Content-Type: application/json" \
    -d '{"reason": "Customer ordered the wrong size."}'
{"accepted":true}

$ curl http://localhost:3000/orders/58b424f5/fulfilment
{"status":"cancelled","stage":"awaiting-delivery","waitingFor":[],"wakeAt":null,"steps":{"charge-payment":"completed","reserve-stock":"completed","await-delivery":"cancelled","$compensate:reserve-stock":"completed","$compensate:charge-payment":"completed"},"error":"Customer ordered the wrong size."}
```

The journal shows both compensations: the stock was released first, then the charge was refunded. The wait never finished, so it's marked `cancelled`, and the stage stays where the workflow last set it.

The instances are rows in your database, in the store's schema, next to the orders:

```bash
$ psql "$DATABASE_URL" -c "SELECT o.id, o.status, w.status AS fulfilment, w.runs FROM orders o JOIN nest_workflows.instances w ON w.id = 'order-' || o.id ORDER BY w.created_at"
    id    |  status   | fulfilment | runs
----------+-----------+------------+------
 f7e1e1eb | delivered | suspended  |    2
 58b424f5 | cancelled | cancelled  |    2
(2 rows)
```

Finally, restart the application and ask for the first order again. Its status hasn't changed, and the store found nothing to migrate. Start a second process on another port against the same database, and the two share the work: each instance runs on one of them at a time. To see the 3-day timeout without waiting 3 days, use a test clock, as the tests below do.

##### Test with a manual clock

Two things make workflow tests fast and deterministic:

- Every timestamp the engine uses (deadlines, retry times, lease expiry and `ctx.now()`) comes from the module's `clock`. A `ManualWorkflowClock` only moves when you call `advance()`.
- With the worker disabled, nothing runs in the background. `WorkflowWorker.drain()` runs every due instance until none is left that can start, and starts the occurrences of schedules that the clock has passed. The clock starts on 1 January 2026 at 00:00 UTC, so a test that moves it by days also starts the invoice batch's first occurrence, at 07:00 UTC.

Run the tests on PGlite, with your real migrations. Override the database `DrizzleModule` registers (`getDrizzleToken()` returns its token) with one on PGlite: the workflow store follows, because its factory injects it, and creates its schema there when the application starts. Override `WORKFLOWS_MODULE_OPTIONS` with a `ManualWorkflowClock` and a disabled worker. Share the database and the stand-ins for the external APIs between applications, because they outlive a process:

```typescript
@@filename(test/support)
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { Test } from '@nestjs/testing';
import { ManualWorkflowClock, WORKFLOWS_MODULE_OPTIONS, WorkflowClient, WorkflowWorker } from '@nestjs/workflows';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
// ...AppModule, getDrizzleToken, the schema and the stand-in services

/**
 * PostgreSQL in-process (PGlite), with the app's migrations applied: the orders
 * table. The workflow store creates its own tables when the application starts.
 */
export async function createDatabase() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
  return { db, close: () => client.close() };
}

/** Your database and the external APIs. They outlive a process, so every "process" in a test shares them. */
export async function createWorld() {
  const database = await createDatabase();
  return {
    db: database.db,
    paymentProvider: new PaymentProviderClient(),
    inventory: new InventoryService(),
    mail: new MailService(),
    invoices: new InvoicesService(database.db as unknown as Database),
    close: database.close,
  };
}

export type World = Awaited<ReturnType<typeof createWorld>>;

export async function bootApp(clock: ManualWorkflowClock, world: World) {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(getDrizzleToken())
    .useValue(world.db)
    .overrideProvider(WORKFLOWS_MODULE_OPTIONS)
    .useValue({ clock, worker: { enabled: false, shutdownTimeout: 50 } })
    .overrideProvider(PaymentProviderClient)
    .useValue(world.paymentProvider)
    .overrideProvider(InventoryService)
    .useValue(world.inventory)
    .overrideProvider(MailService)
    .useValue(world.mail)
    .overrideProvider(InvoicesService)
    .useValue(world.invoices)
    .compile();
  const app = moduleRef.createNestApplication({ logger: false });
  await app.listen(0, '127.0.0.1');
  return {
    app,
    url: await app.getUrl(),
    orders: app.get(OrdersService),
    workflows: app.get(WorkflowClient),
    worker: app.get(WorkflowWorker),
    close: () => app.close(),
  };
}

export type App = Awaited<ReturnType<typeof bootApp>>;
```

With a manual clock, the 3-day timeout is one `advance()` call:

```typescript
@@filename(test/order-fulfilment.spec)
describe('order fulfilment', () => {
  let clock: ManualWorkflowClock;
  let world: World;
  let node: App;

  beforeEach(async () => {
    clock = new ManualWorkflowClock();
    world = await createWorld();
    node = await bootApp(clock, world);
  });

  afterEach(async () => {
    await node.close();
    await world.close();
  });

  // ...

  it('refunds and releases the stock when the carrier never confirms delivery', async () => {
    const order = await node.orders.place({ userId: 'u_42', items: [{ productId: KIBBLE, quantity: 1, price: 2499 }] });
    await node.worker.drain(); // charge, reserve, then park for up to 3 days

    clock.advance('3d');
    await node.worker.drain(); // the wait times out and the compensations run

    const fulfilment = await node.workflows.getStatus(fulfilmentId(order.id), { journal: true });
    expect(fulfilment).toMatchObject({
      status: 'failed',
      error: { message: `Order ${order.id} was not delivered within 3 days.` },
    });
    // Compensations run in reverse: release the stock, then refund.
    expect(fulfilment!.journal.filter((entry) => entry.kind === 'compensation').map((entry) => entry.name)).toEqual([
      '$compensate:reserve-stock',
      '$compensate:charge-payment',
    ]);
    expect(world.paymentProvider.refunds).toHaveLength(1);
    expect(world.inventory.stock.get(KIBBLE)).toBe(25);
  });

  // ...

  it('saves the order and starts its fulfilment together, or neither', async () => {
    // The transaction fails after start(): say, the next statement hits a constraint.
    const original = node.workflows.start.bind(node.workflows);
    vi.spyOn(node.workflows, 'start').mockImplementationOnce(async (...args) => {
      await original(...args); // the instance is created in the transaction...
      throw new Error('insert or update on table "order_lines" violates foreign key constraint');
    });
    await expect(place()).rejects.toThrow('violates foreign key constraint');

    // ...and rolled back with it: no order, no fulfilment for the worker to charge.
    expect(await world.db.select().from(orders)).toEqual([]);
    expect(await node.workflows.list()).toEqual([]);
    expect(await node.worker.drain()).toBe(0);
    expect(world.paymentProvider.requests).toBe(0);
  });
});
```

##### Test crash recovery

`createWorld()` creates a fresh database per test. Crash safety needs two applications on the same database. Closing an application while a step hangs simulates a crash: the shutdown timeout expires, and the dead process's lease stays in the database until it expires. The second application takes over after that:

```typescript
@@filename(test/crash-recovery.spec)
it('survives a crash in the middle of an order', async () => {
  const first = await bootApp(clock, world);
  const order = await first.orders.place({ userId: 'u_42', items: [{ productId: KIBBLE, quantity: 1, price: 2499 }] });

  // The process dies while reserving stock, after the payment provider charged the card.
  const reserve = vi.spyOn(world.inventory, 'reserve').mockImplementationOnce(() => new Promise<never>(() => {}));
  void first.worker.drain();
  await vi.waitFor(() => expect(reserve).toHaveBeenCalled());
  await first.close();

  // Another process on the same database takes over once the dead one's lease expires.
  const second = await bootApp(clock, world);
  clock.advance('31s');
  await second.worker.drain();

  expect(await second.workflows.getStatus(fulfilmentId(order.id))).toMatchObject({
    status: 'suspended',
    waits: [
      { signal: 'shipment.delivered', key: order.id },
      { signal: 'shipment.returned', key: order.id },
    ],
  });
  expect(world.paymentProvider.charges).toHaveLength(1); // journaled: not charged again
  expect(reserve.mock.calls.map(([, key]) => key)).toEqual([
    `order-${order.id}:reserve-stock`, // the attempt that died
    `order-${order.id}:reserve-stock`, // the retry, with the same key
  ]);
  await second.close();
});
```

The same setup covers a crash in the middle of the compensations: the next process replays the journal to rebuild the list of compensations, skips the ones already done, and continues with the rest. PGlite is a single connection, so it can't show two workers racing for the same instance; the tutorial's tests of the store run the contract's races on a PostgreSQL server, along with three applications sharing 30 orders.

To give a test its own store without overriding providers, call `registerSource()` on `moduleRef.get(WorkflowStorage)` before `init()`, with `replace: true`: without it, a second registration throws. The `clock` option takes any `WorkflowClock`, an object whose `now()` returns epoch milliseconds, so a test can drive the engine from a clock it already has.

#### With CQRS

If your application follows the [CQRS recipe](/recipes/cqrs), command handlers publish events, and event handlers and sagas react to them. They react in memory: an event published just before the process stops never reaches them, and a saga that waits for a second event forgets the first one on a restart. The `@nestjs/workflows/cqrs` entry point lets the events themselves start and signal workflows, durably, while your code keeps executing commands and publishing events. It works with `@nestjs/cqrs` 11 and later, registered with `CqrsModule.forRoot()` as in the recipe.

##### Map events to workflows

Here the fulfilment starts when the order is placed and wakes when the carrier reports the delivery, as before, but the workflow client calls are gone from the application code. Import `WorkflowsCqrsModule` next to `CqrsModule` and `WorkflowsModule`:

```typescript
@@filename(app.module)
import { CqrsModule } from '@nestjs/cqrs';
import { WorkflowsModule, WorkflowStorage } from '@nestjs/workflows';
import { WorkflowsCqrsModule } from '@nestjs/workflows/cqrs';

@Module({
  imports: [
    // ...DrizzleModule, as before
    CqrsModule.forRoot(),
    WorkflowsModule.forRoot(),
    WorkflowsCqrsModule, // mapped events start and signal workflows
  ],
  controllers: [OrdersController, CarrierWebhookController],
  providers: [
    // ...the store and the services, as before
    PlaceOrderHandler,
    MarkDeliveredHandler,
    ChargePaymentHandler,
    OrderFulfilmentWorkflow,
  ],
})
export class AppModule {}
```

Then map the events on the workflow class. `@StartOn()` starts the workflow when an event is published, and `@SignalOn()` sends one of its signals:

```typescript
@@filename(orders/order-fulfilment.workflow)
import { SignalOn, StartOn } from '@nestjs/workflows/cqrs';
import { OrderDeliveredEvent } from './order-delivered.event.js';
import { OrderPlacedEvent } from './order-placed.event.js';

@Workflow('order-fulfilment')
@StartOn(OrderPlacedEvent, {
  id: (event) => fulfilmentId(event.order.id),
  input: (event) => event.order,
  // Lower runs first: express orders before standard ones.
  priority: (event) => (event.order.shipping === 'express' ? 1 : 2),
})
@SignalOn(OrderDeliveredEvent, {
  signal: shipmentDelivered,
  key: (event) => event.delivery.reference,
  id: (event) => event.delivery.trackingNumber,
  payload: (event) => event.delivery,
})
export class OrderFulfilmentWorkflow implements WorkflowRunner<Order, FulfilmentResult> {
  // ...the constructor, which now injects CommandBus too, and run()
}
```

`@StartOn()`'s `id` is required. It derives the instance id from the business key, as `start()` does, so an event published twice finds the instance the first one started. It also takes `start()`'s `priority`, `concurrencyKey` and `rateLimitKey`, each as a value or a function of the event: here, express orders go first, as before. `@SignalOn()`'s `id` is optional, and becomes the signal's `id`: a delivery event published again, say for the carrier's retried webhook, stores no second signal. `input` defaults to the event itself, and a signal's `payload` too. TypeScript checks the input against `run()` and the payload against the signal's type. The events are plain classes, such as `OrderPlacedEvent` with a `readonly order: Order` constructor parameter.

The command handler saves the order and publishes the event in one transaction:

```typescript
@@filename(orders/place-order.handler)
import { randomUUID } from 'node:crypto';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { Database } from '../database/drizzle.js';
import { orders } from '../database/schema.js';
import type { Order } from './order.js';
import { OrderPlacedEvent } from './order-placed.event.js';
import { PlaceOrderCommand } from './place-order.command.js';

@CommandHandler(PlaceOrderCommand)
export class PlaceOrderHandler implements ICommandHandler<PlaceOrderCommand> {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ dto }: PlaceOrderCommand): Promise<Order> {
    const total = dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order: Order = {
      id: randomUUID().slice(0, 8),
      userId: dto.userId,
      items: dto.items,
      shipping: dto.shipping ?? 'standard',
      total,
      status: 'placed',
    };

    return this.db.transaction(async (tx) => {
      await tx.insert(orders).values(order);
      // The transaction rides along as the dispatcher context: the fulfilment
      // this event starts commits with the order, or rolls back with it.
      await this.eventBus.publish(new OrderPlacedEvent(order), { transaction: tx });
      return order;
    });
  }
}
```

The second argument of `publish()` and `publishAll()` is CQRS's dispatcher context. `WorkflowsCqrsModule` reads its `transaction` property and passes it to `start()` and `signal()`, so the instance is created through your transaction, exactly as with the `transaction` option. With TypeORM, the dispatcher context carries the `EntityManager` that `dataSource.transaction()` hands its callback, under the same `transaction` property. `publish()` resolves once the workflows are started and signalled, and only then does the event reach your event handlers and sagas. Events that no workflow maps go straight through, unchanged. The controllers execute the commands: `POST /orders` executes `PlaceOrderCommand`, and the carrier's webhook executes `MarkDeliveredCommand`, whose `MarkDeliveredHandler` does the same for the delivery: it updates the order's status and publishes `OrderDeliveredEvent` in one transaction, so the status and the signal commit together.

The module wraps whatever publisher the event bus has, so a publisher you set with `CqrsModule.forRoot()`'s `eventPublisher` option (a message broker, for example) still receives every event, after the workflows. Replacing `EventBus.publisher` after startup would bypass the workflows, so startup fails if something does. It also fails when a workflow maps events but `WorkflowsCqrsModule` isn't imported, when one class maps the same event twice, or when `@StartOn()` gives a key to a workflow without a limit per key. When two versions of a workflow are registered, the highest version's `@StartOn()` decides what starts, and a signal reaches the waiting instances of every version, sent once, so their `@SignalOn()` declarations must agree on its payload and `id`: `publish()` rejects when they don't.

The mappings live on the workflow classes, so every process that publishes mapped events registers them, including one that runs no workflows, such as an API that only places orders. Register the classes and the store there as usual, and pass `worker: false` to `WorkflowsModule.forRoot()`: the process starts and signals the workflows, and the worker processes execute them. A process that imports `WorkflowsCqrsModule` but registers no workflow that maps an event starts and signals nothing, and logs a warning at startup saying so.

##### Execute commands from steps

A step can execute commands. Pass the step's idempotency key along with the command, and have the handler hand it to the system it calls:

```typescript
@@filename(orders/order-fulfilment.workflow)
const charge = await ctx.step(
  'charge-payment',
  ({ idempotencyKey }) => this.commandBus.execute(new ChargePaymentCommand(order, idempotencyKey)),
  {
    retry: { attempts: 5, backoff: { delay: '2s' } },
    compensate: (charge, { idempotencyKey }) => this.paymentsService.refund(charge.chargeId, idempotencyKey),
  },
);
```

`ChargePaymentHandler` calls `PaymentsService.charge()` with the key, so a retried step never charges twice, and the command's result is journaled like any step's. A step can publish events and send signals too. It runs at least once, so an event published from a step may be published again. A mapped start finds its instance, and so does a `start()` without an `id` in a step: it gets an id derived from the step's `idempotencyKey`, the workflow's name and its place among the step's starts of that workflow, and a repeat returns the instance as first started, input included. A signal sent from inside a step, directly or through a mapped event, is stored once: without an `id` of its own, it gets one derived from the step's `idempotencyKey` and its place among the step's signals with the same name and key. Send those in a fixed order. A step that sends several with one name and key concurrently should give each its own `id`.

##### What each way of publishing guarantees

The guarantee depends on how, and when, the event is published:

| How the event is published | The workflow's start or signal | If the process dies or a write fails |
| --- | --- | --- |
| In your transaction, with the transaction in the dispatcher context | Commits with your writes, or not at all | Nothing is half done. A failed start or signal rejects `publish()`, and your transaction rolls back |
| An aggregate's events, from `commit()` with the transaction in the dispatcher context (`@nestjs/cqrs` 12.1 or later), or with `publishAll()` in your transaction, as shown below | Commits with your writes, or not at all | As above: a failed start or signal rejects `commit()` or `publishAll()`, and your transaction rolls back |
| After your transaction commits | Written before `publish()` resolves | A crash between your commit and the publish loses it. Publish again from a reconciliation job: the start's `id` makes that safe, and so does a signal's, if `@SignalOn()` sets one |
| From `commit()` without a transaction, of an aggregate merged with `EventPublisher` | Written outside your transaction, in the background unless you await `commit()` (12.1 or later) | Lost on a crash while nothing waits for it, and left behind when your transaction rolls back. Failures go to the `UnhandledExceptionBus` and the log, and the module logs a warning once per event class |
| From `commit()` without a transaction, of a `@Publishable()` aggregate | Written outside your transaction, in the background unless you await `commit()` (12.1 or later) | Lost on a crash while nothing waits for it, and left behind when your transaction rolls back. Unawaited, a failure is an unhandled promise rejection, which stops Node.js by default. Nothing tells it apart from a plain `publish()`, so there's no warning |
| From a workflow step | Once, however often the step runs | A retried step starts nothing new, and stores no second signal |

An aggregate merged with `EventPublisher.mergeObjectContext()` or `mergeClassContext()`, or decorated with `@Publishable()`, publishes its events from `commit()`. With `@nestjs/cqrs` 12.1 or later, `commit()` takes a dispatcher context, as `publish()` does, and returns what the event bus returns. Pass it your transaction and await it in the command handler's transaction: the aggregate's events then start and signal workflows in that transaction, and `commit()` rejects when a start or signal fails, which rolls the transaction back:

```typescript
await order.commit({ transaction: tx });
```

`commit()` clears the aggregate's events when it hands them over, before the workflows are written, so after a failure, run the command again with a freshly loaded aggregate.

Without a dispatcher context, `commit()` publishes outside your transaction: the workflows still start, but a rollback leaves them behind, and a crash before they're written loses them. Don't let it publish events that start or signal workflows. With `@nestjs/cqrs` 12.0 or earlier, `commit()` takes no context and returns nothing to wait for, so publish the aggregate's events yourself, in the command handler's transaction, and then clear them:

```typescript
await this.eventBus.publishAll(order.getUncommittedEvents(), { transaction: tx });
order.uncommit();
```

The module tells you when a mapped event arrives from a merged aggregate's `commit()` without a transaction: the first time, it logs a warning naming the event class. A `@Publishable()` aggregate's events arrive without any dispatcher context, like an ordinary `publish()` call, so they get no warning.

Your event handlers and sagas still receive every event, in memory, after the workflows. Inside a transaction they run before it commits, as they always did, so they can react to an event whose transaction then rolls back. A saga that turns one event into one command can stay a saga. A saga that remembers events, such as one that waits for the payment after the order and gives up after an hour, is a workflow in disguise: start the workflow from the first event, map the others to signals, and let `waitForSignal()` with a `timeout` do the waiting, durably.

#### Prepare for production

##### Keep journals short

Every execution loads the instance's whole journal and replays `run()` from the top. A process with a fixed number of steps keeps its journal small, but a loop with a step or a sleep per round adds entries for as long as it runs, and each execution gets slower. The module warns when a journal reaches 1,000 entries or 1 MB: once per instance, when it crosses the line, in the log and as a `journal-large` event. Once it holds 10,000 entries or 10 MB, the instance fails before it records another one: its compensations run, which may still record theirs, and it ends as `failed` with a `WorkflowJournalLimitError`. The module's `journal` option moves both lines. Size them to your longest regular workflow with room to spare, and set a limit to `Infinity` to turn it off:

```typescript
WorkflowsModule.forRoot({
  journal: { warnEntries: 500, maxEntries: 5_000 },
});
```

A process that goes on for good, such as a monthly litter subscription, continues in a new instance instead. After a year of deliveries, its last step starts the next year's instance, and the current one completes:

```typescript
async run(ctx: WorkflowContext, subscription: Subscription) {
  for (let month = 1; month <= 12; month++) {
    await ctx.step(`ship-${month}`, ({ idempotencyKey }) => this.subscriptionsService.ship(subscription, idempotencyKey));
    await ctx.sleep(`wait-${month}`, '30d');
  }

  const next = { ...subscription, year: subscription.year + 1 };
  return ctx.step('continue', async () => {
    const { id } = await this.workflowClient.start(LitterSubscriptionWorkflow, next, {
      id: `subscription-${subscription.id}-${next.year}`,
    });
    return id;
  });
}
```

The step starts the next instance once: a retried step finds the instance it started. The new instance has a fresh journal and its own id, so the finished year stays readable until retention purges it. Continuing under the same id would need every store to replace a journal in place, under the worker's lease; a new id needs nothing new from the store. When each round stands on its own, a schedule is simpler still: it starts an instance per occurrence, each with a journal of its own, as [Run workflows on a schedule](/reliability/workflows#run-workflows-on-a-schedule) shows.

##### Encrypt what workflows store

The store keeps what your workflows handle: orders, charges, deliveries. To keep that unreadable to whoever reads the database or its backups, give the module a **payload codec**. `AesGcmPayloadCodec` encrypts with AES-256-GCM, under keys from your secret manager. Create it in the module's factory, which runs at startup:

```typescript
@@filename(app.module)
import { AesGcmPayloadCodec, WorkflowsModule, WorkflowStorage } from '@nestjs/workflows';

WorkflowsModule.forRootAsync({
  useFactory: () => ({
    worker: {
      // ...as before
    },
    // Encrypts what the store keeps. The key comes from your secret manager, through the environment.
    codec: new AesGcmPayloadCodec({
      keys: { '2026-09': process.env.WORKFLOWS_KEY_2026_09! },
      current: '2026-09',
    }),
  }),
}),
```

A key is 32 random bytes in base64 (`openssl rand -base64 32`), under an id of your choice. A key that is missing (an unset environment variable), isn't base64 or isn't 32 bytes fails the startup, with an error that names it.

- **What it encrypts**: everything that holds your data. Inputs and outputs, step results and checkpoints, signal payloads, custom statuses, cancel reasons, schedules' inputs, and the messages and stacks of errors. Each payload is encrypted under a key derived for it, with where it's stored as authenticated data, so a payload that was changed, or moved to another instance or field, fails to decrypt instead of being read. Payloads of 1 KiB or more are compressed first. If payloads mix secrets with data an attacker chooses, and attackers can see stored sizes, turn that off with `compress: false`.
- **What stays readable**, because the store matches, filters, orders or counts on it: ids, workflow names and versions, statuses, signal names and keys, concurrency and rate-limit keys, priorities, links to parents and schedules, journal entry names, and all times. Errors keep their names, such as `StepFailedError`. So pick ids and keys that say nothing sensitive: `order-71e1973d`, not an email address. Here the concurrency key is the customer's id, readable in `concurrency_key`.
- **Stored form**: `$wf1:aes-256-gcm:2026-09.` followed by the ciphertext, a string in the same JSON columns, so the store needs no change.

**Rotating keys.** Add a key, and make it `current`. A payload decrypts with the key that encrypted it, and everything written from then on uses the current one. Nothing is re-encrypted in bulk: payloads are rewritten as instances progress, and old ones go with purges. So keep a key listed while anything it encrypted may still be read: unfinished instances, signals not purged yet, and schedules saved under it. A declared schedule's input is saved again under the current key at startup and every minute, but an upserted one's only by its next `upsert()`: `pause()` and `resume()` keep it as stored.

```typescript
codec: new AesGcmPayloadCodec({
  keys: {
    '2027-03': process.env.WORKFLOWS_KEY_2027_03!,
    '2026-09': process.env.WORKFLOWS_KEY_2026_09!,
  },
  current: '2027-03',
}),
```

An instance whose payloads need a key that isn't listed can't be read: `getStatus()` throws an error that names the key, `list()` shows the instance without its payloads, and workers leave it alone until the key is back, then run it.

Adding a codec breaks no running instance: payloads stored before it are read as they are, and new writes are encrypted. That is also where the protection ends. Someone who can write to the database can replace an encrypted payload with a plain one, and have it read: the codec protects what it encoded against reading and tampering, not the database against its writers.

A codec of your own implements `WorkflowPayloadCodec`: an `id`, stored with each payload, and `encode()` and `decode()`, which receive the value and where it's stored. Pass its class to `codec` to have Nest create it, with its dependencies from global modules, such as a KMS client. To replace a codec, list the new one first and the old one after it: the first one encodes, and each payload is decoded by the codec whose id it carries.

##### Production checklist

- Pass the `idempotencyKey` to every side effect, including compensations. Steps run at least once.
- Give signals an `id` when their sender can run twice, such as a webhook the sender retries or a message consumer. Signals sent from a step get one automatically.
- Call `enableShutdownHooks()`, and keep `shutdownTimeout` below your platform's grace period (30 seconds by default on Kubernetes).
- Choose `leaseDuration` deliberately. It's how long a crashed process's instances wait before another process takes over, and a process whose event loop stalls for longer loses its instances. Lease expiry compares timestamps written by different hosts, so keep their clocks in sync (NTP) and `leaseDuration` well above any skew between them.
- Register a store on your database: `PostgresWorkflowStore`, `MySqlWorkflowStore`, or one of your own. In memory, or in a file on the container's disk, state dies with the instance: the in-memory default loses every running order on restart, and startup refuses it in production. Run the contract suite against a store of your own in CI, on its database, with `concurrent: true`.
- Apply the store's migrations before a new version starts, with `npx nest-workflows migrate` or your migration tool, and check them in CI with `npx nest-workflows status`. With `NODE_ENV=production`, the store doesn't migrate at startup: a schema that's behind fails it instead.
- Run as many workers as you like, on as many hosts. Size the connection pool for them: each running instance renews its lease and writes its journal through the pool, and each poll holds a connection for its claim.
- Start workflows in the transaction that writes their business rows (`transaction: tx`, or the `EntityManager` with TypeORM), so a crash between the two can't leave an order that nothing fulfils. Pass the transaction, never the root database. With CQRS, publish the events inside that transaction, with the transaction in the dispatcher context.
- Keep transactions that send signals short: signals and the suspensions that register waits queue behind them. On PostgreSQL, keep them READ COMMITTED, and the database's default isolation too: the store refuses a stricter one. On MySQL, keep them REPEATABLE READ or READ COMMITTED, and run a transaction again when it fails with a deadlock (error 1213).
- Verify webhook signatures, and return `2xx` only after the transaction with the signal has committed.
- Alert on instances that need a person. `compensation_failed` means an undo gave up halfway, and a `failed` instance with `WorkflowNonDeterminismError` means a deploy broke replay. `WorkflowClient.list()` finds them, and [What each status means](/reliability/workflows#what-each-status-means) says what to do with each: `retry()` once the cause is fixed, or `delete()`. For logs and metrics, subscribe to `WorkflowEvents.events$`, or to the `nestjs:workflows:*` diagnostics channels that tracing tools read without Nest; [Events](/reliability/workflows#events) maps them onto a trace.
- Mark your point of no return with `ctx.commit()`. Before it, every failure and cancel undoes the completed steps.
- Purge finished instances every night with `purge()`, on one instance of the application, as [Purge finished instances](/reliability/workflows#purge-finished-instances) shows. Keep its `olderThan` longer than any sender's redelivery window: a signal's `id` deduplicates only as long as the signal is stored.
- Keep journals short: bound loops, and continue one that never ends in a new instance ([Keep journals short](/reliability/workflows#keep-journals-short)). Give a process that must give up at some point a run timeout ([Time out the whole workflow](/reliability/workflows#time-out-the-whole-workflow)).
- Size concurrency and rate limits to what the steps call, and deploy a change to them to every process: each applies the limits of the code it runs. Once some instances have a priority, give the rest one too, since instances without one go first.
- Deploy a declared schedule to every process that registers its workflow: only workers whose code declares it start its occurrences. A schedule that a deploy drops, or whose workflow it removes, keeps starting on the processes of the old code, and goes about five minutes after the last of them stopped. Set `missed` for work that mustn't be skipped when no worker is up at its time. If processes of other code share the database, don't leave a schedule without a worker whose code declares it for five minutes: they delete it, and it starts over once one starts.
- Encrypt what the store keeps with a codec, with keys from your secret manager ([Encrypt what workflows store](/reliability/workflows#encrypt-what-workflows-store)). Keep an old key listed while anything it encrypted may be read, and pick ids and keys that say nothing sensitive: they stay readable.

#### Reference

##### Module options

`WorkflowsModule.forRoot()` takes these options; `forRootAsync()` takes them from `useFactory`, `useClass` or `useExisting` (a class implementing `WorkflowsOptionsFactory`). The options token is `WORKFLOWS_MODULE_OPTIONS`. The store isn't an option: register it with `WorkflowStorage`, as in [Keep workflows in your database](/reliability/workflows#keep-workflows-in-your-database).

| Option | Default | Meaning |
| --- | --- | --- |
| `worker.enabled` | `true` | Run the polling loop. `worker: false` is shorthand for `enabled: false`: the process starts, signals and inspects workflows, and `WorkflowWorker.drain()` runs due instances on demand |
| `worker.id` | `hostname:pid:random` | The worker's name, shown as the instance's `leaseOwner` |
| `worker.concurrency` | `10` | Instances this process executes at once |
| `worker.pollInterval` | `'1s'` | How often to look for due instances. A local `start()` or `signal()` wakes the loop at once |
| `worker.leaseDuration` | `'30s'` | How long a claim is valid without a renewal, so how long a crashed process keeps its instances |
| `worker.heartbeatInterval` | A third of `leaseDuration` | How often a running instance renews its lease |
| `worker.shutdownTimeout` | `'10s'` | How long shutdown waits for running executions before handing them back |
| `retry` | 3 attempts, `'1s'` doubling up to `'5m'`, no jitter | The default for every step. See the retry fields below |
| `journal.warnEntries`, `journal.warnBytes` | `1000`, `1000000` | At either, log a warning and emit `journal-large`, once per instance ([Keep journals short](/reliability/workflows#keep-journals-short)) |
| `journal.maxEntries`, `journal.maxBytes` | `10000`, `10000000` | At either, fail the instance with a `WorkflowJournalLimitError` before it records another entry. `Infinity` turns a check off |
| `clock` | The system clock | A `WorkflowClock`. Tests pass a `ManualWorkflowClock` ([Test with a manual clock](/reliability/workflows#test-with-a-manual-clock)) |
| `allowInMemoryStorage` | `false` | With `NODE_ENV=production` and no registered store, startup fails; `true` runs on the in-memory store anyway |
| `codec` | None | A `WorkflowPayloadCodec`, its class, or a list of them: the first encodes, and each decodes the payloads it encoded ([Encrypt what workflows store](/reliability/workflows#encrypt-what-workflows-store)) |
| `isGlobal` | `true` | Registers the module globally. Top level of `forRoot()` and `forRootAsync()` |

A `retry` option (the module's, a step's `retry` or its `compensateRetry`) is a number of attempts, `false` for a single attempt, or an object with these fields. A step's `retry` merges over the module's field by field.

| Field | Default | Meaning |
| --- | --- | --- |
| `attempts` | `3` | Total attempts, including the first |
| `backoff.delay` | `'1s'` | The wait before the first retry |
| `backoff.factor` | `2` | Growth per retry; `1` keeps the wait constant |
| `backoff.maxDelay` | `'5m'` | The cap for a single wait |
| `backoff.jitter` | `'none'` | `'full'` (zero to the wait), `'equal'` (half to all of it) or `'none'` |
| `retryIf` | Every error | `(error, attempt) => boolean`: `false` fails the step at once |

`backoff` can also be a function, `(attempt, error) => duration`. A `NonRetryableStepError` never retries.

##### PostgreSQL store

`new PostgresWorkflowStore(options, workflowStorage)`, from `@nestjs/workflows/postgres`, takes these options:

| Option | Default | Meaning |
| --- | --- | --- |
| `executor` | Required | How the store reaches the database: `fromDrizzle(db)`, `fromTypeOrm(dataSource)`, `fromPg(pool)`, `fromPrisma(prisma, options)` or `fromKysely(db)` |
| `schema` | `'nest_workflows'` | The schema of its tables, which its first migration creates. Letters, digits and underscores, not starting with a digit, at most 63 characters |
| `migrate` | `true`, except with `NODE_ENV=production` | Apply the pending migrations when the application starts. With `false`, startup fails with a `WorkflowSchemaError` while the schema is behind |

Each executor takes your database client, and its own kind of transaction object, which `start()` and `signal()` then take as `transaction`:

| Executor | Takes | Transaction object |
| --- | --- | --- |
| `fromDrizzle(db)` | A Drizzle PostgreSQL database, whichever its driver | The `tx` that `db.transaction()` hands its callback |
| `fromTypeOrm(dataSource)` | A `DataSource` of type `postgres`, or its `manager` | The `EntityManager` that `dataSource.transaction()` hands its callback, or a `QueryRunner` after `startTransaction()` |
| `fromPg(pool)` | A node-postgres `Pool`, or a connected `Client` | A client, such as one from `pool.connect()`, after `BEGIN` |
| `fromPrisma(prisma, options)` | A Prisma client on PostgreSQL, through a driver adapter such as `@prisma/adapter-pg` or Prisma's engine. `maxWait` (default `'10s'`) and `timeout` (default `'1m'`) limit the store's own transactions | The transaction client that `prisma.$transaction()` hands its callback |
| `fromKysely(db)` | A `Kysely` instance with a PostgreSQL dialect. The store's statements skip its plugins | The transaction that `db.transaction().execute()` hands its callback, or a controlled transaction |

The store's `migrate()` method applies the pending migrations at once, whatever the `migrate` option says, and resolves with the versions it applied. `PostgresWorkflowStore.migrationSql()` returns their SQL, with the bookkeeping. Its options are the `schema`, the versions to go `from` (default `0`, a new database) and `to` (default: the one the package needs), and `statementBreakpoints`, which separates the statements with drizzle-kit's `--> statement-breakpoint` lines. From version 0, it starts with `CREATE SCHEMA IF NOT EXISTS`, which needs the CREATE privilege on the database: leave it out if someone created the schema for you. `PostgresWorkflowStore.schemaVersion` is the version the package needs. A schema's own version is the highest in its `migrations` table.

##### MySQL store

`new MySqlWorkflowStore(options, workflowStorage)`, from `@nestjs/workflows/mysql`, runs on MySQL 8.4 LTS and 9.x, and takes these options:

| Option | Default | Meaning |
| --- | --- | --- |
| `executor` | Required | How the store reaches the database: `fromDrizzle(db)`, `fromTypeOrm(dataSource)`, `fromMysql2(pool)`, `fromPrisma(prisma, options)` or `fromKysely(db)`, from `@nestjs/workflows/mysql` |
| `schema` | `'nest_workflows'` | The start of its tables' names (`nest_workflows_instances`...), in the connection's database. Lowercase letters, digits and underscores, not starting with a digit, at most 40 characters |
| `migrate` | `true`, except with `NODE_ENV=production` | Apply the pending migrations when the application starts, one statement at a time. With `false`, startup fails with a `WorkflowSchemaError` while the tables are behind |

| Executor | Takes | Transaction object |
| --- | --- | --- |
| `fromDrizzle(db)` | A Drizzle MySQL database (`drizzle-orm/mysql2`) | The `tx` that `db.transaction()` hands its callback |
| `fromTypeOrm(dataSource)` | A `DataSource` of type `mysql`, or its `manager` | The `EntityManager` that `dataSource.transaction()` hands its callback, or a `QueryRunner` after `startTransaction()` |
| `fromMysql2(pool)` | A mysql2 pool, or a connection | A connection, such as one from `pool.getConnection()`, after `beginTransaction()` |
| `fromPrisma(prisma, options)` | A Prisma client on MySQL, through `@prisma/adapter-mariadb`. `maxWait` (default `'10s'`) and `timeout` (default `'1m'`) limit the store's own transactions, `migrate()` included: raise `timeout` for it, or migrate from the command line | The transaction client that `prisma.$transaction()` hands its callback |
| `fromKysely(db)` | A `Kysely` instance with a `MysqlDialect`. The store's statements skip its plugins | The transaction that `db.transaction().execute()` hands its callback, or a controlled transaction |

At startup, the store checks the server and the connection: MySQL, not MariaDB; a strict `sql_mode` (`STRICT_TRANS_TABLES`, MySQL's default), without which MySQL would cut a value too long for its column; and a database, where its tables go. It counts the rows an update matched, so keep mysql2's `FOUND_ROWS` flag, which is on by default (Prisma's adapter calls it `foundRows`), and leave the `NO_BACKSLASH_ESCAPES` SQL mode off.

Its ids, names and keys are indexed columns of bounded length, in characters:

| Key | At most |
| --- | --- |
| An instance id, including a child's (by default `<parent id>/<workflow>#<n>`) and that of an instance a schedule starts (`<schedule id>@<time>`) | 255 |
| A schedule id | 230 |
| A workflow's name, a signal's name, `key` and `id`, a concurrency key, a rate-limit key | 255 |
| A journal entry's name: a step's, a sleep's or a wait's, and those the engine adds, such as `$compensate:<step>` and `$child:<child id>` | 512 |

A longer one fails with a `RangeError` that names it, before any SQL. `migrate()` and `MySqlWorkflowStore.schemaVersion` are the PostgreSQL store's. `MySqlWorkflowStore.migrationSql()` takes the same options and returns the statements to apply in order, each once, and `MySqlWorkflowStore.migrationStatements()` takes the `schema`, `from` and `to` and returns them one per string, for a tool that runs one statement per call. A schema's own version is the highest one applied in its `<schema>_migrations` table.

##### Command line

`npx nest-workflows` applies either store's migrations from a deploy step or checks them in CI. It takes `--url` (default `DATABASE_URL`) and `--schema` (default `nest_workflows`). The URL picks the store: `postgres://` or `postgresql://` for PostgreSQL, which needs `pg` installed, and `mysql://` for MySQL, which needs `mysql2`.

| Command | What it does |
| --- | --- |
| `migrate` | Applies the pending migrations, as `migrate: true` does at startup |
| `status` | Prints the schema's version and the one the package needs, and exits with 1 while the schema is behind |
| `sql` | Prints the SQL of `migrationSql()`, from `--from` to `--to`, without a database: PostgreSQL's, or MySQL's with `--dialect mysql`. `--statement-breakpoints` separates the statements for drizzle-kit |

##### The store contract

`PostgresWorkflowStore` and `MySqlWorkflowStore` implement the `WorkflowStore` interface. For another database, implement it in a provider of your own. The JSDoc of each method on `WorkflowStore` says what the method must do, and which race each rule prevents.

**Registration.** The store is an ordinary singleton provider that calls `registerSource(this)` on the injectable `WorkflowStorage` in its constructor. The registry checks the shape at once, refuses a second registration unless it passes `replace: true`, and locks when `WorkflowsModule` initializes, logging the store in use. A request-scoped provider, a provider in a lazy-loaded module, or a lifecycle hook registers too late, and throws. With nothing registered, the module uses `InMemoryWorkflowStore`: a restart loses every running instance, and two processes don't share them. It can't join your transaction either, so `start()` and `signal()` with `transaction` write at once, and it logs a warning the first time. With `NODE_ENV=production`, startup fails instead, with an error that names the package's stores and the interface to implement, unless you set `allowInMemoryStorage: true` in the module options.

**Atomicity.** Workers, signals, cancels, retries, purges and schedules race each other through the store. `claim()` must never lease one instance to two workers, `write()` must write only while the worker's lease holds, and `signal()` must not slip past an instance that is suspending. So every method that changes state is one conditional statement, or one transaction with the right lock, never a read followed by a write. Two methods are optional: `createInTransaction()` and `signalInTransaction()`, which `start()` and `signal()` call with your transaction object, untouched. They must write through it, and refuse the root handle, whose writes commit on their own. On PostgreSQL, `signalInTransaction()` also refuses a transaction that isn't READ COMMITTED, whose wake-up could miss waits committed after its snapshot.

**Test it** with the suite from `@nestjs/workflows/testing`. `workflowStoreContract()` returns the contract as test cases, races included, for any test runner. The tutorial's tests run it against `PostgresWorkflowStore` through Drizzle, and against `MySqlWorkflowStore` on MySQL, as you would against yours, with a function that returns a store on emptied tables:

```typescript
@@filename(test/drizzle-workflow.store.spec)
// The concurrency cases run too; with one connection, PGlite runs them one statement at a time.
const cases = workflowStoreContract(() => freshStore(db), { concurrent: true, transaction: (work) => db.transaction(work) });
for (const c of cases) {
  it(c.name, c.run);
}
```

With `concurrent: true`, the suite races claims (under limits too), signals, suspensions, children's final writes, cancels and terminates, retries, purges and schedule claims against each other: 60 signals against 60 suspensions, for example. Run it on a database server with a connection pool too, where a store without the right locks fails it. With `transaction`, a function that opens one of your transactions, the cases of the two optional methods run as well. The package's own tests run the suite against a hand-written Drizzle store, as the proof that a store written against the interface passes it.

Packages built on the engine, such as a job queue, take its storage-agnostic parts (clocks, retries, payload codecs, limits, the leased worker loop and schedules) from `@nestjs/workflows/core`; applications don't need it.

##### Call options

| Call | Options | Explained in |
| --- | --- | --- |
| `@Workflow(name, options)` | `version` (default `1`), `timeout` (a run timeout; default none), `concurrency` (`limit`, and a `key` function for a limit per key; one of each in an array), `rateLimit` (`max`, `duration`, and a `key` function; one of each in an array), `schedules` (see the schedule options below) | [Deploy changes safely](/reliability/workflows#deploy-changes-safely), [Time out the whole workflow](/reliability/workflows#time-out-the-whole-workflow), [Limit how many run at once](/reliability/workflows#limit-how-many-run-at-once), [Run workflows on a schedule](/reliability/workflows#run-workflows-on-a-schedule) |
| `ctx.step(name, fn, options)` | `retry`, `timeout`, `heartbeatTimeout`, `compensate`, `compensateRetry` | [Write the workflow](/reliability/workflows#write-the-workflow), [Long-running steps](/reliability/workflows#long-running-steps) |
| `ctx.waitForSignal(name, signal, options)` | `key`, `timeout` (resolves `null` when it passes), `match` (a pure filter over the payload) | [Wait for the delivery webhook](/reliability/workflows#wait-for-the-delivery-webhook) |
| `ctx.sleep(name, duration)` | A duration, or an object with `until` (a `Date` or epoch milliseconds) | [Sleep for a week, then ask for a review](/reliability/workflows#sleep-for-a-week-then-ask-for-a-review) |
| `ctx.waitForAny(name, conditions)` | An object of conditions: `ctx.signalWait(signal, options)` (`key`, `match`), `ctx.timer(duration)` (a duration, or an object with `until`), or a child's handle. Resolves with the winner's `key` and `value` | [Wait for whichever comes first](/reliability/workflows#wait-for-whichever-comes-first) |
| `ctx.startChild(workflow, input, options)`, `ctx.executeChild(workflow, input, options)` | `id` (default the parent's id, the workflow's name and a count, such as `order-71e1973d/shipment#1`), `version`, `timeout`, `parentClose` (`'cancel'`, `'terminate'` or `'abandon'`; default `'cancel'`), `priority` (default the parent's), `concurrencyKey`, `rateLimitKey` | [Start child workflows](/reliability/workflows#start-child-workflows) |
| `ctx.setStatus(status)` | A JSON value of up to 16 KiB, or `undefined` to clear it | [Report its status](/reliability/workflows#report-its-status) |
| `ctx.schedule` | Not a call: the `id` of the schedule and the time `at` of the occurrence that started the instance, or `null` | [Run workflows on a schedule](/reliability/workflows#run-workflows-on-a-schedule) |
| `WorkflowClient.start(workflow, input, options)` | `id` (default a random UUID, or inside a step one derived from the step), `version` (default the highest registered), `timeout` (default the decorator's), `transaction`, `priority` (1 to 2,097,151, lower first; default none, which goes before all), `concurrencyKey`, `rateLimitKey` (instead of the keys the limits compute) | [Start it with the order](/reliability/workflows#start-it-with-the-order), [Limit how many run at once](/reliability/workflows#limit-how-many-run-at-once) |
| `WorkflowClient.signal(signal, payload, options)` | `key`, `id` (stores a signal with the same name and id once; derived from the step inside a step), `transaction` | [Wait for the delivery webhook](/reliability/workflows#wait-for-the-delivery-webhook), [With CQRS](/reliability/workflows#with-cqrs) |
| `WorkflowClient.startAndWait(workflow, input, options, wait)` | `start()`'s options, but not `transaction`, and `result()`'s as `wait` | [Wait for a result](/reliability/workflows#wait-for-a-result) |
| `WorkflowClient.result(id, options)` | `timeout` (wall-clock; default none), `signal` (stops waiting when aborted) | [Wait for a result](/reliability/workflows#wait-for-a-result) |
| `WorkflowClient.getStatus(id, options)` | `journal`, `children` | [Report its status](/reliability/workflows#report-its-status), [Start child workflows](/reliability/workflows#start-child-workflows) |
| `WorkflowClient.cancel(id, reason)`, `terminate(id, reason)` | None | [Let customer support cancel an order](/reliability/workflows#let-customer-support-cancel-an-order), [Retry, delete or terminate](/reliability/workflows#retry-delete-or-terminate) |
| `WorkflowClient.list(filter)` | `status` (one or a list), `workflow`, `version`, `parentId`, `scheduleId`, `limit` (default `100`), `offset` | [Deploy changes safely](/reliability/workflows#deploy-changes-safely) |
| `WorkflowClient.retry(id, options)` | `timeout` (a new run timeout from now, or `false` for none; default the instance's) | [Retry, delete or terminate](/reliability/workflows#retry-delete-or-terminate) |
| `WorkflowClient.delete(id, options)` | `force` (delete an unfinished instance too; default `false`) | [Retry, delete or terminate](/reliability/workflows#retry-delete-or-terminate) |
| `WorkflowClient.purge(options)` | `olderThan` (required), `status` (default `completed`, `failed` and `cancelled`), `batchSize` (default `500`) | [Purge finished instances](/reliability/workflows#purge-finished-instances) |
| `WorkflowClient.schedules`, or the injectable `WorkflowSchedules` | `upsert(id, options)` (the schedule options, with `workflow`, and optionally `version` and a JSON `input`), `get(id)`, `list(filter)` (`workflow`, `limit`, `offset`), `remove(id)`, `pause(id)` and `resume(id)` (neither re-encrypts the stored input), `trigger(id)` (in a process that registers the workflow, unless the schedule pins a `version`), and `preview(schedule, options)` (a schedule's id or timing; `from`, and `count`, default `10`) | [Run workflows on a schedule](/reliability/workflows#run-workflows-on-a-schedule) |
| `@StartOn(event, options)` | `id` (required), `input` (default the event), `priority`, `concurrencyKey`, `rateLimitKey` (as `start()`'s: a value, or a function of the event, where `undefined` leaves the default) | [With CQRS](/reliability/workflows#with-cqrs) |
| `@SignalOn(event, options)` | `signal`, `key`, `id`, `payload` (default the event) | [With CQRS](/reliability/workflows#with-cqrs) |
| `EventBus.publish(event, context)`, `publishAll(events, context)`, an aggregate's `commit(context)` (`@nestjs/cqrs` 12.1 or later) | `transaction`, read from the dispatcher context once `WorkflowsCqrsModule` is imported | [With CQRS](/reliability/workflows#with-cqrs) |

A step's function receives `idempotencyKey`, `attempt`, `signal`, `progress` and `heartbeat()`; a compensation receives the same, plus the reason the workflow is being undone.

A schedule, declared in `@Workflow()` or saved with `upsert()`, takes these options:

| Option | Default | Meaning |
| --- | --- | --- |
| `id` | Required in `@Workflow()` | Unique across the application: letters, digits, `.`, `:`, `_` and `-`. `upsert()` takes it as its first argument |
| `cron`, `every`, `rrule` | One of the three is required | A cron expression of 5 fields, or 6 with the seconds first; an interval of at least a second, counted from `startAt`; or an RFC 5545 recurrence rule |
| `tz` | `'UTC'` | The IANA time zone of `cron` and `rrule`. Not with `every` |
| `startAt`, `endAt` | None | No occurrence before `startAt`, or after `endAt` |
| `limit` | None | How many occurrences it starts before it ends |
| `missed` | `'skip'` | Occurrences no worker was up to start: `'skip'`, `'once'` or `'all'` |
| `overlap` | `'skip'` | An occurrence due while an instance it started is unfinished: `'skip'`, `'allow'`, `'cancel-previous'` or `'buffer-one'` |
| `priority` | None | The priority of the instances it starts |
| `input` | None | The instances' input: a JSON value, or in `@Workflow()` a function of the occurrence |

##### Events

`WorkflowEvents.events$` emits each event, and publishes it on the `nestjs:workflows:<type>` diagnostics channel, for example `nestjs:workflows:step-failed`. Every payload has `type`, `id` (the instance), `workflow`, `version` and `at` (the engine's time, in milliseconds).

| Event | Other fields | When |
| --- | --- | --- |
| `workflow-started` | None | The first execution of an instance began |
| `workflow-resumed` | `run` | A later execution began: after a wait, a sleep, a retry or a crash |
| `workflow-suspended` | `wakeAt`, `waits` | An execution parked the instance |
| `step-completed` | `step`, `attempt`, `durationMs` | A step attempt succeeded |
| `step-failed` | `step`, `attempt`, `error`, `retryAt` | A step attempt failed; `retryAt` is `null` when the step gave up |
| `signal-received` | `wait`, `signal`, `signalId` | A wait took a signal |
| `signal-timed-out` | `wait`, `signal` | A wait's deadline passed without a matching signal |
| `workflow-compensating` | `error` | The instance failed or was cancelled, and starts undoing |
| `step-compensated` | `step`, `attempt` | A step's compensation completed |
| `workflow-completed` | `output` | The instance completed |
| `workflow-failed` | `error` | The instance failed, after its compensations ran |
| `workflow-cancelled` | `error` | The instance was cancelled, after its compensations ran; `error.message` is the reason |
| `workflow-compensation-failed` | `error` | A compensation gave up halfway. Needs a person |
| `journal-large` | `entries`, `bytes` | The journal reached `journal.warnEntries` or `journal.warnBytes`; once per instance |
| `workflow-retried` | `from`, `error` | `retry()` reopened a `failed` or `compensation_failed` instance; `error` is the one it had |
| `workflow-deleted` | `status` | `delete()` removed an instance; `status` is the one it had |
| `custom-status` | `status` | A write changed the instance's custom status |
| `child-started` | `child`, `childWorkflow`, `childVersion` | The instance started a child |
| `schedule-skipped` | `reason` (`'missed'` or `'overlap'`), `from`, `to` | A schedule passed over occurrences. Its `id` is the schedule's |

An instance maps onto one trace, whichever processes run it over its days or weeks, so key the trace by the instance `id`. The instance is the root span, from `workflow-started` to its final event (`workflow-completed`, `workflow-failed`, `workflow-cancelled` or `workflow-compensation-failed`). Each execution is a child span, from `workflow-started` or `workflow-resumed` to `workflow-suspended` or the final event. Each step attempt is a span inside it that ends at `step-completed`, whose `durationMs` gives its start, or at `step-failed`. The other events are events on the execution's span. Tracing tools subscribe to the diagnostics channels, so this needs no code in your application.

##### Errors

The package's errors extend `WorkflowError`, except the two that are control flow or yours to throw. The ones found on a failed instance are there by name, in its `error`.

| Error | HTTP status | Raised when |
| --- | --- | --- |
| `WorkflowIdConflictError` | `409` | `start()` with an existing id, but a different workflow or input, `signal()` with an `id` already used for the same signal with another key, or `startChild()` with an id that another workflow, parent or input uses |
| `WorkflowNotFoundError` | `404` | `cancel()`, `terminate()`, `retry()`, `delete()` or `result()` of an unknown id, a schedule method with an unknown schedule id, or `start()` or a schedule's `trigger()` of a workflow this application can't resolve |
| `WorkflowStateError` | `409` | `retry()` of an instance that isn't `failed` or `compensation_failed`, or whose compensations ran; `delete()` of an unfinished instance without `force`; either racing another change to the instance; `upsert()` or `remove()` of a declared schedule |
| `NonRetryableStepError` | None | You throw it from a step to fail the step without retrying |
| `StepFailedError` | None | Inside `run()`, a step gave up; `step`, `attempts`, and the original error's name and message as `cause` |
| `StepTimeoutError` | None | A step attempt ran past its `timeout` or `heartbeatTimeout`. Retried |
| `WorkflowFailedError` | None | `ctx.fail()` failed the instance. Also what `result()` and `startAndWait()` reject with for an instance that ended without completing, with its `instanceId`, its `status` and its error as `cause` |
| `ChildWorkflowFailedError` | None | A child failed, was cancelled or was terminated: what `ctx.executeChild()` and a child's `result()` throw in the parent, with the child's `workflow`, `instanceId`, `status` and error as `cause`. Extends `WorkflowFailedError` |
| `WorkflowResultTimeoutError` | None | `result()` or `startAndWait()` waited past its `timeout`, with the `instanceId` and `timeoutMs`. The instance keeps running |
| `WorkflowDefinitionError` | None | A name used twice in one run, or a `ctx` call inside a step. The instance fails without compensation |
| `WorkflowNonDeterminismError` | None | A deploy renamed, removed or reordered steps that running instances journaled. Extends `WorkflowDefinitionError`. [Deploy changes safely](/reliability/workflows#deploy-changes-safely) |
| `WorkflowInterrupt` | None | The engine's control flow (a suspension, a cancel). Rethrow it; `isWorkflowInterrupt()` identifies it |
| `WorkflowTimeoutError` | None | Only by name, on an instance that ran past its run timeout: it compensated and failed |
| `WorkflowCancelledError` | None | Only by name, on a cancelled instance: its message is the reason |
| `WorkflowTerminatedError` | None | Only by name, on a terminated instance, which ends as `cancelled`: its message is the reason |
| `WorkflowDeletedError` | None | Only by name, as the cause of a parent's `ChildWorkflowFailedError`, when `delete()` with `force` removed the child before it ended |
| `WorkflowJournalLimitError` | None | Only by name, on an instance whose journal reached `journal.maxEntries` or `journal.maxBytes`: it compensated and failed |
| `WorkflowSchemaError` | None | The schema of `PostgresWorkflowStore` or `MySqlWorkflowStore` is behind the package's migrations while `migrate` is off, or applying them failed (`cause`; on MySQL, the message names the statement where the next run resumes): startup and every call fail until it's fixed. With the `schema`, its `version` and the `requiredVersion`. From `@nestjs/workflows/postgres` and `@nestjs/workflows/mysql` |

`MySqlWorkflowStore` also rejects an id, name or key longer than its column with a `RangeError`, before any SQL ([MySQL store](/reliability/workflows#mysql-store)). A deadlock in your transaction reaches you as MySQL's error 1213, which the store doesn't retry, since it rolled back your writes too.
