### Distributed locks

An online store for cat food and supplies runs two scheduled jobs with `@nestjs/schedule`. Every night at 02:00 an export sends the day's invoices to the accounting system, and every five minutes a reconciliation asks the warehouse for a full stock count and writes it to the products table. Both work on one instance. In production the order API runs on three, and `@nestjs/schedule` fires every `@Cron()` on each of them:

- The accounting system records every invoice three times.
- The warehouse is asked for three full counts every five minutes. A full count pages through the whole catalog, and at month end it takes longer than five minutes, so the next tick starts a second count alongside the first, then a third.

The usual fixes have holes. A `RUN_JOBS=true` instance works until a rolling deploy has two of them for a minute, or the job instance is the one that dies. A `SET NX` key in Redis at the top of the job works until its holder pauses for longer than the key's TTL, in a stop-the-world garbage collection or behind a network partition: another instance takes the key, and when the first one wakes up it finishes its run believing it still holds it. Two writers again, and neither knows. `waitForCompletion: true` on `@Cron()` stops a job from overlapping itself, on one instance.

`@nestjs/locks` turns a job into something one instance holds: a **lease** that the holder keeps renewing while it is up, checked in a store every instance shares. Two decorators put it on a scheduled job, `@OnOneInstance()` and `@WithoutOverlapping()`, in the spirit of Laravel's `onOneServer()` and `withoutOverlapping()`. Under them is a distributed lock you can also take yourself, with the two things a lock needs to be trusted: an `AbortSignal` that aborts when the lease is lost, and a **fencing token** that grows with every acquisition of a key, so a write from a holder that paused past its lease can be refused. A leader election is the same lease, held for as long as the leader lives.

In this tutorial, you'll add it to the store, on PostgreSQL with Drizzle:

- Prove the duplicate runs with a test, on three instances of the app.
- Keep the locks in a table of the application's database.
- Run each job on one instance, with a handover when that instance dies.
- Keep a long stock count from overlapping itself.
- Fence the stock writes, so a paused instance can't overwrite a fresher count.
- Run the export by hand from an admin endpoint, never alongside the scheduled run.
- Keep the locks in Redis instead.
- Hold the warehouse's alert feed on one instance, with a leader election.

#### Installation

To get started, install the required dependency:

```bash
$ npm i --save @nestjs/locks
```

#### See the problem

This is the application before the tutorial. The nightly export takes every placed order that has no invoice yet, uploads the batch, and marks the orders with the batch id:

```typescript
@@filename(invoices/invoice-export.job.step-1)
import { Injectable, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { Cron } from '@nestjs/schedule';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { Database } from '../database/drizzle.js';
import { orders } from '../database/schema.js';
import { AccountingClient } from './accounting.client.js';

@Injectable()
export class InvoiceExportJob {
  private readonly logger = new Logger(InvoiceExportJob.name);

  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly accountingClient: AccountingClient,
  ) {}

  @Cron(process.env.INVOICE_EXPORT_CRON ?? '0 2 * * *', { name: 'invoice-export', timeZone: 'Europe/Warsaw' })
  async exportInvoices() {
    // Every placed order without an invoice, not "yesterday's orders": a night
    // the export didn't run is caught up the next night.
    const pending = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.status, 'placed'), isNull(orders.invoicedAt)))
      .orderBy(orders.placedAt);
    if (pending.length === 0) return;

    const batch = await this.accountingClient.uploadInvoices(
      pending.map((order) => ({
        orderId: order.id,
        userId: order.userId,
        total: order.total,
        placedAt: order.placedAt.toISOString(),
      })),
    );
    await this.db
      .update(orders)
      .set({ invoicedAt: new Date(), invoiceBatch: batch.batchId })
      .where(inArray(orders.id, pending.map((order) => order.id)));
    this.logger.log(`Exported ${pending.length} invoices in batch ${batch.batchId}`);
  }
}
```

The accounting system records every batch it receives, so a batch uploaded twice is recorded twice. The reconciliation asks the warehouse for the counts and writes them:

```typescript
@@filename(inventory/stock-reconciliation.job.step-1)
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockRepository } from './stock.repository.step-1.js';
import { WarehouseClient } from './warehouse.client.js';

@Injectable()
export class StockReconciliationJob {
  private readonly logger = new Logger(StockReconciliationJob.name);

  constructor(
    private readonly warehouseClient: WarehouseClient,
    private readonly stockRepository: StockRepository,
  ) {}

  @Cron(process.env.STOCK_RECONCILIATION_CRON ?? CronExpression.EVERY_5_MINUTES, { name: 'stock-reconciliation' })
  async reconcileStock() {
    const counts = await this.warehouseClient.stockCounts();
    const written = await this.stockRepository.writeStock(counts);
    this.logger.log(`Reconciled stock for ${written} products`);
  }
}
```

