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

- PostgreSQL, with [Drizzle ORM](https://orm.drizzle.team) on the `pg` driver, registered through [`@nestjs/drizzle`](/data/drizzle). The outbox's messages commit with your rows, so they live in the database your orders live in, on a database server that outlives any instance of the application. Using TypeORM or Prisma? Follow the tutorial for what the application does, and take the store from [The store with TypeORM](/reliability/outbox#the-store-with-typeorm) or [The store with Prisma](/reliability/outbox#the-store-with-prisma).
- `@nestjs/microservices`, for the TCP link to the analytics service in [Publish to the analytics microservice](/reliability/outbox#publish-to-the-analytics-microservice).

Install the package:

```bash
$ npm i --save @nestjs/outbox
```

#### Set up the database

The outbox keeps its messages in three tables of your application's database: `outbox_messages`, `outbox_dead_letters` and `outbox_inbox`. They go into your Drizzle schema next to the order API's own tables, so drizzle-kit writes their migrations like any others:

```typescript
@@filename(database/schema)
import type { OutboxAttempt, OutboxDeadLetterReason } from '@nestjs/outbox';
import { bigint, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import type { OrderItem } from '../orders/order.js';

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  /** In cents. */
  price: integer('price').notNull(),
  inStock: integer('in_stock').notNull(),
  reserved: integer('reserved').notNull().default(0),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  items: jsonb('items').$type<OrderItem[]>().notNull(),
  /** In cents. */
  total: integer('total').notNull(),
  status: text('status').$type<'placed' | 'cancelled'>().notNull(),
});

// The outbox's tables, read and written by DrizzleOutboxStore.

export const outboxMessages = pgTable(
  'outbox_messages',
  {
    /** Order within a key: numbered at insert, in commit order (DrizzleOutboxStore.add() locks the key). */
    seq: bigint('seq', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    id: text('id').notNull().unique(),
    topic: text('topic').notNull(),
    // A null payload is stored as NULL.
    payload: jsonb('payload').$type<unknown>(),
    headers: jsonb('headers').$type<Record<string, string>>().notNull(),
    key: text('key'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    availableAt: timestamp('available_at', { withTimezone: true }).notNull(),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    history: jsonb('history').$type<OutboxAttempt[]>().notNull().default([]),
    leaseOwner: text('lease_owner'),
    leaseUntil: timestamp('lease_until', { withTimezone: true }),
  },
  // A key's older messages, for the claim's per-key check.
  (table) => [index('outbox_messages_key_seq').on(table.key, table.seq)],
);

export const outboxDeadLetters = pgTable(
  'outbox_dead_letters',
  {
    id: text('id').primaryKey(),
    /** The message's place in its key, so a requeue puts it back there. */
    seq: bigint('seq', { mode: 'number' }).notNull(),
    topic: text('topic').notNull(),
    payload: jsonb('payload').$type<unknown>(),
    headers: jsonb('headers').$type<Record<string, string>>().notNull(),
    key: text('key'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    attempts: integer('attempts').notNull(),
    lastError: text('last_error'),
    history: jsonb('history').$type<OutboxAttempt[]>().notNull(),
    reason: text('reason').$type<OutboxDeadLetterReason>().notNull(),
    failedAt: timestamp('failed_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('outbox_dead_letters_topic_failed_at').on(table.topic, table.failedAt)],
);

export const outboxInbox = pgTable(
  'outbox_inbox',
  {
    consumer: text('consumer').notNull(),
    messageId: text('message_id').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    // One record per consumer and message: the unique key two deliveries meet at.
    primaryKey({ columns: [table.consumer, table.messageId] }),
    index('outbox_inbox_processed_at').on(table.processedAt),
  ],
);
```

`seq` is the order within a key: an identity column, numbered when a row is inserted. Payloads, headers and failure histories are `jsonb`, and times are `timestamptz`. The `(key, seq)` index is what a claim's per-key check reads (see the next section).

[`DrizzleModule`](/data/drizzle) registers the database in the root module ([Register the outbox](/reliability/outbox#register-the-outbox) shows the whole module). Its `forRootAsync()` factory runs once per application: the module calls the driver's `drizzle()` with the connection string and the schema, which opens a `pg` pool on `DATABASE_URL`, and ends that pool when the application shuts down:

```typescript
@@filename(app.module)
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './database/schema.js';
// ...
DrizzleModule.forRootAsync({
  // A pg pool on DATABASE_URL, closed in onApplicationShutdown(), after the relay drained.
  useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL!, schema }),
}),
```

> info **Hint** The tutorial reads `process.env` directly, to stay short. In an application, load the environment through [`@nestjs/config`](/application/configuration) with a validation schema, so a missing `DATABASE_URL` stops the application at startup, and read it from `ConfigService` in the factory.

The module ends the pool in `onApplicationShutdown()`. Nest runs that phase after `onModuleDestroy()`, which is when the relay finishes its in-flight work, so the relay never loses its connection mid-publish.

The services inject the database with `@InjectDrizzle()`, and type it and their transactions with Drizzle's own types:

```typescript
@@filename(database/drizzle)
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './schema.js';

export type Database = NodePgDatabase<typeof schema>;
/** The `tx` that `db.transaction()` passes its callback. */
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
```

drizzle-kit writes the migrations from the schema. The order tables came first; the outbox's tables get a migration of their own, and a custom migration adds the products:

```bash
$ npx drizzle-kit generate --name=outbox
$ npx drizzle-kit generate --custom --name=seed_products
$ npx drizzle-kit migrate
```

```sql
@@filename(drizzle/0001_outbox.sql)
CREATE TABLE "outbox_messages" (
	"seq" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "outbox_messages_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id" text NOT NULL,
	"topic" text NOT NULL,
	"payload" jsonb,
	"headers" jsonb NOT NULL,
	"key" text,
	"created_at" timestamp with time zone NOT NULL,
	"available_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lease_owner" text,
	"lease_until" timestamp with time zone,
	CONSTRAINT "outbox_messages_id_unique" UNIQUE("id")
);
...
```

#### Write the outbox store

The outbox reads and writes those tables through a **store**: a provider of yours that implements the package's two storage interfaces, `OutboxStore` for the messages and `OutboxInboxStore` for the consumers' inboxes, and registers itself with `OutboxStorage`. The package documents what each method must guarantee; your store supplies the queries, with the ORM you already use. Most methods are a single Drizzle query, and a few carry the rules that keep messages in order and never hand one to two relays:

```typescript
@@filename(database/drizzle-outbox.store)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import {
  OutboxStorage,
  OutboxTransactionRequiredError,
  type OutboxClaimRequest,
  type OutboxDeadLetter,
  type OutboxDeadLetterFilter,
  type OutboxDeadLetterQuery,
  type OutboxDeadLetterUpdate,
  type OutboxInboxStore,
  type OutboxMessage,
  type OutboxRescheduleUpdate,
  type OutboxStore,
  type OutboxStoreStats,
} from '@nestjs/outbox';
import { and, desc, eq, getTableColumns, gt, inArray, isNull, lt, lte, notExists, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { createHash } from 'node:crypto';
import type { Database, Transaction } from './drizzle.js';
import { outboxDeadLetters, outboxInbox, outboxMessages } from './schema.js';

/** Advisory lock classes (the two-number form): any two numbers no other code of yours locks on. */
const CLAIM_LOCK = 20_260_901;
const KEY_LOCK = 20_260_902;

@Injectable()
export class DrizzleOutboxStore implements OutboxStore<Transaction>, OutboxInboxStore<Transaction> {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    storage: OutboxStorage,
  ) {
    storage.registerSource({ messages: this, inbox: this });
  }

  async add(tx: Transaction, messages: readonly OutboxMessage[]): Promise<void> {
    assertTransaction(tx);
    if (messages.length === 0) return;
    // Commit order: a transaction adding a message with the same key waits here until this
    // one commits or rolls back, so rows are numbered in the order they become visible.
    for (const lock of keyLocks(messages)) {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${KEY_LOCK}::int, ${lock}::int)`);
    }
    await tx.insert(outboxMessages).values(
      messages.map((message) => ({
        id: message.id,
        topic: message.topic,
        payload: message.payload,
        headers: message.headers,
        key: message.key,
        createdAt: new Date(message.createdAt),
        availableAt: new Date(message.availableAt),
      })),
    );
  }

  claim({ owner, now, leaseMs, limit }: OutboxClaimRequest): Promise<OutboxMessage[]> {
    return this.db.transaction(
      async (tx) => {
        // Claims take turns, so each one sees the leases of the one before it.
        await tx.execute(sql`SELECT pg_advisory_xact_lock(${CLAIM_LOCK}::int, 0)`);
        // Due rows in seq order, stopping at `limit` claimable ones: a primary-key index scan,
        // whatever the backlog. SKIP LOCKED passes over a row a relay is writing right now.
        const due = await tx
          .select({ seq: outboxMessages.seq })
          .from(outboxMessages)
          .where(this.claimable(now))
          .orderBy(outboxMessages.seq)
          .limit(limit)
          .for('update', { skipLocked: true });
        if (due.length === 0) return [];
        const seqs = due.map((row) => row.seq);
        await tx
          .update(outboxMessages)
          .set({ leaseOwner: owner, leaseUntil: new Date(now + leaseMs) })
          .where(inArray(outboxMessages.seq, seqs));

        // A last look before committing: each claimed row's predecessor in its key must be
        // ours too. A row whose older sibling was skipped as locked, or came back meanwhile (a
        // dead letter requeued right then), goes back with the rest of its key.
        const previous = alias(outboxMessages, 'previous');
        const rows = await tx
          .select({
            ...getTableColumns(outboxMessages),
            behindOther: sql<boolean | null>`(${tx
              .select({ other: sql`${previous.leaseOwner} IS DISTINCT FROM ${owner}` })
              .from(previous)
              .where(and(eq(previous.key, outboxMessages.key), lt(previous.seq, outboxMessages.seq)))
              .orderBy(desc(previous.seq))
              .limit(1)})`,
          })
          .from(outboxMessages)
          .where(inArray(outboxMessages.seq, seqs))
          .orderBy(outboxMessages.seq);
        const blocked = new Set<string>();
        const giveBack: number[] = [];
        const batch: OutboxMessage[] = [];
        for (const { behindOther, ...row } of rows) {
          if (row.key !== null && (behindOther === true || blocked.has(row.key))) {
            blocked.add(row.key);
            giveBack.push(row.seq);
          } else {
            batch.push(toMessage(row));
          }
        }
        if (giveBack.length > 0) {
          await tx
            .update(outboxMessages)
            .set({ leaseOwner: null, leaseUntil: null })
            .where(inArray(outboxMessages.seq, giveBack));
        }
        return batch;
      },
      // Each statement sees what committed before it started (PostgreSQL's default).
      { isolationLevel: 'read committed' },
    );
  }

  async markPublished(id: string, owner: string): Promise<boolean> {
    const deleted = await this.db
      .delete(outboxMessages)
      .where(leasedBy(id, owner))
      .returning({ id: outboxMessages.id });
    return deleted.length === 1;
  }

  async reschedule(id: string, owner: string, update: OutboxRescheduleUpdate): Promise<boolean> {
    const updated = await this.db
      .update(outboxMessages)
      .set({
        attempts: update.attempts,
        availableAt: new Date(update.availableAt),
        lastError: update.error.error,
        history: sql`${outboxMessages.history} || ${JSON.stringify([update.error])}::jsonb`,
        leaseOwner: null,
        leaseUntil: null,
      })
      .where(leasedBy(id, owner))
      .returning({ id: outboxMessages.id });
    return updated.length === 1;
  }

  deadLetter(id: string, owner: string, update: OutboxDeadLetterUpdate): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx.delete(outboxMessages).where(leasedBy(id, owner)).returning();
      if (!row) return false;
      const deadLetter = {
        id: row.id,
        seq: row.seq,
        topic: row.topic,
        payload: row.payload,
        headers: row.headers,
        key: row.key,
        createdAt: row.createdAt,
        attempts: update.attempts,
        lastError: update.error.error,
        history: [...row.history, update.error],
        reason: update.reason,
        failedAt: new Date(update.failedAt),
      };
      // Replaces an earlier dead letter with this id (a producer that reused a custom id).
      await tx
        .insert(outboxDeadLetters)
        .values(deadLetter)
        .onConflictDoUpdate({ target: outboxDeadLetters.id, set: deadLetter });
      return true;
    });
  }

  async release(ids: readonly string[], owner: string): Promise<number> {
    const released = await this.db
      .update(outboxMessages)
      .set({ leaseOwner: null, leaseUntil: null })
      .where(and(eq(outboxMessages.leaseOwner, owner), inArray(outboxMessages.id, [...ids])))
      .returning({ id: outboxMessages.id });
    return released.length;
  }

  async stats(now: number): Promise<OutboxStoreStats> {
    const at = new Date(now);
    const [pending, ready, leased, deadLetters, [oldest]] = await Promise.all([
      this.db.$count(outboxMessages),
      this.db.$count(outboxMessages, this.claimable(now)),
      this.db.$count(outboxMessages, gt(outboxMessages.leaseUntil, at)),
      this.db.$count(outboxDeadLetters),
      // Waiting since it became due; once an attempt failed, since it was added.
      this.db
        .select({
          dueAt: sql<Date | null>`min(CASE
            WHEN ${gt(outboxMessages.attempts, 0)} THEN ${outboxMessages.createdAt}
            WHEN ${lte(outboxMessages.availableAt, at)} THEN ${outboxMessages.availableAt} END)`.mapWith(
            outboxMessages.createdAt,
          ),
        })
        .from(outboxMessages),
    ]);
    return { pending, ready, leased, deadLetters, oldestDueAt: oldest?.dueAt?.getTime() ?? null };
  }

  async listDeadLetters({ topic, key, limit = 50, offset = 0 }: OutboxDeadLetterQuery): Promise<OutboxDeadLetter[]> {
    const rows = await this.db
      .select()
      .from(outboxDeadLetters)
      .where(
        and(
          topic === undefined ? undefined : eq(outboxDeadLetters.topic, topic),
          key === undefined ? undefined : eq(outboxDeadLetters.key, key),
        ),
      )
      .orderBy(desc(outboxDeadLetters.failedAt), desc(outboxDeadLetters.id))
      .limit(limit)
      .offset(offset);
    return rows.map(toDeadLetter);
  }

  async getDeadLetter(id: string): Promise<OutboxDeadLetter | undefined> {
    const [row] = await this.db.select().from(outboxDeadLetters).where(eq(outboxDeadLetters.id, id));
    return row && toDeadLetter(row);
  }

  requeueDeadLetters(filter: OutboxDeadLetterFilter, now: number): Promise<number> {
    const where = deadLetterFilter(filter);
    return this.db.transaction(async (tx) => {
      const rows = await tx.delete(outboxDeadLetters).where(where).returning();
      if (rows.length === 0) return 0;
      // The original seq: back ahead of the messages added after it, with the same key.
      await tx.insert(outboxMessages).values(
        rows.map((row) => ({
          seq: row.seq,
          id: row.id,
          topic: row.topic,
          payload: row.payload,
          headers: row.headers,
          key: row.key,
          createdAt: row.createdAt,
          availableAt: new Date(now),
          lastError: row.lastError,
          history: row.history,
        })),
      );
      return rows.length;
    });
  }

  async purgeDeadLetters(filter: OutboxDeadLetterFilter): Promise<number> {
    const purged = await this.db
      .delete(outboxDeadLetters)
      .where(deadLetterFilter(filter))
      .returning({ id: outboxDeadLetters.id });
    return purged.length;
  }

  async recordInbox(tx: Transaction | undefined, consumer: string, messageId: string, now: number): Promise<boolean> {
    if (tx !== undefined) assertTransaction(tx);
    // One statement on the unique key: a concurrent delivery waits for this transaction.
    const inserted = await (tx ?? this.db)
      .insert(outboxInbox)
      .values({ consumer, messageId, processedAt: new Date(now) })
      .onConflictDoNothing()
      .returning({ consumer: outboxInbox.consumer });
    return inserted.length === 1;
  }

  async hasInbox(consumer: string, messageId: string): Promise<boolean> {
    const found = await this.db.$count(
      outboxInbox,
      and(eq(outboxInbox.consumer, consumer), eq(outboxInbox.messageId, messageId)),
    );
    return found > 0;
  }

  async pruneInbox(before: number): Promise<number> {
    const pruned = await this.db
      .delete(outboxInbox)
      .where(lt(outboxInbox.processedAt, new Date(before)))
      .returning({ consumer: outboxInbox.consumer });
    return pruned.length;
  }

  /**
   * Due, unleased, and no older message with the same key is delayed or leased. The
   * NOT EXISTS probes the (key, seq) index from the key's oldest row.
   */
  private claimable(now: number): SQL {
    const at = new Date(now);
    const older = alias(outboxMessages, 'older');
    return and(
      lte(outboxMessages.availableAt, at),
      or(isNull(outboxMessages.leaseUntil), lte(outboxMessages.leaseUntil, at)),
      or(
        isNull(outboxMessages.key),
        notExists(
          this.db
            .select({ one: sql`1` })
            .from(older)
            .where(
              and(
                eq(older.key, outboxMessages.key),
                lt(older.seq, outboxMessages.seq),
                or(gt(older.availableAt, at), gt(older.leaseUntil, at)),
              ),
            ),
        ),
      ),
    )!;
  }
}

