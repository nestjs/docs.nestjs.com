### Webhooks

An online store for cat food and supplies sells to cat shelters and resellers that buy in bulk, through its API. Northside Pet Supplies, a reseller, places an order and wants to know when it ships and when it's cancelled, without polling: a webhook to its warehouse system. The store receives webhooks too: the payment provider reports payments, and the carrier reports shipments. Both directions look simple, and both go wrong in the same ways:

- **Sending.** A `fetch()` after the order commits is lost when the process dies in between, and sent for a transaction that then rolls back. A retry sends the same event twice without telling the partner so. Every partner writes its own verifier for a homemade signature. A partner that is down for an hour is hammered, a dead endpoint is never turned off, and nobody can answer "did you send it?". And the URL the partner typed is a server-side request forgery waiting to happen: `https://169.254.169.254/` answers with the cloud credentials.
- **Receiving.** The signature is checked on a body the framework parsed and serialized again (a stray space breaks it, and a tampered body can pass), compared with `===` instead of in constant time, with no timestamp window, and a redelivered event runs the handler twice: an order marked paid twice, or shipped twice.

`@nestjs/webhooks` makes both directions one thing to configure. Outgoing webhooks travel through the [outbox](/reliability/outbox): `webhooks.dispatch()` adds the message in the same transaction as the order, and after the commit a worker fans it out to the partner's endpoints, signs each request the way [Standard Webhooks](https://www.standardwebhooks.com) specifies, retries with backoff for about two days, keeps a log of every attempt, and replays on request. Incoming webhooks are one decorator, `@VerifyWebhook()`, which checks the signature on the raw body and skips redeliveries.

In this tutorial, you'll add webhooks to the store's order API, on PostgreSQL with Drizzle:

