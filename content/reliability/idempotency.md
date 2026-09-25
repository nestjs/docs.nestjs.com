### Idempotency keys

A customer of an online store for cat food and supplies pays for salmon kibble and cat litter in the store's mobile app, on a phone on a train. The app sends `POST /orders/ord_1001/pay`. The server charges the card through the payment provider, but the response never reaches the phone. The app can't tell a lost request from a lost response, so it retries. Without protection, the retry goes wrong in one of two ways:

- It arrives after the first request finished. The order is already `paid`, so the customer gets an error for a payment that went through.
- It arrives while the first request is still waiting for the payment provider. Both requests pass the "is the order still pending?" check, and the card is charged twice.

An **idempotency key** fixes both. The client generates a unique key for each payment attempt and sends it in the `Idempotency-Key` header with every retry. The server runs the handler once per key, stores the result, and answers every retry with that result. `@nestjs/idempotency` implements this for HTTP routes, GraphQL mutations and microservice handlers with one decorator, `@Idempotent()`. Its HTTP behavior follows the IETF [Idempotency-Key header draft](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/).

In this tutorial, you'll make the payment endpoint idempotent, teach the mobile app to retry safely, move the keys to PostgreSQL (or to Redis), encrypt the stored receipts, protect the GraphQL mutation, and deduplicate the `order.paid` events that the shipping service consumes.

#### Prerequisites

This tutorial starts from the store's order API, which already has:

- An `OrdersModule` with an `OrdersService` and an `OrdersController`. An `Order` has an `id`, a `userId`, `items`, a `total` in cents, and a `status` of `'pending'`, `'paid'`, `'shipped'` or `'refunded'`.
- A `PaymentProviderClient` that wraps the payment provider's SDK. It throws a 402 `HttpException` when a card is declined, and a `ServiceUnavailableException` (503) when the provider is down.
- An `AuthGuard` that validates the bearer token and sets `req.user` (see [Authentication](/security/authentication#implementing-the-authentication-guard)), plus a `@CurrentUser()` parameter decorator that reads it.
- A global `ValidationPipe`, and a TCP client for the shipping service, registered as `SHIPPING_SERVICE`.
- Its data in PostgreSQL, through Drizzle, with the database registered by `@nestjs/drizzle` (see [Drizzle](/data/drizzle)). Using TypeORM? [Store keys in PostgreSQL](/reliability/idempotency#store-keys-in-postgresql) ends with the store for TypeORM.

This is the method we need to protect:

```typescript
@@filename(orders/orders.service)
async pay(orderId: string, user: User, dto: PayOrderDto): Promise<PaymentReceipt> {
  const order = this.ordersRepository.findOwned(orderId, user.id);
  if (order.status !== 'pending') {
    throw new ConflictException(`Order ${order.id} is already ${order.status}`);
  }
  const charge = await this.paymentProviderClient.charge({
    amount: order.total,
    paymentMethod: dto.paymentMethod,
    reference: order.id,
  });
  this.ordersRepository.markPaid(order.id);
  this.shipping.emit('order.paid', {
    eventId: `order-paid:${order.id}`,
    orderId: order.id,
  });

  return {
    orderId: order.id,
    receiptId: charge.id,
    amount: charge.amount,
    cardLast4: charge.cardLast4,
    paidAt: charge.createdAt,
  };
}
```

The status check can't stop a double charge on its own: two requests that arrive together both see `pending` before either one reaches `markPaid()`.

Install the package:

```bash
$ npm i --save @nestjs/idempotency
```

#### Make the payment endpoint idempotent

Register `IdempotencyModule` once, in the root module:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { IdempotencyModule } from '@nestjs/idempotency';
import type { User } from './orders/order.js';
import { OrdersModule } from './orders/orders.module.js';

@Module({
  imports: [
    IdempotencyModule.forRoot({
      // Runs after guards, so req.user is set. Keys never collide across users.
      scope: (req: { user?: User }) => req.user?.id,
    }),
    OrdersModule,
  ],
})
export class AppModule {}
```

The module is global. It registers one app-wide interceptor, which does nothing for handlers that aren't marked with `@Idempotent()`, so no other route changes behavior.

`scope` gives every user's keys their own namespace. Without it, all clients share one namespace, and a key that one user picks could replay another user's receipt. With it, Alice and Bob can both send `Idempotency-Key: 1` without ever seeing each other's results. Because guards run before interceptors, `req.user` is already set when `scope` runs, and an unauthenticated request is rejected before it can use up a key. If a signed-in user calls an `@Idempotent()` handler that has no `scope`, the module logs a warning, once for each handler. Where one shared namespace is deliberate, such as a webhook keyed by the provider's event ids, set `scope: false`.

Now mark the handler:

```typescript
@@filename(orders/orders.controller)
import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Idempotent } from '@nestjs/idempotency';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PayOrderDto } from './dto/pay-order.dto.js';
import type { User } from './order.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post(':id/pay')
  @Idempotent({ required: true })
  pay(
    @Param('id') id: string,
    @Body() dto: PayOrderDto,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.pay(id, user, dto);
  }
}
```

`required: true` rejects a request without a key with a 400 `IDEMPOTENCY_KEY_REQUIRED` error, before the handler runs. A payment without a key can't be retried safely, so it's better to refuse it than to charge the card unprotected.

Here's what happens to a request that carries a key:

1. The interceptor computes a **fingerprint** of the request: a SHA-256 hash of the scope, the method, the URL (which includes the order id) and the body, with object keys sorted.
2. It atomically takes a lock on the **record key** `<scope>:<key>`, for example `usr_alice:5e0f6d0e-…`. If a record already exists, the handler doesn't run (see the table below). While the handler runs, the interceptor keeps renewing the lock, so a slow handler never loses it to a retry.
3. The handler runs. When it finishes, the lock becomes a completed record that holds the response: the status code, the body, and the headers from a short allowlist (`Location`, `Content-Type`, `Content-Language`, `Content-Location`, `ETag` and `Last-Modified`) if the handler or a middleware set them. They describe the stored body, so a retry sent with another `Accept-Language` still gets the stored body's `Content-Language`. Cookies, CORS and rate-limit headers belong to the original request and are never replayed.

Every later request with the same key gets one of these answers:

| Situation                              | Response                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| The first request is still running     | 409 `IDEMPOTENCY_KEY_IN_USE`, with a `Retry-After` header                               |
| The first request completed            | The stored status and body, plus `Idempotent-Replayed: true`. The handler doesn't run.  |
| Same key, but a different body or URL  | 422 `IDEMPOTENCY_KEY_REUSED`                                                            |

Errors can be stored too. [Tune TTLs and failure handling](/reliability/idempotency#tune-ttls-and-failure-handling) covers which ones.

Because the interceptor is global, it runs outside the interceptors of your controllers and handlers. The stored body is exactly what the client received, after serializers and other interceptors ran, and a replay skips all of them. Pipes run inside it, so a `ValidationPipe` 400 is stored like any other client error. Other global interceptors are a different matter, as the production checklist explains.

Until you [store keys in PostgreSQL](/reliability/idempotency#store-keys-in-postgresql), records live in memory, in the default `InMemoryIdempotencyStore`. That's fine for a single instance in development, but every instance of the API has its own records, and they're lost on restart. When `NODE_ENV` is `production`, the app refuses to start this way, with an error that says how to register a store.

#### Send keys from the mobile app

The server can only deduplicate what the client sends consistently. The app follows two rules:

- It creates the key when the customer taps **Pay**, not once per request. Every retry of that payment sends the same key, even after the app is killed and restarted, so the key is saved with the pending payment.
- It creates a new key only for a new decision by the customer, such as choosing another card after a decline. Sending an old key with a different body is a 422.

```typescript
@@filename(mobile/pay-order)
export interface Receipt {
  orderId: string;
  receiptId: string;
  amount: number;
  cardLast4: string;
  paidAt: string;
}

export interface PendingPayment {
  orderId: string;
  paymentMethod: string;
  idempotencyKey: string;
}

export class PaymentError extends Error {
  constructor(
    readonly status: number,
    readonly body: { code?: string; message?: string },
  ) {
    super(body.message ?? `Payment failed with status ${status}`);
  }
}

// Call when the customer taps "Pay", and save the result with the order
// (for example in AsyncStorage). Retries, even after an app restart, reuse it.
export function startPayment(orderId: string, paymentMethod: string): PendingPayment {
  return { orderId, paymentMethod, idempotencyKey: crypto.randomUUID() };
}