The cron expressions come from the environment, with the real schedule as the default, so the tests and the [Try it](/reliability/locks#try-it) section can speed them up or turn them off. `AccountingClient` and `WarehouseClient` stand in for the two external systems; each counts what it was asked to do. The database is the application's, registered with `DrizzleModule` in `app.module.ts` and injected with `@InjectDrizzle()`.

> info **Hint** The tutorial reads `process.env` directly, to stay short. In an application, load the environment through [`@nestjs/config`](/application/configuration) with a validation schema, so a missing variable stops the application at startup rather than at the first request, and read the values from `ConfigService`.

Before changing anything, prove the problem. The test starts three instances of the application in one process, on one database (PostgreSQL in-process with [PGlite](https://pglite.dev), or a PostgreSQL server when one is configured), and fires the schedules on each of them through `@nestjs/schedule`'s own registry, the way 02:00 would:

```typescript
@@filename(test/step-1.duplicate-runs.e2e-spec)
describe.each(targets)('three instances with plain @Cron() jobs, on %s', (_, target) => {
  let database: TestDatabase;
  let accounting: FakeAccounting;
  let warehouse: FakeWarehouse;
  let instances: TestingModule[];
  let logger: CapturingLogger;

  beforeEach(async (context) => {
    if (!target) return context.skip();
    database = await openDatabase(target, 'locks_step_1');
    accounting = new FakeAccounting();
    warehouse = new FakeWarehouse();
    logger = new CapturingLogger();
    instances = [];
    for (let i = 0; i < 3; i++) {
      instances.push(await startInstance({ database, module: StepOneApp, accounting, warehouse, logger }));
    }
  });
  afterEach(async () => {
    for (const app of instances ?? []) await app.close();
    await database?.close();
  });

  /**
   * 02:00: every instance's scheduler fires the job, through @nestjs/schedule's own
   * callback (which doesn't wait for the job to finish).
   */
  const tick = (name: string) =>
    Promise.all(instances.map((app) => app.get(SchedulerRegistry).getCronJob(name).fireOnTick()));

  it('records every invoice three times', async () => {
    await tick('invoice-export');
    await until(() => logger.matching('Exported 3 invoices').length === 3);
    const orders = ['ord_1001', 'ord_1002', 'ord_1004'];
    expect(booked(accounting)).toEqual([orders, orders, orders]);
    // The orders point at whichever batch wrote last; the accounting system has all three.
    const rows = await database.query<{ invoice_batch: string }>(
      "SELECT DISTINCT invoice_batch FROM orders WHERE status = 'placed'",
    );
    expect(rows).toHaveLength(1);
  });

  it('asks the warehouse for three full counts every five minutes', async () => {
    await tick('stock-reconciliation');
    await until(() => logger.matching('Reconciled stock').length === 3);
    expect(warehouse.counts).toBe(3);
  });
});
```

Three batches, each with the same three orders, and three full counts. The `orders` table looks fine afterwards, every order has a batch id, which is why this goes unnoticed until accounting calls.

#### Keep locks in your database

`@nestjs/locks` works as soon as you import `LocksModule`, on an in-memory store. That store excludes callers in one process only: three instances would each have their own, all three would take "the" lock, and nothing would change. The locks need a store every instance shares, and the package doesn't ship one. It defines the contract, the `LockStore` interface, and you implement it in a provider of your application with the database it already has.

This section shows that store twice: first with Drizzle on PostgreSQL, registered through [`@nestjs/drizzle`](/data/drizzle) with the `pg` driver, which is the tutorial's path, and then, under "With TypeORM" at the end of the section, the same store for an application whose ORM is TypeORM. Take one of the two, or keep the locks in Redis with [the store on Redis](/reliability/locks#the-store-on-redis). With Drizzle, a lock is one row per key:

```typescript
@@filename(database/schema)
// The locks, read and written by DrizzleLockStore: one row per lock key.

export const locks = pgTable('locks', {
  key: text('key').primaryKey(),
  /** The holder's id; null once released. */
  owner: text('owner'),
  fencingToken: bigint('fencing_token', { mode: 'number' }).notNull(),
  /** On the database's clock: every instance agrees on it. */
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

/** Fencing tokens for every key: a sequence never goes back, so they only grow. */
export const locksFencingTokenSeq = pgSequence('locks_fencing_token_seq');
```

drizzle-kit writes the migration:

```bash
$ npx drizzle-kit generate --name=locks
$ npx drizzle-kit migrate
```

```sql
@@filename(drizzle/0002_locks.sql)
CREATE SEQUENCE "public"."locks_fencing_token_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "locks" (
	"key" text PRIMARY KEY NOT NULL,
	"owner" text,
	"fencing_token" bigint NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
```

The contract has three methods, and each takes the lock key and an `owner` first: a random id the package draws for each acquisition. Durations arrive in whole milliseconds.

- `acquire(key, owner, ttl)` takes the key if no live lock holds it, and returns the lock's fencing token, or reports that the key is taken. It must be atomic: of any number of concurrent callers, exactly one may win.
- `renew(key, owner, ttl)` is the heartbeat. It moves the expiry to `ttl` from now, if `owner` still holds a live lock on the key. The package calls it every `ttl / 3` while a lock is held.
- `release(key, owner)` gives the lock back, if `owner` still holds it.

"If `owner` still holds it" has to be checked in the same statement that writes: checked in a separate read first, a takeover could slip in between. And the store measures `ttl` with its own clock, so every instance agrees on when a lock expires whatever their clocks say. With Drizzle, that is one conditional insert and two conditional updates:

```typescript
@@filename(database/drizzle-lock.store)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { LocksStorage, type LockAcquireResult, type LockStore } from '@nestjs/locks';
import { and, eq, gt, sql } from 'drizzle-orm';
import type { Database } from './drizzle.js';
import { locks } from './schema.js';

/** `ttl` from now, on the database's clock. */
const expiresIn = (ttl: number) => sql`clock_timestamp() + ${ttl} * interval '1 millisecond'`;

/** The lock on `key`, if `owner` still holds it: the compare-and-set of renew() and release(). */
const heldBy = (key: string, owner: string) =>
  and(eq(locks.key, key), eq(locks.owner, owner), gt(locks.expiresAt, sql`clock_timestamp()`));

@Injectable()
export class DrizzleLockStore implements LockStore {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    storage: LocksStorage,
  ) {
    storage.registerSource(this);
  }

  async acquire(key: string, owner: string, ttl: number): Promise<LockAcquireResult> {
    // One statement: insert the lock, or take over a released or expired one. Of any number
    // of concurrent callers, one inserts or updates the row; the others find it held.
    const [row] = await this.db
      .insert(locks)
      .values({ key, owner, fencingToken: sql`nextval('locks_fencing_token_seq')`, expiresAt: expiresIn(ttl) })
      .onConflictDoUpdate({
        target: locks.key,
        // nextval() here runs after the row is locked: a later holder always gets a
        // greater token than the one before it. The row's own token is the floor, so a
        // sequence that went back (a restore, a failover) can't hand a key an old token.
        set: {
          owner,
          fencingToken: sql`greatest(nextval('locks_fencing_token_seq'), ${locks.fencingToken} + 1)`,
          expiresAt: expiresIn(ttl),
        },
        setWhere: sql`${locks.owner} is null or ${locks.expiresAt} <= clock_timestamp()`,
      })
      .returning({ fencingToken: locks.fencingToken });
    return row ? { acquired: true, fencingToken: row.fencingToken } : { acquired: false };
  }

  async renew(key: string, owner: string, ttl: number): Promise<boolean> {
    const rows = await this.db
      .update(locks)
      .set({ expiresAt: expiresIn(ttl) })
      .where(heldBy(key, owner))
      .returning({ key: locks.key });
    return rows.length === 1;
  }

  async release(key: string, owner: string): Promise<boolean> {
    // Keep the row, so the next acquire() always takes the update path above, whose token is
    // drawn after the row is locked.
    const rows = await this.db
      .update(locks)
      .set({ owner: null })
      .where(heldBy(key, owner))
      .returning({ key: locks.key });
    return rows.length === 1;
  }
}
```

A few things about this store:

- **`acquire()` is one statement.** The insert wins a key that has no row; the `ON CONFLICT DO UPDATE` with its `WHERE` takes over a released or expired one, and PostgreSQL re-checks that `WHERE` against the row after it locked it. Of many callers racing for the same key, one gets a row back and the rest get nothing. A `SELECT` followed by an `INSERT` would let several of them in.
- **The fencing token comes from a sequence**, drawn inside the statement, after the row lock. A sequence never goes back, so every acquisition of a key gets a greater token than the one before, across releases and expiries. It has gaps, because a caller that lost the race still consumed a value; that doesn't matter. The `greatest()` makes the row's own token the floor of the next one: if the sequence ever does go back (a restore from a backup, a failover to a replica that lagged), a key still can't get a token it had before. [Fence the writes](/reliability/locks#fence-the-writes) shows what the token is for.
- **`release()` keeps the row** and clears the owner, so the next acquisition always takes the update path. With a delete, an insert that drew its token early could win the key after a later holder had already released it, and hand out a smaller token.
- **`clock_timestamp()`**, not `now()`: `now()` is the transaction's start time, which is what a lock's expiry must not depend on.
- Why a table and not `pg_advisory_lock()`: an advisory lock is bound to a session, so the holder would have to keep one connection checked out of the pool for the whole critical section, would lose the lock without knowing when that connection drops, can't renew it, and gets no expiry for a paused holder and no fencing token. A row has all of that, through any pool.

The package ships the contract as a test suite, so you can prove the store before you rely on it. `lockStoreContract()` returns cases for any test runner, and `concurrent: true` adds the races:

```typescript
@@filename(test/step-2.drizzle-lock-store.e2e-spec)
describe('DrizzleLockStore on PGlite, the LockStore contract', () => {
  const client = new PGlite();
  const db = drizzlePglite(client, { schema }) as unknown as Database;
  beforeAll(() => migratePglite(db as never, { migrationsFolder }));
  afterAll(() => client.close());

  // The concurrency cases run too; with one connection, PGlite runs them one statement at a time.
  const cases = lockStoreContract(() => new DrizzleLockStore(db, new LocksStorage()), { concurrent: true });
  for (const c of cases) it(c.name, c.run);
});
```

The example runs the same suite against a PostgreSQL server with a pool of 20 connections and 32 racing callers, where the statements really overlap. Run it that way in CI, on the PostgreSQL version you run in production.

Now register the module and the store, next to the application's `DrizzleModule`. The store is a plain provider; its constructor registers it, so there is nothing to configure:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nestjs/drizzle';
import { LocksModule } from '@nestjs/locks';
import { ScheduleModule } from '@nestjs/schedule';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzleLockStore } from './database/drizzle-lock.store.js';
import * as schema from './database/schema.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';

@Module({
  imports: [
    // A pg pool on DATABASE_URL, closed in onApplicationShutdown(), after running jobs
    // finished and handed their locks back. The jobs and the store inject it with @InjectDrizzle().
    DrizzleModule.forRootAsync({
      useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL!, schema }),
    }),
    ScheduleModule.forRoot(),
    LocksModule.forRoot(),
    InvoicesModule,
    InventoryModule,
  ],
  providers: [DrizzleLockStore],
})
export class AppModule {}
```

`LocksModule.forRoot()` takes a `ttl` (the default is `'30s'`: how long a lock lives without a renewal, so how soon another instance takes over after a crash), a `clock` for tests, and `allowInMemoryStorage`. `forRootAsync()` takes the same options from a factory. The module is global, so `Locks`, `LocksContext` and `LocksStorage` are available everywhere. When it initializes, it logs the store in use:

```bash
[Nest] 1270  - 09/24/2026, 9:44:02 AM     LOG [LocksModule] LocksStorage: DrizzleLockStore
```

With nothing registered, the line names `InMemoryLockStore` and what that means. With `NODE_ENV=production` and nothing registered, the application doesn't start, because in memory every instance would take the same lock and run the same job:

```bash
Error: LocksStorage: no LockStore is registered, and NODE_ENV is "production": in memory, a lock only excludes callers in this process, so every instance of the app would take the same lock and run the same job. Implement LockStore in a provider that injects LocksStorage and calls `storage.registerSource(this)` in its constructor, or set `allowInMemoryStorage: true` in the LocksModule options to run in memory anyway (one instance).
```

**With TypeORM.** The same store for an application whose ORM is TypeORM, on the same table and sequence. Drizzle stays the tutorial's path: take this store instead of the one above, not next to it. The table is an entity, and every column states its type, so that the TypeORM CLI, which loads it without decorator metadata, sees the same schema as the application:

```typescript
@@filename(typeorm/lock.entity)
import { Column, Entity, PrimaryColumn } from 'typeorm';

// The locks table, read and written by TypeOrmLockStore: the same table as the Drizzle
// schema in src/database/schema.ts. Every column states its type, so the entity loads the
// same with or without emitted decorator metadata (the TypeORM CLI runs it through tsx,
// which emits none).

@Entity('locks')
export class LockEntity {
  @PrimaryColumn({ type: 'text' })
  key: string;

  /** The holder's id; null once released. */
  @Column({ type: 'text', nullable: true })
  owner: string | null;

  /** Drawn from locks_fencing_token_seq, which the migration creates. `pg` returns a bigint as a string. */
  @Column({ type: 'bigint', name: 'fencing_token' })
  fencingToken: string;

  /** On the database's clock: every instance agrees on it. */
  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;
}
```

The TypeORM CLI and `TypeOrmModule` share one set of options, in a data source file:

```typescript
@@filename(typeorm/data-source)
import { DataSource, type DataSourceOptions } from 'typeorm';
import { LockEntity } from './lock.entity.js';
import { Locks1790321710846 } from './migrations/1790321710846-Locks.js';