/** Drizzle's `tx` has rollback(); the database itself doesn't, and would write outside the transaction. */
function assertTransaction(tx: Transaction) {
  if (typeof (tx as Partial<Transaction> | undefined)?.rollback !== 'function') {
    throw new OutboxTransactionRequiredError('Pass the tx that db.transaction() gives you, not the database.');
  }
}

/** One lock per key, sorted, so two transactions locking the same keys can't deadlock. */
function keyLocks(messages: readonly OutboxMessage[]): number[] {
  const keys = new Set(messages.flatMap((message) => (message.key === null ? [] : [message.key])));
  const locks = [...keys].map((key) => createHash('sha256').update(key).digest().readInt32BE(0));
  return [...new Set(locks)].sort((a, b) => a - b);
}

/** The message, if `owner` still holds its lease: every relay write is fenced by it. */
function leasedBy(id: string, owner: string): SQL {
  return and(eq(outboxMessages.id, id), eq(outboxMessages.leaseOwner, owner))!;
}

/** The filter's fields combined with AND; an empty filter is refused unless it says `all`. */
function deadLetterFilter({ ids, topic, key, failedBefore, all }: OutboxDeadLetterFilter): SQL | undefined {
  const conditions: SQL[] = [];
  if (ids) conditions.push(inArray(outboxDeadLetters.id, ids));
  if (topic !== undefined) conditions.push(eq(outboxDeadLetters.topic, topic));
  if (key !== undefined) conditions.push(eq(outboxDeadLetters.key, key));
  if (failedBefore !== undefined) conditions.push(lt(outboxDeadLetters.failedAt, new Date(+failedBefore)));
  if (conditions.length === 0 && !all) {
    throw new Error('Refusing an empty dead-letter filter; pass { all: true }');
  }
  return and(...conditions);
}

function toMessage(row: typeof outboxMessages.$inferSelect): OutboxMessage {
  return {
    id: row.id,
    topic: row.topic,
    payload: row.payload,
    headers: row.headers,
    key: row.key,
    createdAt: row.createdAt.getTime(),
    availableAt: row.availableAt.getTime(),
    attempts: row.attempts,
    lastError: row.lastError,
  };
}

function toDeadLetter(row: typeof outboxDeadLetters.$inferSelect): OutboxDeadLetter {
  return {
    id: row.id,
    topic: row.topic,
    payload: row.payload,
    headers: row.headers,
    key: row.key,
    createdAt: row.createdAt.getTime(),
    attempts: row.attempts,
    lastError: row.lastError,
    reason: row.reason,
    failedAt: row.failedAt.getTime(),
    history: row.history,
  };
}
```

- **`add()` locks each key on your transaction.** PostgreSQL runs transactions side by side and numbers rows when they're inserted, not when they commit. Without a lock, a transaction that adds a key's second message could commit first, and a relay could publish it before the first one is even visible. `pg_advisory_xact_lock` makes the second transaction wait until the first commits or rolls back. The lock is released with the transaction, stores nothing, and messages without a key take none. The locks are taken in sorted order, so two transactions adding the same keys can't deadlock on them.
- **`claim()` takes turns, reads in order, and looks again.** The claim lock lets one claim run at a time, so each sees the leases of the one before it. The claim reads due rows in `seq` order and stops at the batch size, so it takes about as long over 40,000 pending messages as over 200 (about 3 ms on PGlite). `SKIP LOCKED` passes over a row another relay is writing at that moment. Before committing, the claim checks each row's predecessor in its key: a row whose older sibling was skipped, or came back meanwhile as a requeued dead letter, goes back with the rest of its key.
- **Every relay write is fenced.** `markPublished()`, `reschedule()`, `deadLetter()` and `release()` carry `lease_owner = owner` in their own `WHERE`. A relay that stalled past its lease changes nothing, even if another relay took the message over a moment earlier.
- **Moves are atomic.** `deadLetter()` and `requeueDeadLetters()` delete with `RETURNING` and insert in one transaction, and a dead letter keeps its `seq`, so a requeue puts it back at its place.
- **The inbox is one insert.** `recordInbox()` inserts with `ON CONFLICT DO NOTHING` on the primary key. A second delivery of the same message waits for the first transaction, then sees its record: exactly once, never twice.

Raw `sql` appears only where the query builder has no equivalent: the advisory locks, appending to the `jsonb` history, the predecessor subquery and `min(CASE ...)` in `stats()`.

`storage.registerSource()` makes the provider the outbox's store, registered by name for both contracts: `messages` and `inbox`. Registration is explicit and happens in the constructor, so the store must be a singleton provider; the outbox settles on it when the application initializes and logs `OutboxStorage: DrizzleOutboxStore`. Without a registered store, the outbox keeps everything in memory, which is lost on restart and can't join your transactions. In production (`NODE_ENV=production`) that fails at startup instead. [The store contract](/reliability/outbox#the-store-contract), after the tutorial, covers what a store must do.

To check the store, run the package's contract suites against it, one per interface. `outboxStoreContract()` and `outboxInboxStoreContract()` from `@nestjs/outbox/testing` return test cases for any test runner; each case gets a store on empty tables and a way to open one of your transactions. The `concurrent` option adds the races a naive store fails: producers of a key committing out of order, relays claiming the same message, a stale relay's write racing a takeover, and two deliveries of one message:

```typescript
@@filename(test/drizzle-outbox.store.e2e-spec)
import { outboxInboxStoreContract, outboxStoreContract, type OutboxStoreHarness } from '@nestjs/outbox/testing';
// ...
/** A store on emptied tables, built the way Nest builds it: with the database and a registry. */
async function freshStore(db: Database): Promise<OutboxStoreHarness<Transaction> & { store: DrizzleOutboxStore }> {
  await db.execute(sql`TRUNCATE outbox_messages, outbox_dead_letters, outbox_inbox RESTART IDENTITY`);
  const store = new DrizzleOutboxStore(db, new OutboxStorage());
  return { store, transaction: (work) => db.transaction(work), notATransaction: db };
}

describe('DrizzleOutboxStore on PGlite: the store contract', () => {
  const client = new PGlite();
  const db = drizzlePglite(client, { schema }) as unknown as Database;
  beforeAll(() => migratePglite(db as never, { migrationsFolder }));
  afterAll(() => client.close());

  // The concurrency cases run too; with one connection, PGlite runs them one transaction at a time.
  for (const c of outboxStoreContract(() => freshStore(db), { concurrent: true })) it(c.name, c.run);
  describe('the inbox contract', () => {
    for (const c of outboxInboxStoreContract(() => freshStore(db), { concurrent: true })) it(c.name, c.run);
  });
});
```

PGlite has one connection, so the races run one transaction at a time there. The example runs the same cases against a PostgreSQL server through a `pg` pool, where the transactions really overlap. It also checks that the suite catches a store without the key locks, and one whose `markPublished()` reads the row first and then deletes it by id.

#### Register the outbox

Register `OutboxModule` in the root module, after the `DrizzleModule` from [Set up the database](/reliability/outbox#set-up-the-database), with the store in its `providers`. The feature modules it imports are built in the next steps:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nestjs/drizzle';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientProxyTransport, OutboxModule } from '@nestjs/outbox';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzleOutboxStore } from './database/drizzle-outbox.store.js';
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
  // Registers itself as the outbox's store.
  providers: [DrizzleOutboxStore],
})
export class AppModule {}
```

`ClientProxyTransport(ANALYTICS_SERVICE)` is a class that Nest instantiates inside `OutboxModule`, so `transports` sits next to `useFactory`, where classes go. The factory runs when the application starts and returns the rest of the options:

- `transports` and `route`: where each message is published. The `local` transport is built in and runs `@OnOutboxMessage()` handlers in this process ([Handle order.placed in-process](/reliability/outbox#handle-orderplaced-in-process)). `ClientProxyTransport(ANALYTICS_SERVICE)` publishes through the TCP client that `ClientsModule` registers under that name, which is why that module is in `imports` ([Publish to the analytics microservice](/reliability/outbox#publish-to-the-analytics-microservice)). `route` picks exactly one transport per message.
- `relay`: the background publisher. It polls every `pollInterval`, leases what it claims for `lease`, and gives up on a single publish after `publishTimeout`. Setting `OUTBOX_RELAY=off` turns it off in API-only instances ([Run several instances](/reliability/outbox#run-several-instances)).
- `retry`: 10 attempts, with exponential backoff that starts at 1 second and is capped at 1 minute ([Retries and the dead-letter queue](/reliability/outbox#retries-and-the-dead-letter-queue)).

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
import { inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
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
    if (!items?.length) throw new BadRequestException('An order needs at least one item');

    const order = await this.db.transaction(async (tx) => {
      const ids = items.map((item) => item.productId);
      const prices = await tx.select().from(products).where(inArray(products.id, ids));
      const lines = items.map(({ productId, quantity }) => {
        const product = prices.find((row) => row.id === productId);
        if (!product) throw new BadRequestException(`Unknown product "${productId}"`);
        if (!Number.isInteger(quantity) || quantity < 1) {
          throw new BadRequestException(`Invalid quantity for "${productId}"`);
        }
        return { productId, quantity, price: product.price };
      });
      const order: Order = {
        id: randomUUID(),
        userId,
        items: lines,
        total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
        status: 'placed',
      };
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

`outbox.add()` takes the transaction handle first, then the message or an array of messages. With Drizzle, the handle is the `tx` that `db.transaction()` passes its callback. `DrizzleOutboxStore.add()` inserts with `tx.insert()`, so the messages commit with the order, or roll back with it. The store is asynchronous, so await `add()` like any other query. Every API in the package that joins your transaction takes the handle as its first argument.

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
    if (!row) throw new NotFoundException(`Order ${id} not found`);
    if (row.status !== 'placed') throw new ConflictException(`Order ${id} is ${row.status}`);

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

The analytics service is a separate Nest application, and like any service it owns its data: a PostgreSQL database of its own, with its own schema and migrations. It never reads the order API's tables. It records each order event in an `order_events` table, and keeps its inbox next to it, so an event and the record that it was processed commit together:

```typescript
@@filename(analytics-service/database/schema)
import { bigint, index, integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

export const orderEvents = pgTable(
  'order_events',
  {
    /** Arrival order. */
    seq: bigint('seq', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    orderId: text('order_id').notNull(),
    event: text('event').$type<'placed' | 'cancelled'>().notNull(),
    /** The change to revenue, in cents: the order's total when placed, minus it when cancelled. */
    amount: integer('amount').notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('order_events_order_id').on(table.orderId)],
);

// The inbox, read and written by DrizzleInboxStore: the message ids this service has processed.
export const outboxInbox = pgTable(
  'outbox_inbox',
  {
    consumer: text('consumer').notNull(),
    messageId: text('message_id').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    // One record per consumer and message: the unique key two deliveries meet at.
    primaryKey({ columns: [table.consumer, table.messageId] }),
    index('outbox_inbox_processed_at').on(table.processedAt),
  ],
);
```

It registers `DrizzleModule` as the order API does in [Set up the database](/reliability/outbox#set-up-the-database), on its own `DATABASE_URL` and schema, and its migrations have their own drizzle-kit config:

```bash
$ npx drizzle-kit generate --config analytics-service/drizzle.config.ts --name=analytics
$ npx drizzle-kit migrate --config analytics-service/drizzle.config.ts
```

The service only consumes, so it registers `OutboxModule` with the relay turned off. That gives it an `OutboxInbox`, backed by a store on its own database. It registers the store for the `inbox` contract alone: a service that only consumes needs nothing else, so its store implements just the three methods of `OutboxInboxStore`, the inbox half of the order API's store:

```typescript
@@filename(analytics-service/database/drizzle-inbox.store)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { OutboxStorage, OutboxTransactionRequiredError, type OutboxInboxStore } from '@nestjs/outbox';
import { and, eq, lt } from 'drizzle-orm';
import type { Database, Transaction } from './drizzle.js';
import { outboxInbox } from './schema.js';

/** The inbox half of the order API's DrizzleOutboxStore: all a consumer-only service needs. */
@Injectable()
export class DrizzleInboxStore implements OutboxInboxStore<Transaction> {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    storage: OutboxStorage,
  ) {
    // Consumer only: the inbox is the one contract this service registers.
    storage.registerSource({ inbox: this });
  }

  async recordInbox(tx: Transaction | undefined, consumer: string, messageId: string, now: number): Promise<boolean> {
    if (tx !== undefined && typeof (tx as Partial<Transaction>).rollback !== 'function') {
      throw new OutboxTransactionRequiredError('Pass the tx that db.transaction() gives you, not the database.');
    }
    // One statement on the unique key: a concurrent delivery waits for this transaction.
    const inserted = await (tx ?? this.db)
      .insert(outboxInbox)
      .values({ consumer, messageId, processedAt: new Date(now) })
      .onConflictDoNothing()
      .returning({ consumer: outboxInbox.consumer });
    return inserted.length === 1;
  }

  async hasInbox(consumer: string, messageId: string): Promise<boolean> {
    const found = await this.db.$count(
      outboxInbox,
      and(eq(outboxInbox.consumer, consumer), eq(outboxInbox.messageId, messageId)),
    );
    return found > 0;
  }

  async pruneInbox(before: number): Promise<number> {
    const pruned = await this.db
      .delete(outboxInbox)
      .where(lt(outboxInbox.processedAt, new Date(before)))
      .returning({ consumer: outboxInbox.consumer });
    return pruned.length;
  }
}
```

```typescript
@@filename(analytics-service/analytics.module)
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nestjs/drizzle';
import { OutboxModule } from '@nestjs/outbox';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AnalyticsController } from './analytics.controller.js';
import { DrizzleInboxStore } from './database/drizzle-inbox.store.js';
import * as schema from './database/schema.js';
import { OrderStatsService } from './order-stats.service.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      // This service's own database, not the order API's.
      useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL!, schema }),
    }),
    // Consumer only: the store holds this service's inbox, and no relay runs.
    OutboxModule.forRoot({ relay: { enabled: false } }),
  ],
  controllers: [AnalyticsController],
  providers: [DrizzleInboxStore, OrderStatsService],
})
export class AnalyticsModule {}
```

`OrderStatsService` records an event and returns the revenue so far. It opens a transaction and calls `inbox.processInTransaction(tx, 'analytics', messageId, work)`: the inbox record and the `order_events` row commit together, so a redelivered event changes nothing, even if the service crashes halfway:

```typescript
@@filename(analytics-service/order-stats.service)
import { Injectable, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { OutboxInbox } from '@nestjs/outbox';
import { asc, eq, sql } from 'drizzle-orm';
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
    if (outcome.duplicate) return false;
    this.logger.log(`Order ${order.id} ${event}, revenue is now ${outcome.result}`);
    return true;
  }

  /** Total revenue in cents. */
  async revenue(db: Database | Transaction = this.db): Promise<number> {
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${orderEvents.amount}), 0)`.mapWith(Number) })
      .from(orderEvents);
    return row!.total;
  }

  /** An order's events, in the order they were recorded. */
  async timeline(orderId: string): Promise<OrderEvent[]> {
    const rows = await this.db
      .select({ event: orderEvents.event })
      .from(orderEvents)
      .where(eq(orderEvents.orderId, orderId))
      .orderBy(asc(orderEvents.seq));
    return rows.map((row) => row.event);
  }
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
      if (!recorded) this.logger.warn(`Skipped duplicate ${envelope.topic} ${envelope.id}`);
    });
  }

  private inOrder(key: string, work: () => Promise<void>): Promise<void> {
    const next = (this.queues.get(key) ?? Promise.resolve()).then(work, work);
    this.queues.set(key, next);
    const forget = () => {
      if (this.queues.get(key) === next) this.queues.delete(key);
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
import { AnalyticsModule } from './analytics.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AnalyticsModule, {
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

- **Claims.** A relay claims a batch of messages by writing a lease on them for `lease` (30 s), with a random token for that claim. Claims take turns on an advisory lock, and `SKIP LOCKED` passes over rows another relay is writing, so two relays never get the same message. They publish their batches in parallel.
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

The example application runs this step against a PostgreSQL server: two relays sharing 20 orders, three instances (one of them API-only) placing and cancelling 12 orders with every message published once and each order's events in order, a transaction that waits for another instance's lock on the same key, an instance that crashes holding a lease, and a graceful shutdown.

#### Try it

Create the two databases, `store` for the order API and `analytics` for the analytics service, and apply each service's migrations:

```bash
$ DATABASE_URL=postgres://localhost:5432/store npx drizzle-kit migrate
$ DATABASE_URL=postgres://localhost:5432/analytics npx drizzle-kit migrate --config analytics-service/drizzle.config.ts
```

Start the analytics service (TCP port 4001) on `analytics`, and the order API (port 3000) on `store`, with `ADMIN_TOKEN=s3cret` in the API's environment. Each logs the store it registered when it starts:

```bash
[Nest] 46426  - 09/25/2026, 8:56:39 AM     LOG [OutboxModule] OutboxStorage: DrizzleOutboxStore
[Nest] 46425  - 09/25/2026, 8:56:38 AM     LOG [OutboxModule] OutboxStorage: DrizzleInboxStore (inbox)
```

Place an order:

```bash
$ curl -X POST localhost:3000/orders \
    -H 'Content-Type: application/json' \
    -d '{"userId":"user-42","items":[{"productId":"salmon-kibble-2kg","quantity":2}]}'
{"id":"5bfb3a5c-a2e1-4831-8ba7-91f51e680b20","userId":"user-42","items":[{"productId":"salmon-kibble-2kg","quantity":2,"price":2499}],"total":4998,"status":"placed"}
```

The API's log shows the two in-process handlers:

```bash
[Nest] 46426  - 09/25/2026, 8:56:39 AM     LOG [MailerService] Order confirmation for 5bfb3a5c-a2e1-4831-8ba7-91f51e680b20 sent to user-42
[Nest] 46426  - 09/25/2026, 8:56:39 AM     LOG [StockReservationHandler] Reserved stock for order 5bfb3a5c-a2e1-4831-8ba7-91f51e680b20
```

And the analytics service's log shows the TCP consumer:

```bash
[Nest] 46425  - 09/25/2026, 8:56:39 AM     LOG [OrderStatsService] Order 5bfb3a5c-a2e1-4831-8ba7-91f51e680b20 placed, revenue is now 4998
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
{"id":"2a5ae11d-bc4e-4756-9788-409ea81ee31d","userId":"user-7","items":[{"productId":"clumping-litter-10l","quantity":2,"price":1599}],"total":3198,"status":"placed"}
```

```bash
[Nest] 46426  - 09/25/2026, 8:56:39 AM     LOG [MailerService] Order confirmation for 2a5ae11d-bc4e-4756-9788-409ea81ee31d sent to user-7
[Nest] 46426  - 09/25/2026, 8:56:39 AM    WARN [OutboxRelay] Dead-lettered order.placed 01a0d75a-1129-70b2-8114-a1ff5042dc4d after 1 attempt(s) (rejected): NonRetryableMessageError: Not enough stock for "clumping-litter-10l" (order 2a5ae11d-bc4e-4756-9788-409ea81ee31d)
```

Inspect the dead-letter queue. Without the `x-admin-token` header, the guard answers `403`:

```bash
$ curl localhost:3000/admin/outbox/dead-letters -H 'x-admin-token: s3cret'
```

```json
[
  {
    "id": "01a0d75a-1129-70b2-8114-a1ff5042dc4d",
    "topic": "order.placed",
    "payload": {
      "id": "2a5ae11d-bc4e-4756-9788-409ea81ee31d",
      "items": [{ "price": 1599, "quantity": 2, "productId": "clumping-litter-10l" }],
      "total": 3198,
      "status": "placed",
      "userId": "user-7"
    },
    "headers": {},
    "key": null,
    "createdAt": 1790319399209,
    "attempts": 1,
    "lastError": "NonRetryableMessageError: Not enough stock for \"clumping-litter-10l\" (order 2a5ae11d-bc4e-4756-9788-409ea81ee31d)",
    "reason": "rejected",
    "failedAt": 1790319399241,
    "history": [
      {
        "at": 1790319399241,
        "error": "NonRetryableMessageError: Not enough stock for \"clumping-litter-10l\" (order 2a5ae11d-bc4e-4756-9788-409ea81ee31d)",
        "attempt": 1,
        "transport": "local"
      }
    ]
  }
]
```

The payload is stored as `jsonb`, which keeps its own key order, so it comes back with its keys in a different order than they were added.

Restock, then requeue the message by its id:

```bash
$ psql postgres://localhost:5432/store -c "UPDATE products SET in_stock = in_stock + 5 WHERE id = 'clumping-litter-10l'"
UPDATE 1
$ curl -X POST localhost:3000/admin/outbox/dead-letters/01a0d75a-1129-70b2-8114-a1ff5042dc4d/requeue \
    -H 'x-admin-token: s3cret'
{"requeued":1}
```

The reservation goes through. The email handler's inbox already has this message id, so no second email is sent:

```bash
[Nest] 46426  - 09/25/2026, 8:56:39 AM     LOG [StockReservationHandler] Reserved stock for order 2a5ae11d-bc4e-4756-9788-409ea81ee31d
```

Finally, stop the analytics service with `Ctrl+C`, then place an order and cancel it:

```bash
$ curl -X POST localhost:3000/orders \
    -H 'Content-Type: application/json' \
    -d '{"userId":"user-42","items":[{"productId":"salmon-kibble-2kg","quantity":1}]}'
{"id":"2101abe2-50cd-4f76-8475-97317c5ec0c6","userId":"user-42","items":[{"productId":"salmon-kibble-2kg","quantity":1,"price":2499}],"total":2499,"status":"placed"}
$ curl -X POST localhost:3000/orders/2101abe2-50cd-4f76-8475-97317c5ec0c6/cancel
{"id":"2101abe2-50cd-4f76-8475-97317c5ec0c6","userId":"user-42","items":[{"price":2499,"quantity":1,"productId":"salmon-kibble-2kg"}],"total":2499,"status":"cancelled"}
$ curl localhost:3000/admin/outbox/stats -H 'x-admin-token: s3cret'
{"pending":2,"ready":0,"leased":0,"deadLetters":0,"oldestDueAt":1790319399436,"lagMs":3126,"inFlight":0,"published":5,"retried":3,"deadLettered":1,"leaseLost":0,"lastPublishLagMs":37}
```

Both analytics messages are pending. `lagMs` grows while the outage lasts, and `retried` counts the failed attempts. `ready` is 0: the placement is waiting for its next retry, and the cancellation is due but waits behind it, because they share a key. The API logs each failed attempt:

```bash
[Nest] 46426  - 09/25/2026, 8:56:39 AM    WARN [OutboxRelay] Retrying analytics.order.placed 01a0d75a-120d-71b7-aa53-80f376c1c8fd in 980ms (attempt 1 of 10 failed): Error: connect ECONNREFUSED 127.0.0.1:4001
[Nest] 46426  - 09/25/2026, 8:56:40 AM    WARN [OutboxRelay] Retrying analytics.order.placed 01a0d75a-120d-71b7-aa53-80f376c1c8fd in 1329ms (attempt 2 of 10 failed): Error: connect ECONNREFUSED 127.0.0.1:4001
[Nest] 46426  - 09/25/2026, 8:56:42 AM    WARN [OutboxRelay] Retrying analytics.order.placed 01a0d75a-120d-71b7-aa53-80f376c1c8fd in 2330ms (attempt 3 of 10 failed): Error: connect ECONNREFUSED 127.0.0.1:4001
```

Start the analytics service again. At its next retry, the relay publishes the placement, then the cancellation. The revenue picks up where it was, because it lives in the service's database, not in its memory:

```bash
[Nest] 46443  - 09/25/2026, 8:56:45 AM     LOG [OrderStatsService] Order 2101abe2-50cd-4f76-8475-97317c5ec0c6 placed, revenue is now 10695
[Nest] 46443  - 09/25/2026, 8:56:45 AM     LOG [OrderStatsService] Order 2101abe2-50cd-4f76-8475-97317c5ec0c6 cancelled, revenue is now 8196
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
    // The real migrations, the outbox's tables included.
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    process.env.OUTBOX_RELAY = 'off'; // no poll loop: the test drives the relay
    moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(db) // DrizzleOutboxStore injects it too
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

- The outbox, the Drizzle store, the migrations and the in-process dispatch are real. Only the mailer and the analytics client are stubbed.
- Override the database `DrizzleModule` registers, whose token `getDrizzleToken()` returns, with the PGlite one. `DrizzleOutboxStore` injects the same token, so the orders and the outbox share it, as they share the pool in production. The module still opens its `pg` pool, which never connects.
- The rollback test lets `outbox.add()` write the messages, then fails the transaction. The order and its messages disappear together, and `runOnce()` finds nothing to claim.
- For behavior that depends on time, such as backoff and lease expiry, move `Date.now()` forward with `vi.spyOn(Date, 'now')`. The relay and the store take the time from it, and real timers keep running for sockets and HTTP.
- PGlite has a single connection, so it runs transactions one at a time. Test races between instances against a PostgreSQL server, the same major version as production, as the example does for [several instances](/reliability/outbox#run-several-instances).
- To keep the outbox out of a test, replace the store: `overrideProvider(DrizzleOutboxStore).useValue(new InMemoryOutboxStore())`. A plain instance doesn't register itself, so the outbox falls back to its in-memory store. It can't join your Drizzle transactions, though: a rolled-back message is still published, and the store logs a warning the first time it gets your transaction.

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

Order within a key is the order in which the store numbered the messages, not their ids: an id comes from its instance's clock, and clocks differ. PostgreSQL runs transactions concurrently, so the store makes the transactions that add messages with the same key take turns, and the numbering follows commit order (see [Write the outbox store](/reliability/outbox#write-the-outbox-store)).

#### Production checklist

- Keep the outbox's tables in your application's database, on a database server, and register a store for both contracts ([The store contract](/reliability/outbox#the-store-contract)). Never keep them on the instance itself, in memory or in a file database such as SQLite on its disk: a container's filesystem goes away when the task is replaced, and every message that hadn't been published goes with it. The production guard refuses to start without a store; set `allowInMemoryStorage` only for a process whose messages you can afford to lose.
- Alert on `lagMs` and `deadLetters` from `relay.stats()`, and on `dead-lettered` events, from `OutboxEvents` or the `nestjs:outbox:dead-lettered` diagnostics channel.
- Size `retry` to how long your downstreams can be down. The package default is 20 attempts, about 30 to 60 minutes in total. This tutorial's 10 attempts capped at 1 minute give up after 2 to 4 minutes, and then a key's later messages overtake the dead-lettered one.
- Keep `consumer` names stable. Inbox entries are keyed by them, so a renamed consumer sees every past message as new.
- Prune inboxes. Nothing calls `OutboxInbox.prune()` for you. Run it from a [cron job](/application/task-scheduling#declarative-cron-jobs), for example `inbox.prune('30d')`, with a window longer than any redelivery, requeues included.
- Keep handlers shorter than `publishTimeout`, and pass `ctx.signal` to the calls they make. A slower handler counts as a failed attempt; leases aren't extended.
- Call `app.enableShutdownHooks()`, so deploys drain the relay instead of leaving messages leased. `DrizzleModule` ends the pool after that, in `onApplicationShutdown()`.
- Protect the dead-letter routes. They expose full payloads.
- Version payloads. A message added by the previous release can still be delivered after a deploy.
- Give each ordered stream its own key, and don't share a key between messages for different transports.
- Run the contract suites with `concurrent: true` in CI, on a pool, against the database engine and major version you run in production.
- Generate the outbox tables' migrations with your ORM's tool, review them, and apply them before the new version starts. Check for drift after deploys.
- Pick advisory lock numbers that no other code of yours locks on in the same database. The stores on this page use `20260901` and `20260902`.
- Keep transactions that call `outbox.add()` short. The per-key lock makes transactions adding messages with the same key take turns. Prisma's interactive transactions time out after 5 seconds by default (`transactionOptions` on the client, or per call).
- Size the connection pool for both your requests and the relay: each claim holds a connection for one short transaction.
- With Prisma and the `pg` adapter, keep the database session's time zone UTC. With Prisma 7.10 and a session time zone of `America/New_York`, a `DateTime` is written as local time: `new Date(1000)` is stored as `1970-01-01 00:00:01-05`. Prisma reads it back consistently, but SQL and other clients see a different instant.

#### The store contract

Every `outbox.add()` writes through your application's transaction, and several relays read the same table at once, so the outbox asks more of its store than any other package. This section is the reference for writing one with any ORM. The tutorial wrote it with Drizzle, and the next two sections write it with TypeORM and with Prisma.

A store is an ordinary provider that implements `OutboxStore` for the messages and `OutboxInboxStore` for the consumers' inboxes, with whatever it injects, and registers itself in its constructor with `registerSource()` on the injectable `OutboxStorage`, as `DrizzleOutboxStore` does. The contracts are registered by name, `messages` and `inbox`, so a consumer-only service, like the analytics service, registers an inbox store alone. The registry checks the shape at once (every method is a function), refuses a second registration unless it passes `replace: true`, and locks when `OutboxModule` initializes. So the store must be a singleton provider: a request-scoped provider, a provider in a lazy-loaded module, or a lifecycle hook registers too late, and throws.

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
Error: OutboxStorage: no store is registered for `messages` (OutboxStore) and `inbox` (OutboxInboxStore), and NODE_ENV is "production": in memory, messages and inbox records would be lost on restart and not shared between instances. Implement OutboxStore and OutboxInboxStore in a provider that injects OutboxStorage and calls `storage.registerSource({ messages: this, inbox: this })` in its constructor, or set `allowInMemoryStorage: true` in the OutboxModule options to run in memory anyway.
```

`allowInMemoryStorage: true` in the module's options is the deliberate way out, for a single instance that may lose its state. In tests, `overrideProvider(DrizzleOutboxStore).useValue(new InMemoryOutboxStore())` works as it is: a plain instance doesn't register, so the in-memory default applies.

**Your transaction.** `add()`, and `recordInbox()` when a handler calls `processInTransaction()`, write through the handle your code passes in, so they commit or roll back with your rows. The handle is whatever your ORM hands the callback of its transaction method. The store receives it untouched, typed by the store's type parameter (`OutboxStore<EntityManager>`, `Outbox<EntityManager>`):

| ORM | Your transaction | The handle a store receives | Not a transaction (refuse it) |
| --- | --- | --- | --- |
| TypeORM | `dataSource.transaction(async (manager) => ...)` | `manager`, an `EntityManager` | `dataSource.manager` |
| Prisma | `prisma.$transaction(async (tx) => ...)` | `tx`, a `Prisma.TransactionClient` | `prisma` itself |
| Drizzle | `db.transaction(async (tx) => ...)` | `tx` | `db` itself |

Prisma's array form, `prisma.$transaction([query1, query2])`, has no handle to pass, so it can't include an `outbox.add()`. Use the interactive form. A store refuses a handle that isn't a transaction with `OutboxTransactionRequiredError`: writing the message on its own is the dual write the outbox removes.

**What each method must do.** A method marked atomic is one conditional statement, or one transaction with the right lock, never a read followed by a write. Those are the methods where two producers, two relays or two deliveries race, so they are the ones a straightforward ORM implementation gets wrong, and the ones the contract suites race. The package's README walks through each rule and the race it prevents.

| Method | What it does | Atomic | Takes your transaction |
| --- | --- | --- | --- |
| `add(tx, messages)` | Inserts the messages | Yes: a lock per key on `tx`, so a key's messages are numbered in the order their transactions commit | Yes |
| `claim(request)` | Leases up to `limit` due messages to a relay, in `seq` order, never a key's message ahead of an older one | Yes: row locks that skip rows another relay holds, so two relays never get the same message | No |
| `markPublished(id, owner)` | Deletes a published message | Yes: fenced by the lease owner in the statement that writes | No |
| `reschedule(id, owner, update)` | Records a failed attempt, appends it to the history, and schedules the retry | Yes: fenced, and appended in the same statement | No |
| `deadLetter(id, owner, update)` | Moves the message to the dead letters, keeping its `seq` | Yes: fenced, both writes in one transaction | No |
| `release(ids, owner)` | Gives leases back without counting an attempt | Yes: fenced | No |
| `stats(now)`, `listDeadLetters(query)`, `getDeadLetter(id)` | Reads | No | No |
| `requeueDeadLetters(filter, now)` | Moves dead letters back to the messages, at their `seq` | Yes: one transaction that takes the rows it moves | No |
| `purgeDeadLetters(filter)` | Deletes dead letters | No: one `DELETE` | No |
| `recordInbox(tx, consumer, messageId, now)` | Records that a consumer processed a message; `false` if it already had | Yes: insert-if-absent on the `(consumer, messageId)` key, never check, then insert | When given one |
| `hasInbox(consumer, messageId)`, `pruneInbox(before)` | Reads, and deletes old records | No | No |

"Fenced" means the statement that writes carries `lease_owner = owner` in its own `WHERE`: a relay that stalled past its lease changes nothing, even if another relay took the message over a moment earlier.

**Testing your store.** `@nestjs/outbox/testing` exports both contracts as test suites, `outboxStoreContract()` and `outboxInboxStoreContract()`. A suite is an array of cases, each a `name` and a `run()` function that throws on failure, so it works with any test runner: with Vitest or Jest, `it(c.name, c.run)`, with `node:test`, `test(c.name, c.run)`. The harness you pass gives each case the store on empty tables, a way to open one of your transactions, and `notATransaction`, a handle `add()` and `recordInbox()` must refuse. `concurrent: true` adds the cases a naive store fails: producers whose transactions overlap, four relays claiming side by side, producers and relays racing, a stale relay's writes racing a takeover, and two deliveries of one message. They hold one transaction open while another starts, so run them against a PostgreSQL server with a pool, the same major version as production. [Write the outbox store](/reliability/outbox#write-the-outbox-store) shows the Drizzle harness; the next two sections show TypeORM's and Prisma's.

**Migrations.** The package ships no SQL. The outbox's three tables are your application's tables: declare them in your ORM's schema, and let its own tool write and apply the migrations, reviewed like any other.

| ORM | Declare | Generate | Apply on deploy | Check for drift |
| --- | --- | --- | --- | --- |
| TypeORM | entities | `typeorm migration:generate` | `typeorm migration:run`, or `dataSource.runMigrations()` | `migration:generate --check` |
| Prisma | models in `schema.prisma` | `prisma migrate dev --create-only`, or `prisma migrate diff --script` offline | `prisma migrate deploy` | `prisma migrate diff --exit-code` |
| Drizzle | tables in `schema.ts` | `drizzle-kit generate` | `drizzle-kit migrate`, or `migrate()` | `drizzle-kit check` checks the migration history, not the database |

Other packages' stores can live elsewhere: the idempotency store fits Redis. The outbox's store can't, because its messages must commit with your rows, in your database.

#### The store with TypeORM

This is the tutorial's store, written with TypeORM. It carries the same guarantees:

- `add()` takes a PostgreSQL advisory lock per key in **your** transaction, so two transactions adding messages with the same key commit in the order their rows are numbered.
- `claim()` reads due rows with `FOR UPDATE SKIP LOCKED`, leases them, and takes a last look at each row's predecessor in its key before it commits.
- Every write a relay makes (`markPublished`, `reschedule`, `deadLetter`, `release`) is fenced by the lease owner in the statement that writes.
- A dead letter keeps its message's `seq`, so a requeue puts it back in its place, ahead of the key's later messages.

The example application keeps a TypeORM version of the order API in `src/typeorm`, and a Prisma version in `src/prisma`, next to the tutorial's Drizzle code. They keep the tutorial's email handler and add `order.placed` alone. Your application has one ORM.

**The entities.** The outbox's three tables are ordinary entities in your application:

```typescript
@@filename(typeorm/outbox.entities)
import type { OutboxAttempt, OutboxDeadLetterReason } from '@nestjs/outbox';
import { Column, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

// The outbox's tables, read and written by TypeOrmOutboxStore. Every column states its
// type, so the entities load the same with or without emitted decorator metadata (the
// TypeORM CLI runs them through tsx, which emits none).

/** What a `jsonb` column holds (shallow: TypeORM's deep partial types can't take a recursive one). */
export type Json = object | string | number | boolean | null;

@Entity('outbox_messages')
// A key's older messages, for the claim's per-key check.
@Index('outbox_messages_key_seq', ['key', 'seq'])
export class OutboxMessageEntity {
  /** Order within a key: numbered at insert, in commit order (TypeOrmOutboxStore.add() locks the key). */
  @PrimaryGeneratedColumn('identity', { type: 'bigint', generatedIdentity: 'BY DEFAULT' })
  seq: string;

  @Column({ type: 'text', unique: true })
  id: string;

  @Column({ type: 'text' })
  topic: string;

  // A null payload is stored as NULL.
  @Column({ type: 'jsonb', nullable: true })
  payload: Json;

  @Column({ type: 'jsonb' })
  headers: Record<string, string>;

  @Column({ type: 'text', nullable: true })
  key: string | null;

  @Column({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'available_at' })
  availableAt: Date;

  @Column({ type: 'integer', default: 0 })
  attempts: number;

  @Column({ type: 'text', name: 'last_error', nullable: true })
  lastError: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  history: OutboxAttempt[];

  @Column({ type: 'text', name: 'lease_owner', nullable: true })
  leaseOwner: string | null;

  @Column({ type: 'timestamptz', name: 'lease_until', nullable: true })
  leaseUntil: Date | null;
}

@Entity('outbox_dead_letters')
@Index('outbox_dead_letters_topic_failed_at', ['topic', 'failedAt'])
export class OutboxDeadLetterEntity {
  @PrimaryColumn({ type: 'text' })
  id: string;

  /** The message's place in its key, so a requeue puts it back there. */
  @Column({ type: 'bigint' })
  seq: string;

  @Column({ type: 'text' })
  topic: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Json;

  @Column({ type: 'jsonb' })
  headers: Record<string, string>;

  @Column({ type: 'text', nullable: true })
  key: string | null;

  @Column({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'integer' })
  attempts: number;

  @Column({ type: 'text', name: 'last_error', nullable: true })
  lastError: string | null;

  @Column({ type: 'jsonb' })
  history: OutboxAttempt[];

  @Column({ type: 'text' })
  reason: OutboxDeadLetterReason;

  @Column({ type: 'timestamptz', name: 'failed_at' })
  failedAt: Date;
}

@Entity('outbox_inbox')
@Index('outbox_inbox_processed_at', ['processedAt'])
export class OutboxInboxEntity {
  // One record per consumer and message: the unique key two deliveries meet at.
  @PrimaryColumn({ type: 'text' })
  consumer: string;

  @PrimaryColumn({ type: 'text', name: 'message_id' })
  messageId: string;

  @Column({ type: 'timestamptz', name: 'processed_at' })
  processedAt: Date;
}
```

`seq` is an identity column: the order within a key. Payloads, headers and failure histories are `jsonb`, and times are `timestamptz`. The `(key, seq)` index is what a claim's per-key check reads. TypeORM returns `bigint` columns as strings, which is fine: `seq` never leaves the store.

**The migration.** The TypeORM CLI and `TypeOrmModule` share one set of options, in a data source file. `ProductEntity` and `OrderEntity` are the order API's own tables, and `SeedProducts` adds the two products, as the Drizzle seed migration does:

```typescript
@@filename(typeorm/data-source)
import { DataSource, type DataSourceOptions } from 'typeorm';
import { Orders1790154512059 } from './migrations/1790154512059-Orders.js';
import { Outbox1790154527507 } from './migrations/1790154527507-Outbox.js';
import { SeedProducts1790156662634 } from './migrations/1790156662634-SeedProducts.js';
import { OrderEntity } from './order.entity.js';
import { OutboxDeadLetterEntity, OutboxInboxEntity, OutboxMessageEntity } from './outbox.entities.js';
import { ProductEntity } from './product.entity.js';

/** What the application's TypeOrmModule and the TypeORM CLI share. */
export const dataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [ProductEntity, OrderEntity, OutboxMessageEntity, OutboxDeadLetterEntity, OutboxInboxEntity],
  migrations: [Orders1790154512059, Outbox1790154527507, SeedProducts1790156662634],
} satisfies DataSourceOptions;

// The TypeORM CLI's data source: `migration:generate` compares the entities with this database.
export default new DataSource(dataSourceOptions);
```

Generate the migration from the entities, against a database that has the previous migrations applied. The CLI needs a TypeScript loader for the data source file; this uses `tsx`, which emits no decorator metadata, so every column above states its type:

```bash
$ npx tsx ./node_modules/typeorm/cli.js migration:generate src/typeorm/migrations/Outbox -d src/typeorm/data-source.ts --pretty
```

This is the migration it wrote, unedited:

```typescript
@@filename(typeorm/migrations/1790154527507-Outbox)
import { MigrationInterface, QueryRunner } from "typeorm";

export class Outbox1790154527507 implements MigrationInterface {
    name = 'Outbox1790154527507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "outbox_messages" (
                "seq" bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
                "id" text NOT NULL,
                "topic" text NOT NULL,
                "payload" jsonb,
                "headers" jsonb NOT NULL,
                "key" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "available_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "attempts" integer NOT NULL DEFAULT '0',
                "last_error" text,
                "history" jsonb NOT NULL DEFAULT '[]',
                "lease_owner" text,
                "lease_until" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "UQ_0171348f527c64b137e4d4f5b66" UNIQUE ("id"),
                CONSTRAINT "PK_d24ca6550fc486f101fe4f8b021" PRIMARY KEY ("seq")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "outbox_messages_key_seq" ON "outbox_messages" ("key", "seq")
        `);
        await queryRunner.query(`
            CREATE TABLE "outbox_dead_letters" (
                "id" text NOT NULL,
                "seq" bigint NOT NULL,
                "topic" text NOT NULL,
                "payload" jsonb,
                "headers" jsonb NOT NULL,
                "key" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "attempts" integer NOT NULL,
                "last_error" text,
                "history" jsonb NOT NULL,
                "reason" text NOT NULL,
                "failed_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "PK_865626cb0b65e2889216c075044" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "outbox_dead_letters_topic_failed_at" ON "outbox_dead_letters" ("topic", "failed_at")
        `);
        await queryRunner.query(`
            CREATE TABLE "outbox_inbox" (
                "consumer" text NOT NULL,
                "message_id" text NOT NULL,
                "processed_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "PK_c0e4a67e4a7ed5e6890bbfc682e" PRIMARY KEY ("consumer", "message_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "outbox_inbox_processed_at" ON "outbox_inbox" ("processed_at")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."outbox_inbox_processed_at"
        `);
        await queryRunner.query(`
            DROP TABLE "outbox_inbox"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."outbox_dead_letters_topic_failed_at"
        `);
        await queryRunner.query(`
            DROP TABLE "outbox_dead_letters"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."outbox_messages_key_seq"
        `);
        await queryRunner.query(`
            DROP TABLE "outbox_messages"
        `);
    }

}
```

Add the class to `migrations` in the data source, as above, and apply it on deploy with `migration:run`. After that, `migration:generate --check` confirms the entities and the database agree:

```bash
$ npx tsx ./node_modules/typeorm/cli.js migration:run -d src/typeorm/data-source.ts
$ npx tsx ./node_modules/typeorm/cli.js migration:generate src/typeorm/migrations/Check -d src/typeorm/data-source.ts --check
No changes in database schema were found
```

**The store.** Each method uses the entity manager, the repository API or the query builder:

```typescript
@@filename(typeorm/typeorm-outbox.store)
import { Injectable } from '@nestjs/common';
import {
  OutboxStorage,
  OutboxTransactionRequiredError,
  type OutboxClaimRequest,
  type OutboxDeadLetter,
  type OutboxDeadLetterFilter,
  type OutboxDeadLetterQuery,
  type OutboxDeadLetterUpdate,
  type OutboxInboxStore,
  type OutboxMessage,
  type OutboxRescheduleUpdate,
  type OutboxStore,
  type OutboxStoreStats,
} from '@nestjs/outbox';
import { createHash } from 'node:crypto';
import {
  DataSource,
  EntityManager,
  In,
  LessThan,
  MoreThan,
  type FindOptionsWhere,
  type SelectQueryBuilder,
} from 'typeorm';
import { OutboxDeadLetterEntity, OutboxInboxEntity, OutboxMessageEntity, type Json } from './outbox.entities.js';

/** Advisory lock classes (the two-number form): any two numbers no other code of yours locks on. */
const CLAIM_LOCK = 20_260_901;
const KEY_LOCK = 20_260_902;

@Injectable()
export class TypeOrmOutboxStore implements OutboxStore<EntityManager>, OutboxInboxStore<EntityManager> {
  constructor(
    private readonly dataSource: DataSource,
    storage: OutboxStorage,
  ) {
    storage.registerSource({ messages: this, inbox: this });
  }

  async add(tx: EntityManager, messages: readonly OutboxMessage[]): Promise<void> {
    assertTransaction(tx);
    if (messages.length === 0) return;
    // Commit order: a transaction adding a message with the same key waits here until this
    // one commits or rolls back, so rows are numbered in the order they become visible.
    for (const lock of keyLocks(messages)) {
      await tx.query('SELECT pg_advisory_xact_lock($1::int, $2::int)', [KEY_LOCK, lock]);
    }
    await tx.insert(
      OutboxMessageEntity,
      messages.map((message) => ({
        id: message.id,
        topic: message.topic,
        payload: message.payload as Json, // JSON-safe: Outbox.add() took a JSON snapshot
        headers: message.headers,
        key: message.key,
        createdAt: new Date(message.createdAt),
        availableAt: new Date(message.availableAt),
      })),
    );
  }

  claim({ owner, now, leaseMs, limit }: OutboxClaimRequest): Promise<OutboxMessage[]> {
    // Each statement sees what committed before it started (PostgreSQL's default).
    return this.dataSource.transaction('READ COMMITTED', async (manager) => {
      // Claims take turns, so each one sees the leases of the one before it.
      await manager.query('SELECT pg_advisory_xact_lock($1::int, 0)', [CLAIM_LOCK]);
      // Due rows in seq order, stopping at `limit` claimable ones: a primary-key index scan,
      // whatever the backlog. SKIP LOCKED passes over a row a relay is writing right now.
      const due = await this.claimable(manager, now)
        .select('message.seq', 'seq')
        .orderBy('message.seq')
        .limit(limit)
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .getRawMany<{ seq: string }>();
      if (due.length === 0) return [];
      const seqs = due.map((row) => row.seq);
      await manager.update(OutboxMessageEntity, { seq: In(seqs) }, { leaseOwner: owner, leaseUntil: new Date(now + leaseMs) });

      // A last look before committing: each claimed row's predecessor in its key must be
      // ours too. A row whose older sibling was skipped as locked, or came back meanwhile (a
      // dead letter requeued right then), goes back with the rest of its key.
      const { entities, raw } = await manager
        .createQueryBuilder(OutboxMessageEntity, 'message')
        .addSelect(
          (previous) =>
            previous
              .select('older.leaseOwner IS DISTINCT FROM :owner')
              .from(OutboxMessageEntity, 'older')
              .where('older.key = message.key')
              .andWhere('older.seq < message.seq')
              .orderBy('older.seq', 'DESC')
              .limit(1),
          'behind_other',
        )
        .where({ seq: In(seqs) })
        .orderBy('message.seq')
        .setParameter('owner', owner)
        .getRawAndEntities<{ message_seq: string; behind_other: boolean | null }>();
      const behindOther = new Map(raw.map((row) => [row.message_seq, row.behind_other]));
      const blocked = new Set<string>();
      const giveBack: string[] = [];
      const batch: OutboxMessage[] = [];
      for (const row of entities) {
        if (row.key !== null && (behindOther.get(row.seq) === true || blocked.has(row.key))) {
          blocked.add(row.key);
          giveBack.push(row.seq);
        } else {
          batch.push(toMessage(row));
        }
      }
      if (giveBack.length > 0) {
        await manager.update(OutboxMessageEntity, { seq: In(giveBack) }, { leaseOwner: null, leaseUntil: null });
      }
      return batch;
    });
  }

  async markPublished(id: string, owner: string): Promise<boolean> {
    const { affected } = await this.dataSource.manager.delete(OutboxMessageEntity, leasedBy(id, owner));
    return affected === 1;
  }

  async reschedule(id: string, owner: string, update: OutboxRescheduleUpdate): Promise<boolean> {
    const { affected } = await this.dataSource
      .createQueryBuilder()
      .update(OutboxMessageEntity)
      .set({
        attempts: update.attempts,
        availableAt: new Date(update.availableAt),
        lastError: update.error.error,
        // Appends in the statement that checks the lease: no read, no lost update.
        history: () => 'history || CAST(:attempt AS jsonb)',
        leaseOwner: null,
        leaseUntil: null,
      })
      .where(leasedBy(id, owner))
      .setParameter('attempt', JSON.stringify([update.error]))
      .execute();
    return affected === 1;
  }

  deadLetter(id: string, owner: string, update: OutboxDeadLetterUpdate): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      // SELECT ... FOR UPDATE: PostgreSQL checks the lease on the locked row, and nobody
      // else can change it before this transaction ends.
      const row = await manager.findOne(OutboxMessageEntity, {
        where: leasedBy(id, owner),
        lock: { mode: 'pessimistic_write' },
      });
      if (!row) return false;
      await manager.delete(OutboxMessageEntity, { seq: row.seq });
      // Replaces an earlier dead letter with this id (a producer that reused a custom id).
      await manager.upsert(
        OutboxDeadLetterEntity,
        {
          id: row.id,
          seq: row.seq,
          topic: row.topic,
          payload: row.payload,
          headers: row.headers,
          key: row.key,
          createdAt: row.createdAt,
          attempts: update.attempts,
          lastError: update.error.error,
          history: [...row.history, update.error],
          reason: update.reason,
          failedAt: new Date(update.failedAt),
        },
        ['id'],
      );
      return true;
    });
  }

  async release(ids: readonly string[], owner: string): Promise<number> {
    if (ids.length === 0) return 0;
    const { affected } = await this.dataSource.manager.update(
      OutboxMessageEntity,
      { id: In([...ids]), leaseOwner: owner },
      { leaseOwner: null, leaseUntil: null },
    );
    return affected ?? 0;
  }

  async stats(now: number): Promise<OutboxStoreStats> {
    const at = new Date(now);
    const manager = this.dataSource.manager;
    const [pending, ready, leased, deadLetters, oldest] = await Promise.all([
      manager.count(OutboxMessageEntity),
      this.claimable(manager, now).getCount(),
      manager.countBy(OutboxMessageEntity, { leaseUntil: MoreThan(at) }),
      manager.count(OutboxDeadLetterEntity),
      // Waiting since it became due; once an attempt failed, since it was added.
      manager
        .createQueryBuilder(OutboxMessageEntity, 'message')
        .select('MIN(CASE WHEN message.attempts > 0 THEN message.createdAt WHEN message.availableAt <= :at THEN message.availableAt END)', 'dueAt')
        .setParameter('at', at)
        .getRawOne<{ dueAt: Date | null }>(),
    ]);
    return { pending, ready, leased, deadLetters, oldestDueAt: oldest?.dueAt?.getTime() ?? null };
  }

  async listDeadLetters({ topic, key, limit = 50, offset = 0 }: OutboxDeadLetterQuery): Promise<OutboxDeadLetter[]> {
    const rows = await this.dataSource.manager.find(OutboxDeadLetterEntity, {
      // TypeORM refuses `undefined` in a where object: leave the fields out instead.
      where: { ...(topic !== undefined && { topic }), ...(key !== undefined && { key }) },
      order: { failedAt: 'DESC', id: 'DESC' },
      take: limit,
      skip: offset,
    });
    return rows.map(toDeadLetter);
  }

  async getDeadLetter(id: string): Promise<OutboxDeadLetter | undefined> {
    const row = await this.dataSource.manager.findOneBy(OutboxDeadLetterEntity, { id });
    return row ? toDeadLetter(row) : undefined;
  }

  requeueDeadLetters(filter: OutboxDeadLetterFilter, now: number): Promise<number> {
    const where = deadLetterFilter(filter);
    if (!where) return Promise.resolve(0);
    return this.dataSource.transaction(async (manager) => {
      // Locked, so a concurrent requeue or purge waits and then finds them gone.
      const rows = await manager.find(OutboxDeadLetterEntity, { where, lock: { mode: 'pessimistic_write' } });
      if (rows.length === 0) return 0;
      await manager.delete(OutboxDeadLetterEntity, { id: In(rows.map((row) => row.id)) });
      // The original seq: back ahead of the messages added after it, with the same key.
      await manager.insert(
        OutboxMessageEntity,
        rows.map((row) => ({
          seq: row.seq,
          id: row.id,
          topic: row.topic,
          payload: row.payload,
          headers: row.headers,
          key: row.key,
          createdAt: row.createdAt,
          availableAt: new Date(now),
          lastError: row.lastError,
          history: row.history,
        })),
      );
      return rows.length;
    });
  }

  async purgeDeadLetters(filter: OutboxDeadLetterFilter): Promise<number> {
    const where = deadLetterFilter(filter);
    if (!where) return 0;
    const purge = this.dataSource.createQueryBuilder().delete().from(OutboxDeadLetterEntity);
    // TypeORM refuses an empty where: `{ all: true }` deletes without one, on purpose.
    const { affected } = await (Object.keys(where).length === 0 ? purge : purge.where(where)).execute();
    return affected ?? 0;
  }

  async recordInbox(tx: EntityManager | undefined, consumer: string, messageId: string, now: number): Promise<boolean> {
    if (tx !== undefined) assertTransaction(tx);
    // One statement on the unique key: a concurrent delivery waits for this transaction.
    const { raw } = await (tx ?? this.dataSource.manager)
      .createQueryBuilder()
      .insert()
      .into(OutboxInboxEntity)
      .values({ consumer, messageId, processedAt: new Date(now) })
      .orIgnore()
      .returning(['consumer'])
      .updateEntity(false)
      .execute();
    return (raw as unknown[]).length === 1;
  }

  hasInbox(consumer: string, messageId: string): Promise<boolean> {
    return this.dataSource.manager.existsBy(OutboxInboxEntity, { consumer, messageId });
  }

  async pruneInbox(before: number): Promise<number> {
    const { affected } = await this.dataSource.manager.delete(OutboxInboxEntity, { processedAt: LessThan(new Date(before)) });
    return affected ?? 0;
  }

  /**
   * Due, unleased, and no older message with the same key is delayed or leased. The
   * NOT EXISTS probes the (key, seq) index from the key's oldest row.
   */
  private claimable(manager: EntityManager, now: number): SelectQueryBuilder<OutboxMessageEntity> {
    return manager
      .createQueryBuilder(OutboxMessageEntity, 'message')
      .where('message.availableAt <= :now')
      .andWhere('(message.leaseUntil IS NULL OR message.leaseUntil <= :now)')
      .andWhere((query) => {
        const blocking = query
          .subQuery()
          .select('1')
          .from(OutboxMessageEntity, 'older')
          .where('older.key = message.key')
          .andWhere('older.seq < message.seq')
          .andWhere('(older.availableAt > :now OR older.leaseUntil > :now)')
          .getQuery();
        return `(message.key IS NULL OR NOT EXISTS ${blocking})`;
      })
      .setParameter('now', new Date(now));
  }
}