- Partners subscribe to `order.shipped` and `order.cancelled` through the API, and see their secret once.
- The API sends the webhooks after the commit, signed, and retries them while a partner is down.
- Partners read their delivery log, and ask for a replay.
- The API receives the payment provider's payment webhooks (Standard Webhooks) and the carrier's shipment webhooks (Stripe's scheme), verified on the raw body and processed exactly once.
- Secrets rotate without a gap, and a URL that points inside the store's network is refused.

#### Installation

To get started, install the required dependency:

```bash
$ npm i --save @nestjs/webhooks
```

The tutorial runs on PostgreSQL, through [Drizzle ORM](https://orm.drizzle.team) and [`@nestjs/drizzle`](/data/drizzle) with the `pg` driver: the endpoints and the delivery log live in the database the orders live in, on a database server that outlives any instance of the application. Using TypeORM, or MySQL? Follow the tutorial, and see "With TypeORM" and "With MySQL" in [Keep webhooks in your database](/http/webhooks#keep-webhooks-in-your-database) for what changes.

Outgoing webhooks are outbox messages, and incoming ones are deduplicated with the outbox's inbox, so the application runs the outbox too (`@nestjs/outbox`, installed and set up in [the outbox tutorial](/reliability/outbox)).

The example application, the online store's order API, keeps its catalog, the partners that call it, and their orders in three tables of its own, which the later sections read and write. They're the example's data, not something webhooks need: the webhooks' and the outbox's tables belong to their stores, which create them, as [Keep webhooks in your database](/http/webhooks#keep-webhooks-in-your-database) shows.

`products` is the catalog:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `text` | Primary key, such as `salmon-kibble-2kg` |
| `name` | `text` | The display name, such as `Salmon kibble, 2 kg` |
| `price` | `integer` | In cents |

`partners` holds the cat shelters and resellers that buy in bulk over the API, and receive its webhooks:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `text` | Primary key, such as `northside` |
| `name` | `text` | The display name, such as `Northside Pet Supplies` |
| `api_key_hash` | `text` | The SHA-256 of the partner's API key, in hex. Unique |

`orders` holds the partners' orders, whose `status` goes from `placed` to `paid` and `shipped`, or to `cancelled`:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `text` | Primary key |
| `partner_id` | `text` | References `partners.id` |
| `items` | `jsonb` | The order's lines, as a JSON array: each line's `productId`, `quantity` and unit `price` (in cents) |
| `total` | `integer` | In cents |
| `status` | `text` | `placed`, `paid`, `shipped` or `cancelled` |
| `payment_id` | `text` | Nullable: set when the order is paid |
| `tracking_number` | `text` | Nullable: set when the order is shipped |

The other columns aren't nullable.

The catalog has two products, `salmon-kibble-2kg` at 2499 cents and `clumping-litter-10l` at 1599 cents, and the two partners have sample API keys (issue real ones from your partner onboarding):

| Partner | `id` | API key |
| --- | --- | --- |
| Northside Pet Supplies, a reseller | `northside` | `partner_northside_7c1d2e` |
| Riverside Cat Shelter | `riverside` | `partner_riverside_91ab44` |

#### Keep webhooks in your database

There's nothing to create for webhooks, or for the outbox they travel through: no tables, entities or Prisma models. Register their two stores, and each creates its own schema, `nest_webhooks` and `nest_outbox`, and migrates it: at startup in development and in tests, and in production with `npx nest-webhooks migrate` and `npx nest-outbox migrate`, or with their `migrationSql()` in your own migrations.

The package keeps the endpoints, with their secrets, the messages it dispatched, their deliveries and the log of every attempt in a **store**, which it reads through two contracts, `WebhookEndpointStore` and `WebhookDeliveryStore`. Until you register one, the module keeps them in memory: fine for a first run, but a restart loses every pending delivery, and two instances don't share them.

> warning **Warning** With `NODE_ENV=production` and no store registered, startup fails, unless you set `allowInMemoryStorage: true`.

On PostgreSQL, register the package's store, `PostgresWebhookStore` from `@nestjs/webhooks/postgres`. The outbox needs one too, for the messages that carry dispatched webhooks out of your transaction and for the inbox that deduplicates incoming ones: `PostgresOutboxStore` from `@nestjs/outbox/postgres`, as in [the outbox tutorial](/reliability/outbox#keep-messages-in-your-database). Both run their SQL through the database client your application already has, and keep their tables in schemas of their own. They're ordinary providers, registered once, in the root module, next to `WebhooksModule` and `OutboxModule`: all four are application-wide. `AppModule` creates each with a factory that injects the Drizzle database and its package's storage registry, which the store registers itself with:

```typescript
@@filename(app.module)
{
  // Outbox messages and the inbox, in your database, in a schema of their own (nest_outbox)
  provide: PostgresOutboxStore,
  inject: [getDrizzleToken(), OutboxStorage],
  useFactory: (db: Database, outboxStorage: OutboxStorage) =>
    new PostgresOutboxStore({ executor: fromDrizzle(db) }, outboxStorage),
},
{
  // Endpoints, deliveries and their log, in your database, in a schema of their own (nest_webhooks)
  provide: PostgresWebhookStore,
  inject: [getDrizzleToken(), WebhooksStorage],
  useFactory: (db: Database, webhooksStorage: WebhooksStorage) =>
    new PostgresWebhookStore({ executor: fromDrizzle(db) }, webhooksStorage),
},
```

`fromDrizzle(db)` is the stores' **executor**: it runs their statements through your Drizzle database, whichever driver it uses, such as `pg` or PGlite. `fromPg(pool)`, `fromTypeOrm(dataSource)`, `fromPrisma(prisma)` and `fromKysely(db)` do the same for a node-postgres pool, TypeORM, Prisma and Kysely. `@nestjs/webhooks/postgres` and `@nestjs/outbox/postgres` both export them, so `AppModule` imports `fromDrizzle` once, for both stores. At startup, each module logs the store it uses.

**The schema.** The webhook store keeps its tables in a schema of its own, `nest_webhooks` (the `schema` option names another). On MySQL, which has no schemas, they're tables of the connection's database, with the schema's name as their prefix: `nest_webhooks_endpoints` and so on.

| Table | What it holds |
| --- | --- |
| `nest_webhooks.endpoints` | The partners' endpoints: URL, event types, tenant, and secrets |
| `nest_webhooks.messages` | What was dispatched, byte for byte |
| `nest_webhooks.deliveries` | One per message and endpoint, with its status, attempts and lease |
| `nest_webhooks.delivery_attempts` | The log: every attempt, with the status code, the response and how long it took |
| `nest_webhooks.migrations` | The versions of the store's schema applied |

The outbox's store keeps its messages, dead letters and inbox in `nest_outbox` (`nest_outbox_messages` and so on, on MySQL), as in [the outbox tutorial](/reliability/outbox#keep-messages-in-your-database). They belong to the stores: your migrations don't create them, and your own tables can't collide with them. A few choices in there matter to the package:

- An endpoint's secrets are a JSON array, newest first: during a rotation, the old secret stays for the overlap, with an expiry. With `encryption` configured (see [Register the modules](/http/webhooks#register-the-modules)), what is stored is sealed.
- A message's `body` is `text`, not `jsonb`. It is the exact JSON that was signed and sent, and `jsonb` would reformat it: a partner storing the request and its signature could no longer verify a replay.
- A delivery is unique per message and endpoint. The fan-out that creates deliveries runs after the commit, inside the outbox, so it can run twice; the unique key makes the second run insert nothing.
- No foreign key from a delivery to its endpoint: a deleted endpoint's log stays. Attempts go with their delivery.
- Times are epoch milliseconds (`bigint`), from the package's clock, never the database's.

**Migrations.** The packages ship their schemas as versioned migrations, and the stores apply them themselves. With the `migrate` option, each applies the ones its schema hasn't had yet at startup, before the relay and the worker run, in one transaction that holds an advisory lock: of several instances that start together, one migrates, and the others find nothing left to do. `migrate` defaults to `true`, except with `NODE_ENV=production`. So in development and in tests, the stores create their schemas on the first start, and your migrations only create your own tables.

In production, apply the migrations before the new version of your application starts, as you apply your own, so that no instance changes a schema while it boots: in the middle of a rolling deploy, that would lock busy tables, and a least-privilege database user can't do it anyway. The packages' command lines do it from your deploy step, next to `npx drizzle-kit migrate`. They read the database from `DATABASE_URL`, or from `--url`, and need `pg` installed:

```bash
$ npx nest-webhooks status
Schema "nest_webhooks" is at version 0; this version of @nestjs/webhooks needs version 1.
$ npx nest-webhooks migrate
Migrated schema "nest_webhooks" to version 1 (applied 1).
$ npx nest-outbox migrate
Migrated schema "nest_outbox" to version 1 (applied 1).
```

`status` exits with 1 while the schema is behind, which makes it a check for CI. To apply the migrations with your own migration tool instead, take their SQL from `npx nest-webhooks sql` and `npx nest-outbox sql`, or from `PostgresWebhookStore.migrationSql()` and `PostgresOutboxStore.migrationSql()` in code: the statements of every migration, with the bookkeeping that records the version. Run each in one transaction, as TypeORM's and Drizzle's migrators do. With TypeORM, that's a migration of your own, next to the ones it generates for your entities:

```typescript
@@filename(typeorm/migrations/1790801311590-WebhookStores)
import { PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { PostgresWebhookStore } from '@nestjs/webhooks/postgres';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class WebhookStores1790801311590 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(PostgresOutboxStore.migrationSql());
    await queryRunner.query(PostgresWebhookStore.migrationSql());
  }

  async down(): Promise<void> {
    throw new Error('The webhook and outbox stores have no down migrations.');
  }
}
```

With drizzle-kit, create a custom migration per store, and fill each with its SQL, a `--> statement-breakpoint` line between the statements: Drizzle's migrator then runs them one at a time, which PGlite requires. In code, `migrationSql()` with `statementBreakpoints: true` returns the same.

```bash
$ npx drizzle-kit generate --custom --name=outbox
$ npx nest-outbox sql --statement-breakpoints > drizzle/0002_outbox.sql
$ npx drizzle-kit generate --custom --name=webhooks
$ npx nest-webhooks sql --statement-breakpoints > drizzle/0003_webhooks.sql
```

On MySQL, the stores' `migrationStatements()` return the statements one per string, and a TypeORM migration runs them one per call:

```typescript
@@filename(typeorm/mysql-migrations/1790801311590-WebhookStores)
for (const statement of [...MySqlOutboxStore.migrationStatements(), ...MySqlWebhookStore.migrationStatements()]) {
  await queryRunner.query(statement);
}
```

With `migrate` off, a store whose schema is behind fails the startup with a `WebhookSchemaError` (the outbox's store, with an `OutboxSchemaError`) that names these three ways, and fails every call the same way until the schema catches up, which it notices without a restart. During a rolling deploy, the previous version of your application keeps running on a schema that the new one migrated. There are no down migrations.

**Transactions.** No method of the webhook store takes your transaction. `webhooks.dispatch(tx, ...)` adds the message to the outbox in your transaction, through the outbox's store, and `webhook.processInTransaction(tx, ...)` records an incoming webhook in the outbox's inbox the same way; the fan-out after the commit, the worker and everything else run on the stores' own connections. With Drizzle, `tx` is what `db.transaction()` hands its callback, as the next sections show. The outbox's store refuses the database itself, whose statements would commit on their own, with an `OutboxTransactionRequiredError` that says what to pass. With the other executors, pass a node-postgres client after `BEGIN` (not the pool), TypeORM's `EntityManager` from `dataSource.transaction()`, Prisma's interactive transaction client, or a Kysely transaction.

**Isolation.** The stores rely on READ COMMITTED, PostgreSQL's default isolation level: their statements race each other, and under a stricter level they would fail with serialization errors. At startup, each checks the database's `default_transaction_isolation`, and fails if it's stricter. Your own transactions may run at any level. Under REPEATABLE READ or SERIALIZABLE, though, a copy of an incoming webhook that `processInTransaction()` handles in your transaction, racing the first one's commit, fails with PostgreSQL's serialization error instead of being skipped as a duplicate: the sender gets an error, and its retry finds the webhook recorded.

**With TypeORM.** `TypeOrmModule` takes the place of `DrizzleModule` in `AppModule`, and both stores run on the `DataSource` it provides, through `fromTypeOrm()`:

```typescript
@@filename(typeorm/app.module)
{
  // Outbox messages and the inbox, in your database, in a schema of their own (nest_outbox)
  provide: PostgresOutboxStore,
  inject: [DataSource, OutboxStorage],
  useFactory: (dataSource: DataSource, outboxStorage: OutboxStorage) =>
    new PostgresOutboxStore({ executor: fromTypeOrm(dataSource) }, outboxStorage),
},
{
  // Endpoints, deliveries and their log, in your database, in a schema of their own (nest_webhooks)
  provide: PostgresWebhookStore,
  inject: [DataSource, WebhooksStorage],
  useFactory: (dataSource: DataSource, webhooksStorage: WebhooksStorage) =>
    new PostgresWebhookStore({ executor: fromTypeOrm(dataSource) }, webhooksStorage),
},
```

Where the tutorial passes Drizzle's `tx` to `dispatch()` and `processInTransaction()`, pass the `EntityManager` that `dataSource.transaction()` hands its callback, and inject `Webhooks<EntityManager>`. The outbox's store refuses `dataSource.manager`, whose writes would commit on their own. This is the order service's `cancelOrder()`, from [Send order.shipped and order.cancelled after the commit](/http/webhooks#send-ordershipped-and-ordercancelled-after-the-commit), with TypeORM:

```typescript
@@filename(typeorm/orders.service)
const order = await this.dataSource.transaction(async (manager) => {
  const row = await manager.findOne(OrderEntity, { where: { id, partnerId: partner.id }, lock: { mode: 'pessimistic_write' } });
  if (!row) {
    throw new NotFoundException(`Order ${id} not found`);
  }
  if (row.status === 'shipped' || row.status === 'cancelled') {
    throw new ConflictException(`Order ${id} is ${row.status}`);
  }
  await manager.update(OrderEntity, id, { status: 'cancelled' });

  // The transaction's EntityManager: the webhook is sent only if the cancellation commits.
  const data: OrderCancelled = { orderId: id, reason };
  await this.webhooks.dispatch(manager, { type: 'order.cancelled', tenant: row.partnerId, data });
  return { ...row, status: 'cancelled' as const };
});
```

Your entities and their migrations stay as they are: `migration:generate` compares only your entities with the database, and leaves the stores' schemas alone.

**With MySQL.** On MySQL 8.4 or 9.x, import the stores and the executor from `@nestjs/outbox/mysql` and `@nestjs/webhooks/mysql` instead. The providers are the same, with `MySqlOutboxStore` and `MySqlWebhookStore`, on a Drizzle database of `drizzle-orm/mysql2`:

```typescript
@@filename(mysql/app.module)
import { MySqlOutboxStore } from '@nestjs/outbox/mysql';
import { fromDrizzle, MySqlWebhookStore } from '@nestjs/webhooks/mysql';
import { drizzle } from 'drizzle-orm/mysql2';
// ...
DrizzleModule.forRootAsync({
  // Drizzle on MySQL: a mysql2 pool on DATABASE_URL (mysql://), whose database holds the stores' tables too
  useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL! }),
}),
// ...
{
  // Outbox messages and the inbox, in your database, in tables of their own (nest_outbox_*)
  provide: MySqlOutboxStore,
  inject: [getDrizzleToken(), OutboxStorage],
  useFactory: (db: Database, outboxStorage: OutboxStorage) =>
    new MySqlOutboxStore({ executor: fromDrizzle(db) }, outboxStorage),
},
{
  // Endpoints, deliveries and their log, in your database, in tables of their own (nest_webhooks_*)
  provide: MySqlWebhookStore,
  inject: [getDrizzleToken(), WebhooksStorage],
  useFactory: (db: Database, webhooksStorage: WebhooksStorage) =>
    new MySqlWebhookStore({ executor: fromDrizzle(db) }, webhooksStorage),
},
```

With the other clients, the executor is `fromMysql2(pool)` for a `mysql2/promise` pool, `fromTypeOrm(dataSource)` for a `DataSource` of type `mysql`, `fromPrisma(prisma)` for Prisma through `@prisma/adapter-mariadb`, or `fromKysely(db)` for Kysely's `MysqlDialect`. What differs from PostgreSQL:

- **Tables, not a schema.** MySQL has no schemas inside a database, so the stores keep their tables in the connection's database, the one in the URL's path, next to yours, and `schema` becomes their prefix: `nest_webhooks_endpoints`, `nest_webhooks_deliveries` and so on, and `nest_outbox_messages` for the outbox. It takes lowercase letters, digits and underscores, at most 40 characters.
- **Your transactions.** `dispatch()` and `processInTransaction()` work at REPEATABLE READ, MySQL's default, as at READ COMMITTED: there's nothing to configure, and the stores don't check the database's default. When MySQL breaks a deadlock in your transaction (error 1213), it rolls the whole transaction back, and the client's error reaches your code: run the transaction again. The stores run their own transactions again themselves. With `processInTransaction()`, that can happen when copies of one webhook arrive at once and the first one's transaction rolls back: the sender gets an error, and its retry goes through.
- **Keys are bounded.** Ids and tenants are indexed columns: at most 255 characters, 256 for a tenant, which the package's own ids and its limit on `tenant` stay within. An incoming webhook's id goes into the inbox's key, of at most 255 characters too, and the verifier refuses a longer id on every database, with a 401, before the handler runs.
- **Migrations aren't one transaction.** MySQL commits each DDL statement on its own, so `migrate` applies the statements one at a time, under a lock (`GET_LOCK()`), and a run that failed resumes at the statement it stopped at. Your own tool must send one statement per call too, as the TypeORM migration in **Migrations** above does. The command lines take a `mysql://` URL, and `sql --dialect mysql` prints MySQL's SQL: add `--statement-breakpoints` for a drizzle-kit custom migration, since its MySQL migrator sends one statement per breakpoint.
- **The server.** The stores check it at startup, and refuse MariaDB, a connection without a database, and a `sql_mode` that isn't strict (MySQL's default is). Keep `NO_BACKSLASH_ESCAPES` out of it too.

For another database, write a store of your own: [The store contract](/http/webhooks#the-store-contract) says what it must do.

#### Register the modules

Register `OutboxModule` and `WebhooksModule` in the root module, next to `DrizzleModule`, which registers the Drizzle database, with both stores in its `providers`. The feature modules are built in the next sections:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';
import { OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { WebhooksModule, WebhooksStorage } from '@nestjs/webhooks';
import { fromDrizzle, PostgresWebhookStore } from '@nestjs/webhooks/postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Database } from './database/drizzle.js';
import * as schema from './database/schema.js';
import { OrdersModule } from './orders/orders.module.js';
import { PartnerWebhooksModule } from './partner-webhooks/partner-webhooks.module.js';

@Module({
  imports: [
    // A pg pool on DATABASE_URL, closed in onApplicationShutdown(), after the relay and the
    // worker drained. The services inject it with @InjectDrizzle(), the stores' factories too.
    DrizzleModule.forRootAsync({
      useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL!, schema }),
    }),
    // Outgoing webhooks travel through the outbox: dispatched in the order's transaction,
    // handed to the webhooks worker after the commit.
    OutboxModule.forRootAsync({
      useFactory: () => ({
        relay: { enabled: process.env.OUTBOX_RELAY !== 'off', pollInterval: '1s' },
      }),
    }),
    WebhooksModule.forRootAsync({
      useFactory: () => ({
        // The types partners may subscribe to; dispatch() refuses any other.
        eventTypes: ['order.shipped', 'order.cancelled'],
        // Ten attempts: 5s, 20s, 80s, ... capped at a day, about two days in all.
        retry: { attempts: 10, backoff: { delay: '5s', factor: 4, maxDelay: '1d' } },
        // An endpoint that fails every attempt for five days is switched off.
        disableEndpointAfter: '5d',
        delivery: {
          timeout: '15s',
          // Development only: deliver over http:// and to this machine. Without it, only
          // public https:// endpoints are accepted.
          allowHttp: process.env.WEBHOOKS_ALLOW_LOCAL === '1',
          allowPrivateNetworks: process.env.WEBHOOKS_ALLOW_LOCAL === '1',
        },
        worker: { enabled: process.env.WEBHOOKS_WORKER !== 'off', pollInterval: '1s' },
        // Endpoint secrets at rest: the first key encrypts, every key decrypts.
        encryption: process.env.WEBHOOKS_ENCRYPTION_KEYS
          ? { keys: process.env.WEBHOOKS_ENCRYPTION_KEYS.split(',').map((key) => key.trim()) }
          : undefined,
      }),
    }),
    OrdersModule,
    PartnerWebhooksModule,
  ],
  providers: [
    {
      // Outbox messages and the inbox, in your database, in a schema of their own (nest_outbox)
      provide: PostgresOutboxStore,
      inject: [getDrizzleToken(), OutboxStorage],
      useFactory: (db: Database, outboxStorage: OutboxStorage) =>
        new PostgresOutboxStore({ executor: fromDrizzle(db) }, outboxStorage),
    },
    {
      // Endpoints, deliveries and their log, in your database, in a schema of their own (nest_webhooks)
      provide: PostgresWebhookStore,
      inject: [getDrizzleToken(), WebhooksStorage],
      useFactory: (db: Database, webhooksStorage: WebhooksStorage) =>
        new PostgresWebhookStore({ executor: fromDrizzle(db) }, webhooksStorage),
    },
  ],
})
export class AppModule {}
```

`WebhooksModule` needs the outbox: `dispatch()` is an `Outbox.add()`, and the fan-out that turns a committed message into deliveries is an outbox handler. Without `OutboxModule`, startup fails and says so. The outbox's `relay` hands committed messages to the fan-out, polling every second, and `OUTBOX_RELAY=off` turns it off. The rest of the options, resolved when the application starts:

- `eventTypes`: the message types this application sends. `dispatch()` refuses any other, and so does an endpoint that tries to subscribe to one, with the known types in the message.
- `retry`: the vocabulary shared with the outbox, the HTTP client and resilience. Ten attempts, and a backoff that starts at 5 seconds, grows fourfold and is capped at a day, with jitter: what the Standard Webhooks spec recommends, "a retry schedule spanning multiple days".
- `disableEndpointAfter`: an endpoint that has failed every attempt for five days without a single success is switched off, and its owner is told (see [Retries, the delivery log and replay](/http/webhooks#retries-the-delivery-log-and-replay)).
- `delivery`: one attempt has 15 seconds for DNS, the connection, TLS, the request and the response. `allowHttp` and `allowPrivateNetworks` are off by default: only public `https://` endpoints are accepted. `WEBHOOKS_ALLOW_LOCAL=1` turns them on in development, where the partner's receiver runs on this machine. Cloud metadata addresses stay blocked even then.
- `worker`: the background deliverer, one per process. `WEBHOOKS_WORKER=off` turns it off in instances that only serve the API.
- `encryption`: endpoint secrets sealed at rest, with the family's shape: the first key encrypts, every key decrypts. Optional, from `WEBHOOKS_ENCRYPTION_KEYS`.

> info **Hint** The tutorial reads `process.env` directly, to stay short. In an application, load the environment through [`@nestjs/config`](/application/configuration) with a validation schema, so a missing variable stops the application at startup rather than at the first request, and read the values from `ConfigService` (`inject: [ConfigService]` in the factories).

Durations are milliseconds or strings such as `'15s'` and `'5d'`. Both modules are global: `Webhooks`, `WebhookEndpoints`, `WebhookDeliveries`, `WebhooksEvents` and `WebhooksStorage` can be injected anywhere. `main.ts` binds the validation pipe for the partner API's DTOs (see the next section), and enables the shutdown hooks, so a deploy lets the relay and the worker finish their in-flight work:

```typescript
@@filename(main)
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // The partner API's DTOs; whitelist: properties without a decorator are dropped.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // On SIGTERM the outbox relay and the webhook worker finish what they started.
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

At startup, both modules log the store they use, and on the first start, the stores log the schemas they created:

```bash
[Nest] 55905  - 09/30/2026, 6:52:36 PM     LOG [OutboxModule] OutboxStorage: PostgresOutboxStore
[Nest] 55905  - 09/30/2026, 6:52:36 PM     LOG [WebhooksModule] WebhooksStorage: PostgresWebhookStore
[Nest] 55905  - 09/30/2026, 6:52:36 PM     LOG [OutboxModule] PostgresOutboxStore: migrated schema "nest_outbox" to version 1.
[Nest] 55905  - 09/30/2026, 6:52:36 PM     LOG [WebhooksModule] PostgresWebhookStore: migrated schema "nest_webhooks" to version 1.
```

#### Let partners subscribe

Shelters and resellers call the partner API with an API key: the example's two partners, Northside Pet Supplies (a reseller) and Riverside Cat Shelter, have the sample keys in [Installation](/http/webhooks#installation). `PartnerGuard` looks the key's hash up and sets the partner on the request, and `@CurrentPartner()` reads it:

```typescript
@@filename(partners/partner.guard)
import {
  createParamDecorator,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import type { Database } from '../database/drizzle.js';
import { partners } from '../database/schema.js';

export interface Partner {
  id: string;
  name: string;
}

/** Authenticates a partner by its API key: `Authorization: Bearer <key>`. */
@Injectable()
export class PartnerGuard implements CanActivate {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; partner?: Partner }>();
    const key = /^Bearer (\S+)$/.exec(request.headers.authorization ?? '')?.[1];
    if (!key) {
      throw new UnauthorizedException();
    }
    const hash = createHash('sha256').update(key).digest('hex');
    const [partner] = await this.db
      .select({ id: partners.id, name: partners.name })
      .from(partners)
      .where(eq(partners.apiKeyHash, hash));
    if (!partner) {
      throw new UnauthorizedException();
    }
    request.partner = partner;
    return true;
  }
}

/** The partner `PartnerGuard` authenticated. */
export const CurrentPartner = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<{ partner: Partner }>().partner,
);
```

A subscription is a URL, the event types to receive, and a description; an update sends only what changes. The DTOs check the shape, and leave the URL and the types to the package, which knows what it accepts. Request bodies are validated with whatever the application already uses: every DTO on this page comes twice, as a class with `class-validator` decorators and as a Zod schema, so pick the style you have and skip the other listing:

```typescript
@@filename(partner-webhooks/webhook-endpoints.dto)
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

/** Body of `POST /partner/webhook-endpoints`. The package checks the URL and the types themselves. */
export class CreateEndpointDto {
  @IsString()
  url: string;

  /** `order.shipped`, `order.cancelled`, or `*` for both. */
  @IsArray()
  @IsString({ each: true })
  eventTypes: string[];

  @IsOptional()
  @IsString()
  description?: string;
}

/** Body of `PATCH /partner/webhook-endpoints/:id`: only what is sent changes. */
export class UpdateEndpointDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eventTypes?: string[];

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
```

The same rules as Zod schemas, whose inferred types replace the classes. Nest 12.1 validates any [Standard Schema](https://standardschema.dev/) object, from Zod, Valibot or ArkType, through `StandardSchemaValidationPipe`:

```typescript
@@filename(partner-webhooks/webhook-endpoints.schemas)
import { z } from 'zod';