/** What the application's TypeOrmModule and the TypeORM CLI share. */
export const dataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [LockEntity],
  migrations: [Locks1790321710846],
} satisfies DataSourceOptions;

// The TypeORM CLI's data source: `migration:generate` compares the entities with this database.
export default new DataSource(dataSourceOptions);
```

Generate the migration from the entity, against a database with your previous migrations applied. The CLI needs a TypeScript loader for the data source file; this uses `tsx`:

```bash
$ npx tsx ./node_modules/typeorm/cli.js migration:generate src/typeorm/migrations/Locks -d src/typeorm/data-source.ts --pretty
Migration /store/src/typeorm/migrations/1790321710846-Locks.ts has been generated successfully.
```

TypeORM has no entity for a sequence, so the migration it writes creates the table alone. Add the sequence to it yourself, before the table, and drop it in `down()`:

```typescript
@@filename(typeorm/migrations/1790321710846-Locks)
import { MigrationInterface, QueryRunner } from "typeorm";

export class Locks1790321710846 implements MigrationInterface {
    name = 'Locks1790321710846'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Added by hand: TypeORM has no entity for a sequence, so the CLI doesn't generate it.
        await queryRunner.query(`
            CREATE SEQUENCE "locks_fencing_token_seq"
        `);
        await queryRunner.query(`
            CREATE TABLE "locks" (
                "key" text NOT NULL,
                "owner" text,
                "fencing_token" bigint NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "PK_c6e1e10d298aec42ba087dd57e5" PRIMARY KEY ("key")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "locks"
        `);
        await queryRunner.query(`
            DROP SEQUENCE "locks_fencing_token_seq"
        `);
    }

}
```

`migrations` in the data source lists it. Apply it, and check that the entity and the database agree. The check doesn't compare sequences, so the one you added doesn't count as a change:

```bash
$ npx tsx ./node_modules/typeorm/cli.js migration:run -d src/typeorm/data-source.ts
$ npx tsx ./node_modules/typeorm/cli.js migration:generate src/typeorm/migrations/Check -d src/typeorm/data-source.ts --check
No changes in database schema were found
```

Now the store, under the same rules as the Drizzle one:

```typescript
@@filename(typeorm/typeorm-lock.store)
import { Injectable } from '@nestjs/common';
import { LocksStorage, type LockAcquireResult, type LockStore } from '@nestjs/locks';
import { DataSource } from 'typeorm';
import { LockEntity } from './lock.entity.js';

/** `ttl` from now, on the database's clock. */
const EXPIRES_IN = "clock_timestamp() + :ttl * interval '1 millisecond'";

/** The lock on `key`, if `owner` still holds it: the compare-and-set of renew() and release(). */
const HELD_BY = 'key = :key AND owner = :owner AND expires_at > clock_timestamp()';

@Injectable()
export class TypeOrmLockStore implements LockStore {
  constructor(
    private readonly dataSource: DataSource,
    storage: LocksStorage,
  ) {
    storage.registerSource(this);
  }

  async acquire(key: string, owner: string, ttl: number): Promise<LockAcquireResult> {
    // One statement: insert the lock, or take over a released or expired one. It is SQL
    // because the takeover draws its token from the locked row, which orUpdate() can't
    // express: it sets each column from EXCLUDED, whose nextval() ran before the row lock.
    const rows: { fencing_token: string }[] = await this.dataSource.query(
      `INSERT INTO locks (key, owner, fencing_token, expires_at)
       VALUES ($1, $2, nextval('locks_fencing_token_seq'), clock_timestamp() + $3 * interval '1 millisecond')
       ON CONFLICT (key) DO UPDATE SET
         owner = EXCLUDED.owner,
         fencing_token = greatest(nextval('locks_fencing_token_seq'), locks.fencing_token + 1),
         expires_at = clock_timestamp() + $3 * interval '1 millisecond'
       WHERE locks.owner IS NULL OR locks.expires_at <= clock_timestamp()
       RETURNING fencing_token`,
      [key, owner, ttl],
    );
    const [row] = rows;
    // `pg` returns a bigint as a string; the package takes the token as a number.
    return row ? { acquired: true, fencingToken: Number(row.fencing_token) } : { acquired: false };
  }

  async renew(key: string, owner: string, ttl: number): Promise<boolean> {
    const { affected } = await this.dataSource
      .createQueryBuilder()
      .update(LockEntity)
      .set({ expiresAt: () => EXPIRES_IN })
      .where(HELD_BY, { key, owner, ttl })
      .execute();
    return affected === 1;
  }

  async release(key: string, owner: string): Promise<boolean> {
    // Keep the row, so the next acquire() always takes the update path above, whose token is
    // drawn after the row is locked.
    const { affected } = await this.dataSource
      .createQueryBuilder()
      .update(LockEntity)
      .set({ owner: null })
      .where(HELD_BY, { key, owner })
      .execute();
    return affected === 1;
  }
}
```

- **`acquire()` is the one statement written as SQL**, through `dataSource.query()`. The insert query builder's `orUpdate()` writes an `ON CONFLICT DO UPDATE`, with the `WHERE` in its `overwriteCondition` option, but it sets every column from `EXCLUDED`: the token would be the one the insert drew before the row was locked, which a later holder of the key may already have passed. The SQL draws it in the `SET`, after the row lock, as the Drizzle store does.
- **`renew()` and `release()`** are the update query builder with the owner and the expiry in the `WHERE`, and read `affected`. Never `save()`, and no `findOneBy()` first: a read before the write lets a takeover slip in between.
- **The token is converted with `Number()`.** `pg` returns a `bigint` column as a string, and the package refuses a string token.
- **Use it** in place of the Drizzle store: `TypeOrmModule.forRoot(dataSourceOptions)` in `AppModule`, and `TypeOrmLockStore` in its providers instead of `DrizzleLockStore`. It injects the `DataSource` that `TypeOrmModule` provides, and the startup line names `TypeOrmLockStore`.

The contract suite runs on it unchanged, with the concurrency cases. TypeORM connects through `pg`, so the suite needs a PostgreSQL server and is skipped without one. Three more cases check that a key's tokens keep growing after the sequence went back, that the entity and the migration agree (what `migration:generate --check` checks), and that the store registers itself when provided in a module:

```typescript
@@filename(test/typeorm-lock.store.e2e-spec)
/**
 * TypeOrmLockStore against the package's contract suite (`@nestjs/locks/testing`), on
 * PostgreSQL (the server in SQL_TEST_PG_URL, else a throwaway local cluster; see
 * test-support/postgres.ts), with the migration the TypeORM CLI generated. A pool, so the
 * concurrency cases race for real. Skipped, with the reason, without a server.
 */
import { Logger } from '@nestjs/common';
import { LocksModule, LocksStorage } from '@nestjs/locks';
import { lockStoreContract } from '@nestjs/locks/testing';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { startPostgres } from '../../../test-support/postgres.js';
import { dataSourceOptions } from '../src/typeorm/data-source.js';
import { TypeOrmLockStore } from '../src/typeorm/typeorm-lock.store.js';

const { postgres, reason } = await startPostgres();
afterAll(() => postgres?.stop());