/** A transaction's EntityManager has an active query runner; `dataSource.manager` has none. */
function assertTransaction(tx: EntityManager) {
  if (!(tx instanceof EntityManager) || !tx.queryRunner?.isTransactionActive) {
    throw new OutboxTransactionRequiredError(
      'Pass the EntityManager that dataSource.transaction() gives you, not dataSource.manager.',
    );
  }
}

/** One lock per key, sorted, so two transactions locking the same keys can't deadlock. */
function keyLocks(messages: readonly OutboxMessage[]): number[] {
  const keys = new Set(messages.flatMap((message) => (message.key === null ? [] : [message.key])));
  const locks = [...keys].map((key) => createHash('sha256').update(key).digest().readInt32BE(0));
  return [...new Set(locks)].sort((a, b) => a - b);
}

/** The message, if `owner` still holds its lease: every relay write is fenced by it. */
function leasedBy(id: string, owner: string): FindOptionsWhere<OutboxMessageEntity> {
  return { id, leaseOwner: owner };
}

/**
 * The filter's fields combined with AND; an empty filter is refused unless it says `all`.
 * `undefined` when it matches nothing (`ids: []`).
 */
function deadLetterFilter({ ids, topic, key, failedBefore, all }: OutboxDeadLetterFilter) {
  const where: FindOptionsWhere<OutboxDeadLetterEntity> = {};
  if (ids) {
    if (ids.length === 0) return undefined;
    where.id = In(ids);
  }
  if (topic !== undefined) where.topic = topic;
  if (key !== undefined) where.key = key;
  if (failedBefore !== undefined) where.failedAt = LessThan(new Date(+failedBefore));
  if (Object.keys(where).length === 0 && !all) {
    throw new Error('Refusing an empty dead-letter filter; pass { all: true }');
  }
  return where;
}