/** Body of `POST /partner/webhook-endpoints`. The package checks the URL and the types themselves. */
export const createEndpointSchema = z.object({
  url: z.string(),
  /** `order.shipped`, `order.cancelled`, or `*` for both. */
  eventTypes: z.array(z.string()),
  description: z.string().optional(),
});
export type CreateEndpointDto = z.infer<typeof createEndpointSchema>;

/** Body of `PATCH /partner/webhook-endpoints/:id`: only what is sent changes. */
export const updateEndpointSchema = z.object({
  url: z.string().optional(),
  eventTypes: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
});
export type UpdateEndpointDto = z.infer<typeof updateEndpointSchema>;
```

The subscription API is a controller over `WebhookEndpoints`. Every call passes the partner's id as the **tenant**: an endpoint is created for that tenant, listed for that tenant, and another partner's endpoint id behaves as if it didn't exist:

```typescript
@@filename(partner-webhooks/webhook-endpoints.controller)
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WebhookEndpoints } from '@nestjs/webhooks';
import { CurrentPartner, PartnerGuard, type Partner } from '../partners/partner.guard.js';
import { CreateEndpointDto, UpdateEndpointDto } from './webhook-endpoints.dto.js';

/** A partner's subscriptions. Every call is scoped to the partner: another partner's endpoint is a 404. */
@Controller('partner/webhook-endpoints')
@UseGuards(PartnerGuard)
export class WebhookEndpointsController {
  constructor(private readonly webhookEndpoints: WebhookEndpoints) {}

  /** Returns the endpoint and its secret. The secret is shown this once. */
  @Post()
  create(@CurrentPartner() partner: Partner, @Body() dto: CreateEndpointDto) {
    return this.webhookEndpoints.create({
      url: dto.url,
      eventTypes: dto.eventTypes,
      description: dto.description ?? null,
      tenant: partner.id,
    });
  }

  @Get()
  list(@CurrentPartner() partner: Partner) {
    return this.webhookEndpoints.list({ tenant: partner.id });
  }

  @Get(':id')
  async get(@CurrentPartner() partner: Partner, @Param('id') id: string) {
    const endpoint = await this.webhookEndpoints.get(id, { tenant: partner.id });
    if (!endpoint) {
      throw new NotFoundException(`Webhook endpoint ${id} not found`);
    }
    return endpoint;
  }

  @Patch(':id')
  update(@CurrentPartner() partner: Partner, @Param('id') id: string, @Body() dto: UpdateEndpointDto) {
    return this.webhookEndpoints.update(id, dto, { tenant: partner.id });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentPartner() partner: Partner, @Param('id') id: string) {
    await this.webhookEndpoints.delete(id, { tenant: partner.id });
  }

  /** A new secret. The old one keeps signing for 24 hours, so the partner can switch without a gap. */
  @Post(':id/rotate-secret')
  @HttpCode(HttpStatus.OK)
  async rotateSecret(@CurrentPartner() partner: Partner, @Param('id') id: string) {
    return { secret: await this.webhookEndpoints.rotateSecret(id, { tenant: partner.id }) };
  }
}
```

With the Zod schemas, the body parameters declare their schema instead of a class:

```typescript
@@filename(partner-webhooks/webhook-endpoints.controller)
import { createEndpointSchema, updateEndpointSchema, type CreateEndpointDto, type UpdateEndpointDto } from './webhook-endpoints.schemas.js';
// ...
@Post()
create(@CurrentPartner() partner: Partner, @Body({ schema: createEndpointSchema }) dto: CreateEndpointDto) {
  // ...
}

@Patch(':id')
update(@CurrentPartner() partner: Partner, @Param('id') id: string, @Body({ schema: updateEndpointSchema }) dto: UpdateEndpointDto) {
  // ...
}
```

> info **Hint** The DTOs are enforced only by a validation pipe: bind `ValidationPipe` globally, with `useGlobalPipes()` in `main.ts` as [Register the modules](/http/webhooks#register-the-modules) does (`whitelist` drops properties without a decorator), or as an `APP_PIPE` provider. With the Zod schemas, bind `StandardSchemaValidationPipe` the same way instead: an application uses one or the other. The [validation](/application/validation) page has the options of each.

`create()` returns the endpoint with its `secret`, a Standard Webhooks `whsec_…` of 32 random bytes, generated here. This API shows it this once: `list()` and `get()` never include it, and a partner that lost it rotates. The package keeps the secret, sealed when `encryption` is set, because it signs with it, and `getSecret()` reads the current one back, for a "reveal" button behind a fresh sign-in if your API offers one. Endpoints moved from Svix or another Standard Webhooks sender keep their secrets: a migration script passes the partner's existing `whsec_…` as the `secret` of `create()`, so the partner's verifier keeps working, and `rotateSecret()` takes a given `secret` the same way. The package checks what the partner submits and throws an `InvalidWebhookEndpointError` with a 400 status: a URL that isn't `https://` (or `http://` with `allowHttp`), that carries credentials, or whose host is a blocked address, such as `https://169.254.169.254/latest/meta-data/` or `https://localhost/`; an event type that isn't in `eventTypes`. A partner's mistakes come back as 400s, and another partner's ids as 404s, through one filter:

```typescript
@@filename(partner-webhooks/webhooks-error.filter)
import { Catch, HttpException, type ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { WebhooksError } from '@nestjs/webhooks';

/**
 * The package's errors carry an HTTP status (400 for an endpoint it refuses, 404 for another
 * partner's endpoint or delivery); this answers with it and the error's message.
 */
@Catch(WebhooksError)
export class WebhooksErrorFilter extends BaseExceptionFilter {
  override catch(error: WebhooksError, host: ArgumentsHost) {
    const status = (error as { status?: number }).status;
    super.catch(status ? new HttpException(error.message, status, { cause: error }) : error, host);
  }
}
```

```typescript
@@filename(partner-webhooks/partner-webhooks.module)
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { WebhookDeliveriesController } from './webhook-deliveries.controller.js';
import { WebhookEndpointsController } from './webhook-endpoints.controller.js';
import { WebhooksErrorFilter } from './webhooks-error.filter.js';

@Module({
  controllers: [WebhookEndpointsController, WebhookDeliveriesController],
  // Turns the package's errors (a refused URL, another partner's endpoint) into 4xx responses.
  providers: [{ provide: APP_FILTER, useClass: WebhooksErrorFilter }],
})
export class PartnerWebhooksModule {}
```

The delivery log's controller, added to this module [later](/http/webhooks#retries-the-delivery-log-and-replay), gives the partner the other half: what was sent to their endpoints.

#### Send order.shipped and order.cancelled after the commit