describe.skipIf(!postgres)(`TypeOrmLockStore on PostgreSQL${postgres ? '' : ` (skipped: ${reason})`}`, () => {
  let dataSource: DataSource;
  let url: string;

  beforeAll(async () => {
    url = await postgres!.createDatabase('locks_typeorm_store');
    dataSource = await new DataSource({ ...dataSourceOptions, url, poolSize: 20 }).initialize();
    await dataSource.runMigrations();
  });
  afterAll(() => dataSource?.destroy());

  describe('the LockStore contract', () => {
    // The expiry cases wait in real time: the store reads the database's clock.
    const cases = lockStoreContract(() => new TypeOrmLockStore(dataSource, new LocksStorage()), { concurrent: { callers: 32 } });
    for (const c of cases) it(c.name, c.run);
  });

  it("keeps a key's tokens growing after the sequence went back (a restore, a failover to a lagging replica)", async () => {
    const store = new TypeOrmLockStore(dataSource, new LocksStorage());
    const key = `reset-${Date.now()}`;
    await dataSource.query("SELECT setval('locks_fencing_token_seq', 1000)");
    const before = await store.acquire(key, 'a', 5_000);
    expect(before.acquired).toBe(true);
    expect(await store.release(key, 'a')).toBe(true);
    await dataSource.query('ALTER SEQUENCE locks_fencing_token_seq RESTART WITH 1');
    const after = await store.acquire(key, 'b', 5_000);
    expect(after.acquired).toBe(true);
    expect((after as { fencingToken: number }).fencingToken).toBeGreaterThan((before as { fencingToken: number }).fencingToken);
  });

  it('has a migration that matches the entity (what `migration:generate --check` checks)', async () => {
    const { upQueries } = await dataSource.driver.createSchemaBuilder().log();
    expect(upQueries.map((query) => query.query)).toEqual([]);
  });

  it('registers itself when provided in a module', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    const app = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot({ ...dataSourceOptions, url }), LocksModule.forRoot()],
      providers: [TypeOrmLockStore],
    }).compile();
    await app.init();
    try {
      expect(app.get(LocksStorage).source).toBe(app.get(TypeOrmLockStore));
      expect(log).toHaveBeenCalledWith('LocksStorage: TypeOrmLockStore');
    } finally {
      log.mockRestore();
      await app.close();
    }
  });
});
```

> info **Hint** Using Prisma? [The store contract](/reliability/locks#the-store-contract), after the tutorial, lists what the store must guarantee and how Prisma expresses the atomic methods. Test your store against the same cases.

#### Run each job on one instance

Add `@OnOneInstance()` to both jobs, next to `@Cron()`:

```typescript
@@filename(invoices/invoice-export.job.step-3)
import { OnOneInstance } from '@nestjs/locks';
import { Cron } from '@nestjs/schedule';
```

```typescript
@@filename(invoices/invoice-export.job.step-3)
@Cron(process.env.INVOICE_EXPORT_CRON ?? '0 2 * * *', { name: 'invoice-export', timeZone: 'Europe/Warsaw' })
@OnOneInstance({ key: 'invoices:nightly-export' })
async exportInvoices() {
```

```typescript
@@filename(inventory/stock-reconciliation.job.step-3)
@Cron(process.env.STOCK_RECONCILIATION_CRON ?? CronExpression.EVERY_5_MINUTES, { name: 'stock-reconciliation' })
@OnOneInstance({ key: 'inventory:stock-reconciliation' })
async reconcileStock() {
```

That is the whole change. What it does:

- **The first instance whose scheduler fires the job takes the job's lease**, a lock named after the key with an `:owner` suffix, and keeps renewing it every `ttl / 3` for as long as it is up. It runs this tick and every tick after it.
- **On the other instances, the tick is skipped**: the call resolves without running the method, and a debug line says why. Nothing is queued; the job's schedule is the schedule.
- **When the owner dies**, it stops renewing, the lease expires `ttl` (30 seconds) later, and the first instance whose tick comes after that takes the job over. When the owner shuts down cleanly, it finishes the runs in progress, hands the lease back, and the next tick anywhere takes it.
- **The decorators wrap the method.** `@nestjs/schedule` isn't patched, and it doesn't know they are there: its explorer finds the `@Cron()` metadata on the wrapper, in either decorator order, and calls the wrapper, which asks `LocksModule` whether this call may run. `@Interval()` and `@Timeout()` jobs work the same way, and so does calling the method yourself.
- **The key** defaults to `ClassName.methodName`. Set it on a job that must never run twice: a renamed class or method changes the default, and during a rolling deploy the old and the new instances would each run the job once. Two jobs with the same default key fail at startup, and so does a job whose key is another job's lease (`<key>:owner`) or an election's key: they would exclude each other silently.

Ownership is sticky on purpose. A race per tick would be simpler, but a tick isn't an instant: the instances' clocks differ by tens of milliseconds, so a per-tick lock would have to outlive the run by the skew, and a fast job would need a "ran at" record to stop a lagging instance from running the tick again. A lease held between ticks has none of that, at the cost of one instance running all of a job's ticks, which a scheduled job rarely minds.

What about a tick that nobody runs? While the owner is down, up to `ttl` of ticks are skipped, and the nightly export can fall on those thirty seconds. **Missed ticks aren't caught up**: nothing records when a job last ran. Write jobs that do everything that is due rather than "yesterday's". The export takes every order without an invoice, so a night it didn't run is caught up the next night; the reconciliation writes the current counts, so a missed tick costs five minutes of staleness. A job whose ticks each do something distinct keeps that record in its own table.

The test from [See the problem](/reliability/locks#see-the-problem), with the new jobs and the store, now records every invoice once, and the test that stops an instance from renewing (its clock stands still, as if the process had died) shows the handover:

```typescript
@@filename(test/step-3.one-instance.e2e-spec)
it('records every invoice once, and counts the stock once per tick', async () => {
  const apps = [await start(), await start(), await start()];
  await tick(apps, 'export');
  expect(booked(accounting)).toEqual([['ord_1001', 'ord_1002', 'ord_1004']]);
  await tick(apps, 'reconcile');
  await tick(apps, 'reconcile');
  expect(warehouse.counts).toBe(2);
  expect(logger.matching(/runs on this instance \(lease "inventory:stock-reconciliation:owner"/)).toHaveLength(1);
  expect(logger.matching('Skipped StockReconciliationJob.reconcileStock: it runs on another instance')).toHaveLength(4);
});
```

```typescript
@@filename(test/step-3.one-instance.e2e-spec)
it('moves the job to another instance when its owner dies, after ttl', async () => {
  // A's clock stands still: it stops renewing, as if its process died.
  const crashed = await start({ clock: new ManualLockClock(), ttl: '1s' });
  const survivor = await start({ ttl: '1s' });
  await tick([crashed, survivor], 'export');
  expect(booked(accounting)).toHaveLength(1);

  await database.query("INSERT INTO orders (id, user_id, items, total, status, placed_at) VALUES ('ord_1005', 'usr_dave', '[]', 999, 'placed', now())");
  expect(await survivor.get(InvoiceExportJob).exportInvoices()).toBeUndefined(); // the lease is still A's
  await sleep(1_200); // the database's clock passes A's lease
  await survivor.get(InvoiceExportJob).exportInvoices();
  expect(booked(accounting)).toEqual([['ord_1001', 'ord_1002', 'ord_1004'], ['ord_1005']]);
});
```

`ManualLockClock` is the package's clock for tests: it only moves when told to. An instance on it never renews, so the database, on its own clock, expires the instance's locks after `ttl`.

#### Don't let a long run overlap itself

`@OnOneInstance()` puts the reconciliation on one instance. It doesn't stop that instance from starting the next count while the last one is still running, and neither does a plain `@Cron()`. At month end the count takes longer than five minutes, so the warehouse gets a second full count, then a third. Add `@WithoutOverlapping()`:

```typescript
@@filename(inventory/stock-reconciliation.job.step-4)
@Cron(process.env.STOCK_RECONCILIATION_CRON ?? CronExpression.EVERY_5_MINUTES, { name: 'stock-reconciliation' })
@OnOneInstance({ key: 'inventory:stock-reconciliation' })
@WithoutOverlapping()
async reconcileStock() {
```

A run now takes a second lock, named after the same key (the two decorators on one method share it), holds it for the whole run, renewing it, and releases it when the run ends. A tick that finds the lock held is skipped, on this instance or any other: the ticks during a long count are dropped, and the first tick after it runs. If the run crashes, the lock expires after `ttl` and the next tick runs. `@WithoutOverlapping()` on its own, without `@OnOneInstance()`, means "any instance, one run at a time".

The test drives two instances on one `ManualLockClock`, holds a count open, and advances the clock through three ticks:

```typescript
@@filename(test/step-4.without-overlapping.e2e-spec)
it('with @WithoutOverlapping(), every tick during the run is skipped, then the next one runs', async () => {
  const [owner, other] = [await start(StepFourJob), await start(StepFourJob)];
  const slow = warehouse.pauseNext();
  const first = owner!.reconcileStock();
  await until(() => warehouse.counts === 1);
  for (let tick = 0; tick < 3; tick++) {
    await clock.advance('5m'); // the run goes on, its locks renewed
    await Promise.all([owner!.reconcileStock(), other!.reconcileStock()]);
  }
  expect(warehouse.counts).toBe(1);
  expect(logger.matching('Skipped StockReconciliationJob.reconcileStock: a run is still in progress')).toHaveLength(3);
  expect(logger.matching('Skipped StockReconciliationJob.reconcileStock: it runs on another instance')).toHaveLength(3);
  slow.resume();
  await first;
  await clock.advance('5m');
  await Promise.all([owner!.reconcileStock(), other!.reconcileStock()]);
  expect(warehouse.counts).toBe(2);
});
```

`clock.advance('5m')` fires every renewal that falls due on the way, in order, and waits for each to reach the store, so fifteen minutes of a long run take a moment, with the run's locks renewed the whole time.

#### Fence the writes

A lease can't stop a holder that is paused. Take the reconciliation on instance A: it reads the counts from the warehouse (salmon kibble: 12), and then A stalls, in a stop-the-world garbage collection, a swap, a VM migration, a debugger. It stops renewing. Thirty seconds later the database expires its locks, and B takes the job over at its next tick: it reads fresher counts (three bags were sold and shipped since: salmon kibble: 9) and writes them. Then A wakes up and finishes its run, with the counts it read before the pause. Salmon kibble is back at 12, and the store sells three bags it doesn't have.

A's signal aborts at its next renewal, when the database refuses it, but a write that is already on its way goes through. Note what the lease does and doesn't promise. A holder counts its own deadline, `ttl` from the moment it sent the last renewal the store confirmed, which is before the store processed it: a holder that is running gives up no later than the store's expiry, so its signal aborts before any other instance can take the key. The window exists only for a holder that isn't running (paused, stopped, its event loop blocked): from the store's expiry until it runs again, it still believes it holds the lock. What stops its write is the **fencing token**: every acquisition of a key gets a token greater than every token the key had before, and the resource being written keeps the highest token it has seen and refuses a lower one. A's token is lower than B's, so A's late write updates nothing.

The products table gets a column for it:

```typescript
@@filename(database/schema)
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  /** In cents. */
  price: integer('price').notNull(),
  inStock: integer('in_stock').notNull(),
  /** The fencing token of the stock reconciliation run that last wrote `inStock`. */
  stockFencingToken: bigint('stock_fencing_token', { mode: 'number' }).notNull().default(0),
});
```

```bash
$ npx drizzle-kit generate --name=stock_fencing_token
$ npx drizzle-kit migrate
```

```sql
@@filename(drizzle/0003_stock_fencing_token.sql)
ALTER TABLE "products" ADD COLUMN "stock_fencing_token" bigint DEFAULT 0 NOT NULL;
```

The repository writes a count only if no run with a greater token has written that product, and records the token it wrote with, in the same statement:

```typescript
@@filename(inventory/stock.repository)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq, lte } from 'drizzle-orm';
import type { Database } from '../database/drizzle.js';
import { products } from '../database/schema.js';
import type { StockCount } from './warehouse.client.js';

@Injectable()
export class StockRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  /**
   * Writes the counts a reconciliation run read, fenced by the run's token: a product that a
   * newer run (a greater token) already wrote is left alone.
   */
  async writeStock(counts: StockCount[], fencingToken: number): Promise<{ written: number; stale: number }> {
    let written = 0;
    for (const { productId, count } of counts) {
      const rows = await this.db
        .update(products)
        .set({ inStock: count, stockFencingToken: fencingToken })
        .where(and(eq(products.id, productId), lte(products.stockFencingToken, fencingToken)))
        .returning({ id: products.id });
      written += rows.length;
    }
    return { written, stale: counts.length - written };
  }
}
```

The job gets its token, and its signal, from `LocksContext`. `@nestjs/schedule` calls the method without arguments, so the context carries them, through `AsyncLocalStorage`, to every service the job calls:

```typescript
@@filename(inventory/stock-reconciliation.job)
import { Injectable, Logger } from '@nestjs/common';
import { LocksContext, OnOneInstance, WithoutOverlapping } from '@nestjs/locks';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockRepository } from './stock.repository.js';
import { WarehouseClient } from './warehouse.client.js';