function toMessage(row: OutboxMessageEntity): OutboxMessage {
  return {
    id: row.id,
    topic: row.topic,
    payload: row.payload,
    headers: row.headers,
    key: row.key,
    createdAt: row.createdAt.getTime(),
    availableAt: row.availableAt.getTime(),
    attempts: row.attempts,
    lastError: row.lastError,
  };
}

function toDeadLetter(row: OutboxDeadLetterEntity): OutboxDeadLetter {
  return {
    id: row.id,
    topic: row.topic,
    payload: row.payload,
    headers: row.headers,
    key: row.key,
    createdAt: row.createdAt.getTime(),
    attempts: row.attempts,
    lastError: row.lastError,
    reason: row.reason,
    failedAt: row.failedAt.getTime(),
    history: row.history,
  };
}
```

What it needed beyond TypeORM's query API, and why:

- **Advisory locks** are PostgreSQL functions, so `add()` and `claim()` call them with `tx.query()` on the transaction's own connection. The lock is held until that transaction ends.
- **The claim** is the query builder all the way: `setLock('pessimistic_write')` with `setOnLocked('skip_locked')` is `FOR UPDATE SKIP LOCKED`, and the per-key rule is a `NOT EXISTS` subquery written with `subQuery()`. The last look before committing is a correlated subquery in `addSelect()`, read with `getRawAndEntities()`.
- **Appending to the failure history** in the statement that checks the lease takes a raw expression in `set()`: `history: () => 'history || CAST(:attempt AS jsonb)'`. Reading the row first, then saving it, would let a stale relay overwrite a newer attempt.
- **Moving a row between tables** (`deadLetter()`, `requeueDeadLetters()`) runs in a transaction that first locks the rows it moves with the `lock` option in `pessimistic_write` mode, which is `SELECT ... FOR UPDATE`. PostgreSQL checks the lease on the locked row, and nobody else can change it before the move commits.
- `recordInbox()` is `insert().orIgnore()`, which is `ON CONFLICT DO NOTHING`, with `returning()` to tell a new record from a duplicate.

And what TypeORM 1 is strict about. `find()` and `delete()` refuse `undefined` in a `where` object (leave the field out instead), and `delete()` refuses empty criteria, so purging every dead letter builds a `DELETE` without a `WHERE` on purpose. The query builder turns `message.createdAt` into `"message"."created_at"` only when a space, `=`, `)` or `,` follows the property name. A line break right after it leaves the name as it is, and PostgreSQL then reports a missing `message.createdat` column, so the `stats()` expression stays on one line. And a `jsonb` column typed `unknown` doesn't fit TypeORM's insert types, hence the small `Json` type in the entities.

**Use it.** `TypeOrmModule` takes the place of `DrizzleModule` in the root module, with the shared options, and the store goes in `providers` like any other provider:

```typescript
@@filename(typeorm/app.module)
import { Module } from '@nestjs/common';
import { OutboxModule } from '@nestjs/outbox';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { dataSourceOptions } from './data-source.js';
import { OrdersService } from './orders.service.js';
import { TypeOrmOutboxStore } from './typeorm-outbox.store.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // The entities and migrations the CLI uses; migrations run on deploy (`migration:run`).
      useFactory: () => ({ ...dataSourceOptions, url: process.env.DATABASE_URL }),
    }),
    OutboxModule.forRoot({ relay: { pollInterval: '1s' } }),
    NotificationsModule,
  ],
  // TypeOrmOutboxStore registers itself as the outbox's store.
  providers: [TypeOrmOutboxStore, OrdersService],
})
export class AppModule {}
```

`OrdersService` opens its transaction with the data source, prices the lines as the Drizzle version does, and passes the transaction's entity manager to `outbox.add()`, next to its own writes:

```typescript
@@filename(typeorm/orders.service)
@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly outbox: Outbox<EntityManager>,
  ) {}

  async placeOrder({ userId, items }: PlaceOrderDto): Promise<Order> {
    if (!items?.length) throw new BadRequestException('An order needs at least one item');

    const order = await this.dataSource.transaction(async (manager) => {
      const products = await manager.findBy(ProductEntity, { id: In(items.map((item) => item.productId)) });
      // ... price the lines and build the order, as in the Drizzle version
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

**Test it.** The harness passes `dataSource.transaction(work)` as your transaction, and `dataSource.manager` as the handle to refuse:

```typescript
@@filename(test/typeorm-outbox.store.e2e-spec)
/**
 * TypeOrmOutboxStore against the package's contract suites (`@nestjs/outbox/testing`), on
 * PostgreSQL (the server in SQL_TEST_PG_URL, else a throwaway local cluster; see
 * test-support/postgres.ts), with the migrations the TypeORM CLI generated. A pool, so the
 * concurrency cases' transactions really overlap. Skipped, with the reason, without a server.
 */
import { OutboxStorage } from '@nestjs/outbox';
import { outboxInboxStoreContract, outboxStoreContract, type OutboxStoreHarness } from '@nestjs/outbox/testing';
import { DataSource, type EntityManager } from 'typeorm';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { startPostgres } from '../../../test-support/postgres.js';
import { dataSourceOptions } from '../src/typeorm/data-source.js';
import { TypeOrmOutboxStore } from '../src/typeorm/typeorm-outbox.store.js';
import { recipeGuarantees } from './recipe-guarantees.js';

const { postgres, reason } = await startPostgres();
afterAll(() => postgres?.stop());

describe.skipIf(!postgres)(`TypeOrmOutboxStore on PostgreSQL${postgres ? '' : ` (skipped: ${reason})`}`, () => {
  let dataSource: DataSource;
  let url: string;

  beforeAll(async () => {
    url = await postgres!.createDatabase('outbox_typeorm_store');
    dataSource = await new DataSource({ ...dataSourceOptions, url, poolSize: 12 }).initialize();
    await dataSource.runMigrations();
  });
  afterAll(() => dataSource?.destroy());

  /** A store on emptied tables, built the way Nest builds it: with the data source and a registry. */
  async function harness(): Promise<OutboxStoreHarness<EntityManager> & { store: TypeOrmOutboxStore }> {
    await dataSource.query('TRUNCATE outbox_messages, outbox_dead_letters, outbox_inbox RESTART IDENTITY');
    return {
      store: new TypeOrmOutboxStore(dataSource, new OutboxStorage()),
      transaction: (work) => dataSource.transaction(work),
      notATransaction: dataSource.manager,
    };
  }

  describe('the store contract', () => {
    for (const c of outboxStoreContract(harness, { concurrent: true })) it(c.name, c.run);
  });

  describe('the inbox contract', () => {
    for (const c of outboxInboxStoreContract(harness, { concurrent: true })) it(c.name, c.run);
  });

  describe('beyond the contract', () => {
    recipeGuarantees(async () => ({ ...(await harness()), url, reset: async () => undefined }));
  });
});
```

`recipeGuarantees()` checks what the store guarantees beyond the contract, as the Drizzle store's test does: a claim passes over a row another transaction is writing without waiting, gives a row back when an older row of its key reappears during the claim, and doesn't slow down with 40,000 pending messages instead of 200.

With the store registered, the application logs it at startup, and the order's email goes out once its transaction commits:

```bash
[Nest] 19039  - 09/23/2026, 11:28:45 AM     LOG [OutboxModule] OutboxStorage: TypeOrmOutboxStore
[Nest] 19039  - 09/23/2026, 11:28:45 AM     LOG [MailerService] Order confirmation for 720f2ee8-0f69-41e7-9bc1-2a9ab8df6880 sent to user-42
```

#### The store with Prisma

The same store with Prisma, with the same guarantees.

**The models.** The same three tables, in `prisma/schema.prisma`, next to your own models:

```prisma
@@filename(prisma/schema.prisma)
// The outbox's tables, read and written by PrismaOutboxStore.

model OutboxMessage {
  /// Order within a key: numbered at insert, in commit order (PrismaOutboxStore.add() locks the key).
  seq         BigInt    @id @default(autoincrement())
  id          String    @unique
  topic       String
  /// A null payload is stored as NULL (Prisma.DbNull).
  payload     Json?
  headers     Json
  key         String?
  createdAt   DateTime  @map("created_at") @db.Timestamptz(3)
  availableAt DateTime  @map("available_at") @db.Timestamptz(3)
  attempts    Int       @default(0)
  lastError   String?   @map("last_error")
  history     Json      @default("[]")
  leaseOwner  String?   @map("lease_owner")
  leaseUntil  DateTime? @map("lease_until") @db.Timestamptz(3)

  /// A key's older messages, for the claim's per-key check.
  @@index([key, seq], map: "outbox_messages_key_seq")
  @@map("outbox_messages")
}

model OutboxDeadLetter {
  id        String   @id
  /// The message's place in its key, so a requeue puts it back there.
  seq       BigInt
  topic     String
  payload   Json?
  headers   Json
  key       String?
  createdAt DateTime @map("created_at") @db.Timestamptz(3)
  attempts  Int
  lastError String?  @map("last_error")
  history   Json
  reason    String
  failedAt  DateTime @map("failed_at") @db.Timestamptz(3)

  @@index([topic, failedAt], map: "outbox_dead_letters_topic_failed_at")
  @@map("outbox_dead_letters")
}

model OutboxInbox {
  consumer    String
  messageId   String   @map("message_id")
  processedAt DateTime @map("processed_at") @db.Timestamptz(3)

  /// One record per consumer and message: the unique key two deliveries meet at.
  @@id([consumer, messageId])
  @@index([processedAt], map: "outbox_inbox_processed_at")
  @@map("outbox_inbox")
}
```

Prisma has no identity columns, so `seq` is a `BIGSERIAL`: numbered from a sequence at insert. That is enough, because the order within a key comes from the per-key lock in `add()`, not from the column type. A `null` payload is stored as SQL `NULL`, which Prisma writes as `Prisma.DbNull`.

**The migration.** Create it with Prisma Migrate, without applying it, and review it:

```bash
$ npx prisma migrate dev --create-only --name outbox
Prisma Migrate created the following migration without applying it 20260923091040_outbox
```

`migrate dev` needs a development database. Offline, `npx prisma migrate diff --from-schema <previous schema.prisma> --to-schema prisma/schema.prisma --script` prints the same SQL (checked for this migration). Prisma wrote:

```sql
@@filename(prisma/migrations/20260923091040_outbox/migration.sql)
-- CreateTable
CREATE TABLE "outbox_messages" (
    "seq" BIGSERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" JSONB,
    "headers" JSONB NOT NULL,
    "key" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "available_at" TIMESTAMPTZ(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "history" JSONB NOT NULL DEFAULT '[]',
    "lease_owner" TEXT,
    "lease_until" TIMESTAMPTZ(3),

    CONSTRAINT "outbox_messages_pkey" PRIMARY KEY ("seq")
);

-- CreateTable
CREATE TABLE "outbox_dead_letters" (
    "id" TEXT NOT NULL,
    "seq" BIGINT NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" JSONB,
    "headers" JSONB NOT NULL,
    "key" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "attempts" INTEGER NOT NULL,
    "last_error" TEXT,
    "history" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "failed_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "outbox_dead_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_inbox" (
    "consumer" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "processed_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "outbox_inbox_pkey" PRIMARY KEY ("consumer","message_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "outbox_messages_id_key" ON "outbox_messages"("id");

-- CreateIndex
CREATE INDEX "outbox_messages_key_seq" ON "outbox_messages"("key", "seq");

-- CreateIndex
CREATE INDEX "outbox_dead_letters_topic_failed_at" ON "outbox_dead_letters"("topic", "failed_at");

-- CreateIndex
CREATE INDEX "outbox_inbox_processed_at" ON "outbox_inbox"("processed_at");
```

Apply it on deploy with `npx prisma migrate deploy`. `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` then reports "No difference detected".

**The client.** Prisma 7 generates the client into your source tree (`npx prisma generate`), and connects through the `pg` driver adapter:

```typescript
@@filename(prisma/prisma.service)
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from './generated/client.js';

/** The `tx` that `prisma.$transaction(async (tx) => ...)` passes its callback. */
export type Transaction = Prisma.TransactionClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnApplicationShutdown {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  }

  // Runs after onModuleDestroy(), where the outbox relay finishes its in-flight work.
  async onApplicationShutdown() {
    await this.$disconnect();
  }
}
```

**The store.** Prisma Client covers the simple methods. The rest are `$queryRaw` and `$executeRaw` tagged templates, which bind every value as a parameter:

```typescript
@@filename(prisma/prisma-outbox.store)
import { Injectable } from '@nestjs/common';
import {
  OutboxStorage,
  OutboxTransactionRequiredError,
  type OutboxAttempt,
  type OutboxClaimRequest,
  type OutboxDeadLetter,
  type OutboxDeadLetterFilter,
  type OutboxDeadLetterQuery,
  type OutboxDeadLetterReason,
  type OutboxDeadLetterUpdate,
  type OutboxInboxStore,
  type OutboxMessage,
  type OutboxRescheduleUpdate,
  type OutboxStore,
  type OutboxStoreStats,
} from '@nestjs/outbox';
import { createHash } from 'node:crypto';
import {
  Prisma,
  type OutboxDeadLetter as DeadLetterRow,
  type OutboxMessage as MessageRow,
} from './generated/client.js';
import { PrismaService, type Transaction } from './prisma.service.js';

/** Advisory lock classes (the two-number form): any two numbers no other code of yours locks on. */
const CLAIM_LOCK = 20_260_901;
const KEY_LOCK = 20_260_902;

/** A raw query's columns, named like the models' fields. */
const MESSAGE_FIELDS = Prisma.sql`seq, id, topic, payload, headers, key, created_at AS "createdAt",
  available_at AS "availableAt", attempts, last_error AS "lastError", history,
  lease_owner AS "leaseOwner", lease_until AS "leaseUntil"`;
const DEAD_LETTER_FIELDS = Prisma.sql`id, seq, topic, payload, headers, key, created_at AS "createdAt",
  attempts, last_error AS "lastError", history, reason, failed_at AS "failedAt"`;

@Injectable()
export class PrismaOutboxStore implements OutboxStore<Transaction>, OutboxInboxStore<Transaction> {
  constructor(
    private readonly prismaService: PrismaService,
    storage: OutboxStorage,
  ) {
    storage.registerSource({ messages: this, inbox: this });
  }

  async add(tx: Transaction, messages: readonly OutboxMessage[]): Promise<void> {
    assertTransaction(tx);
    if (messages.length === 0) return;
    // Commit order: a transaction adding a message with the same key waits here until this
    // one commits or rolls back, so rows are numbered in the order they become visible.
    for (const lock of keyLocks(messages)) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${KEY_LOCK}::int, ${lock}::int)`;
    }
    await tx.outboxMessage.createMany({
      data: messages.map((message) => ({
        id: message.id,
        topic: message.topic,
        payload: toJson(message.payload),
        headers: message.headers,
        key: message.key,
        createdAt: new Date(message.createdAt),
        availableAt: new Date(message.availableAt),
      })),
    });
  }

  claim({ owner, now, leaseMs, limit }: OutboxClaimRequest): Promise<OutboxMessage[]> {
    return this.prismaService.$transaction(
      async (tx) => {
        // Claims take turns, so each one sees the leases of the one before it.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CLAIM_LOCK}::int, 0)`;
        // Due rows in seq order, stopping at `limit` claimable ones: a primary-key index scan,
        // whatever the backlog. SKIP LOCKED passes over a row a relay is writing right now.
        const due = await tx.$queryRaw<{ seq: bigint }[]>`
          SELECT seq FROM outbox_messages AS message
          WHERE ${claimable(now)}
          ORDER BY seq
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED`;
        if (due.length === 0) return [];
        const seqs = due.map((row) => row.seq);
        await tx.outboxMessage.updateMany({
          where: { seq: { in: seqs } },
          data: { leaseOwner: owner, leaseUntil: new Date(now + leaseMs) },
        });

        // A last look before committing: each claimed row's predecessor in its key must be
        // ours too. A row whose older sibling was skipped as locked, or came back meanwhile (a
        // dead letter requeued right then), goes back with the rest of its key.
        const rows = await tx.$queryRaw<(MessageRow & { behindOther: boolean | null })[]>`
          SELECT ${MESSAGE_FIELDS}, (
            SELECT older.lease_owner IS DISTINCT FROM ${owner}
            FROM outbox_messages AS older
            WHERE older.key = message.key AND older.seq < message.seq
            ORDER BY older.seq DESC
            LIMIT 1
          ) AS "behindOther"
          FROM outbox_messages AS message
          WHERE seq IN (${Prisma.join(seqs)})
          ORDER BY seq`;
        const blocked = new Set<string>();
        const giveBack: bigint[] = [];
        const batch: OutboxMessage[] = [];
        for (const { behindOther, ...row } of rows) {
          if (row.key !== null && (behindOther === true || blocked.has(row.key))) {
            blocked.add(row.key);
            giveBack.push(row.seq);
          } else {
            batch.push(toMessage(row));
          }
        }
        if (giveBack.length > 0) {
          await tx.outboxMessage.updateMany({
            where: { seq: { in: giveBack } },
            data: { leaseOwner: null, leaseUntil: null },
          });
        }
        return batch;
      },
      // Each statement sees what committed before it started (PostgreSQL's default).
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async markPublished(id: string, owner: string): Promise<boolean> {
    const { count } = await this.prismaService.outboxMessage.deleteMany({ where: leasedBy(id, owner) });
    return count === 1;
  }

  async reschedule(id: string, owner: string, update: OutboxRescheduleUpdate): Promise<boolean> {
    // Raw, because Prisma Client can't append to a JSON array: one statement that checks
    // the lease and appends, so there is no read and no lost update.
    const updated = await this.prismaService.$executeRaw`
      UPDATE outbox_messages
      SET attempts = ${update.attempts},
          available_at = ${new Date(update.availableAt)},
          last_error = ${update.error.error},
          history = history || ${JSON.stringify([update.error])}::jsonb,
          lease_owner = NULL,
          lease_until = NULL
      WHERE id = ${id} AND lease_owner = ${owner}`;
    return updated === 1;
  }

  deadLetter(id: string, owner: string, update: OutboxDeadLetterUpdate): Promise<boolean> {
    return this.prismaService.$transaction(async (tx) => {
      // delete() with the lease in its where: one DELETE ... WHERE id AND lease_owner RETURNING.
      const row = await tx.outboxMessage.delete({ where: leasedBy(id, owner) }).catch(ifNotFound(null));
      if (!row) return false;
      const deadLetter = {
        seq: row.seq,
        topic: row.topic,
        payload: toJson(row.payload),
        headers: row.headers as Prisma.InputJsonObject,
        key: row.key,
        createdAt: row.createdAt,
        attempts: update.attempts,
        lastError: update.error.error,
        history: [...(row.history as unknown as OutboxAttempt[]), update.error] as unknown as Prisma.InputJsonArray,
        reason: update.reason,
        failedAt: new Date(update.failedAt),
      };
      // Replaces an earlier dead letter with this id (a producer that reused a custom id).
      await tx.outboxDeadLetter.upsert({
        where: { id: row.id },
        create: { id: row.id, ...deadLetter },
        update: deadLetter,
      });
      return true;
    });
  }

  async release(ids: readonly string[], owner: string): Promise<number> {
    const { count } = await this.prismaService.outboxMessage.updateMany({
      where: { id: { in: [...ids] }, leaseOwner: owner },
      data: { leaseOwner: null, leaseUntil: null },
    });
    return count;
  }

  async stats(now: number): Promise<OutboxStoreStats> {
    const at = new Date(now);
    const [pending, [ready], leased, deadLetters, [oldest]] = await Promise.all([
      this.prismaService.outboxMessage.count(),
      this.prismaService.$queryRaw<{ count: number }[]>`
        SELECT count(*)::int AS count FROM outbox_messages AS message WHERE ${claimable(now)}`,
      this.prismaService.outboxMessage.count({ where: { leaseUntil: { gt: at } } }),
      this.prismaService.outboxDeadLetter.count(),
      // Waiting since it became due; once an attempt failed, since it was added.
      this.prismaService.$queryRaw<{ dueAt: Date | null }[]>`
        SELECT min(CASE WHEN attempts > 0 THEN created_at
                        WHEN available_at <= ${at} THEN available_at END) AS "dueAt"
        FROM outbox_messages`,
    ]);
    return { pending, ready: ready!.count, leased, deadLetters, oldestDueAt: oldest?.dueAt?.getTime() ?? null };
  }

  async listDeadLetters({ topic, key, limit = 50, offset = 0 }: OutboxDeadLetterQuery): Promise<OutboxDeadLetter[]> {
    const rows = await this.prismaService.outboxDeadLetter.findMany({
      where: { topic, key },
      orderBy: [{ failedAt: 'desc' }, { id: 'desc' }],
      take: limit,
      skip: offset,
    });
    return rows.map(toDeadLetter);
  }

  async getDeadLetter(id: string): Promise<OutboxDeadLetter | undefined> {
    const row = await this.prismaService.outboxDeadLetter.findUnique({ where: { id } });
    return row ? toDeadLetter(row) : undefined;
  }

  requeueDeadLetters(filter: OutboxDeadLetterFilter, now: number): Promise<number> {
    const where = deadLetterFilter(filter);
    return this.prismaService.$transaction(async (tx) => {
      // Raw, because Prisma Client's deleteMany() returns a count, not the rows: take the
      // dead letters in one statement, so a concurrent requeue or purge can't take them too.
      const rows = await tx.$queryRaw<DeadLetterRow[]>`
        DELETE FROM outbox_dead_letters WHERE ${where} RETURNING ${DEAD_LETTER_FIELDS}`;
      if (rows.length === 0) return 0;
      // The original seq: back ahead of the messages added after it, with the same key.
      await tx.outboxMessage.createMany({
        data: rows.map((row) => ({
          seq: row.seq,
          id: row.id,
          topic: row.topic,
          payload: toJson(row.payload),
          headers: row.headers as Prisma.InputJsonObject,
          key: row.key,
          createdAt: row.createdAt,
          availableAt: new Date(now),
          lastError: row.lastError,
          history: row.history as Prisma.InputJsonArray,
        })),
      });
      return rows.length;
    });
  }

  async purgeDeadLetters(filter: OutboxDeadLetterFilter): Promise<number> {
    return await this.prismaService.$executeRaw`DELETE FROM outbox_dead_letters WHERE ${deadLetterFilter(filter)}`;
  }

  async recordInbox(tx: Transaction | undefined, consumer: string, messageId: string, now: number): Promise<boolean> {
    if (tx !== undefined) assertTransaction(tx);
    // INSERT ... ON CONFLICT DO NOTHING on the unique key: a concurrent delivery waits for
    // this transaction. The count says whether this call inserted the record.
    const { count } = await (tx ?? this.prismaService).outboxInbox.createMany({
      data: { consumer, messageId, processedAt: new Date(now) },
      skipDuplicates: true,
    });
    return count === 1;
  }

  async hasInbox(consumer: string, messageId: string): Promise<boolean> {
    const found = await this.prismaService.outboxInbox.count({ where: { consumer, messageId } });
    return found > 0;
  }

  async pruneInbox(before: number): Promise<number> {
    const { count } = await this.prismaService.outboxInbox.deleteMany({ where: { processedAt: { lt: new Date(before) } } });
    return count;
  }
}

/**
 * Due, unleased, and no older message with the same key is delayed or leased (on
 * `outbox_messages AS message`). The NOT EXISTS probes the (key, seq) index from the key's
 * oldest row.
 */
function claimable(now: number): Prisma.Sql {
  const at = new Date(now);
  return Prisma.sql`message.available_at <= ${at}
    AND (message.lease_until IS NULL OR message.lease_until <= ${at})
    AND (message.key IS NULL OR NOT EXISTS (
      SELECT 1 FROM outbox_messages AS older
      WHERE older.key = message.key AND older.seq < message.seq
        AND (older.available_at > ${at} OR older.lease_until > ${at})))`;
}

/**
 * A transaction client lacks the root client's `$connect()`. (Both have `$transaction()`:
 * on a transaction client, it nests.)
 */
function assertTransaction(tx: Transaction) {
  if (typeof (tx as Partial<PrismaService> | undefined)?.$connect === 'function' || tx === undefined || tx === null) {
    throw new OutboxTransactionRequiredError(
      'Pass the tx that prisma.$transaction(async (tx) => ...) gives you, not the client.',
    );
  }
}

/** One lock per key, sorted, so two transactions locking the same keys can't deadlock. */
function keyLocks(messages: readonly OutboxMessage[]): number[] {
  const keys = new Set(messages.flatMap((message) => (message.key === null ? [] : [message.key])));
  const locks = [...keys].map((key) => createHash('sha256').update(key).digest().readInt32BE(0));
  return [...new Set(locks)].sort((a, b) => a - b);
}

/** The message, if `owner` still holds its lease: every relay write is fenced by it. */
function leasedBy(id: string, owner: string) {
  return { id, leaseOwner: owner } satisfies Prisma.OutboxMessageWhereUniqueInput;
}

/** The filter's fields combined with AND; an empty filter is refused unless it says `all`. */
function deadLetterFilter({ ids, topic, key, failedBefore, all }: OutboxDeadLetterFilter): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];
  if (ids) conditions.push(ids.length === 0 ? Prisma.sql`FALSE` : Prisma.sql`id IN (${Prisma.join(ids)})`);
  if (topic !== undefined) conditions.push(Prisma.sql`topic = ${topic}`);
  if (key !== undefined) conditions.push(Prisma.sql`key = ${key}`);
  if (failedBefore !== undefined) conditions.push(Prisma.sql`failed_at < ${new Date(+failedBefore)}`);
  if (conditions.length === 0 && !all) {
    throw new Error('Refusing an empty dead-letter filter; pass { all: true }');
  }
  return conditions.length === 0 ? Prisma.sql`TRUE` : Prisma.join(conditions, ' AND ');
}