`Webhooks.dispatch()` takes your transaction handle first, like `Outbox.add()`: with Drizzle, the `tx` that `db.transaction()` passes its callback, whose type the service gives `Webhooks<Transaction>`. Cancelling an order updates it and dispatches `order.cancelled` on the same `tx`; shipping it (which the carrier triggers, in [Receive the carrier's Stripe-like webhooks](/http/webhooks#receive-the-carriers-stripe-like-webhooks)) updates it and dispatches `order.shipped`. `tenant` is the partner that placed the order, so only that partner's endpoints receive it:

```typescript
@@filename(orders/orders.service)
@Injectable()
export class OrdersService {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly webhooks: Webhooks<Transaction>,
  ) {}

  // ...

  /** Cancels an order that hasn't shipped, and tells the partner in the same transaction. */
  async cancelOrder(partner: Partner, id: string, reason: string): Promise<Order> {
    const order = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, id), eq(orders.partnerId, partner.id)))
        .for('update');
      if (!row) {
        throw new NotFoundException(`Order ${id} not found`);
      }
      if (row.status === 'shipped' || row.status === 'cancelled') {
        throw new ConflictException(`Order ${id} is ${row.status}`);
      }
      await tx.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, id));

      // Drizzle's tx: the webhook is sent only if the cancellation commits, and only to the
      // partner's own endpoints (the tenant).
      const data: OrderCancelled = { orderId: id, reason };
      await this.webhooks.dispatch(tx, { type: 'order.cancelled', tenant: row.partnerId, data });
      return { ...row, status: 'cancelled' as const };
    });

    this.webhooks.notify(); // deliver now instead of at the next poll
    return order;
  }

  // ...

  /** The carrier picked the order up: marks it shipped and tells the partner, in one transaction (the carrier's webhook). */
  async markShipped(tx: Transaction, orderId: string, trackingNumber: string): Promise<Order> {
    const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');
    if (!row) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (row.status !== 'paid') {
      throw new ConflictException(`Order ${orderId} is ${row.status}, not paid`);
    }
    await tx.update(orders).set({ status: 'shipped', trackingNumber }).where(eq(orders.id, orderId));

    const data: OrderShipped = { orderId, trackingNumber };
    await this.webhooks.dispatch(tx, { type: 'order.shipped', tenant: row.partnerId, data });
    return { ...row, status: 'shipped', trackingNumber };
  }
}
```

Nothing leaves the process inside the transaction. If it rolls back, the message never existed. If it commits, the outbox relay picks the message up (`notify()` asks it to do so now instead of at its next poll) and hands it to the package's fan-out, which creates one delivery per enabled endpoint of the tenant that subscribed to the type. The worker then signs and sends each. This is what Northside's server receives, on every attempt of the delivery, with the same `webhook-id` and the exact body that was serialized at `dispatch()`:

```http
POST /store/webhooks HTTP/1.1
content-type: application/json
user-agent: NestJS-Webhooks/1.0
webhook-id: msg_01a0f33b898e7341950339801ec3319a
webhook-timestamp: 1790787160
webhook-signature: v1,<base64 HMAC-SHA256 of "msg_01a0f33b898e7341950339801ec3319a.1790787160.{the body}">

{"type":"order.shipped","timestamp":"2026-09-30T16:52:40.462Z","data":{"orderId":"1067d04c-0617-44ac-9a29-67297867329e","trackingNumber":"TRK-4471-0001"}}
```

The signature is keyed with the endpoint's secret, so the partner can verify it with any Standard Webhooks library. Or with this package: Northside's receiver is a Nest application of its own, with its own root module, that only receives, with `outgoing: false`, and `@VerifyWebhook('store')` on its route. `STORE_WEBHOOK_SECRET` takes a comma-separated list, because the store's [rotation](/http/webhooks#rotate-secrets) signs with two secrets for a day:

```typescript
@@filename(partner-service/app.module)
import { Module } from '@nestjs/common';
import { OutboxModule } from '@nestjs/outbox';
import { WebhooksModule } from '@nestjs/webhooks';
import { StoreWebhooksController } from './store-webhooks.controller.js';

/**
 * Northside's side: a service that only receives. `outgoing: false` leaves out the
 * endpoints, deliveries and worker. The outbox's inbox deduplicates redeliveries by
 * webhook-id; in memory here, on the partner's own database in production (the outbox's
 * store, as in the outbox tutorial's analytics service).
 */
@Module({
  imports: [
    OutboxModule.forRoot({ relay: { enabled: false } }),
    WebhooksModule.forRootAsync({
      outgoing: false,
      useFactory: () => {
        const secrets = process.env.STORE_WEBHOOK_SECRET;
        if (!secrets) {
          throw new Error('Set STORE_WEBHOOK_SECRET to the secret the store gave this endpoint');
        }
        return {
          receivers: {
            // Every listed secret is tried: keep the old one next to the new one while the store rotates.
            store: { scheme: 'standard', secret: secrets.split(',') },
          },
        };
      },
    }),
  ],
  controllers: [StoreWebhooksController],
})
export class AppModule {}
```

```typescript
@@filename(partner-service/store-webhooks.controller)
import { Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { IncomingWebhook, VerifyWebhook } from '@nestjs/webhooks';

/** What the store sends: the Standard Webhooks payload, `type`, `timestamp` and `data`. */
export type StoreEvent =
  | { type: 'order.shipped'; timestamp: string; data: { orderId: string; trackingNumber: string } }
  | { type: 'order.cancelled'; timestamp: string; data: { orderId: string; reason: string } };

@Controller('store')
export class StoreWebhooksController {
  private readonly logger = new Logger(StoreWebhooksController.name);

  @Post('webhooks')
  @HttpCode(HttpStatus.NO_CONTENT)
  @VerifyWebhook('store')
  receive(@IncomingWebhook() webhook: IncomingWebhook<StoreEvent>) {
    const event = webhook.payload;
    if (event.type === 'order.shipped') {
      this.logger.log(`Order ${event.data.orderId} shipped, tracking ${event.data.trackingNumber} (${webhook.id})`);
    } else {
      this.logger.log(`Order ${event.data.orderId} cancelled: ${event.data.reason} (${webhook.id})`);
    }
  }
}
```

```typescript
@@filename(partner-service/main)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // rawBody: the signature is checked on the bytes the store signed, not on a re-serialized body.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 4100);
}
await bootstrap();
```

The partner's `OutboxModule` provides the inbox that `@VerifyWebhook()` deduplicates with. It runs in memory here; a real partner registers the outbox's store on its own database, `PostgresOutboxStore` on PostgreSQL, as the analytics service does in [the outbox tutorial](/reliability/outbox#publish-to-the-analytics-microservice).

#### Retries, the delivery log and replay

A 2xx from the partner is a success. Anything else is a failed attempt: a 5xx, a 4xx, a 3xx (redirects are never followed), a timeout, a refused connection. The worker retries after the backoff, honors a `Retry-After` header in seconds or as an HTTP date (up to the backoff's cap, a day; any other value is ignored), and on a 429, 502, 503 or 504 pauses that endpoint until then, five seconds without a header: its other deliveries wait without an attempt, so a partner asking for a breather gets one probe, not one per batch, while the other partners' deliveries go on. Three answers end a delivery early: a 410 Gone, which also disables the endpoint (`gone`); a destination the transport refuses (the subscription checks, run again at every send, because DNS changes); and `retry.retryIf` saying no. After the last attempt, the delivery is `failed` with the reason `exhausted`.

An endpoint that fails every attempt for `disableEndpointAfter` is disabled with the reason `failing`, and `WebhooksEvents` emits `endpoint-disabled`: tell the partner. A success at any point resets the clock. A disabled endpoint, whether by the worker or by the partner (`enabled: false` in the subscription `update()`), gets no delivery for anything dispatched while it stays disabled: the fan-out skips it, and nothing creates those deliveries later. A replay doesn't either, because it re-sends deliveries that exist. What does exist are the deliveries that were pending when the endpoint was disabled: they fail with the reason `endpoint-disabled` when their turn comes, and after re-enabling, the partner can ask for those again, as the failed deliveries they are. Re-enabling forgets the failures, and the endpoint receives what is dispatched from then on.

Every attempt is logged: the status code, the duration, the first 4 KB of the response body, the error. The partner reads its own log, and asks for a delivery to be sent again, one or every failed one since an outage began. The bulk retry takes an endpoint and the start of the outage, both optional:

```typescript
@@filename(partner-webhooks/webhook-deliveries.dto)
import { IsISO8601, IsOptional, IsString } from 'class-validator';

/** Body of `POST /partner/webhook-deliveries/retry`: every failed delivery since an outage began. */
export class RetryDeliveriesDto {
  /** One endpoint's, or every endpoint's. */
  @IsOptional()
  @IsString()
  endpointId?: string;

  /** Deliveries created at or after this time (ISO 8601): the start of the outage. */
  @IsOptional()
  @IsISO8601()
  since?: string;
}
```

```typescript
@@filename(partner-webhooks/webhook-deliveries.schemas)
import { z } from 'zod';

/** Body of `POST /partner/webhook-deliveries/retry`: every failed delivery since an outage began. */
export const retryDeliveriesSchema = z.object({
  /** One endpoint's, or every endpoint's. */
  endpointId: z.string().optional(),
  /** Deliveries created at or after this time (ISO 8601): the start of the outage. */
  since: z.iso.datetime().optional(),
});
export type RetryDeliveriesDto = z.infer<typeof retryDeliveriesSchema>;
```

```typescript
@@filename(partner-webhooks/webhook-deliveries.controller)
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WebhookDeliveries, type WebhookDeliveryStatus } from '@nestjs/webhooks';
import { CurrentPartner, PartnerGuard, type Partner } from '../partners/partner.guard.js';
import { RetryDeliveriesDto } from './webhook-deliveries.dto.js';

/** A partner's delivery log: what was sent, how each attempt went, and a way to ask for it again. */
@Controller('partner/webhook-deliveries')
@UseGuards(PartnerGuard)
export class WebhookDeliveriesController {
  constructor(private readonly webhookDeliveries: WebhookDeliveries) {}

  /** Newest first. */
  @Get()
  list(
    @CurrentPartner() partner: Partner,
    @Query('endpointId') endpointId?: string,
    @Query('status') status?: WebhookDeliveryStatus,
    @Query('type') type?: string,
  ) {
    return this.webhookDeliveries.list({ tenant: partner.id, endpointId, status, type });
  }

  /** The delivery, the message that was sent, and every attempt: status code, duration, the start of the response. */
  @Get(':id')
  async get(@CurrentPartner() partner: Partner, @Param('id') id: string) {
    const delivery = await this.webhookDeliveries.get(id, { tenant: partner.id });
    if (!delivery) {
      throw new NotFoundException(`Webhook delivery ${id} not found`);
    }
    return delivery;
  }

  /** Sends one delivery again, now, with the same webhook-id: a replay of a lost webhook, or a retry of a failed one. */
  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  async retry(@CurrentPartner() partner: Partner, @Param('id') id: string) {
    return { retried: await this.webhookDeliveries.retry(id, { tenant: partner.id }) };
  }

  /** Retries every failed delivery, of one endpoint or all, since an outage began. */
  @Post('retry')
  @HttpCode(HttpStatus.OK)
  async retryFailed(@CurrentPartner() partner: Partner, @Body() dto: RetryDeliveriesDto) {
    const since = dto.since === undefined ? undefined : new Date(dto.since);
    const retried = await this.webhookDeliveries.retry(
      { endpointId: dto.endpointId, status: 'failed', since },
      { tenant: partner.id },
    );
    return { retried };
  }
}
```

With the Zod schema:

```typescript
@@filename(partner-webhooks/webhook-deliveries.controller)
import { retryDeliveriesSchema, type RetryDeliveriesDto } from './webhook-deliveries.schemas.js';
// ...
@Post('retry')
@HttpCode(HttpStatus.OK)
async retryFailed(@CurrentPartner() partner: Partner, @Body({ schema: retryDeliveriesSchema }) dto: RetryDeliveriesDto) {
  // ...
}
```

A retry starts a new round: `attempts` back to 0, sent now, with the same `webhook-id` and the same body. The log of the earlier rounds stays. Because the id is the same, a partner whose inbox kept it answers 2xx without running its handler, so a replay is safe for a delivered webhook too: Northside can ask for the last hour again after losing its own database, and get only what it hasn't processed.

Operators get the same through `WebhookDeliveries` without a tenant: `stats()` (pending, due, leased and failed counts, and `lagMs`, how long the most overdue delivery has waited, the number to alert on), `retry()` across tenants, and `prune('30d')`, which nothing calls for you. `WebhooksEvents.events$` emits `delivered`, `retry-scheduled`, `delivery-failed`, `endpoint-disabled` and `destination-blocked`, each also on a `node:diagnostics_channel` channel named `nestjs:webhooks:<event>`.

#### Receive the payment provider's webhooks

The payment provider tells the store that a payment went through with a Standard Webhooks request. Verifying it needs the body exactly as the provider signed it, so the application is created with `rawBody: true`. That works on Express and on Fastify:

```typescript
@@filename(main)
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // rawBody: incoming webhooks are verified on the bytes that were signed, not on a re-serialized body.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  // The partner API's DTOs; whitelist: properties without a decorator are dropped.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // On SIGTERM the outbox relay and the webhook worker finish what they started.
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

The sender goes into the module's `receivers`, by the name the route will use. The payment provider's secret is the one it shows in its dashboard:

```typescript
@@filename(app.module)
// The senders whose webhooks this API accepts, by the name @VerifyWebhook() uses.
receivers: {
  // The payment provider follows Standard Webhooks: webhook-id, webhook-timestamp, webhook-signature.
  payments: { scheme: 'standard', secret: process.env.PAYMENTS_WEBHOOK_SECRET! },
  // The carrier copied Stripe's scheme under its own header: Carrier-Signature: t=...,v1=...
  carrier: { scheme: 'stripe', header: 'Carrier-Signature', secret: process.env.CARRIER_WEBHOOK_SECRET! },
},
```

`@VerifyWebhook('payments')` on the route verifies the request before the handler runs, and `@IncomingWebhook()` gives what was verified: the sender's `id` for the webhook, the signed `timestamp`, the `payload` parsed from the signed bytes, and `processInTransaction()`:

```typescript
@@filename(provider-webhooks/payment-provider-webhooks.controller)
import { Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { IncomingWebhook, VerifyWebhook } from '@nestjs/webhooks';
import type { Database } from '../database/drizzle.js';
import { OrdersService } from '../orders/orders.service.js';

/** The payment provider's payload: the Standard Webhooks shape, `type`, `timestamp` and `data`. */
export interface PaymentProviderEvent {
  type: 'payment.succeeded' | 'payment.failed';
  timestamp: string;
  data: { paymentId: string; orderId: string; amount: number };
}

@Controller('webhooks/payments')
export class PaymentProviderWebhooksController {
  private readonly logger = new Logger(PaymentProviderWebhooksController.name);

  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @VerifyWebhook('payments')
  async receive(@IncomingWebhook() webhook: IncomingWebhook<PaymentProviderEvent>) {
    const { type, data } = webhook.payload;
    if (type !== 'payment.succeeded') {
      this.logger.log(`Ignoring ${type} for order ${data.orderId}`);
      return;
    }
    // Exactly once: the webhook's id is recorded in the same transaction as the order's new
    // status, so a redelivery, even one racing this request on another instance, changes nothing.
    const result = await this.db.transaction(async (tx) =>
      webhook.processInTransaction(tx, () => this.ordersService.markPaid(tx, data.orderId, data.paymentId, data.amount)),
    );
    if (!result.duplicate) {
      this.logger.log(`Order ${data.orderId} paid: ${data.paymentId}, ${data.amount} cents`);
    }
  }
}
```

```typescript
@@filename(orders/orders.service)
/** The payment provider confirmed the payment. Runs inside the receiver's transaction. */
async markPaid(tx: Transaction, orderId: string, paymentId: string, amount: number): Promise<Order> {
  const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');
  if (!row) {
    throw new NotFoundException(`Order ${orderId} not found`);
  }
  if (row.status !== 'placed') {
    throw new ConflictException(`Order ${orderId} is ${row.status}`);
  }
  if (amount !== row.total) {
    throw new ConflictException(`Payment ${paymentId} is for ${amount}, and order ${orderId} totals ${row.total}`);
  }
  await tx.update(orders).set({ status: 'paid', paymentId }).where(eq(orders.id, orderId));
  return { ...row, status: 'paid', paymentId };
}
```

```typescript
@@filename(provider-webhooks/provider-webhooks.module)
import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { CarrierWebhooksController } from './carrier-webhooks.controller.js';
import { PaymentProviderWebhooksController } from './payment-provider-webhooks.controller.js';

/** The webhooks the store receives: the payment provider's payments and the carrier's shipments. */
@Module({
  imports: [OrdersModule],
  controllers: [PaymentProviderWebhooksController, CarrierWebhooksController],
})
export class ProviderWebhooksModule {}
```

What the decorator checks, in order: the three `webhook-` headers are present and well formed, with a `webhook-id` of at most 255 characters, counted in code points; one `v1,` signature in `webhook-signature` matches the HMAC of `id.timestamp.body` with one of the configured secrets (compared in constant time; several secrets can be listed while the payment provider rotates); the signed timestamp is within 5 minutes of now, in either direction; the body is JSON. A request that fails gets a 401 with a generic message. The reason never goes to the sender; it goes to the `verification-failed` event, with the receiver's name. A signed body that isn't JSON gets a 400 from the framework's body parser before the decorator sees it, so no event is emitted for it.

Then comes deduplication. The payment provider retries until it gets a 2xx, so a timeout after the handler succeeded makes it send the same `webhook-id` again. The receiver keeps an inbox of the ids it processed (the outbox's inbox, consumer `webhooks:payments`): a known id is answered with an empty 200 without running the handler, and an id is recorded only after the handler succeeded, so a handler that threw is run again on the payment provider's retry. Two copies arriving together at one instance run the handler once; two instances receiving them at the same moment could both run it, which is what the next paragraph is for.

`markPaid()` moves money-related state, so the controller goes one step further with `processInTransaction()`: the webhook's id is recorded *through the order's transaction*, and `markPaid()` runs only if it is new. The record and the new status commit together. A redelivery after a crash between the handler and the inbox write, or one racing this request on another instance, finds the id and changes nothing; it resolves with `duplicate` set, which the controller uses to log only once. And when `markPaid()` throws, a payment for the wrong amount, say, the transaction rolls back, the record with it, the sender gets the 409, and its retry gets another chance once the order is fixed.

For development, a small script signs a request the way the payment provider (and, in the next section, the carrier) would, with `signWebhook()` from `@nestjs/webhooks/testing`:

```typescript
@@filename(scripts/send-webhook)
/**
 * Sends the signed request the payment provider or the carrier would send, for trying the API by hand:
 *
 *   npx tsx scripts/send-webhook.ts payments payment.succeeded '{"paymentId":"pay_1","orderId":"...","amount":4998}'
 *   npx tsx scripts/send-webhook.ts carrier shipment.shipped '{"orderId":"...","trackingNumber":"TRK-0001"}'
 *
 * Signs with PAYMENTS_WEBHOOK_SECRET or CARRIER_WEBHOOK_SECRET, the secrets the API was
 * started with, and posts to API_URL (default http://localhost:3000). WEBHOOK_ID sends a
 * redelivery with a given id; TAMPER=1 changes a byte of the body after signing it.
 */
import { signWebhook } from '@nestjs/webhooks/testing';
import { randomUUID } from 'node:crypto';

const [sender, type, json = '{}'] = process.argv.slice(2);
if (sender !== 'payments' && sender !== 'carrier') {
  console.error('usage: send-webhook.ts <payments|carrier> <type> <data as JSON>');
  process.exit(2);
}
const data: unknown = JSON.parse(json);
const id = process.env.WEBHOOK_ID;

function secret(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}`);
  }
  return value;
}

const signed =
  sender === 'payments'
    ? signWebhook({
        scheme: 'standard',
        secret: secret('PAYMENTS_WEBHOOK_SECRET'),
        id,
        payload: { type, timestamp: new Date().toISOString(), data },
      })
    : signWebhook({
        scheme: 'stripe',
        header: 'Carrier-Signature',
        secret: secret('CARRIER_WEBHOOK_SECRET'),
        payload: { id: id ?? `evt_${randomUUID().replaceAll('-', '')}`, type, data },
      });

const body = process.env.TAMPER ? `${signed.body.slice(0, -1)} }` : signed.body;
const response = await fetch(`${process.env.API_URL ?? 'http://localhost:3000'}/webhooks/${sender}`, {
  method: 'POST',
  headers: signed.headers,
  body,
});
console.log(`${response.status} ${await response.text()}`);
```

#### Receive the carrier's Stripe-like webhooks

The carrier copied Stripe's scheme: a `Carrier-Signature: t=…,v1=…` header, the hex HMAC-SHA256 of `t.body` keyed with the secret's text, and the event's id inside the payload. The receiver in the [`receivers` option](/http/webhooks#receive-the-payment-providers-webhooks) says so: `scheme: 'stripe'` with the `header` name. Stripe's own webhooks are the same receiver without `header`. GitHub's, and senders with a scheme of their own, are in [Other senders](/http/webhooks#other-senders).

The handler is the interesting part. Marking the order shipped and telling the partner happen in one transaction: the order's new status, the partner's `order.shipped` message (through the outbox) and this webhook's inbox record commit together, or none of them does:

```typescript
@@filename(provider-webhooks/carrier-webhooks.controller)
import { Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { IncomingWebhook, VerifyWebhook, Webhooks } from '@nestjs/webhooks';
import type { Database } from '../database/drizzle.js';
import { OrdersService } from '../orders/orders.service.js';

/** The carrier's payload, Stripe-like: the event's `id` is in the body, which is what the signature covers. */
export interface CarrierEvent {
  id: string;
  type: 'shipment.shipped' | 'shipment.delivered';
  data: { orderId: string; trackingNumber: string };
}

@Controller('webhooks/carrier')
export class CarrierWebhooksController {
  private readonly logger = new Logger(CarrierWebhooksController.name);

  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly ordersService: OrdersService,
    private readonly webhooks: Webhooks,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @VerifyWebhook('carrier')
  async receive(@IncomingWebhook() webhook: IncomingWebhook<CarrierEvent>) {
    const { type, data } = webhook.payload;
    if (type !== 'shipment.shipped') {
      this.logger.log(`Ignoring ${type} for order ${data.orderId}`);
      return;
    }
    // One transaction: the order's status, the partner's order.shipped webhook (through the
    // outbox) and this webhook's inbox record commit together, or not at all.
    const result = await this.db.transaction(async (tx) =>
      webhook.processInTransaction(tx, () => this.ordersService.markShipped(tx, data.orderId, data.trackingNumber)),
    );
    if (result.duplicate) {
      return;
    }
    this.webhooks.notify(); // deliver order.shipped now instead of at the next poll
    this.logger.log(`Order ${data.orderId} shipped, tracking ${data.trackingNumber}`);
  }
}
```

`markShipped()` is the method from [Send order.shipped and order.cancelled after the commit](/http/webhooks#send-ordershipped-and-ordercancelled-after-the-commit). The deduplication id is the event's `id` from the signed payload, not a header, because that is what Stripe's scheme signs. A `shipment.shipped` event for an order that isn't paid yet is refused with a 409, and nothing is recorded: when the carrier retries it after the payment arrived, the same event id is processed.

#### Other senders

GitHub's webhooks take `scheme: 'github'`: `X-Hub-Signature-256`, the hex HMAC-SHA256 of the body keyed with the secret's text.

> warning **Warning** GitHub signs neither a timestamp nor an id. A captured request verifies forever, and deduplication keys by default on the `X-GitHub-Delivery` header, which isn't signed: the same request replayed with a new value in that header runs the handler again.

Key the deduplication on the signed body instead, with the receiver's `id` option. The payload is parsed from the bytes that were signed, so a replay has the same id as the original, and the inbox skips it:

```typescript
receivers: {
  github: {
    scheme: 'github',
    secret: process.env.GITHUB_WEBHOOK_SECRET!,
    // The signed body, not the unsigned X-GitHub-Delivery header: a replayed request has a known id.
    id: (payload) => createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
  },
},
```

The inbox remembers an id until `OutboxInbox.prune()` removes it, so for GitHub its window is also how long a replay is caught: keep it long. Replayed after that, a request verifies and runs; accepting GitHub's webhooks only from the addresses it publishes (`hooks` in `https://api.github.com/meta`) narrows who can send one.

A sender with a scheme of its own is a class extending `WebhookSignatureScheme`. Say the store also sells through a marketplace, which signs the URL it posts to followed by the body, and puts the event's id in the body:

```typescript
@@filename(provider-webhooks/marketplace.scheme)
import { WebhookSignatureScheme, type WebhookSignatureCheck, type WebhookSignedRequest } from '@nestjs/webhooks';
import { createHmac } from 'node:crypto';

/**
 * The marketplace's scheme: `X-Marketplace-Signature` is the base64 HMAC-SHA256 of the URL it
 * posts to followed by the body, keyed with the secret's text, and the event's id is in the body.
 * A scheme sees the request's headers and raw body, so the URL comes in through the constructor:
 * the one registered in the marketplace's dashboard.
 */
export class MarketplaceScheme extends WebhookSignatureScheme {
  constructor(private readonly url: string) {
    super();
  }

  verify({ headers, rawBody }: WebhookSignedRequest, keys: readonly Buffer[]): WebhookSignatureCheck {
    const signature = headers['x-marketplace-signature'];
    if (signature === undefined) {
      return { valid: false, reason: 'missing-header', detail: 'no x-marketplace-signature header' };
    }
    if (typeof signature !== 'string') {
      return { valid: false, reason: 'malformed-header', detail: 'x-marketplace-signature is repeated' };
    }

    const candidates = [Buffer.from(signature, 'base64')];
    for (const key of keys) {
      const expected = createHmac('sha256', key).update(this.url).update(rawBody).digest();
      // In constant time, never with ===.
      if (WebhookSignatureScheme.matches(expected, candidates)) {
        return { valid: true };
      }
    }
    return { valid: false, reason: 'invalid-signature', detail: 'no signature matches a configured secret' };
  }

  /** The deduplication id: the event's, from the signed body. */
  override idFromPayload(payload: unknown): string | undefined {
    const id = (payload as { eventId?: unknown } | null)?.eventId;
    return typeof id === 'string' ? id : undefined;
  }
}
```

- `verify(request, keys)` gets the request's `headers` (lower-case names) and its `rawBody`, as received, and one key per configured secret. It returns `valid: true`, with the sender's `id` when a header carries one and the signed `timestamp` in epoch seconds when the scheme signs one (the receiver's `tolerance` then applies), or `valid: false` with a `reason` for the `verification-failed` event and a `detail`. It runs synchronously, before the body is parsed as JSON.
- `WebhookSignatureScheme.matches(expected, candidates)` compares in constant time. Never compare signatures with `===`.
- `idFromPayload(payload, headers)` gives the deduplication id when no header carries one, from the parsed body, as the built-in Stripe scheme does with the event's `id`. An id longer than 255 characters, from either, is refused with `malformed-header`.
- `key(secret)` turns each configured secret into the key `verify()` receives, once, at startup, where a malformed secret stops the application. The default takes the secret's text and refuses an empty one or one with surrounding whitespace. Override it for an encoded secret, as the `standard` scheme does for `whsec_…`.

The receiver takes an instance:

```typescript
receivers: {
  marketplace: {
    scheme: new MarketplaceScheme('https://api.store.example.com/webhooks/marketplace'),
    secret: process.env.MARKETPLACE_WEBHOOK_SECRET!,
  },
},
```

#### Rotate secrets

A secret leaks, or a partner's policy says a year is enough. `POST /partner/webhook-endpoints/:id/rotate-secret` (see [Let partners subscribe](/http/webhooks#let-partners-subscribe)) returns a new secret, and the old one keeps signing next to it for `secretRotationOverlap`, 24 hours: every delivery carries two `v1,` signatures, and a Standard Webhooks verifier accepts any one that matches. The partner adds the new secret to its list, deploys, removes the old one, on its own schedule. After the overlap, only the new secret signs. `rotateSecret()` with `overlap: 0` retires the old one at once, for a leaked secret.

Set `WEBHOOKS_ENCRYPTION_KEYS` to seal the secrets at rest, `openssl rand -base64 32` for each key, newest first. Endpoints created before are still read (their secrets are plaintext) and sealed at their next rotation.

#### Try it

Create the database, and apply your migrations to it, which create the order API's tables and rows from [Installation](/http/webhooks#installation):

```bash
$ psql postgres://localhost:5432/postgres -c 'CREATE DATABASE store'
```

Export the secrets the payment provider and the carrier share with the store (invented here), allow deliveries to this machine, and start the API on port 3000:

```bash
$ export PAYMENTS_WEBHOOK_SECRET=whsec_$(openssl rand -base64 32)
$ export CARRIER_WEBHOOK_SECRET=carrier_test_$(openssl rand -hex 6)
$ export WEBHOOKS_ALLOW_LOCAL=1
```

```bash
[Nest] 55905  - 09/30/2026, 6:52:36 PM     LOG [OutboxModule] OutboxStorage: PostgresOutboxStore
[Nest] 55905  - 09/30/2026, 6:52:36 PM     LOG [WebhooksModule] WebhooksStorage: PostgresWebhookStore
[Nest] 55905  - 09/30/2026, 6:52:36 PM     LOG [OutboxModule] PostgresOutboxStore: migrated schema "nest_outbox" to version 1.
[Nest] 55905  - 09/30/2026, 6:52:36 PM     LOG [WebhooksModule] PostgresWebhookStore: migrated schema "nest_webhooks" to version 1.
[Nest] 55905  - 09/30/2026, 6:52:36 PM     LOG [NestApplication] Nest application successfully started +2ms
```

Your migrations created the order API's tables, and the stores their schemas, next to them. Northside subscribes, with its API key, to both events at a receiver it will run on port 4100. The response carries the secret, this once:

```bash
$ curl -s -X POST localhost:3000/partner/webhook-endpoints \
    -H 'Authorization: Bearer partner_northside_7c1d2e' \
    --json '{"url":"http://127.0.0.1:4100/store/webhooks","eventTypes":["order.shipped","order.cancelled"],"description":"Warehouse system"}'
{"id":"ep_01a0f33b79e27154b8fd089a10f3e48e","tenant":"northside","url":"http://127.0.0.1:4100/store/webhooks","eventTypes":["order.shipped","order.cancelled"],"description":"Warehouse system","enabled":true,"disabledReason":null,"failingSince":null,"createdAt":1790787156450,"updatedAt":1790787156450,"secret":"whsec_yKaIEKkc0ZpOWofM8Fx1Wc5yxdffKSsP1jolLCynqug="}
$ curl -s localhost:3000/partner/webhook-endpoints -H 'Authorization: Bearer partner_northside_7c1d2e'
[{"id":"ep_01a0f33b79e27154b8fd089a10f3e48e","tenant":"northside","url":"http://127.0.0.1:4100/store/webhooks","eventTypes":["order.shipped","order.cancelled"],"description":"Warehouse system","enabled":true,"disabledReason":null,"failingSince":null,"createdAt":1790787156450,"updatedAt":1790787156450}]
```

> info **Hint** `--json` needs curl 7.82 or later.

The URL of a cloud metadata service is refused before anything is stored, and so is an event type the API doesn't send. Riverside Cat Shelter, the other partner, gets a 404 for Northside's endpoint:

```bash
$ curl -s -X POST localhost:3000/partner/webhook-endpoints \
    -H 'Authorization: Bearer partner_northside_7c1d2e' \
    --json '{"url":"https://169.254.169.254/latest/meta-data/","eventTypes":["*"]}'
{"statusCode":400,"message":"Invalid webhook URL: 169.254.169.254 is link-local (cloud metadata)"}
$ curl -s -X POST localhost:3000/partner/webhook-endpoints \
    -H 'Authorization: Bearer partner_northside_7c1d2e' \
    --json '{"url":"https://hooks.northside.example.com/store","eventTypes":["order.paid"]}'
{"statusCode":400,"message":"Unknown message type \"order.paid\". Known: order.shipped, order.cancelled"}
$ curl -s -o /dev/null -w '%{http_code}' localhost:3000/partner/webhook-endpoints/ep_01a0f33b79e27154b8fd089a10f3e48e \
    -H 'Authorization: Bearer partner_riverside_91ab44'
404
```

Start Northside's receiver, `partner-service/main.ts`, on port 4100, with the secret it was given in its environment:

```bash
STORE_WEBHOOK_SECRET=whsec_yKaIEKkc0ZpOWofM8Fx1Wc5yxdffKSsP1jolLCynqug=
```

Now place an order, and let the payment provider pay for it and the carrier ship it. The script signs the requests they would send, with the secrets exported above:

```bash
$ curl -s -X POST localhost:3000/orders \
    -H 'Authorization: Bearer partner_northside_7c1d2e' \
    --json '{"items":[{"productId":"salmon-kibble-2kg","quantity":2}]}'
{"id":"1067d04c-0617-44ac-9a29-67297867329e","partnerId":"northside","items":[{"productId":"salmon-kibble-2kg","quantity":2,"price":2499}],"total":4998,"status":"placed","paymentId":null,"trackingNumber":null}
$ npx tsx scripts/send-webhook.ts payments payment.succeeded \
    '{"paymentId":"pay_8f21c","orderId":"1067d04c-0617-44ac-9a29-67297867329e","amount":4998}'
200
$ npx tsx scripts/send-webhook.ts carrier shipment.shipped \
    '{"orderId":"1067d04c-0617-44ac-9a29-67297867329e","trackingNumber":"TRK-4471-0001"}'
200
$ curl -s localhost:3000/orders/1067d04c-0617-44ac-9a29-67297867329e -H 'Authorization: Bearer partner_northside_7c1d2e'
{"id":"1067d04c-0617-44ac-9a29-67297867329e","partnerId":"northside","items":[{"price":2499,"quantity":2,"productId":"salmon-kibble-2kg"}],"total":4998,"status":"shipped","paymentId":"pay_8f21c","trackingNumber":"TRK-4471-0001"}
```

The API's log shows both webhooks processed, and Northside's log shows `order.shipped` arriving right after the carrier's, with its `webhook-id`:

```bash
[Nest] 55905  - 09/30/2026, 6:52:39 PM     LOG [PaymentProviderWebhooksController] Order 1067d04c-0617-44ac-9a29-67297867329e paid: pay_8f21c, 4998 cents
[Nest] 55905  - 09/30/2026, 6:52:40 PM     LOG [CarrierWebhooksController] Order 1067d04c-0617-44ac-9a29-67297867329e shipped, tracking TRK-4471-0001
```

```bash
[Nest] 56040  - 09/30/2026, 6:52:40 PM     LOG [StoreWebhooksController] Order 1067d04c-0617-44ac-9a29-67297867329e shipped, tracking TRK-4471-0001 (msg_01a0f33b898e7341950339801ec3319a)
```

Northside's delivery log has the delivery, and its details have the message and the one attempt, with the partner's status code and how long it took:

```bash
$ curl -s localhost:3000/partner/webhook-deliveries -H 'Authorization: Bearer partner_northside_7c1d2e'
[{"id":"dlv_01a0f33b89ac720aa76e2c3da97f3c14","messageId":"msg_01a0f33b898e7341950339801ec3319a","endpointId":"ep_01a0f33b79e27154b8fd089a10f3e48e","tenant":"northside","type":"order.shipped","status":"succeeded","attempts":1,"nextAttemptAt":null,"lastAttemptAt":1790787160533,"lastStatusCode":204,"lastError":null,"failureReason":null,"createdAt":1790787160462,"completedAt":1790787160544}]
$ curl -s localhost:3000/partner/webhook-deliveries/dlv_01a0f33b89ac720aa76e2c3da97f3c14 -H 'Authorization: Bearer partner_northside_7c1d2e'
```

```json
{
  "id": "dlv_01a0f33b89ac720aa76e2c3da97f3c14",
  "messageId": "msg_01a0f33b898e7341950339801ec3319a",
  "endpointId": "ep_01a0f33b79e27154b8fd089a10f3e48e",
  "tenant": "northside",
  "type": "order.shipped",
  "status": "succeeded",
  "attempts": 1,
  "nextAttemptAt": null,
  "lastAttemptAt": 1790787160533,
  "lastStatusCode": 204,
  "lastError": null,
  "failureReason": null,
  "createdAt": 1790787160462,
  "completedAt": 1790787160544,
  "message": {
    "id": "msg_01a0f33b898e7341950339801ec3319a",
    "type": "order.shipped",
    "tenant": "northside",
    "body": "{\"type\":\"order.shipped\",\"timestamp\":\"2026-09-30T16:52:40.462Z\",\"data\":{\"orderId\":\"1067d04c-0617-44ac-9a29-67297867329e\",\"trackingNumber\":\"TRK-4471-0001\"}}",
    "createdAt": 1790787160462
  },
  "history": [
    { "deliveryId": "dlv_01a0f33b89ac720aa76e2c3da97f3c14", "attempt": 1, "at": 1790787160533, "durationMs": 11, "statusCode": 204, "response": "", "error": null }
  ]
}
```

Stop Northside's receiver with `Ctrl+C`, then place an order and cancel it. The delivery fails to connect, the API logs the wait before the next attempt, and the partner's log shows the delivery pending with its error:

```bash
$ curl -s -X POST localhost:3000/orders \
    -H 'Authorization: Bearer partner_northside_7c1d2e' \
    --json '{"items":[{"productId":"clumping-litter-10l","quantity":1}]}'
{"id":"d6a36832-6b83-40f6-960b-0c6aa905ae18","partnerId":"northside","items":[{"productId":"clumping-litter-10l","quantity":1,"price":1599}],"total":1599,"status":"placed","paymentId":null,"trackingNumber":null}
$ curl -s -X POST localhost:3000/orders/d6a36832-6b83-40f6-960b-0c6aa905ae18/cancel \
    -H 'Authorization: Bearer partner_northside_7c1d2e' \
    --json '{"reason":"out of stock"}'
{"id":"d6a36832-6b83-40f6-960b-0c6aa905ae18","partnerId":"northside","items":[{"price":1599,"quantity":1,"productId":"clumping-litter-10l"}],"total":1599,"status":"cancelled","paymentId":null,"trackingNumber":null}
$ curl -s 'localhost:3000/partner/webhook-deliveries?status=pending' -H 'Authorization: Bearer partner_northside_7c1d2e'
[{"id":"dlv_01a0f33b8f51724da606406a85418fab","messageId":"msg_01a0f33b8f367090b44d3de36eed8f13","endpointId":"ep_01a0f33b79e27154b8fd089a10f3e48e","tenant":"northside","type":"order.cancelled","status":"pending","attempts":1,"nextAttemptAt":1790787164580,"lastAttemptAt":1790787161969,"lastStatusCode":null,"lastError":"Error: connect ECONNREFUSED 127.0.0.1:4100","failureReason":null,"createdAt":1790787161910,"completedAt":null}]
```

```bash
[Nest] 55905  - 09/30/2026, 6:52:42 PM    WARN [WebhookWorker] Retrying webhook delivery dlv_01a0f33b8f51724da606406a85418fab (order.cancelled) in 2609ms (attempt 1 of 10 failed): Error: connect ECONNREFUSED 127.0.0.1:4100
```

Start the receiver again. The retry goes through, and the log keeps both attempts:

```bash
[Nest] 56304  - 09/30/2026, 6:52:45 PM     LOG [StoreWebhooksController] Order d6a36832-6b83-40f6-960b-0c6aa905ae18 cancelled: out of stock (msg_01a0f33b8f367090b44d3de36eed8f13)
```

```bash
$ curl -s localhost:3000/partner/webhook-deliveries/dlv_01a0f33b8f51724da606406a85418fab -H 'Authorization: Bearer partner_northside_7c1d2e'
```

```json
{
  "id": "dlv_01a0f33b8f51724da606406a85418fab",
  "type": "order.cancelled",
  "status": "succeeded",
  "attempts": 2,
  "lastStatusCode": 204,
  "history": [
    { "attempt": 1, "at": 1790787161969, "durationMs": 2, "statusCode": null, "response": null, "error": "Error: connect ECONNREFUSED 127.0.0.1:4100" },
    { "attempt": 2, "at": 1790787165060, "durationMs": 11, "statusCode": 204, "response": "", "error": null }
  ]
}
```

Northside asks for that delivery again. It is sent with the same `webhook-id`, the receiver's inbox recognizes it and answers 204 without running the handler (nothing new in its log), and the delivery log shows a new round:

```bash
$ curl -s -X POST localhost:3000/partner/webhook-deliveries/dlv_01a0f33b8f51724da606406a85418fab/retry \
    -H 'Authorization: Bearer partner_northside_7c1d2e'
{"retried":1}
$ curl -s localhost:3000/partner/webhook-deliveries/dlv_01a0f33b8f51724da606406a85418fab -H 'Authorization: Bearer partner_northside_7c1d2e'
```

```json
{
  "status": "succeeded",
  "attempts": 1,
  "history": [
    { "attempt": 1, "at": 1790787161969, "statusCode": null, "error": "Error: connect ECONNREFUSED 127.0.0.1:4100" },
    { "attempt": 2, "at": 1790787165060, "statusCode": 204, "error": null },
    { "attempt": 1, "at": 1790787166185, "statusCode": 204, "error": null }
  ]
}
```

Now the payment provider's side. A redelivery with the same `webhook-id` (a lost 200, so the provider retried) is answered but not processed again: the API logs one payment. A tampered body and a wrong secret are refused, without a reason:

```bash
$ curl -s -X POST localhost:3000/orders \
    -H 'Authorization: Bearer partner_northside_7c1d2e' \
    --json '{"items":[{"productId":"salmon-kibble-2kg","quantity":1}]}'
{"id":"d7dbe1ab-c408-4688-9e9e-2925ed2025a3","partnerId":"northside","items":[{"productId":"salmon-kibble-2kg","quantity":1,"price":2499}],"total":2499,"status":"placed","paymentId":null,"trackingNumber":null}
$ WEBHOOK_ID=msg_2c9e4f1a npx tsx scripts/send-webhook.ts payments payment.succeeded \
    '{"paymentId":"pay_9d0a2","orderId":"d7dbe1ab-c408-4688-9e9e-2925ed2025a3","amount":2499}'
200
$ WEBHOOK_ID=msg_2c9e4f1a npx tsx scripts/send-webhook.ts payments payment.succeeded \
    '{"paymentId":"pay_9d0a2","orderId":"d7dbe1ab-c408-4688-9e9e-2925ed2025a3","amount":2499}'
200
$ TAMPER=1 npx tsx scripts/send-webhook.ts payments payment.succeeded \
    '{"paymentId":"pay_9d0a2","orderId":"d7dbe1ab-c408-4688-9e9e-2925ed2025a3","amount":2499}'
401 {"message":"Webhook signature verification failed","error":"Unauthorized","statusCode":401}
$ PAYMENTS_WEBHOOK_SECRET=whsec_$(openssl rand -base64 32) npx tsx scripts/send-webhook.ts payments payment.succeeded \
    '{"paymentId":"pay_9d0a2","orderId":"d7dbe1ab-c408-4688-9e9e-2925ed2025a3","amount":2499}'
401 {"message":"Webhook signature verification failed","error":"Unauthorized","statusCode":401}
```

```bash
[Nest] 55905  - 09/30/2026, 6:52:48 PM     LOG [PaymentProviderWebhooksController] Order d7dbe1ab-c408-4688-9e9e-2925ed2025a3 paid: pay_9d0a2, 2499 cents
```

Finally, rotate the endpoint's secret. The receiver still runs with the old one, and the next delivery verifies anyway: it carries both signatures. Then restart the receiver with the new secret listed first and the old one behind it, as a partner would deploy it, and place and cancel another order: that delivery verifies too:

```bash
$ curl -s -X POST localhost:3000/partner/webhook-endpoints/ep_01a0f33b79e27154b8fd089a10f3e48e/rotate-secret \
    -H 'Authorization: Bearer partner_northside_7c1d2e'
{"secret":"whsec_BUPv/LlKhv9qDH7udP3gsGPquuj4WaopeP8fxyouWOk="}
$ curl -s -X POST localhost:3000/orders/d7dbe1ab-c408-4688-9e9e-2925ed2025a3/cancel \
    -H 'Authorization: Bearer partner_northside_7c1d2e' \
    --json '{"reason":"customer changed their mind"}'
{"id":"d7dbe1ab-c408-4688-9e9e-2925ed2025a3","partnerId":"northside","items":[{"price":2499,"quantity":1,"productId":"salmon-kibble-2kg"}],"total":2499,"status":"cancelled","paymentId":"pay_9d0a2","trackingNumber":null}
```

```bash
[Nest] 56304  - 09/30/2026, 6:52:50 PM     LOG [StoreWebhooksController] Order d7dbe1ab-c408-4688-9e9e-2925ed2025a3 cancelled: customer changed their mind (msg_01a0f33bb022712e8e440b7adef8208f)
```

```bash
STORE_WEBHOOK_SECRET=whsec_BUPv/LlKhv9qDH7udP3gsGPquuj4WaopeP8fxyouWOk=,whsec_yKaIEKkc0ZpOWofM8Fx1Wc5yxdffKSsP1jolLCynqug=
```

```bash
$ curl -s -X POST localhost:3000/orders \
    -H 'Authorization: Bearer partner_northside_7c1d2e' \
    --json '{"items":[{"productId":"clumping-litter-10l","quantity":2}]}'
{"id":"d203fd6f-7396-489b-9d20-775cd8a6ca4e","partnerId":"northside","items":[{"productId":"clumping-litter-10l","quantity":2,"price":1599}],"total":3198,"status":"placed","paymentId":null,"trackingNumber":null}
$ curl -s -X POST localhost:3000/orders/d203fd6f-7396-489b-9d20-775cd8a6ca4e/cancel \
    -H 'Authorization: Bearer partner_northside_7c1d2e' \
    --json '{"reason":"ordered twice"}'
{"id":"d203fd6f-7396-489b-9d20-775cd8a6ca4e","partnerId":"northside","items":[{"price":1599,"quantity":2,"productId":"clumping-litter-10l"}],"total":3198,"status":"cancelled","paymentId":null,"trackingNumber":null}
```

```bash
[Nest] 56624  - 09/30/2026, 6:52:52 PM     LOG [StoreWebhooksController] Order d203fd6f-7396-489b-9d20-775cd8a6ca4e cancelled: ordered twice (msg_01a0f33bb8ad7249a0fa069361100c49)
```

The deliveries are rows in your database, in the store's schema:

```bash
$ psql "$DATABASE_URL" -c "SELECT type, status, attempts, last_status_code FROM nest_webhooks.deliveries ORDER BY created_at"
      type       |  status   | attempts | last_status_code
-----------------+-----------+----------+------------------
 order.shipped   | succeeded |        1 |              204
 order.cancelled | succeeded |        1 |              204
 order.cancelled | succeeded |        1 |              204
 order.cancelled | succeeded |        1 |              204
(4 rows)
```

#### Testing

In an e2e test, run PostgreSQL in-process with [PGlite](https://pglite.dev) and your real migrations, turn the relay and the worker off, replace the transport with the one that records requests, and sign the providers' requests with `signWebhook()`. Override the database `DrizzleModule` registers (`getDrizzleToken()` returns its token) with one on PGlite: the stores follow, because their factories inject it, and create their schemas there when the application starts:

```typescript
@@filename(test/webhooks.e2e-spec)
import { PGlite } from '@electric-sql/pglite';
import type { INestApplication } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';
import { OutboxRelay } from '@nestjs/outbox';
import { Test } from '@nestjs/testing';
import { InMemoryWebhookTransport, WebhookEndpoints, WebhookTransport, WebhookWorker } from '@nestjs/webhooks';
import { signWebhook } from '@nestjs/webhooks/testing';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import * as schema from '../src/database/schema.js';
import { OrdersService } from '../src/orders/orders.service.js';

const PAYMENTS_SECRET = `whsec_${Buffer.alloc(32, 1).toString('base64')}`;
const CARRIER_SECRET = 'carrier_test_secret';

describe('Order webhooks', () => {
  const client = new PGlite(); // PostgreSQL, in-process
  const db = drizzle(client, { schema });
  const transport = new InMemoryWebhookTransport(); // records requests instead of sending them
  const partner = { id: 'northside', name: 'Northside Pet Supplies' };
  let app: INestApplication;
  let relay: OutboxRelay;
  let worker: WebhookWorker;
  let endpoint: { id: string; secret: string };

  beforeAll(async () => {
    // The real migrations: the order tables. The stores create their schemas when the app starts.
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    process.env.PAYMENTS_WEBHOOK_SECRET = PAYMENTS_SECRET;
    process.env.CARRIER_WEBHOOK_SECRET = CARRIER_SECRET;
    process.env.OUTBOX_RELAY = 'off'; // no poll loops: the test drives the relay and the worker
    process.env.WEBHOOKS_WORKER = 'off';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(db) // the stores' factories inject it too
      .overrideProvider(WebhookTransport)
      .useValue(transport)
      .compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    await app.init();
    relay = app.get(OutboxRelay);
    worker = app.get(WebhookWorker);
    endpoint = await app.get(WebhookEndpoints).create({ url: 'https://hooks.northside.example.com/store', eventTypes: ['*'], tenant: partner.id });
  });

  afterAll(async () => {
    await app.close();
    await client.close();
  });

  /** Publishes committed messages (the fan-out), then runs one worker batch. */
  const deliver = async () => {
    await relay.runOnce();
    return worker.runOnce();
  };
  const shipment = (orderId: string, id = 'evt_1') =>
    signWebhook({
      scheme: 'stripe',
      header: 'Carrier-Signature',
      secret: CARRIER_SECRET,
      payload: { id, type: 'shipment.shipped', data: { orderId, trackingNumber: 'TRK-1' } },
    });

  it("sends order.shipped to the partner once the carrier's webhook commits", async () => {
    const order = await app.get(OrdersService).placeOrder(partner, { items: [{ productId: 'salmon-kibble-2kg', quantity: 1 }] });
    const paid = signWebhook({
      scheme: 'standard',
      secret: PAYMENTS_SECRET,
      payload: { type: 'payment.succeeded', data: { paymentId: 'pay_1', orderId: order.id, amount: order.total } },
    });
    await request(app.getHttpServer()).post('/webhooks/payments').set(paid.headers).send(paid.body).expect(200);
    const shipped = shipment(order.id);
    await request(app.getHttpServer()).post('/webhooks/carrier').set(shipped.headers).send(shipped.body).expect(200);
    expect(transport.sent).toEqual([]); // nothing until the outbox relays the commit

    expect(await deliver()).toMatchObject({ delivered: 1 });

    const sent = transport.single({ type: 'order.shipped', endpointId: endpoint.id });
    expect(sent.data).toEqual({ orderId: order.id, trackingNumber: 'TRK-1' });
    expect(sent.isSignedWith(endpoint.secret)).toBe(true);
  });

  it('processes a redelivered shipment webhook once', async () => {
    const [order] = await db.select().from(schema.orders);
    const shipped = shipment(order!.id);
    await request(app.getHttpServer()).post('/webhooks/carrier').set(shipped.headers).send(shipped.body).expect(200, '');
    expect(await deliver()).toMatchObject({ claimed: 0 });
    expect(transport.sent).toHaveLength(1);
  });

  it('refuses a webhook whose body was altered', async () => {
    const shipped = shipment('order-x', 'evt_2');
    await request(app.getHttpServer())
      .post('/webhooks/carrier')
      .set(shipped.headers)
      .send(shipped.body.replace('TRK-1', 'TRK-2'))
      .expect(401);
    expect(await deliver()).toMatchObject({ claimed: 0 });
  });
});
```

- The outbox, both stores, the migrations, the fan-out, the signing and the verification are real. Only the network is replaced: `InMemoryWebhookTransport` answers 200 and keeps every request, and `respondWith(503)` or a function simulates a partner that is down, slow or picky.
- `deliver()` is the whole pipeline after the commit: `relay.runOnce()` publishes the committed messages (the fan-out creates the deliveries), `worker.runOnce()` claims one batch and sends it.
- `SentWebhook.isSignedWith(secret)` verifies the `v1` signature with an endpoint's secret, and `data` is the body's `data`, so a test asserts on what the partner would have verified and read.
- `signWebhook()` produces the body and headers the payment provider, Stripe or GitHub would send. Reuse its `id` for a redelivery, move `timestamp` to test the tolerance, change a byte of the body for a tampered request.
- For behavior that depends on time, such as backoff, leases and the rotation overlap, move `Date.now()` forward with `vi.spyOn(Date, 'now')`. The worker and the stores take the time from it, and real timers keep running for sockets.
- The example's `tutorial.e2e-spec.ts` runs every section of this page over real HTTP, on PGlite and on a PostgreSQL server: the API delivers to the partner's receiver through the default transport, with the outage, the replay, the redeliveries and the rotation. Its `zod.e2e-spec.ts` boots the same app with the Zod variants of the DTOs and `StandardSchemaValidationPipe`. Its store tests run the stores through Drizzle on PGlite, PostgreSQL and MySQL, and through TypeORM on PostgreSQL: the contract suites, a dispatch that commits and rolls back with the order, and the schemas in production.

See [End-to-end testing](/fundamentals/testing#end-to-end-testing) for more about the testing setup.

#### Delivery guarantees

Outgoing webhooks are delivered **at least once**; the receiver deduplicates by `webhook-id`.

| Situation | Outcome |
| --- | --- |
| The order's transaction rolls back | The message never existed and nothing is sent |
| The order's transaction commits | One delivery per subscribed endpoint of the tenant, eventually delivered or failed with its attempt log |
| The outbox redelivers the message (a relay crashed after the fan-out) | The fan-out is idempotent: one delivery per message and endpoint |
| The endpoint was created after the message, or is disabled | It doesn't receive it, and a replay doesn't bring it back |
| A worker dies after claiming | Sent by another worker once the lease expires (`worker.lease`, 1 minute) |
| A worker dies after sending, before recording | **Sent twice**, with the same `webhook-id`, once the lease expires |
| Two workers, same delivery | A claim is exclusive for the lease, and every later write is fenced by it |
| The partner answers 2xx | Delivered |
| It answers anything else, or nothing | Retried with backoff, `Retry-After` honored; 429, 502, 503 and 504 pace the endpoint |
| It answers 410 Gone | Failed (`rejected`), and the endpoint is disabled (`gone`) |
| Every attempt fails for `disableEndpointAfter` | The endpoint is disabled (`failing`), once |
| A partner asks for a replay | A new round with the same `webhook-id`, so its inbox skips it |

Deliveries have **no order**. A worker sends one endpoint's deliveries one at a time, most overdue first, but a failed attempt waits out its backoff while later messages go out, several workers send to the same endpoint at once, and a replay sends an old message now. Two updates of one order can reach the partner in either order. Receivers cope as they do with duplicates: the body's `timestamp` is when the message was dispatched (`webhook-timestamp` is when this attempt was signed), so a handler can ignore an event older than the state it already holds, or treat the webhook as a signal and read the current state from the API.

Incoming webhooks run their handler **once per webhook id and receiver in the common case** with the default inbox (again after a crash between the handler and the inbox write, or when two copies race on two instances), and their `processInTransaction()` work **exactly once**.

#### Production checklist

- Keep the endpoints and the deliveries in your application's database, on a database server: register `PostgresWebhookStore`, or `MySqlWebhookStore`, and the outbox's store next to it ([Keep webhooks in your database](/http/webhooks#keep-webhooks-in-your-database)). The production guard refuses to start in memory; `allowInMemoryStorage` is for a process whose pending deliveries you can afford to lose.
- Apply both stores' migrations before a new version starts, with `npx nest-webhooks migrate` and `npx nest-outbox migrate` or your migration tool, and check them in CI with `status`. With `NODE_ENV=production`, the stores don't migrate at startup: a schema that's behind fails it instead.
- On PostgreSQL, keep the database's default isolation at READ COMMITTED: the stores refuse a stricter one. On MySQL, run a transaction again when MySQL breaks a deadlock in it (error 1213): it rolled back, with the messages it dispatched and the webhooks it recorded.
- Leave `delivery.allowHttp` and `delivery.allowPrivateNetworks` off. A partner's URL is untrusted input, and the transport resolves it itself and pins the address it checked. Use `allowedAddresses` for the one private range you really deliver to, and alert on `destination-blocked` events: a customer pointing a webhook at your metadata service is worth a look.
- Run the worker in a few instances (`WEBHOOKS_WORKER`), not in every API pod: each claim is a short transaction, and the leases keep them from sending the same delivery twice.
- Alert on `lagMs` and `failed` from `deliveries.stats()`, and on `endpoint-disabled`: tell the partner, by email, that their endpoint was switched off and why.
- Version the payloads. A partner keeps its handler for years, and `retry()` re-sends the body as it was dispatched. Add fields to a type's `data`, never rename or remove one. For a breaking change, add a new type, `order.shipped.v2` in `eventTypes`, and dispatch both in the same transaction (`dispatch()` takes an array) while partners move their subscriptions over; an endpoint subscribed to `*` gets both. Then stop dispatching the old type. Replays of older messages still carry the old shape until the log is pruned.
- Give partners the delivery log and the replay. It answers "did you send it?" before they open a ticket.
- Rotate secrets with the overlap, never with `overlap: 0` unless a secret leaked, and seal them at rest with `WEBHOOKS_ENCRYPTION_KEYS`. Keep the keys in a secret manager.
- Prune the log. `deliveries.prune('30d')` from a [cron job](/application/task-scheduling#declarative-cron-jobs); nothing schedules it for you.
- For incoming webhooks, keep `rawBody: true`, and keep the receivers' secrets in the environment. List the old and the new secret while a provider rotates.
- Keep provider handlers short and idempotent in their own right (a status check inside the transaction), even with `processInTransaction()`: the inbox protects against a redelivery, the check against a provider that sends two different events for one fact.
- Prune the inbox with `OutboxInbox.prune()` on a window longer than any provider's retry schedule (Stripe retries for three days, GitHub doesn't retry at all). For GitHub, that window is also how long a replayed request is caught, with the deduplication keyed on the body ([Other senders](/http/webhooks#other-senders)).
- Call `app.enableShutdownHooks()`, so a deploy lets attempts in flight finish and releases the rest.
- For a store of your own, run the contract suites with `concurrent: true` in CI, against the database version you run in production.

#### The store contract

`PostgresWebhookStore` and `MySqlWebhookStore` implement both of the package's contracts, `WebhookEndpointStore` and `WebhookDeliveryStore`. For another database, implement them in a provider of your own. The JSDoc of each method in the two interfaces states its rule, and the race it prevents.

**Registration.** The store is an ordinary singleton provider that calls `registerSource()` on the injectable `WebhooksStorage` in its constructor, naming the contracts it implements: `endpoints`, `deliveries`, or both from one class. The registry checks the shape at once, refuses a second registration unless it passes `replace: true`, and locks when `WebhooksModule` initializes, logging the store in use. With nothing registered, the module uses `InMemoryWebhookStore`, which loses the endpoints and the pending deliveries on restart and can't share them between instances. With `NODE_ENV=production`, startup fails instead, unless `allowInMemoryStorage: true` accepts that.

**No transaction handle.** Unlike the outbox's `add()`, no method here takes your transaction: the outbox carries the message out of your transaction, and the webhook store runs on its own connections.

**The methods.** The ones marked atomic are one conditional statement or one transaction with a row lock, never a read followed by a write; they are the ones the contract suites race.

| Method | What it does | Atomic |
| --- | --- | --- |
| `createEndpoint`, `getEndpoint`, `listEndpoints`, `updateEndpoint`, `deleteEndpoint` | An endpoint's lifecycle; `list` newest first, by tenant | No |
| `findSubscribedEndpoints(tenant, type)` | The enabled endpoints of exactly this tenant subscribed to the type (or `*`): the fan-out's query | No, but the suite checks it never returns another tenant's |
| `addEndpointSecret(id, secret, expireOthersAt, now)` | The rotation: the new secret first, the others expiring | Yes: the row is locked, so two rotations both land |
| `recordEndpointFailure(id, failure)` | Sets `failingSince` on the first failure; disables the endpoint once it has been failing long enough, and says so once | Yes: the row is locked |
| `recordEndpointSuccess(id)` | Clears `failingSince` | No |
| `createDeliveries(message, deliveries)` | The fan-out: the message unless it exists, each delivery unless its `(messageId, endpointId)` exists | Yes: a unique key on the pair, such as PostgreSQL's `ON CONFLICT DO NOTHING` on it |
| `claimDeliveries(request)` | Leases due deliveries, most overdue first, with their message | Yes: `FOR UPDATE SKIP LOCKED`, then the lease |
| `recordDeliveryAttempt(id, owner, update)` | The attempt's outcome and log row, if `owner` still holds the lease | Yes: fenced by the lease owner |
| `releaseDeliveries(ids, owner, nextAttemptAt)` | Gives leases back, postponing when asked | Yes: fenced |
| `getDelivery`, `getMessage`, `listDeliveries`, `listDeliveryAttempts`, `deliveryStats` | Reads; `list` newest first, by tenant, endpoint, message, status and type | No |
| `retryDeliveries(filter, now)` | A new round for the matches that aren't leased | Yes: one `UPDATE` with the lease in its `WHERE` |
| `pruneDeliveries(before)` | Finished deliveries older than `before`, their logs, and the messages left without deliveries | No, but never a pending delivery |

**Test it** with `webhookEndpointStoreContract()` and `webhookDeliveryStoreContract()` from `@nestjs/webhooks/testing`. Each case gets a store on empty tables from the function you pass. The tutorial's tests run both suites against `PostgresWebhookStore` through Drizzle, as you would against yours:

```typescript
@@filename(test/drizzle-webhook.store.e2e-spec)
/** A store on emptied tables, built the way Nest builds it: with the database and a registry. */
async function freshStore(db: Database) {
  await db.execute(sql.raw(`TRUNCATE ${STORE_TABLES.join(', ')} RESTART IDENTITY`));
  return { store: new PostgresWebhookStore({ executor: fromDrizzle(db) }, new WebhooksStorage()) };
}

// ...

// The concurrency cases run too; with one connection, PGlite runs them one statement at a time.
describe('the endpoint contract', () => {
  for (const c of webhookEndpointStoreContract(() => freshStore(db), { concurrent: true })) {
    it(c.name, c.run);
  }
});
describe('the delivery contract', () => {
  for (const c of webhookDeliveryStoreContract(() => freshStore(db), { concurrent: true })) {
    it(c.name, c.run);
  }
});
```

With `concurrent: true`, the suites race rotations and failures on one endpoint, workers claiming side by side, fan-outs of one message, a stale worker against a takeover, and a retry against a claim. On PGlite, with one connection, they pass serialized: run them on a server too, through a pool of several connections, where a store without the right locks fails them. The package's own tests run the suites against a hand-written Drizzle store, as the proof that a store written against the interfaces passes them.

#### Reference

##### Module options

`WebhooksModule.forRoot()` takes these options. `forRootAsync()` takes `outgoing`, `transport` (as a class), `imports` and `isGlobal` at the top level, next to `useFactory`, `useClass` or `useExisting`, and the factory returns the rest. See [Register the modules](/http/webhooks#register-the-modules).

| Option | Default | Description |
| --- | --- | --- |
| `eventTypes` | any type | The message types this application sends. `dispatch()` and new endpoints accept only these (endpoints also accept `*`). |
| `retry` | 10 attempts | `attempts` (including the first), `backoff` and `retryIf(error, attempt, delivery)`. A number sets `attempts`, and `false` means a single attempt. |
| `retry.backoff` | see description | `delay` (`'5s'`), `factor` (4), `maxDelay` (`'1d'`, also the cap for `Retry-After`), `jitter`: `'equal'`, `'full'` or `'none'` (`'equal'`). Or a function of the attempt, the error and the delivery that returns a duration. |
| `disableEndpointAfter` | `'5d'` | Disables an endpoint that has failed every attempt for this long without a success. `false` never disables one. |
| `secretRotationOverlap` | `'24h'` | How long a rotated-out secret keeps signing next to the new one. |
| `delivery.timeout` | `'15s'` | One attempt: DNS, connection, TLS, request and response. Shorter than `worker.lease`. |
| `delivery.allowHttp` | `false` | Accepts `http://` endpoint URLs. For development. |
| `delivery.allowPrivateNetworks` | `false` | Delivers to loopback, private, shared-address and unique-local ranges. For development. Link-local and cloud metadata addresses stay blocked. |
| `delivery.allowedAddresses` | none | CIDR ranges, such as `10.20.0.0/16`, delivered to although they'd be blocked. |
| `delivery.maxResponseSize` | 4096 | Bytes of the response body read and kept in the log. |
| `delivery.userAgent` | `NestJS-Webhooks/1.0` | The `User-Agent` header. |
| `worker.enabled` | `true` | Delivers in this process. `false` in instances that only dispatch. |
| `worker.pollInterval` | `'1s'` | The wait between polls when idle. `notify()` polls at once. |
| `worker.batchSize` | 50 | Deliveries claimed per poll. |
| `worker.concurrency` | 10 | Endpoints delivered to in parallel. One endpoint's deliveries go one at a time. |
| `worker.lease` | `'1m'` | How long a claim is exclusive. Longer than `delivery.timeout`. |
| `encryption` | off | Seals endpoint secrets at rest. `keys` lists 32-byte `Buffer`s or strings of at least 32 characters, newest first: the first key encrypts, every key decrypts. |
| `receivers` | none | The senders whose webhooks this application accepts, by the name `@VerifyWebhook()` uses (see the next table). |
| `transport` | `HttpWebhookTransport` | A `WebhookTransport` class at the top level, or an instance from the async factory. |
| `allowInMemoryStorage` | `false` | Lets a production application start without registered stores. |
| `outgoing` | `true` | Top level only. `false` in a service that only receives webhooks: no endpoints, deliveries, worker or stores. |
| `imports` | none | Top level only. Modules whose exports a transport class injects. |
| `isGlobal` | `true` | Top level only. Registers the module globally. |

Durations are milliseconds or strings such as `'15s'`, `'24h'` or `'5d'`. The options' injection token is `WEBHOOKS_MODULE_OPTIONS`.

Each entry of `receivers` takes these options (see [Receive the payment provider's webhooks](/http/webhooks#receive-the-payment-providers-webhooks) and [Receive the carrier's Stripe-like webhooks](/http/webhooks#receive-the-carriers-stripe-like-webhooks)):

| Option | Applies to | Default | Description |
| --- | --- | --- | --- |
| `scheme` | all | required | `'standard'`, `'stripe'`, `'github'`, or an instance of a class extending `WebhookSignatureScheme` |
| `secret` | all | required | One secret, or an array while the sender rotates. Every one is tried. |
| `tolerance` | `standard`, `stripe`, custom | `'5m'` | The largest accepted distance between the signed timestamp and now, in either direction |
| `header` | `stripe` | `'stripe-signature'` | The signature header, for senders that copied Stripe's scheme |
| `id` | `stripe`, `github` | the payload's `id`; the `X-GitHub-Delivery` header, which isn't signed (see [Other senders](/http/webhooks#other-senders)) | A function of the payload and the headers that returns the deduplication id, of at most 255 characters |
| `dedupe` | all | `true` | Skips a webhook id this receiver already processed |
| `consumer` | all | `webhooks:<name>` | The inbox consumer name. Keep it stable. At most 255 characters, the default included: a longer one fails the startup with a `TypeError` |

##### PostgreSQL and MySQL stores

`new PostgresWebhookStore(options, webhooksStorage)`, from `@nestjs/webhooks/postgres`, and `new MySqlWebhookStore(options, webhooksStorage)`, from `@nestjs/webhooks/mysql`, take these options. The outbox's `PostgresOutboxStore` and `MySqlOutboxStore` take the same, with `'nest_outbox'` as the default `schema`:

| Option | Default | Meaning |
| --- | --- | --- |
| `executor` | Required | How the store reaches the database: `fromDrizzle(db)`, `fromTypeOrm(dataSource)`, `fromPrisma(prisma, options)`, `fromKysely(db)`, and `fromPg(pool)` on PostgreSQL or `fromMysql2(pool)` on MySQL, imported from the store's own subpath: the other dialect's executor doesn't compile |
| `schema` | `'nest_webhooks'` | On PostgreSQL, the schema of its tables, which its first migration creates: letters, digits and underscores, not starting with a digit, at most 63 characters. On MySQL, the prefix of its tables in the connection's database (`nest_webhooks_endpoints`...): lowercase letters, digits and underscores, not starting with a digit, at most 40 characters |
| `migrate` | `true`, except with `NODE_ENV=production` | Apply the pending migrations when the application starts. With `false`, startup fails with a `WebhookSchemaError` while the schema is behind |

Each executor takes your database client, and its own kind of transaction object, which `dispatch()` and `processInTransaction()` then take:

| Executor | Takes | Transaction object |
| --- | --- | --- |
| `fromDrizzle(db)` | A Drizzle database: on PostgreSQL, whichever its driver; on MySQL, `drizzle-orm/mysql2`'s | The `tx` that `db.transaction()` hands its callback |
| `fromTypeOrm(dataSource)` | A `DataSource` of type `postgres` or `mysql` | The `EntityManager` that `dataSource.transaction()` hands its callback, or a `QueryRunner` after `startTransaction()` |
| `fromPg(pool)` | A node-postgres `Pool`, on PostgreSQL | A client from `pool.connect()`, after `BEGIN` |
| `fromMysql2(pool)` | A `mysql2/promise` pool, on MySQL | A connection from `pool.getConnection()`, after `beginTransaction()` |
| `fromPrisma(prisma, options)` | A Prisma client, through a driver adapter such as `@prisma/adapter-pg`, or `@prisma/adapter-mariadb` on MySQL. `maxWait` (default `'10s'`) and `timeout` (default `'1m'`) limit the stores' own transactions | The transaction client that `prisma.$transaction()` hands its callback |
| `fromKysely(db)` | A `Kysely` instance with a PostgreSQL or MySQL dialect | The transaction that `db.transaction().execute()` hands its callback |

The store's `migrate()` method applies the pending migrations at once, whatever the `migrate` option says, and resolves with the versions it applied. `PostgresWebhookStore.migrationSql()` and `MySqlWebhookStore.migrationSql()` return their SQL, with the bookkeeping. Their options are the `schema`, the versions to go `from` (default `0`, a new database) and `to` (default: the one the package needs), and `statementBreakpoints`, which puts drizzle-kit's `--> statement-breakpoint` between the statements. On PostgreSQL, from version 0, the SQL starts with `CREATE SCHEMA IF NOT EXISTS`, which needs the CREATE privilege on the database: leave it out if someone created the schema for you. `MySqlWebhookStore.migrationStatements()` returns MySQL's statements one per string, to run in order, each once. `schemaVersion` is the version the package needs. A schema's own version is the highest applied in its `migrations` table.

The command line, `npx nest-webhooks`, takes `--url` (default `DATABASE_URL`), whose scheme picks the store: `postgres://` or `postgresql://` for `PostgresWebhookStore`'s schema, `mysql://` for `MySqlWebhookStore`'s tables. It takes `--schema` too (default `nest_webhooks`). `npx nest-outbox` does the same for the outbox's stores:

| Command | What it does |
| --- | --- |
| `migrate` | Applies the pending migrations, as `migrate: true` does at startup. Needs `pg` or `mysql2` installed |
| `status` | Prints the schema's version and the one the package needs, and exits with 1 while the schema is behind |
| `sql` | Prints the SQL of `migrationSql()`, from `--from` to `--to`, without a database: PostgreSQL's, or MySQL's with `--dialect mysql`. `--statement-breakpoints` separates the statements for drizzle-kit |

##### Services and decorators

- `Webhooks`: `dispatch(tx, message)` takes one message or an array, with `type`, `data`, `tenant` and an optional `id`, and throws a `TypeError` for an unknown type, data that isn't JSON-serializable or an invalid id. `notify()` runs the relay now.
- `WebhookEndpoints`: `create(input)`, `list(query)`, `get(id, scope)`, `update(id, changes, scope)`, `delete(id, scope)`, `getSecret(id, scope)` and `rotateSecret(id, options)`, where `options` takes `tenant`, `overlap` and `secret`. `create()` takes a `secret` too, an existing `whsec_…` used instead of a generated one. See [Let partners subscribe](/http/webhooks#let-partners-subscribe).
- `WebhookDeliveries`: `list(query)`, `get(id, scope)`, `retry(idOrFilter, scope)`, `stats()` and `prune(olderThan)`. See [Retries, the delivery log and replay](/http/webhooks#retries-the-delivery-log-and-replay).
- `WebhookWorker`: the deliverer, started when the application boots unless `worker.enabled` is `false`. `start()`; `stop()`, which stops claiming, waits for the attempts in flight and releases the deliveries it hasn't started; `running`; `notify()`, which polls now instead of at the next tick; `runOnce()`, which claims one batch and delivers it, resolving to how many it `claimed`, `delivered`, `retried`, `failed` and `released`, and on how many it lost the lease (`leaseLost`), and which works with the worker stopped, as the tests drive it; `stats()`, the same as `WebhookDeliveries.stats()`.
- `WEBHOOKS_OUTBOX_TOPIC`: the outbox topic that dispatched messages travel on, `'nestjs.webhooks.message'`, to the package's `@OnOutboxMessage()` handler, the fan-out. An outbox whose `route` picks among several transports sends this topic to `local`.
- `WebhookVerifier`: `verify(receiver, request)` checks a request that didn't arrive on an HTTP route, such as one stored in a queue, from its `headers` and `rawBody`.
- `@VerifyWebhook(receiver)` verifies and deduplicates, on a method or a controller. `@IncomingWebhook()` injects the verified webhook: `receiver`, `id`, `timestamp`, `payload`, `rawBody` and `processInTransaction()`. `@WebhookPayload()` injects the payload alone, and takes pipes like `@Body()`.

##### Transports

The worker sends through the `WebhookTransport` provider. The default, `HttpWebhookTransport`, is built from the `delivery` options: one `POST` per attempt over `node:http` and `node:https`, the host resolved once and every address it resolves to checked, the socket pinned to the checked address, redirects never followed, no proxy from the environment. Its constructor takes two options that `delivery` doesn't:

- `ca`: certificate authorities to trust besides Node's own, for endpoints behind a private CA. They are added to Node's trust store, so public endpoints keep verifying.
- `lookup`: resolves a host name to every address it has, each an `address` and its `family` (4 or 6), in place of the system resolver. Every address it returns is still checked, and the connection goes to the first.

To use them, pass an instance as `transport`, with the same `allowHttp`, `allowPrivateNetworks` and `allowedAddresses` as `delivery`: `delivery` still decides which URLs `WebhookEndpoints` accepts, and the transport what it connects to.

```typescript
WebhooksModule.forRoot({
  delivery: { allowedAddresses: ['10.20.0.0/16'] },
  transport: new HttpWebhookTransport({
    allowedAddresses: ['10.20.0.0/16'],
    ca: readFileSync('/etc/ssl/partners-ca.pem'),
  }),
}),
```

A transport of your own extends `WebhookTransport` and implements `send(request, options)`, where `options` has the attempt's `signal` and its `attempt` number. The request carries the `url`, the signed `headers` and the `body`, and the ids of its endpoint, delivery and message. Resolve with the response's `statusCode`, `headers` and the start of its `body`, whatever the status, and throw only when there is no response; stop when `signal` aborts, after `delivery.timeout`. `NonRetryableWebhookError` and `WebhookDestinationBlockedError` fail the delivery without a retry; any other error is retried. Pass the class as `transport` at the top level of `forRoot()` or `forRootAsync()`, where Nest instantiates it (`imports` for the modules it injects from), or an instance. It replaces the SSRF guard with whatever it does itself: sending through an egress proxy that enforces one, such as Smokescreen, is a reason to write one; wrapping `HttpWebhookTransport` keeps the guard.

For tests, `InMemoryWebhookTransport` records instead of sending, without network or address checks (see [Testing](/http/webhooks#testing)):

- `sent`: every request, oldest first, as `SentWebhook`s. `clear()` empties it.
- `respondWith(answer)`: how the endpoint answers from now on, 200 until then. A status (`503`), a response (`statusCode`, `headers` such as `retry-after`, `body`), or a function of the request and the attempt number that returns either and throws to simulate no response.
- `filter(query)` and `single(query)`: the requests matching `type`, `url` (a string or a `RegExp`), `endpointId` and `messageId`, or a function of the `SentWebhook`. `single()` throws, listing what was sent, unless exactly one matches.

A `SentWebhook` has the `request`, the `attempt` number within its round, `sentAt`, the request's `url`, `type`, `messageId`, `endpointId`, `deliveryId`, `headers` and `body`, `data` (the body's `data`, parsed), and `isSignedWith(secret)`, which checks a `v1` signature against an endpoint's secret.

##### Events

`WebhooksEvents.events$` emits every event, and each is also published on the diagnostics channel `nestjs:webhooks:<type>`.

| Type | Payload type | Fields besides `type` |
| --- | --- | --- |
| `delivered` | `WebhooksDeliveredEvent` | `delivery`, `statusCode`, `attempt`, `durationMs` |
| `retry-scheduled` | `WebhooksRetryScheduledEvent` | `delivery`, `error`, `statusCode` (`null` without a response), `attempt`, `delayMs` |
| `delivery-failed` | `WebhooksDeliveryFailedEvent` | `delivery`, `error`, `statusCode`, `attempt`, `reason` |
| `endpoint-disabled` | `WebhooksEndpointDisabledEvent` | `endpointId`, `tenant`, `reason` (`'failing'` or `'gone'`) |
| `destination-blocked` | `WebhooksDestinationBlockedEvent` | `endpointId`, `tenant`, `reason`, `address` |
| `verification-failed` | `WebhooksVerificationFailedEvent` | `receiver`, `reason` |

A failed delivery's `reason` is `exhausted`, `rejected` (410 Gone, a blocked destination, `NonRetryableWebhookError` or `retryIf`), `endpoint-disabled` or `endpoint-deleted`. A verification failure's `reason` is `missing-header`, `malformed-header` (a webhook id longer than 255 characters too), `invalid-signature`, `timestamp-out-of-tolerance` or `invalid-payload`. `WebhooksEvent` is the union of all payload types.

##### Errors

Every error except `NonRetryableWebhookError` extends `WebhooksError`. The ones with a `status` are meant for the partner API's exception filter, as in [Let partners subscribe](/http/webhooks#let-partners-subscribe).

| Error | Status | Thrown when |
| --- | --- | --- |
| `InvalidWebhookEndpointError` | 400 | An endpoint's URL, event types or secret are refused. `field` names which one. |
| `WebhookEndpointNotFoundError` | 404 | The endpoint doesn't exist, or belongs to another tenant |
| `WebhookDeliveryNotFoundError` | 404 | The delivery doesn't exist, or belongs to another tenant |
| `WebhookVerificationError` | 401, or 400 for `invalid-payload` | `WebhookVerifier.verify()` refuses a request. It has the `receiver` and the `reason`. |
| `WebhookDestinationBlockedError` | none | The endpoint's URL is, or resolves to, a blocked address. The delivery fails without a retry. |
| `WebhookResponseError` | none | The endpoint answered outside 2xx. It has the `statusCode`, and `retryAfterMs` from a `Retry-After` header. |
| `WebhookDeliveryTimeoutError` | none | No response within `delivery.timeout` |
| `NonRetryableWebhookError` | none | A custom transport throws it to fail a delivery without a retry |
| `WebhookSchemaError` | none | A store's schema is behind the package's migrations while `migrate` is off, or applying them failed (`cause`): startup and every call fail until it's fixed. It has the `schema`, its `version` and the `requiredVersion`. From `@nestjs/webhooks/postgres` and `@nestjs/webhooks/mysql` |

`@VerifyWebhook()` answers a refused request with a 401 (a 400 for a signed body that isn't JSON) and a generic message, and the reason goes to the `verification-failed` event. A request whose body wasn't kept raw gets a 415 if it isn't JSON or a form, and a 500 that logs the missing `rawBody: true` otherwise.