@Injectable()
export class StockReconciliationJob {
  private readonly logger = new Logger(StockReconciliationJob.name);

  constructor(
    private readonly warehouseClient: WarehouseClient,
    private readonly stockRepository: StockRepository,
    private readonly locksContext: LocksContext,
  ) {}

  @Cron(process.env.STOCK_RECONCILIATION_CRON ?? CronExpression.EVERY_5_MINUTES, { name: 'stock-reconciliation' })
  @OnOneInstance({ key: 'inventory:stock-reconciliation' })
  @WithoutOverlapping()
  async reconcileStock() {
    const { fencingToken, signal } = this.locksContext;
    // Aborts the count if this run loses its lock...
    const counts = await this.warehouseClient.stockCounts({ signal });
    // ...and the token stops a write that slips through anyway.
    const { written, stale } = await this.stockRepository.writeStock(counts, fencingToken!);
    if (stale > 0) {
      this.logger.warn(`Skipped ${stale} stale stock writes: a newer run (token > ${fencingToken}) wrote those products`);
    }
    this.logger.log(`Reconciled stock for ${written} products (fencing token ${fencingToken})`);
  }
}
```

The token is the run lock's, a new and higher one for every run. The signal aborts when the run's lock or the instance's lease is lost, and its reason is a `LockLostError` that says how the loss was detected: the store refused a renewal, or `ttl` passed without one reaching the store. Pass the signal to what the job calls, `fetch`, the database driver, an HTTP client; a job that ignores it keeps running, as it would in any process. Nothing is killed.

The test reproduces the pause against PostgreSQL. Instance A runs on a `ManualLockClock`, so it stops renewing; the warehouse client holds A's count open after A read it; the shelves change; B takes over 1.2 seconds later (the test's `ttl` is one second) and writes salmon kibble: 9. Then A's count resumes:

```typescript
@@filename(test/step-5.fencing.e2e-spec)
it('without fencing, the paused instance overwrites the fresh count with its stale one', async () => {
  const { stale, resume } = await pauseAWhileBTakesOver(UnfencedJob);
  resume(); // A wakes up and writes what it read before the pause
  expect(await stale).toBeUndefined();
  expect(await kibble()).toBe(12); // three bags the store doesn't have
});

it("with the run's fencing token, the database refuses the stale write", async () => {
  const { stale, resume } = await pauseAWhileBTakesOver(StockReconciliationJob);
  resume(); // A wakes up before it noticed it lost its locks, and writes
  expect(await stale).toBeUndefined();
  expect(await kibble()).toBe(9);
  expect(logger.matching(/WARN Skipped 3 stale stock writes: a newer run \(token > \d+\) wrote those products/)).toHaveLength(1);
  const tokens = await database.query<{ stock_fencing_token: string }>('SELECT DISTINCT stock_fencing_token FROM products');
  expect(tokens).toHaveLength(1); // every product carries B's token
});