/** `null` is stored as SQL NULL: Prisma needs `Prisma.DbNull` to write it. */
function toJson(value: unknown) {
  return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

/** Turns Prisma's "record to delete does not exist" (P2025) into `fallback`. */
function ifNotFound<T>(fallback: T) {
  return (error: unknown): T => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return fallback;
    throw error;
  };
}

function toMessage(row: MessageRow): OutboxMessage {
  return {
    id: row.id,
    topic: row.topic,
    payload: row.payload,
    headers: row.headers as Record<string, string>,
    key: row.key,
    createdAt: row.createdAt.getTime(),
    availableAt: row.availableAt.getTime(),
    attempts: row.attempts,
    lastError: row.lastError,
  };
}

function toDeadLetter(row: DeadLetterRow): OutboxDeadLetter {
  return {
    id: row.id,
    topic: row.topic,
    payload: row.payload,
    headers: row.headers as Record<string, string>,
    key: row.key,
    createdAt: row.createdAt.getTime(),
    attempts: row.attempts,
    lastError: row.lastError,
    reason: row.reason as OutboxDeadLetterReason,
    failedAt: row.failedAt.getTime(),
    history: row.history as unknown as OutboxAttempt[],
  };
}
```

What it needed beyond Prisma Client, and why:

- **Advisory locks**: `tx.$executeRaw` in the interactive transaction, as with TypeORM.
- **The claim, the `ready` count and `oldestDueAt`**: Prisma Client has no row locks, no `SKIP LOCKED`, and no way to compare a row with the other rows of its table (the per-key `NOT EXISTS`). They are raw SQL, with the models' fields aliased (`created_at AS "createdAt"`) so the rows have the models' shape. Leasing and giving back use `updateMany()`.
- **Appending to the failure history** (`reschedule()`): Prisma Client can't update a JSON column in place, so it is one raw `UPDATE`, fenced by the lease owner.
- **Taking a set of dead letters** (`requeueDeadLetters()`): `deleteMany()` returns a count, not the rows, so the move starts with a raw `DELETE ... RETURNING`. The dead-letter filter is a `Prisma.sql` fragment, shared with `purgeDeadLetters()`.

The rest is Prisma Client, and each call is one statement. `delete()` with the lease in its `where` is a single `DELETE ... WHERE id AND lease_owner RETURNING`; it throws `P2025` when the lease is gone, which the store turns into `false`. `createMany()` with `skipDuplicates` is `INSERT ... ON CONFLICT DO NOTHING`, and its count tells a new inbox record from a duplicate. `upsert()` is a native `INSERT ... ON CONFLICT DO UPDATE`. One detail tells the transaction client from the root client: both have `$transaction()` (on a transaction client, it nests), but only the root client has `$connect()`.

**Use it.** Prisma has no Nest module of its own, so a small global module provides `PrismaService` where `DrizzleModule` stood:

```typescript
@@filename(prisma/database.module)
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