export async function payOrder(
  apiUrl: string,
  token: string,
  payment: PendingPayment,
  maxAttempts = 5,
): Promise<Receipt> {
  for (let attempt = 1; ; attempt++) {
    const backoff = 250 * 2 ** (attempt - 1);
    let res: Response;
    try {
      res = await fetch(`${apiUrl}/orders/${payment.orderId}/pay`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': payment.idempotencyKey,
        },
        body: JSON.stringify({ paymentMethod: payment.paymentMethod }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      // No response: the card may or may not have been charged. Same key, try again.
      if (attempt >= maxAttempts) throw err;
      await sleep(backoff);
      continue;
    }
    if (res.ok) {
      return res.json(); // the first result, even if Idempotent-Replayed: true
    }
    const body = await res.json().catch(() => ({})); // a proxy's 502 page isn't JSON
    const retryable =
      res.status >= 500 || // the server released the key
      res.status === 429 ||
      body.code === 'IDEMPOTENCY_KEY_IN_USE'; // the first attempt is still running
    if (!retryable || attempt >= maxAttempts) {
      throw new PaymentError(res.status, body);
    }
    const retryAfter = Number(res.headers.get('Retry-After'));
    await sleep(retryAfter > 0 ? retryAfter * 1000 : backoff);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
```

`crypto.randomUUID()` is available in browsers and Node.js. In React Native, use a UUID library, such as `randomUUID()` from `expo-crypto`.

These are the responses the app can get, and what they mean for a retry:

| Response                                                      | Meaning                                                                  | Retry with the same key?                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| No response (network error, timeout)                          | The card may or may not have been charged                                | Yes                                               |
| 2xx                                                           | Done. With `Idempotent-Replayed: true`, it's the first attempt's result  | No, show the receipt                              |
| 409 with the code `IDEMPOTENCY_KEY_IN_USE`                    | The first attempt is still running                                       | Yes, after `Retry-After` seconds                  |
| 5xx                                                           | The attempt failed, and the server released the key                      | Yes, with backoff                                 |
| 429                                                           | Rate limited before the handler ran                                      | Yes, after `Retry-After` seconds                  |
| 422 `IDEMPOTENCY_KEY_REUSED`                                  | A bug: the key was reused for a different request                        | No                                                |
| Any other 4xx: 400, 402 (declined), 404, 409 (already paid)   | Final. Every retry with this key gets the same answer                    | No. Show the error; a new attempt gets a new key  |

Check `code`, not just the status. A 409 can also mean that the order is already paid, and that one is final.

#### Store keys in PostgreSQL

The in-memory store isn't enough in production. Its records vanish whenever the process stops, on every deploy or replaced container, so a retry that arrives afterwards runs the payment again. And once the API runs on more than one instance, a retry that lands on another instance wouldn't find the record, and two instances could both take the lock. The records need a shared store that can "create unless it exists" atomically.

`@nestjs/idempotency` doesn't ship one. It defines the contract, the `IdempotencyStore` interface, and you implement it in a provider of your app, with the database or the Redis client it already has. The interface has four methods. Each one takes the record key and an owner first, and durations arrive in whole milliseconds:

- `acquire(key, owner, fingerprint, lockTtl)` creates the lock, or returns the existing record: in flight, or completed with its response. It must be atomic: of any number of concurrent calls for a free key, exactly one may win.
- `complete(key, owner, response, ttl)` turns the lock into a completed record, if `owner` still holds it.
- `release(key, owner)` deletes the lock, if `owner` still holds it, so a retry can run the handler again.
- `extend(key, owner, lockTtl)` resets the lock's expiry to `lockTtl` from now, if `owner` still holds it. The interceptor calls it every `lockTtl / 3` while the handler runs and its result is being stored.

`owner` is a random id for each attempt, known as a fencing token. If an attempt stops renewing its lock (its instance crashed, say) and a retry takes over after `lockTtl`, the old attempt's `extend()`, `complete()` or `release()` does nothing, instead of overwriting the retry's record. So "if `owner` still holds it" has to be checked in the same atomic operation that writes: checked in a separate read first, a takeover could slip in between.

This section shows that store twice: first with Drizzle, which is the tutorial's path, and then, under "With TypeORM" at the end of the section, the same store for an application whose ORM is TypeORM. Take one of the two.

The store keeps its data in PostgreSQL, with Drizzle, so the records get a table in its Drizzle schema:

```typescript
@@filename(database/schema)
import type { IdempotencyStoredPayload } from '@nestjs/idempotency';
import { bigint, index, json, pgTable, text } from 'drizzle-orm/pg-core';

/** One row per idempotency record: an in-flight lock, or a completed response. */
export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    // SHA-256 of the record key: keys can be longer than an index entry allows.
    keyHash: text('key_hash').primaryKey(),
    key: text('key').notNull(),
    fingerprint: text('fingerprint').notNull(),
    // The attempt holding the lock; null once the record is completed.
    owner: text('owner'),
    // null while in flight. json, not jsonb: jsonb rejects "\u0000" in strings.
    response: json('response').$type<IdempotencyStoredPayload>(),
    // Epoch milliseconds.
    expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
  },
  (table) => [index('idempotency_keys_expires_at_idx').on(table.expiresAt)],
);
```

The primary key is a SHA-256 hash of the record key, because record keys (a scope, the client's key and, for GraphQL, the field's path) can be longer than PostgreSQL allows in an index entry. The response is `json` rather than `jsonb`, because `jsonb` rejects a `\u0000` inside a string, and a response body can contain one. Generate the migration with drizzle-kit, and apply it with `npx drizzle-kit migrate` as usual:

```bash
$ npx drizzle-kit generate --name=idempotency
```

```sql
@@filename(drizzle/0000_idempotency.sql)
CREATE TABLE "idempotency_keys" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"fingerprint" text NOT NULL,
	"owner" text,
	"response" json,
	"expires_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys" USING btree ("expires_at");
```

The store implements each method with Drizzle's query builder. It injects the database with `@InjectDrizzle()` from `@nestjs/drizzle`, and the constructor registers the store with `IdempotencyStorage`, a registry that `IdempotencyModule` exports:

```typescript
@@filename(idempotency/drizzle-idempotency.store)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import {
  IdempotencyStorage,
  type IdempotencyAcquireResult,
  type IdempotencyStore,
  type IdempotencyStoredPayload,
} from '@nestjs/idempotency';
import { and, eq, gt, inArray, lte } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { createHash } from 'node:crypto';
import { idempotencyKeys } from '../database/schema.js';

/** A Drizzle database on PostgreSQL: node-postgres in the app, PGlite in its tests. */
export type Database = PgDatabase<PgQueryResultHKT>;

const { keyHash, owner: ownerColumn, expiresAt } = idempotencyKeys;

@Injectable()
export class DrizzleIdempotencyStore implements IdempotencyStore {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    storage: IdempotencyStorage,
  ) {
    storage.registerSource(this);
  }

  async acquire(
    key: string,
    owner: string,
    fingerprint: string,
    lockTtl: number,
  ): Promise<IdempotencyAcquireResult> {
    const hash = hashOf(key);
    // A second round only happens when the row was released or expired
    // between the two statements below.
    for (let attempt = 0; attempt < 5; attempt++) {
      const now = Date.now();
      const lock = { fingerprint, owner, response: null, expiresAt: now + lockTtl };
      // Insert the lock, or take over an expired row. Of many concurrent
      // callers, PostgreSQL lets one write, and re-checks `setWhere` for the
      // others against the winner's row: they get no row back.
      const taken = await this.db
        .insert(idempotencyKeys)
        .values({ keyHash: hash, key, ...lock })
        .onConflictDoUpdate({
          target: keyHash,
          set: lock,
          setWhere: lte(expiresAt, now),
        })
        .returning({ keyHash });
      if (taken.length) {
        return { state: 'acquired' };
      }

      // Someone else holds the key: report their lock or record.
      const [row] = await this.db
        .select()
        .from(idempotencyKeys)
        .where(eq(keyHash, hash));
      if (row && row.expiresAt > now) {
        return row.response === null
          ? { state: 'in-flight', fingerprint: row.fingerprint }
          : { state: 'completed', fingerprint: row.fingerprint, response: row.response };
      }
    }
    throw new Error(`The idempotency record for "${key}" kept changing; try again`);
  }

  async complete(
    key: string,
    owner: string,
    response: IdempotencyStoredPayload,
    ttl: number,
  ): Promise<boolean> {
    const now = Date.now();
    const done = await this.db
      .update(idempotencyKeys)
      .set({ owner: null, response, expiresAt: now + ttl })
      .where(this.ownedBy(key, owner, now))
      .returning({ keyHash });
    return done.length === 1;
  }

  async release(key: string, owner: string): Promise<boolean> {
    const released = await this.db
      .delete(idempotencyKeys)
      .where(this.ownedBy(key, owner, Date.now()))
      .returning({ keyHash });
    return released.length === 1;
  }

  async extend(key: string, owner: string, lockTtl: number): Promise<boolean> {
    const now = Date.now();
    const extended = await this.db
      .update(idempotencyKeys)
      .set({ expiresAt: now + lockTtl })
      .where(this.ownedBy(key, owner, now))
      .returning({ keyHash });
    return extended.length === 1;
  }

  /**
   * Deletes up to `limit` expired rows, for a scheduled job. Expired rows are
   * already ignored, and reused by the next request with the same key.
   */
  async prune(limit = 1000): Promise<number> {
    const now = Date.now();
    const expired = this.db
      .select({ keyHash })
      .from(idempotencyKeys)
      .where(lte(expiresAt, now))
      .limit(limit);
    const deleted = await this.db
      .delete(idempotencyKeys)
      // Checks the expiry again: a row taken over since the subquery read it stays.
      .where(and(inArray(keyHash, expired), lte(expiresAt, now)))
      .returning({ keyHash });
    return deleted.length;
  }

  /** The caller's lock, if it still holds it and it hasn't expired. */
  private ownedBy(key: string, owner: string, now: number) {
    return and(eq(keyHash, hashOf(key)), eq(ownerColumn, owner), gt(expiresAt, now));
  }
}