it('a run that notices it lost its lock stops at its signal, before writing', async () => {
  const { stale, resume } = await pauseAWhileBTakesOver(StockReconciliationJob);
  await clockA.advance('1s'); // A's clock moves: its next renewal is refused
  expect(await stale).toBeInstanceOf(LockLostError);
  resume();
  expect(await kibble()).toBe(9);
  expect(logger.matching(/WARN Lost the lock "inventory:stock-reconciliation(:owner)?"/).length).toBeGreaterThan(0);
});
```

With the previous section's job, the stale write goes through and salmon kibble is back at 12. With the token, the database refuses it, and the job logs that it skipped three stale writes. And a run that gets to its next renewal before writing stops at the signal, with a `LockLostError`, and writes nothing. The package logs a warning for every lost lock and emits a `lock-lost` event, because a lost lock means another instance may be in the same critical section right now: only the token keeps the two apart.

#### Run the export by hand

Accounting sometimes asks for the export before 02:00. An admin endpoint runs it, and it must never run alongside the scheduled run, on any instance. The scheduled run holds the lock named by its key; the endpoint takes the same lock with `Locks.withLock()`, waiting up to two seconds for a run that is about to finish:

```typescript
@@filename(invoices/invoice-exports.controller)
import { ConflictException, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { LockNotAcquiredError, Locks } from '@nestjs/locks';
import { AdminGuard } from '../admin/admin.guard.js';
import { INVOICE_EXPORT_LOCK, InvoiceExportJob } from './invoice-export.job.js';

@Controller('admin/invoice-exports')
@UseGuards(AdminGuard)
export class InvoiceExportsController {
  constructor(
    private readonly locks: Locks,
    private readonly invoiceExportJob: InvoiceExportJob,
  ) {}

  /** Runs the export now, unless a run (scheduled or not) holds its lock. */
  @Post()
  @HttpCode(200)
  async exportNow() {
    try {
      return await this.locks.withLock(INVOICE_EXPORT_LOCK, () => this.invoiceExportJob.export(), { wait: '2s' });
    } catch (error) {
      if (error instanceof LockNotAcquiredError) {
        throw new ConflictException('An invoice export is already running. Try again when it has finished.');
      }
      throw error;
    }
  }
}
```

The job exports the key as a constant, gets `@WithoutOverlapping()` too, and splits the work out of the scheduled method so the endpoint can call it and return its result:

```typescript
@@filename(invoices/invoice-export.job)
/** The export's lock: held by a run, scheduled or started by hand. */
export const INVOICE_EXPORT_LOCK = 'invoices:nightly-export';

export interface InvoiceExportResult {
  exported: number;
  batchId?: string;
}
```

```typescript
@@filename(invoices/invoice-export.job)
@Cron(process.env.INVOICE_EXPORT_CRON ?? '0 2 * * *', { name: 'invoice-export', timeZone: 'Europe/Warsaw' })
@OnOneInstance({ key: INVOICE_EXPORT_LOCK })
@WithoutOverlapping()
async exportInvoices() {
  await this.export();
}

/** Call it under the INVOICE_EXPORT_LOCK lock. */
async export(): Promise<InvoiceExportResult> {
```

`withLock(key, fn, options)` runs `fn` under the lock and releases it whether `fn` resolves or throws. `wait` is how long to keep trying, with backoff, before it gives up with a `LockNotAcquiredError`; the default is to try once. `acquire(key, options)` is the same without the callback: it resolves a `Lock`, or `null` when the key was taken, and you release it yourself, or with `await using`. A `Lock` has the `fencingToken` and the `signal`, and inside `withLock()` so does `LocksContext`, exactly as in a job.

Neither error carries an HTTP status: contention isn't the caller's mistake, so the handler decides. Here it is a `409`. While the export runs by hand, the scheduled tick on any instance finds the lock held and skips.

> info **Hint** `AdminGuard` is a placeholder. Protect the route with your application's real [authorization](/security/authorization).

#### The store on Redis

The store is a contract, so it can live wherever your instances already meet. If that is Redis, each method is one Lua script, which Redis runs atomically:

```typescript
@@filename(redis/redis-lock.store)
import { Inject, Injectable } from '@nestjs/common';
import { LocksStorage, type LockAcquireResult, type LockStore } from '@nestjs/locks';
import { REDIS } from './redis.module.js';

/** The one ioredis method this store needs. */
export interface RedisEval {
  eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown>;
}

// Takes the lock if nobody holds it, expiring on Redis's clock, and draws a fencing token
// from a counter that never goes back. Returns the token, or 0.
const ACQUIRE = `
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
  return redis.call('INCR', KEYS[2])
end
return 0
`;

// Renews the lock, if it is still ours.
const RENEW = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('PEXPIRE', KEYS[1], ARGV[2])
end
return 0
`;

// Deletes the lock, if it is still ours.
const RELEASE = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

/** Where the fencing counter lives; no lock key can be named like it. */
const FENCING_COUNTER = 'locks:fencing-token';

@Injectable()
export class RedisLockStore implements LockStore {
  constructor(
    @Inject(REDIS) private readonly redis: RedisEval,
    storage: LocksStorage,
  ) {
    storage.registerSource(this);
  }

  async acquire(key: string, owner: string, ttl: number): Promise<LockAcquireResult> {
    const token = Number(await this.redis.eval(ACQUIRE, 2, this.key(key), FENCING_COUNTER, owner, ttl));
    return token > 0 ? { acquired: true, fencingToken: token } : { acquired: false };
  }

  async renew(key: string, owner: string, ttl: number): Promise<boolean> {
    return (await this.redis.eval(RENEW, 1, this.key(key), owner, ttl)) === 1;
  }

  async release(key: string, owner: string): Promise<boolean> {
    return (await this.redis.eval(RELEASE, 1, this.key(key), owner)) === 1;
  }

  private key(key: string) {
    return `locks:key:${key}`;
  }
}
```

`SET NX PX` takes the key only if it is free, expiring on Redis's clock in milliseconds, and the `INCR` in the same script draws the token from one counter for every key. Fencing is only as durable as that counter. It never expires, and it must never go back: give Redis persistence (AOF, or RDB with a short interval) and `maxmemory-policy noeviction`, because a counter that restarts at 1 (a restart without persistence, a `FLUSHALL`) hands out tokens that holders already have, and a lock evicted under memory pressure is a lock lost. A failover to an asynchronous replica can lose the last writes too: a lock taken just before it, which is the paused-holder case the token covers, but also the counter's last increments, after which the next holder may draw a token the previous one already has, and the token no longer tells them apart. Where fencing must hold across a failover, keep the locks in the database, whose sequence is in the same WAL as the rows, or replicate Redis synchronously. The `redis.module` provides the client under the `REDIS` token; the example uses a minimal client with ioredis's `eval()` signature, to stay free of dependencies, and in your application it is `new Redis(process.env.REDIS_URL)`:

```typescript
@@filename(redis/redis.module)
import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { RedisClient } from './redis.client.js';

export const REDIS = Symbol('REDIS');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      // With ioredis: new Redis(process.env.REDIS_URL)
      useFactory: () => new RedisClient(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379'),
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: RedisClient) {}

  // After onModuleDestroy(), where running jobs finish and hand their locks back.
  async onApplicationShutdown() {
    await this.redis.quit();
  }
}
```

Swap the provider in the application module, and nothing else changes:

```typescript
@@filename(app.module.step-7)
@Module({
  imports: [
    DrizzleModule.forRootAsync({
      useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL!, schema }),
    }),
    RedisModule,
    ScheduleModule.forRoot(),
    LocksModule.forRoot(),
    InvoicesModule,
    InventoryModule,
  ],
  providers: [RedisLockStore],
})
export class AppModule {}
```

The example runs the contract suite against a real `redis-server`, on eight connections so the calls overlap, and then three instances of the application on it:

```typescript
@@filename(test/step-7.redis-lock-store.e2e-spec)
describe('the LockStore contract', () => {
  // Several connections, so calls really overlap; expiry is Redis's own clock (real time).
  const pool = Array.from({ length: 8 }, () => new RedisLockStore(connect(), new LocksStorage()));
  let next = 0;
  const cases = lockStoreContract(() => pool[next++ % pool.length]!, { concurrent: true });
  for (const c of cases) it(c.name, c.run);
});
```

Close the Redis client in `onApplicationShutdown()`, as the module does; `@nestjs/drizzle` closes the database pool in the same phase. Nest runs each shutdown phase for the whole application before the next: the package hands the leases back in `onModuleDestroy()` and releases every other lock still held in `beforeApplicationShutdown()`, so by the time any module's `onApplicationShutdown()` runs, nothing of the package's needs the connection, whatever the import order.

#### Hold the warehouse feed on one instance

The warehouse pushes low-stock alerts over a feed that allows one connection per shop. That isn't a scheduled job; it's a connection one instance should hold for as long as it lives, and another should take over when it goes down. That is a leader election, and it is the same lease as a job's ownership, held on purpose:

```typescript
@@filename(inventory/warehouse-feed)
import { Injectable, Logger } from '@nestjs/common';
import { LeaderElection, type Lock, type OnLeadershipAcquired, type OnLeadershipLost } from '@nestjs/locks';
import { WarehouseClient } from './warehouse.client.js';

/**
 * The warehouse's alert feed allows one connection per shop, so one instance of the app
 * holds it: the leader. When the leader goes down, another instance connects within the
 * lease's `ttl`.
 */
@Injectable()
@LeaderElection('inventory:warehouse-feed')
export class WarehouseFeed implements OnLeadershipAcquired, OnLeadershipLost {
  private readonly logger = new Logger(WarehouseFeed.name);

  constructor(private readonly warehouseClient: WarehouseClient) {}

  onLeadershipAcquired(lock: Lock) {
    this.logger.log(`Connected to the warehouse feed (fencing token ${lock.fencingToken})`);
    // The connection ends with the leadership: `lock.signal` aborts when the lease is lost
    // or this instance steps down.
    this.warehouseClient.subscribe(
      (alert) => this.logger.warn(`Low stock: ${alert.count} left of ${alert.productId}`),
      { signal: lock.signal },
    );
  }

  onLeadershipLost() {
    this.logger.log('Disconnected from the warehouse feed');
  }
}
```

```typescript
@@filename(inventory/inventory.module)
import { Module } from '@nestjs/common';
import { StockReconciliationJob } from './stock-reconciliation.job.js';
import { StockRepository } from './stock.repository.js';
import { WarehouseClient } from './warehouse.client.js';
import { WarehouseFeed } from './warehouse-feed.js';

@Module({
  providers: [StockReconciliationJob, StockRepository, WarehouseClient, WarehouseFeed],
})
export class InventoryModule {}
```

`@LeaderElection(key)` goes on a singleton provider. From `onApplicationBootstrap`, every instance tries to take the lease on the key, and keeps trying every `ttl / 3`; the one that has it renews it. `onLeadershipAcquired(lock)` runs when this instance becomes the leader, with the lease's `signal` and `fencingToken`; `onLeadershipLost(lock)` when it stops leading, because the lease was lost or because it stepped down, at shutdown or after `onLeadershipAcquired()` threw. The `ttl` option sets the lease's; the default is the module's 30 seconds, so a crashed leader is replaced within half a minute, and a leader that shuts down cleanly is replaced at the others' next try.

The test starts three instances and shows one connection, a handover at shutdown, and the paused leader's blind spot:

```typescript
@@filename(test/step-8.leader-election.e2e-spec)
await until(() => connected().length === 2, 10_000); // the lease expired in the database
warehouse.notify({ productId: 'salmon-kibble-2kg', count: 2 });
// Both receive it: the paused leader hasn't noticed yet. Anything it writes on the feed's
// behalf needs its fencing token, which is lower than the new leader's.
expect(logger.matching('WARN Low stock: 2 left of salmon-kibble-2kg')).toHaveLength(2);
// The old leader wakes up: its renewal is refused, and it learns it lost the lease.
await clock.advance('3s');
expect(leading.get(crashed)).toBe(false);
expect(disconnected()).toHaveLength(1);
```

A leader that pauses is still connected until its next renewal fails, and receives what the feed sends in between. That is the same blind spot as in [Fence the writes](/reliability/locks#fence-the-writes), with the same answer: what the leader does on the group's behalf carries the lease's token.

#### Try it

Create the database and apply the migrations:

```bash
$ psql postgres://localhost:5432/postgres -c 'CREATE DATABASE store'
$ DATABASE_URL=postgres://localhost:5432/store npx drizzle-kit migrate
```

Start three instances on ports 3001, 3002 and 3003, with `ADMIN_TOKEN=s3cret` and a stock reconciliation every ten seconds instead of five minutes, so there is something to watch: `STOCK_RECONCILIATION_CRON='*/10 * * * * *'`. Each logs the lock store it registered. The first one up leads the warehouse feed, and takes the reconciliation at the first tick, before the other two are up:

```bash
[Nest] 48817  - 09/25/2026, 8:59:26 AM     LOG [LocksModule] LocksStorage: DrizzleLockStore
[Nest] 48817  - 09/25/2026, 8:59:26 AM     LOG [NestApplication] Nest application successfully started +9ms
[Nest] 48817  - 09/25/2026, 8:59:26 AM     LOG [Locks] Leading "inventory:warehouse-feed" (fencing token 1)
[Nest] 48817  - 09/25/2026, 8:59:26 AM     LOG [WarehouseFeed] Connected to the warehouse feed (fencing token 1)
[Nest] 48817  - 09/25/2026, 8:59:30 AM     LOG [Locks] StockReconciliationJob.reconcileStock runs on this instance (lease "inventory:stock-reconciliation:owner", fencing token 2)
[Nest] 48817  - 09/25/2026, 8:59:30 AM     LOG [WarehouseClient] Counted 3 products
[Nest] 48817  - 09/25/2026, 8:59:30 AM     LOG [StockReconciliationJob] Reconciled stock for 3 products (fencing token 3)
[Nest] 48817  - 09/25/2026, 8:59:40 AM     LOG [WarehouseClient] Counted 3 products
[Nest] 48817  - 09/25/2026, 8:59:40 AM     LOG [StockReconciliationJob] Reconciled stock for 3 products (fencing token 9)
```

The other two skip every tick, at debug level:

```bash
[Nest] 48849  - 09/25/2026, 8:59:40 AM   DEBUG [Locks] Skipped StockReconciliationJob.reconcileStock: it runs on another instance
[Nest] 48849  - 09/25/2026, 8:59:50 AM   DEBUG [Locks] Skipped StockReconciliationJob.reconcileStock: it runs on another instance
```

The locks table shows the lease, the run lock (released, so its owner is null, and its token grows with every run) and the feed's lease. Every lock expires thirty seconds after its last renewal, on the database's clock:

```bash
$ psql postgres://localhost:5432/store -c "SELECT key, owner, fencing_token, expires_at - clock_timestamp() AS expires_in FROM locks ORDER BY key"
                 key                  |                owner                 | fencing_token |   expires_in
--------------------------------------+--------------------------------------+---------------+-----------------
 inventory:stock-reconciliation       |                                      |             9 | 00:00:26.026727
 inventory:stock-reconciliation:owner | 1feff401-d3c9-41b1-a559-d7b458e2905f |             2 | 00:00:26.054034
 inventory:warehouse-feed             | a4980740-ae27-4d95-af0b-0935d65fffb9 |             1 | 00:00:22.784351
(3 rows)
```

The fencing tokens have gaps: a refused acquisition still consumed a value from the sequence. Run the export by hand. Without the admin token the guard answers `403`; then send two requests at once, to two different instances:

```bash
$ curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3002/admin/invoice-exports
403
$ for port in 3002 3003; do (curl -s -X POST localhost:$port/admin/invoice-exports -H 'x-admin-token: s3cret'; echo) & done; wait
{"exported":3,"batchId":"acc_447817af"}
{"exported":0}
```

One request took the lock and exported the three pending orders. The other waited for it, took the lock when it was released, and found nothing left. A request that waits more than two seconds gets a `409`. The instance that ran the export logs the batch:

```bash
[Nest] 48849  - 09/25/2026, 8:59:44 AM     LOG [AccountingClient] Booked batch acc_447817af: ord_1001, ord_1002, ord_1004
[Nest] 48849  - 09/25/2026, 8:59:44 AM     LOG [InvoiceExportJob] Exported 3 invoices in batch acc_447817af
```

Now kill the first instance, which runs the reconciliation and leads the feed, without giving it a chance to clean up:

```bash
$ kill -9 48817
```

Nothing happens for a while: the other two keep skipping, because the leases are still in the table. Thirty seconds after its last renewal each one expires. The feed's lease goes first, since it was renewed on its own schedule, and the next tick takes the job over:

```bash
[Nest] 48849  - 09/25/2026, 9:00:11 AM     LOG [Locks] Leading "inventory:warehouse-feed" (fencing token 28)
[Nest] 48849  - 09/25/2026, 9:00:11 AM     LOG [WarehouseFeed] Connected to the warehouse feed (fencing token 28)
[Nest] 48849  - 09/25/2026, 9:00:20 AM     LOG [Locks] StockReconciliationJob.reconcileStock runs on this instance (lease "inventory:stock-reconciliation:owner", fencing token 32)
[Nest] 48849  - 09/25/2026, 9:00:20 AM     LOG [WarehouseClient] Counted 3 products
[Nest] 48849  - 09/25/2026, 9:00:20 AM     LOG [StockReconciliationJob] Reconciled stock for 3 products (fencing token 34)
```

Stop the new owner with `Ctrl+C` instead. Its shutdown hooks hand both leases back (`main.ts` calls `app.enableShutdownHooks()`):

```bash
[Nest] 48849  - 09/25/2026, 9:00:35 AM     LOG [Locks] Stepped down from "inventory:warehouse-feed"
[Nest] 48849  - 09/25/2026, 9:00:35 AM     LOG [WarehouseFeed] Disconnected from the warehouse feed
```

The last instance takes the job at its next tick, and the feed at its next campaign, seconds later rather than thirty:

```bash
[Nest] 48859  - 09/25/2026, 9:00:40 AM     LOG [Locks] StockReconciliationJob.reconcileStock runs on this instance (lease "inventory:stock-reconciliation:owner", fencing token 41)
[Nest] 48859  - 09/25/2026, 9:00:40 AM     LOG [WarehouseClient] Counted 3 products
[Nest] 48859  - 09/25/2026, 9:00:40 AM     LOG [StockReconciliationJob] Reconciled stock for 3 products (fencing token 43)
[Nest] 48859  - 09/25/2026, 9:00:41 AM     LOG [Locks] Leading "inventory:warehouse-feed" (fencing token 45)
[Nest] 48859  - 09/25/2026, 9:00:41 AM     LOG [WarehouseFeed] Connected to the warehouse feed (fencing token 45)
```

Finally stop the last one with `Ctrl+C`. It steps down from the feed before it goes:

```bash
[Nest] 48859  - 09/25/2026, 9:00:50 AM     LOG [Locks] Stepped down from "inventory:warehouse-feed"
[Nest] 48859  - 09/25/2026, 9:00:50 AM     LOG [WarehouseFeed] Disconnected from the warehouse feed
```

#### Testing

An application that imports `LocksModule` and registers no store runs on the in-memory store, so an end-to-end test of one instance needs nothing: every tick runs, once. To keep the Drizzle store out of a test, override its provider with a plain `InMemoryLockStore`; a plain instance doesn't register itself, so the in-memory default applies.

To test what the package is for, run several instances in one process. An instance is a Nest application; instances of one application share a store. The example's helper starts one on the shared database, with the fakes and the test's `LocksModule` options:

```typescript
@@filename(test/helpers)
export async function startInstance(options: InstanceOptions): Promise<TestingModule> {
  if (options.database.url) process.env.DATABASE_URL = options.database.url;
  let builder = Test.createTestingModule({ imports: [options.module] })
    .overrideProvider(AccountingClient)
    .useValue(options.accounting)
    .overrideProvider(WarehouseClient)
    .useValue(options.warehouse);
  if (options.database.pglite) builder = builder.overrideProvider(getDrizzleToken()).useValue(options.database.pglite);
  if (options.locks) builder = builder.overrideProvider(LOCKS_MODULE_OPTIONS).useValue(options.locks);
  const app = await builder.compile();
  app.useLogger(options.logger);
  options.onCompiled?.(app);
  await app.init();
  return app;
}
```

- **Share the database.** On PGlite, every instance gets the same Drizzle database by overriding the one `DrizzleModule` registers (`getDrizzleToken()`), with the real migrations applied; `DrizzleLockStore` injects it with `@InjectDrizzle()`, so the instances share the locks table as they share it in production. Against a PostgreSQL server, each instance opens its own pool from the database's URL. Without a database, share one `InMemoryLockStore` between the instances by registering it in each with `LocksStorage.registerSource()` and its `replace` option before `init()`.
- **Fire the jobs yourself.** Call the method (`await job.exportInvoices()`) on each instance, or go through `@nestjs/schedule` with `schedulerRegistry.getCronJob(name).fireOnTick()`. Both reach the wrapper. Point the real schedules at a date that never comes: the example's `vitest.config.mts` sets the two cron variables to February 29th at 3 AM.
- **Control time.** Override `LOCKS_MODULE_OPTIONS` with a `ManualLockClock`, and every renewal, deadline and `wait` in that instance moves only when the test advances the clock: `await clock.advance('5m')` fires what falls due on the way, in order, and waits for each renewal to reach the store. An instance whose clock you don't advance is a paused process. Against PGlite or a server, the store's clock is real time, so a short `ttl` (`'1s'`) and a `sleep` expire a paused instance's locks; with the in-memory store, give it the same `ManualLockClock` and expiries move with it.
- **Assert on the log** or on `LocksEvents.events$`: which instance runs a job, every skipped tick, every lost lock, every leadership change. The events are also published on the `nestjs:locks:lock-lost`, `nestjs:locks:leadership-acquired` and `nestjs:locks:leadership-lost` diagnostics channels.
- **Test your store** with the contract suite, as the Drizzle, TypeORM and Redis stores do, against the server you run in production.

See [End-to-end testing](/fundamentals/testing#end-to-end-testing) for more about the testing setup.

#### Production checklist

- Register a shared store, on your database or Redis, and run the contract suite against it with `concurrent` on, in CI, on the version you run in production. In production the application refuses to start without one, unless `allowInMemoryStorage` is set, which is only right for a single instance.
- Set `key` on every job that must never run twice, so a rename or a minifier can't change it during a rolling deploy.
- Pick a `ttl` well above the store's round trip and the longest event-loop stall you accept, and short enough that a crash doesn't skip too many ticks. Renewals go out every `ttl / 3`; 30 seconds fits most jobs. A long job's run lock is renewed at the same pace, so its `ttl` doesn't need to cover the run.
- Write jobs that do what is due, not what the tick was for. Missed ticks aren't caught up: a crashed owner costs up to `ttl` of ticks, and ticks during a long run are skipped.
- Pass `LocksContext.signal` to what a job calls, and fence the writes that can't be undone with `LocksContext.fencingToken`, in the same statement that writes. Alert on `lock-lost` from `LocksEvents` or the diagnostics channel: it means renewals failed for longer than `ttl`, because the store was unreachable or the event loop was blocked, and another instance may be running the same critical section.
- Call `app.enableShutdownHooks()`, so a deploy hands the leases over at once instead of leaving them to expire. Close the Redis client in `onApplicationShutdown()`, the phase in which `@nestjs/drizzle` closes the database pool: the package hands the leases back in `onModuleDestroy()` and releases every other lock in `beforeApplicationShutdown()`, phases Nest completes for the whole application first. A lease whose job started less than a second before the shutdown is kept for the rest of that second rather than handed back, so that instances firing the same tick skip it instead of running it a second time.
- With the Redis store, give Redis persistence and `maxmemory-policy noeviction`. The fencing counter must never go back, and a lock must never be evicted.
- With the database store, create the table and the sequence through your migrations, and size the connection pool for one short statement per renewal per held lock, plus one per tick per instance.
- Keep the instances' clocks synchronized with NTP anyway. Expiry is measured on the store's clock, but a holder counts its own deadline, and `@nestjs/schedule` fires on the instance's clock.
- Log level: the skipped ticks are logged at `debug`. Keep that level on for a while after the rollout, to see the jobs settle on one instance.

#### The store contract

The tutorial wrote the store with Drizzle, with TypeORM and with Redis. This section sums up what any `LockStore` must do, for writing one with another database or ORM. The package README's "Implementing a store" has every rule and the race it prevents.

**Registration.** The store is an ordinary singleton provider that calls `registerSource(this)` on the injectable `LocksStorage` in its constructor. The registry checks the shape at once, refuses a second registration unless it passes `replace: true`, and locks when `LocksModule` initializes, logging the store in use. With nothing registered, the module uses `InMemoryLockStore`, which excludes callers in one process only. With `NODE_ENV=production`, startup fails instead, unless you set `allowInMemoryStorage: true`.

**The methods.** All three are atomic: each decides who holds a key, and a read followed by a separate write lets two callers into the critical section, which is the duplicate run the package exists to prevent.

| Method | What it does | How it stays atomic |
| --- | --- | --- |
| `acquire(key, owner, ttl)` | Takes the key if no live lock holds it (none, released, or expired), with a fencing token greater than every token the key had before | One insert that takes over a released or expired row in the same statement, re-checking the expiry in the write, so of many concurrent callers exactly one wins; the token is drawn after the check |
| `renew(key, owner, ttl)` | Moves the owner's live lock's expiry to `ttl` from now | A compare-and-set: the owner and the expiry are in the `WHERE` of the statement that writes |
| `release(key, owner)` | Frees the owner's live lock (deletes it, or marks it released), so the next caller takes it at once. Never resets the key's token | A compare-and-set, as `renew()` |

**What else the store must get right**, all of it checked by the suite: an expired lock doesn't exist, for every method, whether or not it has been deleted (`expires_at > now` in every condition, or let the server expire it); `ttl` is measured on the store's clock, in milliseconds, and can be weeks (past a 32-bit integer: `bigint`, `PEXPIRE`); keys are strings of up to 500 characters, any Unicode, kept apart exactly; tokens are positive safe integers returned as numbers. PostgreSQL returns a `bigint` column as a string unless the ORM converts it; the package refuses such a token at once, with a message naming the fix, rather than let fencing break silently.

**With Prisma.** The Drizzle store is the model, with the same table and sequence; [Keep locks in your database](/reliability/locks#keep-locks-in-your-database) also shows it with TypeORM. `acquire()` is one `INSERT ... ON CONFLICT (key) DO UPDATE ... WHERE owner IS NULL OR expires_at <= clock_timestamp() RETURNING fencing_token`, with the token drawn in the `SET`, after the row lock. Prisma's `upsert()` has no condition on the update, so use `$queryRaw`. `renew()` and `release()` put the owner and the expiry in the `WHERE` of `updateMany()` and check `count === 1`. Not `update()` after a `findUnique()`: it reads first.

**Test it** with the suite from `@nestjs/locks/testing`. `lockStoreContract()` returns cases for any test runner. `concurrent: true` races 16 callers for each key, and its `callers` option raises that; run it against a server with a connection pool, where the calls really overlap. `advanceTime` moves the store's clock for the expiry cases; without it they wait in real time, about twenty-five seconds in total, on locks of `ttl` (2.5 seconds by default, checked still held halfway through and free a sixth past it: raise it for a store whose round trips are slow).

#### Reference

##### Module options

`LocksModule.forRoot()` takes these options; `forRootAsync()` takes them from `useFactory`, `useClass` or `useExisting` (a class implementing `LocksOptionsFactory`). The store isn't an option: register it with `LocksStorage`, as in [Keep locks in your database](/reliability/locks#keep-locks-in-your-database).

| Option | Default | Meaning |
| --- | --- | --- |
| `ttl` | `'30s'` | How long a lock lives without a renewal, so how soon another instance takes over after a crash. The default for every lock, lease and election. A duration: milliseconds, or a string such as `'15s'` or `'2m'` |
| `clock` | The system clock | A `LockClock`. Tests pass a `ManualLockClock` ([Testing](/reliability/locks#testing)) |
| `allowInMemoryStorage` | `false` | With `NODE_ENV=production` and no registered store, startup fails; `true` runs on the in-memory store anyway (one instance) |
| `isGlobal` | `true` | Registers the module globally. Top level of `forRoot()` and `forRootAsync()` |

##### Decorators and methods

| API | Options | Notes |
| --- | --- | --- |
| `@OnOneInstance()` | `key`, `ttl` | Runs the job on the instance holding the `<key>:owner` lease; other instances skip the tick. [Run each job on one instance](/reliability/locks#run-each-job-on-one-instance) |
| `@WithoutOverlapping()` | `key`, `ttl` | Skips a tick while a run holds the `<key>` lock, on any instance. [Don't let a long run overlap itself](/reliability/locks#dont-let-a-long-run-overlap-itself) |
| `@LeaderElection(key)` | `ttl` | On a singleton provider implementing `OnLeadershipAcquired`, `OnLeadershipLost` or both. [Hold the warehouse feed on one instance](/reliability/locks#hold-the-warehouse-feed-on-one-instance) |
| `Locks.acquire(key, options)` | `ttl`, `wait`, `signal` | Resolves a `Lock`, or `null` when the key stayed taken. [Run the export by hand](/reliability/locks#run-the-export-by-hand) |
| `Locks.withLock(key, fn, options)` | `ttl`, `wait`, `signal` | Runs `fn(lock)` under the lock and releases it; rejects with `LockNotAcquiredError` when the key stayed taken |

- `key` defaults to `ClassName.methodName`, and the two job decorators on one method share it. `ttl` defaults to the module's.
- `wait` defaults to `0` (try once); a longer wait retries with backoff. `signal` stops the waiting.
- A `Lock` has `key`, `owner`, `fencingToken`, `signal`, `held`, `release()` and `[Symbol.asyncDispose]`, so `await using` releases it.
- `LocksContext` has `lock`, `fencingToken` and `signal` inside a job, a `withLock()` callback, or `run(lock, fn)`; outside one, they are `undefined`. [Fence the writes](/reliability/locks#fence-the-writes)

##### Events

`LocksEvents.events$` emits each event, and publishes it on its `node:diagnostics_channel` channel. Every payload has `type`, `key` and `fencingToken`.

| Event | Channel | Other fields | When |
| --- | --- | --- | --- |
| `lock-lost` | `nestjs:locks:lock-lost` | `detectedBy`: `'renewal'` or `'deadline'` | A holder lost a lock it was using. Alert on it |
| `leadership-acquired` | `nestjs:locks:leadership-acquired` | None | This instance became the leader of `key` |
| `leadership-lost` | `nestjs:locks:leadership-lost` | `reason`: `'lost'` or `'released'` | This instance stopped leading: the lease was lost, or it stepped down |

##### Errors

None of them carries an HTTP status: contention isn't the caller's mistake, so the handler picks the response ([Run the export by hand](/reliability/locks#run-the-export-by-hand) answers `409`).

| Error | Properties | Raised when |
| --- | --- | --- |
| `LocksError` | None | The base class of the two below |
| `LockNotAcquiredError` | `key`, `waitMs` | `withLock()` couldn't take the lock within `wait` |
| `LockLostError` | `key`, `fencingToken`, `detectedBy` | The reason a lost lock's `signal` aborts with: the store refused a renewal (`'renewal'`), or `ttl` passed without a confirmed one (`'deadline'`) |