The store registers itself from the application module, and the service passes the interactive transaction's client to `outbox.add()`:

```typescript
@@filename(prisma/app.module)
import { Module } from '@nestjs/common';
import { OutboxModule } from '@nestjs/outbox';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { DatabaseModule } from './database.module.js';
import { OrdersService } from './orders.service.js';
import { PrismaOutboxStore } from './prisma-outbox.store.js';

@Module({
  imports: [DatabaseModule, OutboxModule.forRoot({ relay: { pollInterval: '1s' } }), NotificationsModule],
  // PrismaOutboxStore registers itself as the outbox's store.
  providers: [PrismaOutboxStore, OrdersService],
})
export class AppModule {}
```

```typescript
@@filename(prisma/orders.service)
@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly outbox: Outbox<Transaction>,
  ) {}

  async placeOrder({ userId, items }: PlaceOrderDto): Promise<Order> {
    if (!items?.length) throw new BadRequestException('An order needs at least one item');

    const order = await this.prismaService.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: items.map((item) => item.productId) } } });
      // ... price the lines and build the order, as in the Drizzle version
      await tx.order.create({ data: { ...order, items: order.items as object[] } });

      // The interactive transaction's client: the message commits or rolls back with the order.
      await this.outbox.add(tx, { topic: 'order.placed', payload: order });
      return order;
    });

    this.outbox.notify(); // publish now instead of at the next poll
    return order;
  }
}
```