function hashOf(key: string) {
  return createHash('sha256').update(key).digest('hex');
}
```

The database is typed as `PgDatabase`, what Drizzle's node-postgres and PGlite drivers have in common, so the tests below can run the store on PGlite. Each method is a single statement that PostgreSQL runs atomically, without a transaction:

- `acquire()` inserts the lock, or takes over an expired row, with one `INSERT ... ON CONFLICT DO UPDATE ... WHERE expires_at <= now`. When several callers race for a key, PostgreSQL lets one of them write and checks the `WHERE` again for the others against the winner's row, so they get no row back and read the winner's lock instead. If that row disappears in between (released, or expired), `acquire()` goes round again.
- `complete()`, `extend()` and `release()` check the owner, and that the lock hasn't expired, in the `WHERE` of the statement that writes. They count the rows that `returning()` gives back, which works the same on every Drizzle driver.
- Expired rows are ignored at once, and the next request with the same key reuses its row. To delete the rest, call `prune()` from a scheduled job, for example with `@Interval()` from `@nestjs/schedule`. It checks the expiry again in the `DELETE` itself, so a row that a retry took over in the meantime stays.

Expiry times come from each instance's clock (`Date.now()`), so keep the clocks in sync, as NTP does. Every idempotent request adds one or two statements to the connection pool, plus an `UPDATE` every `lockTtl / 3` while its handler runs.

The store is an ordinary provider. Register the database with `DrizzleModule` (see [Drizzle](/data/drizzle)), and add the store to the providers of `AppModule`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nestjs/drizzle';
import { IdempotencyModule } from '@nestjs/idempotency';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzleIdempotencyStore } from './idempotency/drizzle-idempotency.store.js';
import type { User } from './orders/order.js';
import { OrdersModule } from './orders/orders.module.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL! }),
    }),
    IdempotencyModule.forRoot({
      scope: (req: { user?: User }) => req.user?.id,
    }),
    OrdersModule,
  ],
  // Registers itself with IdempotencyStorage when Nest creates it.
  providers: [DrizzleIdempotencyStore],
})
export class AppModule {}
```

> info **Hint** The app reads `DATABASE_URL`, and, once receipts are encrypted, `IDEMPOTENCY_KEYS`, from `process.env`. An application loads its environment through `@nestjs/config`, with a validation schema that stops startup when a variable is missing, and injects `ConfigService` into these factories instead.

At startup, the module logs the store it uses, `IdempotencyStorage: DrizzleIdempotencyStore`, and then it stops taking registrations:

- An app has one store. A second `registerSource()` call throws, naming both classes.
- Register from the constructor of a singleton provider. The registry locks when `IdempotencyModule` initializes, so a store that registers later (from a lifecycle hook, per request, or in a lazy-loaded module) throws instead of being silently ignored.
- Without a registered store, the module keeps records in memory. In production (`NODE_ENV=production`), it refuses to start that way, unless you set `allowInMemoryStorage: true`, which accepts that every restart or deploy forgets the records.

Every store is tested with the same contract suite, which `@nestjs/idempotency/testing` exports as plain test cases for any test runner. It covers each method, the owner checks, expiry, and, with `concurrent`, the races that a store that reads and then writes gets wrong. The example project runs it against this store on PGlite, and on PostgreSQL through a `pg` pool, where 32 callers race for each key on up to 16 connections:

```typescript
@@filename(test/step-3.drizzle-store.spec)
import { PGlite } from '@electric-sql/pglite';
import { IdempotencyStorage } from '@nestjs/idempotency';
import { idempotencyStoreContract } from '@nestjs/idempotency/testing';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { DrizzleIdempotencyStore } from '../src/idempotency/drizzle-idempotency.store.js';

const migrationsFolder = new URL('../drizzle', import.meta.url).pathname;
// ...
describe('DrizzleIdempotencyStore on PGlite', () => {
  let pglite: PGlite;
  let store: DrizzleIdempotencyStore;

  beforeAll(async () => {
    pglite = new PGlite();
    const db = drizzlePglite(pglite);
    await migratePglite(db, { migrationsFolder }); // npx drizzle-kit migrate
    store = new DrizzleIdempotencyStore(db, new IdempotencyStorage());
  });
  afterAll(() => pglite.close());

  describe('the IdempotencyStore contract', () => {
    // The store reads Date.now(): fake Date alone, so the driver keeps its timers.
    beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
    afterEach(() => vi.useRealTimers());

    // One store and one table for every case: each case uses keys of its own.
    const cases = idempotencyStoreContract(() => store, {
      advanceTime: (ms) => vi.setSystemTime(Date.now() + ms),
      concurrent: true,
    });
    for (const c of cases) it(c.name, c.run);
  });
  // ...
});
```

**With TypeORM.** The same store for an application whose ORM is TypeORM, on the same table. Drizzle stays the tutorial's path: take this store instead of the one above, not next to it. The table is an entity, and every column states its type, so that the TypeORM CLI, which loads it without decorator metadata, sees the same schema as the application:

```typescript
@@filename(typeorm/idempotency-key.entity)
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

// The idempotency_keys table of the Drizzle schema in src/database/schema.ts, as an entity.
// Every column states its type, so the entity loads the same with or without emitted
// decorator metadata (the TypeORM CLI runs it through tsx, which emits none).

/** Reads a `bigint` column as a number: TypeORM returns it as a string. */
const epochMs = {
  to: (value: number) => value,
  from: (value: string) => Number(value),
};

/** One row per idempotency record: an in-flight lock, or a completed response. */
@Entity('idempotency_keys')
@Index('idempotency_keys_expires_at_idx', ['expiresAt'])
export class IdempotencyKeyEntity {
  // SHA-256 of the record key: keys can be longer than an index entry allows.
  @PrimaryColumn({ type: 'text', name: 'key_hash' })
  keyHash: string;

  @Column({ type: 'text' })
  key: string;

  @Column({ type: 'text' })
  fingerprint: string;

  // The attempt holding the lock; null once the record is completed.
  @Column({ type: 'text', nullable: true })
  owner: string | null;

  // null while in flight. json, not jsonb: jsonb rejects "\u0000" in strings. An
  // IdempotencyStoredPayload, typed `object`: its `unknown` body doesn't fit TypeORM's insert types.
  @Column({ type: 'json', nullable: true })
  response: object | null;

  // Epoch milliseconds.
  @Column({ type: 'bigint', name: 'expires_at', transformer: epochMs })
  expiresAt: number;
}
```

TypeORM returns a `bigint` column as a string, so a transformer reads `expiresAt` back as a number. The response column is typed `object` rather than `IdempotencyStoredPayload`, because the payload's `unknown` body doesn't fit TypeORM's insert types; the store casts it when it reads a record. The TypeORM CLI and `TypeOrmModule` share one set of options, in a data source file:

```typescript
@@filename(typeorm/data-source)
import { DataSource, type DataSourceOptions } from 'typeorm';
import { IdempotencyKeyEntity } from './idempotency-key.entity.js';
import { Idempotency1790321611502 } from './migrations/1790321611502-Idempotency.js';

/** What the application's TypeOrmModule and the TypeORM CLI share. */
export const dataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [IdempotencyKeyEntity],
  migrations: [Idempotency1790321611502],
} satisfies DataSourceOptions;

// The TypeORM CLI's data source: `migration:generate` compares the entities with this database.
export default new DataSource(dataSourceOptions);
```

Generate the migration from the entity, apply it, and check that the entity and the database agree. The CLI needs a TypeScript loader for the data source file; this uses `tsx`:

```bash
$ npx tsx ./node_modules/typeorm/cli.js migration:generate src/typeorm/migrations/Idempotency -d src/typeorm/data-source.ts --pretty
Migration /store/src/typeorm/migrations/1790321611502-Idempotency.ts has been generated successfully.
$ npx tsx ./node_modules/typeorm/cli.js migration:run -d src/typeorm/data-source.ts
$ npx tsx ./node_modules/typeorm/cli.js migration:generate src/typeorm/migrations/Check -d src/typeorm/data-source.ts --check
No changes in database schema were found
```

The migration it wrote, `1790321611502-Idempotency.ts`, is the `CREATE TABLE` and `CREATE INDEX` statements of the Drizzle migration, and `migrations` in the data source lists it. Now the store, under the same rules as the Drizzle one:

```typescript
@@filename(typeorm/typeorm-idempotency.store)
import { Injectable } from '@nestjs/common';
import {
  IdempotencyStorage,
  type IdempotencyAcquireResult,
  type IdempotencyStore,
  type IdempotencyStoredPayload,
} from '@nestjs/idempotency';
import { createHash } from 'node:crypto';
import { DataSource, MoreThan } from 'typeorm';
import { IdempotencyKeyEntity } from './idempotency-key.entity.js';

/**
 * Keeps idempotency records in PostgreSQL, through TypeORM: the Drizzle
 * store, on the same table. Each method is a single statement, so the
 * guarantees hold with any number of API instances.
 */
@Injectable()
export class TypeOrmIdempotencyStore implements IdempotencyStore {
  constructor(
    private readonly dataSource: DataSource,
    storage: IdempotencyStorage,
  ) {
    storage.registerSource(this);
  }

  async acquire(
    key: string,
    owner: string,
    fingerprint: string,
    lockTtl: number,
  ): Promise<IdempotencyAcquireResult> {
    const hash = hashOf(key);
    // A second round only happens when the row was released or expired
    // between the two statements below.
    for (let attempt = 0; attempt < 5; attempt++) {
      const now = Date.now();
      // Insert the lock, or take over an expired row. Of many concurrent
      // callers, PostgreSQL lets one write, and re-checks the overwrite
      // condition for the others against the winner's row: they get no row back.
      const { raw } = await this.dataSource
        .createQueryBuilder()
        .insert()
        .into(IdempotencyKeyEntity)
        .values({ keyHash: hash, key, fingerprint, owner, response: null, expiresAt: now + lockTtl })
        .orUpdate(['fingerprint', 'owner', 'response', 'expires_at'], ['key_hash'], {
          overwriteCondition: { where: 'idempotency_keys.expires_at <= :now', parameters: { now } },
        })
        .returning(['keyHash'])
        .updateEntity(false)
        .execute();
      if ((raw as unknown[]).length === 1) {
        return { state: 'acquired' };
      }

      // Someone else holds the key: report their lock or record.
      const row = await this.dataSource.manager.findOneBy(IdempotencyKeyEntity, { keyHash: hash });
      if (row && row.expiresAt > now) {
        return row.response === null
          ? { state: 'in-flight', fingerprint: row.fingerprint }
          : { state: 'completed', fingerprint: row.fingerprint, response: row.response as IdempotencyStoredPayload };
      }
    }
    throw new Error(`The idempotency record for "${key}" kept changing; try again`);
  }

  async complete(
    key: string,
    owner: string,
    response: IdempotencyStoredPayload,
    ttl: number,
  ): Promise<boolean> {
    const now = Date.now();
    const { affected } = await this.dataSource.manager.update(IdempotencyKeyEntity, ownedBy(key, owner, now), {
      owner: null,
      response,
      expiresAt: now + ttl,
    });
    return affected === 1;
  }

  async release(key: string, owner: string): Promise<boolean> {
    const { affected } = await this.dataSource.manager.delete(IdempotencyKeyEntity, ownedBy(key, owner, Date.now()));
    return affected === 1;
  }

  async extend(key: string, owner: string, lockTtl: number): Promise<boolean> {
    const now = Date.now();
    const { affected } = await this.dataSource.manager.update(IdempotencyKeyEntity, ownedBy(key, owner, now), {
      expiresAt: now + lockTtl,
    });
    return affected === 1;
  }

  /**
   * Deletes up to `limit` expired rows, for a scheduled job. Expired rows are
   * already ignored, and reused by the next request with the same key.
   */
  async prune(limit = 1000): Promise<number> {
    const expired = this.dataSource.manager
      .createQueryBuilder(IdempotencyKeyEntity, 'expired')
      .select('expired.keyHash')
      .where('expired.expiresAt <= :now')
      .limit(limit);
    const { affected } = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(IdempotencyKeyEntity)
      .where(`key_hash IN (${expired.getQuery()})`)
      // Checks the expiry again: a row taken over since the subquery read it stays.
      .andWhere('expires_at <= :now', { now: Date.now() })
      .execute();
    return affected ?? 0;
  }
}

/** The caller's lock, if it still holds it and it hasn't expired. */
function ownedBy(key: string, owner: string, now: number) {
  return { keyHash: hashOf(key), owner, expiresAt: MoreThan(now) };
}

function hashOf(key: string) {
  return createHash('sha256').update(key).digest('hex');
}
```

- **`acquire()`** is the same `INSERT ... ON CONFLICT DO UPDATE ... WHERE expires_at <= now`, through the insert query builder: `orUpdate()` lists the columns a takeover overwrites, its `overwriteCondition` option is the `WHERE`, and `returning()` gives back a row only to the caller that wrote.
- **`complete()`, `extend()` and `release()`** are `update()` and `delete()` on the entity manager, with the owner and `MoreThan(now)` in their criteria, and they read `affected`. Never `save()`: it reads the row first, so a takeover could slip in between.
- **`prune()`** builds the subquery that picks the expired rows with a select query builder, and puts its SQL in the `WHERE` of the `DELETE`, next to the expiry check.

The store injects the `DataSource` that `TypeOrmModule` provides. Register the module with the data source's options in place of `DrizzleModule`, and the store in place of `DrizzleIdempotencyStore`:

```typescript
@@filename(typeorm/app.module)
import { Module } from '@nestjs/common';
import { IdempotencyModule } from '@nestjs/idempotency';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { User } from '../orders/order.js';
import { OrdersModule } from '../orders/orders.module.js';
import { dataSourceOptions } from './data-source.js';
import { TypeOrmIdempotencyStore } from './typeorm-idempotency.store.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // The entity and migration the CLI uses; migrations run on deploy (`migration:run`).
      useFactory: () => ({ ...dataSourceOptions, url: process.env.DATABASE_URL }),
    }),
    IdempotencyModule.forRoot({
      scope: (req: { user?: User }) => req.user?.id,
    }),
    OrdersModule,
  ],
  // Registers itself with IdempotencyStorage when Nest creates it.
  providers: [TypeOrmIdempotencyStore],
})
export class AppModule {}
```

The contract suite runs on it unchanged. TypeORM connects through `pg`, so the suite needs a PostgreSQL server and is skipped without one. One more case checks that the entity and the migration agree, which is what `migration:generate --check` checks:

```typescript
@@filename(test/typeorm-idempotency.store.spec)
import { IdempotencyStorage } from '@nestjs/idempotency';
import { idempotencyStoreContract } from '@nestjs/idempotency/testing';
import { DataSource } from 'typeorm';
import { startPostgres } from '../../../test-support/postgres.js';
import { dataSourceOptions } from '../src/typeorm/data-source.js';
import { TypeOrmIdempotencyStore } from '../src/typeorm/typeorm-idempotency.store.js';
// ...
const { postgres, reason } = await startPostgres();
afterAll(() => postgres?.stop());

describe.skipIf(!postgres)(`TypeOrmIdempotencyStore on PostgreSQL${postgres ? '' : ` (skipped: ${reason})`}`, () => {
  let dataSource: DataSource;
  let url: string;
  let store: TypeOrmIdempotencyStore;

  beforeAll(async () => {
    url = await postgres!.createDatabase('idempotency_typeorm_store');
    dataSource = await new DataSource({ ...dataSourceOptions, url, poolSize: 16 }).initialize();
    await dataSource.runMigrations(); // npx typeorm migration:run
    store = new TypeOrmIdempotencyStore(dataSource, new IdempotencyStorage());
  });
  afterAll(() => dataSource?.destroy());

  describe('the IdempotencyStore contract', () => {
    // The store reads Date.now(): fake Date alone, so the driver keeps its timers.
    beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
    afterEach(() => vi.useRealTimers());

    // One store and one table for every case: each case uses keys of its own.
    // 32 callers per race, on up to 16 connections.
    const cases = idempotencyStoreContract(() => store, {
      advanceTime: (ms) => vi.setSystemTime(Date.now() + ms),
      concurrent: { callers: 32 },
    });
    for (const c of cases) it(c.name, c.run);
  });

  it('has a migration that matches the entity (what `migration:generate --check` checks)', async () => {
    const { upQueries } = await dataSource.driver.createSchemaBuilder().log();
    expect(upQueries.map((query) => query.query)).toEqual([]);
  });
  // ...
});
```

`startPostgres()` is a test helper that creates a throwaway database on a PostgreSQL server, or skips the suite without one. The example also runs two instances of the TypeORM `AppModule` on one database, one charging while the other answers 409.