**Test it.** The harness passes `prisma.$transaction(work)` as your transaction, and `prisma` itself as the handle to refuse:

```typescript
@@filename(test/prisma-outbox.store.e2e-spec)
async function harness(): Promise<OutboxStoreHarness<Transaction> & { store: PrismaOutboxStore }> {
  await prisma.$executeRaw`TRUNCATE outbox_messages, outbox_dead_letters, outbox_inbox RESTART IDENTITY`;
  return {
    store: new PrismaOutboxStore(prisma, new OutboxStorage()),
    transaction: (work) => prisma.$transaction(work),
    notATransaction: prisma,
  };
}
```

The example also runs each ORM end to end: an order and its message written in one ORM transaction, rolled back together, and published by the relay. It checks that the migrations match the entities and the schema, too:

```typescript
@@filename(test/orm-orders.e2e-spec)
it('writes the order and its message in one transaction, and the relay publishes it', async () => {
  const { app, logger } = context();
  const order = await orm.placeOrder(app);
  expect(await orm.orderExists(app, order.id)).toBe(true);

  const sent = `[MailerService] Order confirmation for ${order.id} sent to user-42`;
  await until(() => logger.lines.includes(sent));
  await until(async () => (await app.get(OutboxRelay).stats()).pending === 0);
  expect(logger.matching(sent)).toHaveLength(1);
  // The handler's inbox recorded the message, through the store.
  expect(await orm.inboxRecords(app, 'order-confirmation-email')).toBe(1);
});

it('rolls the message back with the order', async () => {
  const { app } = context();
  // ...
  await expect(orm.failAfterAdd(app, order)).rejects.toThrow('payment declined');

  expect(await orm.orderExists(app, order.id)).toBe(false);
  const stats = await app.get(OutboxRelay).stats();
  expect([stats.pending, stats.deadLetters]).toEqual([0, 0]);
});
```

#### Using BullMQ on Postgres instead

BullMQ 6 has a PostgreSQL backend, so it's fair to ask whether its job table could be the outbox. The package's research into BullMQ 6.3.x (from reading its published code, not a live run) says: not today.

- `Queue.add()` always runs on BullMQ's own connection pool, in autocommit mode. The backend interface deliberately exposes no connection or transaction type, so an `add()` can't join the transaction that inserts your order.
- The enqueue itself is one SQL function, `bullmq.add_job(...)`. Calling it on your own transaction would be atomic, but the function is internal, its signature changes with BullMQ's schema migrations, and every transaction that calls it would take Postgres's global NOTIFY lock at commit.
- `@nestjs/bullmq` 12.0.0 can't select the Postgres backend for a single queue. The only way is BullMQ's process-wide `setDefaultBackendFactory()`.

What's needed is an upstream option to run `add()` on a caller-supplied client (so the job commits with the order), plus a backend option in `@nestjs/bullmq`. With both, the job table would be the outbox, and BullMQ's workers would provide the claims, retries and failed set with no relay in between. Until then, use this outbox and publish to BullMQ from an `OutboxTransport` that calls `queue.add(topic, payload)` with the outbox message `id` as the `jobId`, so a republished message is ignored while the job still exists.

#### Reference

##### Module options

`OutboxModule.forRoot()` takes these options. `forRootAsync()` takes `transports` classes, `imports` and `isGlobal` at its top level, and the rest from `useFactory`, `useClass` or `useExisting` (a class implementing `OutboxOptionsFactory`), as in [Register the outbox](/reliability/outbox#register-the-outbox). The options token is `OUTBOX_MODULE_OPTIONS`. The store isn't an option: register it with `OutboxStorage`, as in [Write the outbox store](/reliability/outbox#write-the-outbox-store). Durations are milliseconds, or strings such as `'30s'` and `'1m'`.

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

None of them carries an HTTP status. `OutboxError` is the base class of the three that the package throws.

| Error | Raised when |
| --- | --- |
| `OutboxTransactionRequiredError` | `add()` or `processInTransaction()` got no transaction handle, or a store refused a handle that isn't a transaction |
| `OutboxPublishTimeoutError` | A publish outlived `relay.publishTimeout` (`timeoutMs`). Counted as a failed attempt |
| `OutboxNoHandlerError` | No `@OnOutboxMessage()` handler for the topic in this process (`topic`). Retried |
| `NonRetryableMessageError` | You throw it from a handler or transport to dead-letter the message without retrying |