> info **Hint** Using Prisma? [The store contract](/reliability/idempotency#the-store-contract), after the tutorial, shows how Prisma expresses these statements. Check your store with the same suite.

#### Store keys in Redis instead

If your API already runs Redis, it can keep the records there instead of in PostgreSQL. Redis suits this store well: a record is a small hash that Redis expires on its own, so there's no pruning job, and a hot key, such as a client retrying one payment every second, costs a round trip to memory instead of a row lock in the primary database. The price is a second store to run, protect and back up, and Redis has to be configured never to evict the records (see the production checklist).

Each method is one Lua script, which Redis runs atomically:

```typescript
@@filename(idempotency/redis-idempotency.store)
import { Inject, Injectable } from '@nestjs/common';
import {
  IdempotencyStorage,
  type IdempotencyAcquireResult,
  type IdempotencyStore,
  type IdempotencyStoredPayload,
} from '@nestjs/idempotency';
import { REDIS } from '../redis/redis.module.js';

/** The one ioredis method this store needs. */
export interface RedisClient {
  eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown>;
}

// Creates the lock if no record exists. Otherwise returns the record, in the
// same round trip.
const ACQUIRE = `
if redis.call('EXISTS', KEYS[1]) == 0 then
  redis.call('HSET', KEYS[1], 'state', 'in-flight', 'fp', ARGV[1], 'owner', ARGV[2])
  redis.call('PEXPIRE', KEYS[1], ARGV[3])
  return {1}
end
local r = redis.call('HMGET', KEYS[1], 'state', 'fp', 'resp')
return {0, r[1], r[2], r[3]}
`;

// Turns our lock into a completed record, unless another attempt took it over.
const COMPLETE = `
if redis.call('HGET', KEYS[1], 'owner') ~= ARGV[1] then return 0 end
redis.call('HSET', KEYS[1], 'state', 'completed', 'resp', ARGV[2])
redis.call('HDEL', KEYS[1], 'owner')
redis.call('PEXPIRE', KEYS[1], ARGV[3])
return 1
`;

// Deletes the lock, but only if it is still ours.
const RELEASE = `
if redis.call('HGET', KEYS[1], 'owner') == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

// Renews our lock while the handler runs, but only if it is still ours.
const EXTEND = `
if redis.call('HGET', KEYS[1], 'owner') ~= ARGV[1] then return 0 end
redis.call('PEXPIRE', KEYS[1], ARGV[2])
return 1
`;

type AcquireReply =
  | [1]
  | [0, 'in-flight' | 'completed', string, string | null];

@Injectable()
export class RedisIdempotencyStore implements IdempotencyStore {
  constructor(
    @Inject(REDIS) private readonly redis: RedisClient,
    storage: IdempotencyStorage,
  ) {
    storage.registerSource(this);
  }

  async acquire(
    key: string,
    owner: string,
    fingerprint: string,
    lockTtl: number,
  ): Promise<IdempotencyAcquireResult> {
    const reply = (await this.redis.eval(
      ACQUIRE, 1, this.key(key), fingerprint, owner, lockTtl,
    )) as AcquireReply;
    if (reply[0] === 1) {
      return { state: 'acquired' };
    }
    const [, state, storedFingerprint, response] = reply;
    return state === 'completed'
      ? { state, fingerprint: storedFingerprint, response: JSON.parse(response!) }
      : { state, fingerprint: storedFingerprint };
  }

  async complete(
    key: string,
    owner: string,
    response: IdempotencyStoredPayload,
    ttl: number,
  ): Promise<boolean> {
    const done = await this.redis.eval(
      COMPLETE, 1, this.key(key), owner, JSON.stringify(response), ttl,
    );
    return done === 1;
  }

  async release(key: string, owner: string): Promise<boolean> {
    const released = await this.redis.eval(RELEASE, 1, this.key(key), owner);
    return released === 1;
  }

  async extend(key: string, owner: string, lockTtl: number): Promise<boolean> {
    const extended = await this.redis.eval(EXTEND, 1, this.key(key), owner, lockTtl);
    return extended === 1;
  }

  private key(key: string) {
    return `idem:${key}`;
  }
}
```

Each record is a hash at `idem:<scope>:<key>`, with the fields `state`, `fp` (the fingerprint), `owner` and `resp` (the stored response as JSON). The hash expires on its own: `lockTtl` after the last renewal while it's in flight, and after `ttl` once it's completed, so no cleanup job is needed. Each script touches a single key, so the store also works with Redis Cluster. Redis runs a script atomically, but it doesn't undo the script's writes when a later command fails. `PEXPIRE`, for one, rejects a fraction of a millisecond, and failing after the `HSET`, it would leave a lock that never expires. That's why the interceptor hands the store whole milliseconds.

Nest injects the Redis client, and the constructor registers the store, as in the PostgreSQL store. An app has one store, so `RedisIdempotencyStore` takes the place of the other one in `AppModule`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { IdempotencyModule } from '@nestjs/idempotency';
import { RedisIdempotencyStore } from './idempotency/redis-idempotency.store.js';
import type { User } from './orders/order.js';
import { OrdersModule } from './orders/orders.module.js';
import { RedisModule } from './redis/redis.module.js';

@Module({
  imports: [
    RedisModule,
    IdempotencyModule.forRoot({
      scope: (req: { user?: User }) => req.user?.id,
    }),
    OrdersModule,
  ],
  providers: [RedisIdempotencyStore],
})
export class AppModule {}
```

`RedisModule` stands for your app's Redis module: a global module that provides an ioredis client under the `REDIS` token, for example with `useFactory: () => new Redis(process.env.REDIS_URL!)`, and closes it with `quit()` in its `onApplicationShutdown()`, after the package has finished the requests in flight. `RedisClient` asks for nothing but `eval()`, which an ioredis `Redis` instance provides as is. At startup, the log line reads `IdempotencyStorage: RedisIdempotencyStore`, and the registry's rules from the PostgreSQL store apply: one store, registered from a constructor.

The example project runs the contract suite against this store too:

```typescript
@@filename(test/step-4.redis-store.spec)
import { idempotencyStoreContract } from '@nestjs/idempotency/testing';
// ...
describe('RedisIdempotencyStore, the IdempotencyStore contract (on FakeRedis)', () => {
  let redis: FakeRedis;
  const cases = idempotencyStoreContract(
    () => {
      redis = new FakeRedis();
      return new RedisIdempotencyStore(redis, new IdempotencyStorage());
    },
    // Redis expires keys on its own clock: the fake's.
    { advanceTime: (ms) => redis.advance(ms), concurrent: true },
  );
  for (const c of cases) it(c.name, c.run);
});
```

> info **Hint** This tutorial's example project has no Redis server, so its tests run the store against an in-process fake that implements the same four scripts in JavaScript. That covers the store's logic and the way it reads replies, but not the Lua itself. Run the contract suite against a real Redis, for example in a container, before you rely on the store. Without `advanceTime`, the suite waits for real expiry, which takes about ten seconds.

The remaining steps show `DrizzleIdempotencyStore` in their module listings. With Redis, register `RedisIdempotencyStore` in its place: encryption, the shipping service and the tuning options work the same, and with encryption on, the `resp` field holds the sealed envelope instead of the `response` column.

#### Encrypt stored receipts

The stored response is the whole receipt: the payment provider's receipt id, the amount, and the card's last four digits. They sit in `idempotency_keys` in plain text, in every backup and every dump of the database, so encrypt the records at rest.

The encryption keys are secrets that the app should read when it starts, not when `app.module.ts` is imported, so switch to `forRootAsync()`. The store stays as it is, a provider of `AppModule` that registers itself, and the factory returns the options:

```typescript
@@filename(app.module)
IdempotencyModule.forRootAsync({
  useFactory: () => ({
    scope: (req: { user?: User }) => req.user?.id,
    encryption: {
      // Newest first: seal with the first key, open with any of them.
      keys: process.env.IDEMPOTENCY_KEYS!.split(','),
    },
  }),
}),
```

Generate a key with `openssl rand -base64 32`, and store it in your secret manager as `IDEMPOTENCY_KEYS`. With encryption on, the `response` column holds a sealed envelope, `v1.<keyId>.<iv>.<ciphertext>.<tag>`, instead of the receipt:

- Records are encrypted with AES-256-GCM, with a random IV for each record.
- The fingerprint stays in plain text. The store has to compare it, and it's a hash anyway.
- The record key is authenticated along with the data, so a record copied under another user's key fails to open instead of replaying there.
- While encryption is on, plain-text records are rejected, so nobody with write access to the table can plant a response.
- A string key must be at least 32 characters, and it's expanded with HKDF-SHA256. That's fine for a random secret like the one above, but it isn't a password hash, so don't use a password that a person chose. A shorter key, or one with spaces around it (`IDEMPOTENCY_KEYS=new, old` splits into a second key that starts with a space), stops the app at startup, with an error that names it.

Turn encryption on before the endpoint stores its first record. It changes the record format both ways: a plain-text record stored before the switch, like a sealed record after encryption is turned off, fails to open until it expires, and its replays get the 500 described below.

To rotate the key without breaking replays:

1. Generate a new key and deploy `IDEMPOTENCY_KEYS=old-key,new-key`. Instances still seal records with the old key, but they can open records sealed with the new one.
2. Once every instance runs that configuration, deploy `IDEMPOTENCY_KEYS=new-key,old-key`. New records are sealed with the new key, and old records still open. During the rolling deploy, instances that haven't restarted yet can already open the new records, thanks to the first step.
3. When `ttl` has passed (48 hours, see [Tune TTLs and failure handling](/reliability/idempotency#tune-ttls-and-failure-handling)), every record sealed with the old key has expired. Deploy `IDEMPOTENCY_KEYS=new-key`.

If you remove a key too early, replays of records sealed with it **fail closed**. The client gets a 500 `IDEMPOTENCY_RECORD_UNREADABLE` error, the failure is logged, and the handler doesn't run again: the record proves that the card was already charged, so running the handler could charge it twice. The error stops when the record expires.

#### Pay through GraphQL

The store's website pays through a GraphQL mutation. Register `GraphQLModule` in `AppModule`:

```typescript
@@filename(app.module)
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
}),
```

Then add the mutation to the orders resolver, next to its queries. In GraphQL, the key can come from the `Idempotency-Key` header, as with REST, or from an argument. An argument puts the key in the schema, where code generators and reviewers can see it. It also suits GraphQL clients, which usually set headers once per connection rather than per operation. `@Idempotent()` reads a mutation's `idempotencyKey` argument when it has one, and the header otherwise, so the resolver only has to declare the argument:

```typescript
@@filename(orders/orders.resolver)
@Mutation(() => PaymentReceipt)
@Idempotent({ required: true })
payOrder(
  @Args('orderId', { type: () => ID }) orderId: string,
  @Args('input') input: PayOrderDto,
  @Args('idempotencyKey') _idempotencyKey: string,
  @CurrentUser() user: User,
) {
  return this.ordersService.pay(orderId, user, input);
}
```

`PayOrderDto` is the class the REST endpoint uses, with `@InputType()` and `@Field()` added, and `PaymentReceipt` is an `@ObjectType()` with the receipt's fields. The resolver uses the same `AuthGuard`, which reads the request from the GraphQL context. The module's `scope` receives that same request, so keys are per user here too. The argument is a non-null `String`, so GraphQL validation already rejects an operation without it:

```graphql
mutation PayOrder($orderId: ID!, $paymentMethod: String!, $key: String!) {
  payOrder(orderId: $orderId, input: { paymentMethod: $paymentMethod }, idempotencyKey: $key) {
    receiptId
    amount
    cardLast4
    paidAt
  }
}
```

A retry with the same variables returns the stored `payOrder` result, with the same types the resolver returned, so a `Date` field replays as a `Date`. The record key gets the field's path appended, as in `usr_alice:<key>:payOrder`, because one operation can contain several mutations. Each field is stored and replayed on its own, and aliases are part of the path, so a retry must send the same document.

A rejection is an error on that field, not an HTTP status. The response is still a 200, because other fields in the same operation may have succeeded, and the status and the retry delay are in `extensions` (`locations` omitted):

```json
{
  "errors": [
    {
      "message": "A request with this idempotency key is still being processed.",
      "path": ["payOrder"],
      "extensions": {
        "code": "IDEMPOTENCY_KEY_IN_USE",
        "httpStatus": 409,
        "retryAfter": 2
      }
    }
  ],
  "data": null
}
```

For the same reason, GraphQL replays don't set the `Idempotent-Replayed` header.

#### Deduplicate order.paid events

After a payment, `OrdersService` emits an `order.paid` event, and the shipping service arranges a courier. In practice, events are delivered at least once. A publisher that retries after a timeout, or a broker (RabbitMQ, Kafka, NATS JetStream) that redelivers an unacknowledged message, can deliver the same event twice, and the customer gets two parcels.

Deduplicating events needs an id that's the same for every delivery of an event, so it's derived from the data rather than generated on each send. An order is paid once, so `OrdersService` uses `order-paid:` followed by the order id. Mark the [event handler](/microservices/basics#event-based) with `@Idempotent()`, and point `keyFrom` at that id:

```typescript
@@filename(shipping/shipping.controller)
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Idempotent } from '@nestjs/idempotency';
import { ShipmentsService } from './shipments.service.js';

export interface OrderPaidEvent {
  eventId: string;
  orderId: string;
}

@Controller()
export class ShippingController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @EventPattern('order.paid')
  @Idempotent({ required: true, keyFrom: { payload: 'eventId' } })
  async onOrderPaid(@Payload() event: OrderPaidEvent) {
    await this.shipmentsService.createFor(event.orderId);
  }
}
```

By default, microservice handlers read the key from the payload's `idempotencyKey` property, then from a transport header named by the `header` option. Here, `keyFrom` reads `eventId` instead, and `required: true` rejects events that don't have one.

The shipping service is a separate application, with its own database and its own `IdempotencyModule`, and it registers the same store class:

```typescript
@@filename(shipping/shipping.module)
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nestjs/drizzle';
import { IdempotencyModule } from '@nestjs/idempotency';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzleIdempotencyStore } from '../idempotency/drizzle-idempotency.store.js';
import { ShipmentsService } from './shipments.service.js';
import { ShippingController } from './shipping.controller.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL! }),
    }),
    IdempotencyModule.forRoot({
      ttl: '7d', // brokers can redeliver long after the first delivery
    }),
  ],
  controllers: [ShippingController],
  providers: [ShipmentsService, DrizzleIdempotencyStore],
})
export class ShippingModule {}
```

```typescript
@@filename(shipping/main)
import { NestFactory } from '@nestjs/core';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { ShippingModule } from './shipping.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ShippingModule, {
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 4001 },
  });
  await app.listen();
}
bootstrap();
```

A few details differ from the API:

- There's no `scope`, because event ids are unique across the whole system.
- `ttl` is 7 days, because a message can come back from a dead-letter queue long after it was first handled.
- Records belong to a handler: the record key ends with the handler's class and method, as in `order-paid%3Aord_1001:ShippingController.onOrderPaid`. Nest runs every handler registered for an event, so a second handler for `order.paid`, one that emails the tracking number, say, keeps its own records and still handles every event once.

A duplicate event is handled in one of two ways:

- If the first delivery has completed, the duplicate is skipped. The stored result is "replayed", and since events have no reply, nothing happens.
- If the first delivery is still running, the duplicate is rejected with `IDEMPOTENCY_KEY_IN_USE`, and Nest logs the error. With a transport that acknowledges messages, such as RabbitMQ or Kafka, don't acknowledge that delivery as processed. Let the transport redeliver it later, when it'll be skipped.

Either way, the courier is booked once. Retries of the HTTP payment don't produce duplicate events in the first place, because a replayed request never reaches `OrdersService`.

#### Tune TTLs and failure handling

The defaults are a starting point. This is the API's final configuration:

```typescript
@@filename(app.module)
IdempotencyModule.forRootAsync({
  useFactory: () => ({
    scope: (req: { user?: User }) => req.user?.id,
    encryption: {
      // Newest first: seal with the first key, open with any of them.
      keys: process.env.IDEMPOTENCY_KEYS!.split(','),
    },
    // Longer than the app keeps retrying a queued payment (24 hours).
    ttl: '48h',
    // A crashed instance blocks a key for at most 45 seconds. While a
    // charge runs, its lock is renewed every 15 seconds.
    lockTtl: '45s',
    // How long a client waits after a 409 before it asks again.
    retryAfter: '2s',
  }),
}),
```

Every duration takes milliseconds, or a string such as `'45s'`, `'48h'` or `'7d'`. A value that doesn't parse stops the app at startup, with an error that names the option.

- **`ttl`** (default: `'24h'`) is how long a completed result can be replayed. It must be longer than the longest time a client keeps retrying. The app queues payments made offline for up to a day, so it's 48 hours here. After `ttl`, the key is forgotten, and a retry runs the handler again. In this app, that ends in a 409 "already paid" error rather than a second charge, but the customer doesn't get the receipt.
- **`lockTtl`** (default: `'60s'`) is how long an in-flight lock survives after the instance running the handler crashes. While the handler runs, the interceptor renews the lock every `lockTtl / 3`, here every 15 seconds, so a charge that takes longer than 45 seconds still keeps it, and a retry gets a 409. Once renewals stop, the lock expires and a retry takes over the key. A shorter `lockTtl` frees keys sooner after a crash, but renews more often. If the store can't be reached to renew a lock, the interceptor logs a warning that the lock was lost.
- **`retryAfter`** (default: `'1s'`) is the value of the `Retry-After` header on a 409, in whole seconds. Card charges usually take a second or two, so the API asks clients to wait 2 seconds rather than check back after one.

`@Idempotent()` accepts `required`, `ttl`, `lockTtl`, `retryAfter`, `keyFrom`, `scope`, `fingerprint` and `storeIf`, which override the module's options for that handler. `fingerprint` selects what a retry must repeat, for example the body without a client timestamp; the method and the URL always count. The decorator also works on a controller or resolver class, where it covers the handlers that change state: GET routes and GraphQL queries are skipped unless they have their own `@Idempotent()`. A handler's own `@Idempotent()` is merged with the class's options, so a class-level `required: true` still applies to a handler that only sets `lockTtl`.

A `scope` function runs for every kind of handler, and what it receives depends on the handler: the request for HTTP and GraphQL, but the message payload for a microservice handler. In an app that serves both from one `IdempotencyModule`, pass `scope` an object instead, with one function per context under the `http`, `graphql` and `rpc` keys. Each function is typed for what its context passes in, and a context without one isn't scoped.

Not every outcome is stored. By default, anything below 500 is:

| Outcome                                                                     | Default                                                     | Why                                                        |
| --------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| 2xx                                                                         | Stored and replayed                                         | The payment succeeded                                      |
| 4xx `HttpException` (validation 400, declined 402, 404, 409 already paid)   | Stored, and thrown again on every replay                    | It's deterministic: the same request gets the same answer  |
| Another error with a 4xx `status` (`AuthorizationError`, 403)               | Stored as Nest's exception for that status, and replayed    | Its package turns it into that status                      |
| 5xx or an unknown error (payment provider 503, database down)                        | Not stored. The key is released, so a retry runs again      | Most failures happen before the side effect                |
| `StreamableFile`, streams, `@Res()` without `passthrough`                   | Not stored. The key is released, and a warning is logged    | They can't be replayed                                     |

A replayed error is rebuilt as a plain `HttpException` with the stored status and body, and it passes through your exception filters again. A filter that checks `instanceof` against a custom exception class sees the base class on a replay.

The `storeIf` option changes the rule. It receives the status and, when the handler threw, the error. For example, `storeIf: () => true` stores 5xx errors too, as Stripe does. That matters for the one gap the default leaves: a 5xx that happens **after** the side effect. If the payment provider charges the card and then `markPaid()` fails, the key is released, and the retry charges again. There are three ways to close the gap:

- Pass the payment provider a key derived from the user's id and the idempotency key. Most payment providers accept an idempotency key of their own, so the provider deduplicates the charge too. The idempotency key alone isn't enough, because two users can send the same one.
- Store 5xx errors for this handler with `storeIf`, and have the app start a new attempt after a 5xx. To store only the failure that follows a charge, throw a dedicated exception there and check for it: `storeIf: (status, error) => status < 500 || error instanceof ChargeCapturedError`.
- Write the payment and the event in one transaction, with a [transactional outbox](/reliability/outbox#prerequisites).

#### Try it

Start the shipping service, and the API with `DATABASE_URL` (migrations applied), `IDEMPOTENCY_KEYS` and the payment provider's sandbox configured. The sandbox takes about half a second to answer. The outputs below are trimmed to the relevant headers.

A payment without a key is refused:

```bash
$ curl -i localhost:3000/orders/ord_1001/pay \
    -H 'Authorization: Bearer alice-token' \
    --json '{"paymentMethod":"pm_card_visa"}'
HTTP/1.1 400 Bad Request

{"statusCode":400,"error":"Bad Request","code":"IDEMPOTENCY_KEY_REQUIRED","message":"An idempotency key is required for this operation."}
```

The first call with a key charges the card:

```bash
$ KEY=$(uuidgen)
$ curl -i localhost:3000/orders/ord_1001/pay \
    -H 'Authorization: Bearer alice-token' \
    -H "Idempotency-Key: $KEY" \
    --json '{"paymentMethod":"pm_card_visa"}'
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"orderId":"ord_1001","receiptId":"ch_0001","amount":4098,"cardLast4":"4242","paidAt":"2026-09-22T11:09:25.813Z"}
```

A retry with the same key gets the same receipt, down to `paidAt`, and the payment provider isn't called:

```bash
$ curl -i localhost:3000/orders/ord_1001/pay \
    -H 'Authorization: Bearer alice-token' \
    -H "Idempotency-Key: $KEY" \
    --json '{"paymentMethod":"pm_card_visa"}'
HTTP/1.1 201 Created
Idempotent-Replayed: true
Content-Type: application/json; charset=utf-8

{"orderId":"ord_1001","receiptId":"ch_0001","amount":4098,"cardLast4":"4242","paidAt":"2026-09-22T11:09:25.813Z"}
```

The same key with a different card is a client bug:

```bash
$ curl -i localhost:3000/orders/ord_1001/pay \
    -H 'Authorization: Bearer alice-token' \
    -H "Idempotency-Key: $KEY" \
    --json '{"paymentMethod":"pm_card_mastercard"}'
HTTP/1.1 422 Unprocessable Entity

{"statusCode":422,"error":"Unprocessable Entity","code":"IDEMPOTENCY_KEY_REUSED","message":"This idempotency key was already used for a different request."}
```

Finally, send two requests with a new key at the same time, for the other order. One is charged, and the other gets a 409 with `Retry-After: 2` while the payment provider is still working:

```bash
$ KEY=$(uuidgen)
$ for i in 1 2; do
  curl -s -o /dev/null -w '%{http_code} %header{retry-after}\n' \
    localhost:3000/orders/ord_1002/pay \
    -H 'Authorization: Bearer alice-token' \
    -H "Idempotency-Key: $KEY" \
    --json '{"paymentMethod":"pm_card_visa"}' &
done; wait
409 2
201
```

> info **Hint** `--json` needs curl 7.82 or later, and `%header` in `-w` needs curl 7.84 or later.

#### Testing

In end-to-end tests, keep the app's real configuration, but override the `DrizzleIdempotencyStore` provider with a plain `InMemoryIdempotencyStore`. A plain instance doesn't register itself, so the module falls back to its in-memory store, and since Nest never creates `DrizzleIdempotencyStore`, nothing queries the database (a node-postgres pool connects on the first query, so `DrizzleModule` opens no connection either). The encryption key still comes from `IDEMPOTENCY_KEYS`, so set it in the test environment, for example with `test.env` in `vitest.config.mts`.

Mock the payment provider with a small delay, so that two requests sent together overlap:

```typescript
@@filename(test/pay-order.e2e-spec)
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { InMemoryIdempotencyStore } from '@nestjs/idempotency';
import { Test } from '@nestjs/testing';
import { setTimeout } from 'node:timers/promises';
import { EMPTY } from 'rxjs';
import request from 'supertest';
import type { MockInstance } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { DrizzleIdempotencyStore } from '../src/idempotency/drizzle-idempotency.store.js';
import { SHIPPING_SERVICE } from '../src/orders/orders.service.js';
import { PaymentProviderClient } from '../src/payments/payment-provider.client.js';

describe('POST /orders/:id/pay', () => {
  let app: INestApplication;
  let charge: MockInstance<PaymentProviderClient['charge']>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DrizzleIdempotencyStore)
      .useValue(new InMemoryIdempotencyStore())
      .overrideProvider(SHIPPING_SERVICE)
      .useValue({ emit: () => EMPTY })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.listen(0, '127.0.0.1');

    charge = vi.spyOn(app.get(PaymentProviderClient), 'charge').mockImplementation(async (input) => {
      await setTimeout(100); // slow enough for duplicates to overlap
      return {
        id: 'ch_test',
        amount: input.amount,
        cardLast4: '4242',
        reference: input.reference,
        createdAt: new Date().toISOString(),
      };
    });
  });

  afterEach(() => app.close());

  const pay = (key: string) =>
    request(app.getHttpServer())
      .post('/orders/ord_1001/pay')
      .set('Authorization', 'Bearer alice-token')
      .set('Idempotency-Key', key)
      .send({ paymentMethod: 'pm_card_visa' });

  it('charges once when the app retries', async () => {
    const first = await pay('key-1').expect(201);
    const retry = await pay('key-1').expect(201).expect('Idempotent-Replayed', 'true');

    expect(retry.body).toEqual(first.body);
    expect(charge).toHaveBeenCalledTimes(1);
  });

  it('rejects a duplicate that arrives while the first is in flight', async () => {
    const [a, b] = await Promise.all([pay('key-2'), pay('key-2')]);

    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(charge).toHaveBeenCalledTimes(1);
  });
});
```

Once the app is initialized, `app.get(IdempotencyStorage).source` returns the store in use, here the in-memory one. Its `peek(key)` method returns the raw record under a record key such as `usr_alice:key-1` (`state`, `fingerprint` and `response`), for assertions such as "the declined payment was stored". Test your own store separately, with the contract suite from [Store keys in PostgreSQL](/reliability/idempotency#store-keys-in-postgresql), against a real server. To keep the Drizzle store in end-to-end tests instead, replace the database that `DrizzleModule` registered, with `overrideProvider(getDrizzleToken()).useValue(db)` (`getDrizzleToken` comes from `@nestjs/drizzle`), where `db` is a Drizzle database on PGlite migrated with your migrations. The example project tests encryption, GraphQL, events and tuning that way.

See [End-to-end testing](/fundamentals/testing#end-to-end-testing) for more about the testing setup.

#### Production checklist

- Register a shared store (your database, or Redis), even for a single instance: in-memory records are lost on every restart or deploy, and a retry after one runs the handler again. Run the contract suite against it with `concurrent` on. In production, the app refuses to start without one, unless `allowInMemoryStorage` is set. With Redis, configure `maxmemory-policy noeviction`. A record evicted early is a double charge waiting to happen, and since every idempotency record has a TTL, the `volatile-*` policies would evict them too.
- Set `required: true` on every endpoint that moves money or creates something a customer would notice twice.
- Set `scope` for every client-facing endpoint. Without it, one user's key can replay another user's response. The module logs a warning when a signed-in user calls a handler that has none.
- Keep the idempotency interceptor outside your other global interceptors. Global interceptors run in the order they were registered, and the `APP_INTERCEPTOR` providers of `AppModule` register before those of the modules it imports, so they run outside it and see every replay. The module warns about them at startup. It refuses to start when one of them is `ClassSerializerInterceptor`, because a replay would hand it a plain object and send the fields that `@Exclude()` hides. Register such interceptors with `app.useGlobalInterceptors()` in `main.ts`, or in a module imported after `IdempotencyModule`.
- With a database store, create its table through your migrations, size the connection pool for its statements, keep the instances' clocks in sync, and call `prune()` on a schedule.
- Keep `ttl` above the client's retry window. `lockTtl` only needs to cover a crash, since the lock is renewed while the handler runs.
- Watch the events. `IdempotencyEvents` is injectable, and its `events$` stream reports every replay, every rejection with its `code`, and every lost lock. The same events are published on the `nestjs:idempotency:replayed`, `nestjs:idempotency:rejected` and `nestjs:idempotency:lock-lost` diagnostics channels for tracing tools. Alert on `lock-lost`: it means the attempt's outcome isn't in the store, because renewals failed (the store was unreachable, or the event loop was blocked for longer than `lockTtl`) or because the store failed when the result was written, and a retry may run the handler again.
- Turn on `encryption` when responses contain personal or payment data, before the endpoint stores its first record. Keep the keys in a secret manager, rotate them in the three steps above, and never remove a key before `ttl` has passed.
- Pass the payment provider a key derived from the user's id and the idempotency key, to cover a failure after the charge.
- When several services share one Redis, give each one its own key prefix (the `idem:` in the store) or its own database. Record keys are only unique within one service: two services can each have a handler class with the same name, and a client could send one key to both.
- Keep the state check in the service, ideally as a conditional database update. An idempotency key deduplicates retries of one attempt, but two taps that create two keys are two attempts.
- Let browsers send the header. For cross-origin clients, add `Idempotency-Key` to the CORS `allowedHeaders`, and `Idempotent-Replayed` and `Retry-After` to `exposedHeaders`.
- Keep idempotent responses small. The whole response body is stored, and the package has no size limit yet.

#### The store contract

The tutorial wrote the store with Drizzle, with TypeORM, and for Redis. This section sums up what any `IdempotencyStore` must do, for writing one with another ORM. The package README's "Implementing a store" has every method in detail.

**Registration.** The store is an ordinary singleton provider that calls `registerSource(this)` on the injectable `IdempotencyStorage` in its constructor. The registry checks the shape at once, refuses a second registration unless it passes `replace: true`, and locks when `IdempotencyModule` initializes, logging the store in use. With nothing registered, the module uses `InMemoryIdempotencyStore`, which one instance can't share with another, and which loses its records on restart. With `NODE_ENV=production`, startup fails instead, unless you set `allowInMemoryStorage: true`, which accepts losing the records on every restart or deploy.

**The methods.** All four are atomic: each one decides who holds a key, and a read followed by a separate write lets two requests both run the handler, which is the double charge the package exists to prevent. None takes your transaction: an idempotency record is written on its own, never as part of your business transaction.

| Method | What it does | How it stays atomic |
| --- | --- | --- |
| `acquire(key, owner, fingerprint, lockTtl)` | Takes the lock on a free or expired key, or returns the record it found | One insert that takes over an expired row in the same statement, so of many concurrent callers exactly one wins; the others read the winner's record |
| `complete(key, owner, response, ttl)` | Turns the owner's live lock into a completed record | A compare-and-set: the owner and expiry checks are in the `WHERE` of the statement that writes |
| `release(key, owner)` | Deletes the owner's live lock, so a retry can run the handler | A compare-and-set, as `complete()` |
| `extend(key, owner, lockTtl)` | Renews the owner's live lock | A compare-and-set, as `complete()` |

**With Prisma.** The Drizzle and TypeORM stores are the model, with the same table:

- **`acquire()`** is one `INSERT ... ON CONFLICT (key_hash) DO UPDATE ... WHERE expires_at <= now RETURNING`. Prisma's `upsert()` has no condition on the update, so use `$queryRaw`. When no row comes back, read the record, as the other stores do.
- **`complete()`, `release()` and `extend()`** put the owner and the expiry in the `WHERE` and count the rows: `updateMany()` or `deleteMany()` with `keyHash`, `owner` and a `gt: now` filter on `expiresAt` in `where`, and `count === 1`. Not `update()` after a `findUnique()`: it reads first.
- **The response column** is `json` rather than `jsonb`, in any ORM: `jsonb` rejects a `\u0000` inside a string, and a response body can contain one.

**Test it** with the suite from `@nestjs/idempotency/testing`, as the Drizzle, TypeORM and Redis stores do. `idempotencyStoreContract()` returns cases for any test runner. `concurrent: true` races 16 callers for each key; run it against PostgreSQL with a connection pool, where the calls really overlap. `advanceTime` moves the store's clock for the expiry cases, and without it they wait in real time.

#### Reference

##### Module options

`IdempotencyModule.forRoot()` takes these options. `forRootAsync()` takes `isGlobal` and `imports` at the top level, next to `useFactory`, `useClass` or `useExisting`, and the factory returns the rest. Every option except `header`, `replayHeaders`, `encryption`, `allowInMemoryStorage` and `isGlobal` can also be set per class or handler in `@Idempotent()`, where it is merged field by field over the module's.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `required` | `boolean` | `false` | Rejects calls without a key with `IDEMPOTENCY_KEY_REQUIRED`. See [Make the payment endpoint idempotent](/reliability/idempotency#make-the-payment-endpoint-idempotent). |
| `scope` | function, object or `false` | none | The key namespace, such as the user id. An object has one function per context, under `http`, `graphql` and `rpc`. `false` shares one namespace on purpose. |
| `ttl` | `Duration` | `'24h'` | How long a completed result is replayed. See [Tune TTLs and failure handling](/reliability/idempotency#tune-ttls-and-failure-handling). |
| `lockTtl` | `Duration` | `'60s'` | How long an in-flight lock survives after renewals stop. The lock is renewed every `lockTtl / 3`. |
| `retryAfter` | `Duration` | `'1s'` | The wait sent with `IDEMPOTENCY_KEY_IN_USE`, in whole seconds, rounded up. |
| `keyFrom` | source, or one source per context | see below | Where the key comes from: `header`, `arg` (GraphQL), `payload` (microservices) or a function of the `ExecutionContext`. |
| `fingerprint` | `(payload, context) => unknown` | the whole payload | What a retry must repeat. The method and URL, GraphQL field or message pattern, and the scope always count. |
| `storeIf` | `(status, error) => boolean` | `status < 500` | Which outcomes are stored and replayed. Others release the key. |
| `header` | `string` | `'Idempotency-Key'` | The HTTP header, also read by GraphQL, and the transport header name for microservices. |
| `replayHeaders` | `string[]` | none | Response headers replayed in addition to `Location`, `Content-Type`, `Content-Language`, `Content-Location`, `ETag` and `Last-Modified`. `Set-Cookie` and headers the platform writes for every response are refused at startup. |
| `encryption` | an object with `keys` | off | AES-256-GCM encryption of stored records. `keys` lists 32-byte `Buffer`s or strings of at least 32 characters, newest first. See [Encrypt stored receipts](/reliability/idempotency#encrypt-stored-receipts). |
| `allowInMemoryStorage` | `boolean` | `false` | Lets a production app start without a registered store. |
| `isGlobal` | `boolean` | `true` | Registers the module globally. |

Every duration takes milliseconds or a string such as `'45s'`, `'48h'` or `'7d'`.

The key comes from these sources by default:

| Context | Default source |
| --- | --- |
| HTTP | The `Idempotency-Key` header (the `header` option) |
| GraphQL | The mutation's `idempotencyKey` argument, then the header |
| Microservices | The payload's `idempotencyKey` property, then the transport header named by `header` |

A key is 1 to 255 printable ASCII characters. A number in a payload counts as its digits.

##### Events

`IdempotencyEvents.events$` emits every event, and each is also published on a diagnostics channel. Every payload has `type`, `context` (`'http'`, `'graphql'` or `'rpc'`), `handler` (such as `OrdersController.pay`), `key` and, when there is one, `scope`.

| Type | Channel | Payload type | Other fields | When |
| --- | --- | --- | --- | --- |
| `replayed` | `nestjs:idempotency:replayed` | `IdempotencyReplayedEvent` | `status` | A retry got the stored result, or a duplicate event was skipped |
| `rejected` | `nestjs:idempotency:rejected` | `IdempotencyRejectedEvent` | `code`, `status` | A call was refused before its handler ran. There is no `key` for `IDEMPOTENCY_KEY_REQUIRED` and `IDEMPOTENCY_KEY_INVALID`. |
| `lock-lost` | `nestjs:idempotency:lock-lost` | `IdempotencyLockLostEvent` | `phase` (`'extend'`, `'complete'` or `'release'`) | The attempt's outcome isn't in the store, so a retry may run the handler again |

`IdempotencyEvent` is the union of the three payload types.

##### Errors

Rejections carry one of these codes, typed as `IdempotencyErrorCode`. Over HTTP, the code is in the response body. In GraphQL, it's in the field error's `extensions`, with `httpStatus` and, for a 409, `retryAfter`. On microservices, the `RpcException` payload has `status`, `code`, `statusCode`, `message` and, for a 409, `retryAfter`.

| Code | Status | Message | Cause |
| --- | --- | --- | --- |
| `IDEMPOTENCY_KEY_REQUIRED` | 400 | An idempotency key is required for this operation. | No key, with `required: true` |
| `IDEMPOTENCY_KEY_INVALID` | 400 | The idempotency key must be 1 to 255 printable ASCII characters. | A key that is too long, has other characters, or isn't a string or number |
| `IDEMPOTENCY_KEY_IN_USE` | 409, with `Retry-After` | A request with this idempotency key is still being processed. | The first call with the key is still running |
| `IDEMPOTENCY_KEY_REUSED` | 422 | This idempotency key was already used for a different request. | The same key with a different fingerprint |
| `IDEMPOTENCY_RECORD_UNREADABLE` | 500 | The stored result for this idempotency key could not be read. | The stored record fails to decrypt, for example because its key was removed |
