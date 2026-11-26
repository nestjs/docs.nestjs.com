### Accept payments with webhooks in Node.js

Accept payments in Node.js with NestJS: payment provider webhooks such as Stripe's, signature checks, idempotency keys, events applied exactly once.

It adds payments to an e-commerce backend: the API creates a payment for each order at a payment provider, and an order becomes paid when the provider's signed webhook says so, never because the browser came back from the payment page. It continues [Build an e-commerce backend](/tutorials/ecommerce-backend). Taking the money is the provider's job. The API's job is to ask for it once, to believe only what the provider signed, and to apply each of the provider's events exactly once, whatever order they arrive in and however often.

By the end, the API will:

- Create one payment per order at the provider, through a typed client on [`@nestjs/http-client`](/application/http-client), with the order's id as the provider's idempotency key, so a retry or a second click never creates a second payment.
- Receive the provider's webhooks with [`@nestjs/webhooks`](/http/webhooks): verified on the raw body, deduplicated by event id, and recorded in the same transaction as the change they make.
- Move an order from `placed` to `paid` with one conditional update, so a replayed, late or out-of-order event changes nothing, and a payment never brings a cancelled order back.
- Cancel the order and put its stock back when a payment fails, with the e-commerce tutorial's cancel logic.
- Announce `order.paid` only once the payment's transaction has committed, through the [transactional outbox](/reliability/outbox).
- Prove it in tests that sign webhooks the way the provider does, against PostgreSQL.

**What is simulated.** There is no real payment provider here, and nothing on this page charges a card. The provider is fictional: its API is shaped like Stripe's (a `POST` with a bearer key and an `Idempotency-Key` header), and its webhooks follow [Standard Webhooks](https://www.standardwebhooks.com), the scheme many providers use. When you try the API, a small script stands in for the provider, and the tests sign the provider's requests themselves. [Switch to a real provider](/tutorials/payments-webhooks#switch-to-a-real-provider) lists what changes for one.

These are the endpoints, and the section that adds each one:

| Endpoint | Section |
| --- | --- |
| The e-commerce tutorial's: `/auth/*`, `/me`, `/health/*`, `/products`, `/cart` and `/orders` | [Start from the e-commerce backend](/tutorials/payments-webhooks#start-from-the-e-commerce-backend) |
| `POST /orders/:id/payment` | [Create the payment](/tutorials/payments-webhooks#create-the-payment) |
| `POST /webhooks/payments` | [Receive the provider's webhooks](/tutorials/payments-webhooks#receive-the-providers-webhooks) |

> info **Hint** The finished application is on GitHub as [nestjs/example-payments-webhooks](https://github.com/nestjs/example-payments-webhooks), with its tests and a CI workflow.

#### Start from the e-commerce backend

Start from the finished application of [Build an e-commerce backend](/tutorials/ecommerce-backend), all of it: `src/`, `test/`, the `drizzle/` folder with its migration, and its database. This tutorial changes a few of its files and adds a second migration. Install the three packages it adds:

```bash
$ npm i --save @nestjs/webhooks @nestjs/outbox @nestjs/http-client
```

- `@nestjs/webhooks` verifies the provider's webhooks and skips the ones it has already processed.
- `@nestjs/outbox` keeps the list of processed webhooks (its **inbox**), in your database, and sends `order.paid` after the commit. `@nestjs/webhooks` needs it for the inbox even in an application that sends no webhooks.
- `@nestjs/http-client` calls the provider's API.

The provider gives you three things: the URL of its API, an API key, and a webhook signing secret, which Standard Webhooks writes as `whsec_` followed by base64. The fake provider of [Try it](/tutorials/payments-webhooks#try-it) takes any key, and a secret you generate. Add them to `.env`:

```bash
PAYMENTS_API_URL=http://localhost:4000
PAYMENTS_API_KEY=sk_test_anything
# From the provider's dashboard. For the fake provider: echo "whsec_$(openssl rand -base64 32)"
PAYMENTS_WEBHOOK_SECRET=
```

The configuration schema checks them at startup, so a missing secret stops the application rather than failing every webhook:

```typescript
@@filename(src/config)
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.url(),
  // Signs the access tokens: at least 32 bytes.
  JWT_SECRET: z.string().min(32),
  // The browser origins allowed to call the API, comma-separated. None by default.
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
    .pipe(z.array(z.url())),
  // The payment provider's API, and the key it gave you.
  PAYMENTS_API_URL: z.url(),
  PAYMENTS_API_KEY: z.string().min(1),
  // Verifies the provider's webhooks: whsec_ and base64, from the provider's dashboard.
  PAYMENTS_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  // "off" in tests, which run the outbox relay themselves.
  OUTBOX_RELAY: z.enum(['on', 'off']).default('on'),
});

export type Env = z.infer<typeof envSchema>;
```

`OUTBOX_RELAY` lets the tests run the outbox's relay themselves, as [Test it](/tutorials/payments-webhooks#test-it) does.

#### Record payments on orders

An order gains a status, `paid`, between `placed` and `shipped`, and the provider's id for the payment that paid it. In `src/database/schema.ts`, the `orders` table becomes:

```typescript
@@filename(src/database/schema)
// ...
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    // placed, then paid and shipped, or cancelled.
    status: text('status', { enum: ['placed', 'paid', 'shipped', 'cancelled'] }).notNull(),
    total: integer('total').notNull(),
    // The provider's id for the payment, set when it succeeds.
    paymentId: text('payment_id'),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  (table) => [index('orders_user_id_created_at_idx').on(table.userId, table.createdAt)],
);
// ...
```

The status is a `text` column whose values Drizzle types, so the new status needs no change in the database. Generate the migration, which adds the `payment_id` column, and apply it:

```bash
$ npx drizzle-kit generate --name=payments
$ npx drizzle-kit migrate
```

The services below hand Drizzle's transaction to each other, so give its type a name:

```typescript
@@filename(src/database/drizzle)
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/** What `db.transaction()` hands its callback. */
export type Transaction = Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];
```

#### Create the payment

The provider's API has one call this shop needs: create a payment for an amount, which returns the payment's id and the provider's payment page, where the customer enters their card. The shop never sees the card. The types of what the provider sends, in its API responses and in its webhooks:

```typescript
@@filename(src/payments/payment)
/** A payment, as the provider's API returns it. */
export interface Payment {
  id: string;
  /** In cents. */
  amount: number;
  currency: string;
  /** What the payment is for: the order's id. */
  reference: string;
  status: 'requires_payment' | 'succeeded' | 'failed';
  /** The provider's payment page, where the customer pays. */
  checkoutUrl: string;
}

/** The provider's webhook body: Standard Webhooks' `type`, `timestamp` and `data`. */
export interface PaymentEvent {
  type: 'payment.succeeded' | 'payment.failed';
  timestamp: string;
  data: Payment;
}
```

The client is a small class around an [`HttpClient`](/application/http-client) of its own, named `payments`:

```typescript
@@filename(src/payments/payments.client)
import { Injectable } from '@nestjs/common';
import { HttpClient, InjectHttpClient, toHttpException } from '@nestjs/http-client';
import type { Order } from '../database/schema.js';
import type { Payment } from './payment.js';

/** The payment provider's API: the one call this shop makes. */
@Injectable()
export class PaymentsClient {
  constructor(@InjectHttpClient('payments') private readonly http: HttpClient) {}

  /** The order's payment. Called again for the same order, it returns the same payment. */
  async createPayment(order: Pick<Order, 'id' | 'total'>): Promise<Payment> {
    try {
      const { data } = await this.http.post<Payment>('/v1/payments', {
        json: { amount: order.total, currency: 'usd', reference: order.id },
        // One key per order: a retry, or a second click, can't create a second payment.
        headers: { 'idempotency-key': order.id },
        // POST isn't retried by default; with the key, retrying is safe.
        retry: { methods: ['POST'] },
      });
      return data;
    } catch (error) {
      // 502 when the provider fails, 504 when it doesn't answer in time.
      throw toHttpException(error);
    }
  }
}
```

- **The idempotency key is the order's id.** A timeout after the provider created the payment looks like a failure, so the client retries, and the customer may click "Pay" twice. With the same key, the provider returns the payment it already created instead of creating another. One order, one payment.
- **The `POST` is retried.** The HTTP client doesn't retry `POST` by default, since repeating one could charge twice (see [Retries](/application/http-client#retries)). The key makes it safe, so this request opts in.
- **Errors become 502 or 504.** `toHttpException()` turns a failing provider into a `502 Bad Gateway` and a slow one into a `504 Gateway Timeout`, and logs it, instead of a `500` (see [Handling errors](/application/http-client#handling-errors)).
- **`data` isn't validated.** The type argument describes the response; nothing checks it at runtime. That's acceptable for a provider's documented API, which you call with your own key.

The service checks that the order is the customer's and still `placed`, then asks the provider:

```typescript
@@filename(src/payments/payments.service)
import { ConflictException, Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service.js';
import { PaymentsClient } from './payments.client.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly paymentsClient: PaymentsClient,
  ) {}

  /** Starts paying for the user's order: where to send the customer to pay. */
  async start(userId: string, orderId: string) {
    const order = await this.ordersService.findOne(userId, orderId);
    if (order.status !== 'placed') {
      throw new ConflictException(`Order is ${order.status}`);
    }
    // Outside any transaction: no database connection waits on the provider.
    const payment = await this.paymentsClient.createPayment(order);
    return { paymentId: payment.id, checkoutUrl: payment.checkoutUrl };
  }
}
```

The call to the provider happens outside any database transaction. A transaction that waited on another company's API would hold a connection of the pool, and its row locks, for as long as the provider takes. The read and the call aren't atomic: a customer can cancel the order between them. That's harmless here, because the payment can only change the order through the webhook, which checks the status again, in the statement that changes it.

```typescript
@@filename(src/payments/payments.controller)
import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import { PaymentsService } from './payments.service.js';

const orderId = { schema: z.uuid() };

@Controller('orders')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // The same order always gets the same payment, so this answers 200, new or not.
  @Can.Anyone()
  @Post(':id/payment')
  @HttpCode(200)
  start(@CurrentUser('id') userId: string, @Param('id', orderId) id: string) {
    return this.paymentsService.start(userId, id);
  }
}
```

The payments module registers the client, with the API's URL, the key as a bearer token, and a timeout per attempt. It imports `OrdersModule`, so add `exports: [OrdersService]` to that module (its final version is in [Announce paid orders after the commit](/tutorials/payments-webhooks#announce-paid-orders-after-the-commit)):

```typescript
@@filename(src/payments/payments.module)
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientModule } from '@nestjs/http-client';
import type { Env } from '../config.js';
import { OrdersModule } from '../orders/orders.module.js';
import { PaymentWebhooksController } from './payment-webhooks.controller.js';
import { PaymentsClient } from './payments.client.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

@Module({
  imports: [
    OrdersModule,
    HttpClientModule.registerAsync({
      name: 'payments',
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        baseUrl: config.get('PAYMENTS_API_URL', { infer: true }),
        headers: { authorization: `Bearer ${config.get('PAYMENTS_API_KEY', { infer: true })}` },
        timeout: '10s',
      }),
    }),
  ],
  controllers: [PaymentsController, PaymentWebhooksController],
  providers: [PaymentsClient, PaymentsService],
})
export class PaymentsModule {}
```

The provider's key makes its retries safe. Your own `POST /orders/:id/payment` is safe to retry too, since a second call returns the same payment. A route whose second call would do something again, such as one that charges a saved card directly, needs idempotency keys of its own, sent by the client: [`@nestjs/idempotency`](/reliability/idempotency) runs the handler once per `Idempotency-Key` and answers retries with the stored response. It ships the contract for its store, not a store, so in production you write one on your database, as [Store keys in PostgreSQL](/reliability/idempotency#store-keys-in-postgresql) shows.

#### Receive the provider's webhooks

When the customer has paid, or the card was declined, the provider sends a webhook: a signed `POST` to a URL you register in its dashboard, here `https://<your API>/webhooks/payments`. The signature is an HMAC of the event's id, a timestamp and the body, with the shared secret. Checking it needs the body exactly as it was signed, not the object the body parser made of it, so create the application with `rawBody: true` (see [Raw body](/faq/raw-body)):

```typescript
@@filename(src/main)
// ...
const app = await NestFactory.create<NestNodeApplication>(AppModule, new NodeAdapter(), {
  instrument: ObserveInstrument,
  // Webhooks are verified on the bytes the provider signed, not on a re-serialized body.
  rawBody: true,
  logger: new ConsoleLogger({
    // ...
  }),
});
// ...
```

The root module registers the outbox, its store, and the webhooks module with the provider as a **receiver**:

```typescript
@@filename(src/app.module)
import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';
import { createObserveModule } from '@nestjs/observe';
import { OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { fromDrizzle, PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { WebhooksModule } from '@nestjs/webhooks';
import { ThrottlerGuard, ThrottlerModule, minutes, normalizeIp } from '@nestjs/throttler';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { accountEmail } from './auth/account-email.js';
import { AuthModule } from './auth/auth.module.js';
import { envSchema, type Env } from './config.js';
import { CartModule } from './cart/cart.module.js';
import { HealthModule } from './health/health.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { ProductsModule } from './products/products.module.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'shop-api',
    }),
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        drizzle,
        connection: config.get('DATABASE_URL', { infer: true }),
      }),
    }),
    AuthenticationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        accessToken: {
          key: config.get('JWT_SECRET', { infer: true }),
          issuer: 'shop-api',
          audience: 'shop-api',
          ttl: '15m',
        },
        refreshToken: { ttl: '30d', absoluteTtl: '90d' },
      }),
    }),
    // After AuthenticationModule: its guard reads the user that authentication sets.
    AuthorizationModule.forRoot(),
    ThrottlerModule.forRoot([
      // Per IP address, on every route.
      { name: 'default', ttl: minutes(1), limit: 100 },
      // Per email and IP address, wherever the request body names an account.
      {
        name: 'account',
        ttl: minutes(15),
        limit: 5,
        skipIf: (context) => !accountEmail(context.switchToHttp().getRequest()),
        getTracker: (req) => `${accountEmail(req)}|${normalizeIp(req.ip)}`,
      },
    ]),
    // Runs order.paid after the commit, and keeps the inbox that deduplicates webhooks.
    OutboxModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        relay: { enabled: config.get('OUTBOX_RELAY', { infer: true }) === 'on', pollInterval: '1s' },
      }),
    }),
    // Receives webhooks only: this shop sends none, so it needs no webhook store.
    WebhooksModule.forRootAsync({
      outgoing: false,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        receivers: {
          // The provider follows Standard Webhooks: webhook-id, webhook-timestamp, webhook-signature.
          payments: { scheme: 'standard', secret: config.get('PAYMENTS_WEBHOOK_SECRET', { infer: true }) },
        },
      }),
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      // Outbox messages and the inbox, in the shop's database, in a schema of their own (nest_outbox).
      provide: PostgresOutboxStore,
      inject: [getDrizzleToken(), OutboxStorage],
      useFactory: (db: NodePgDatabase, outboxStorage: OutboxStorage) =>
        new PostgresOutboxStore({ executor: fromDrizzle(db) }, outboxStorage),
    },
  ],
})
export class AppModule {}
```

- **`outgoing: false`.** `@nestjs/webhooks` also sends webhooks, with endpoints, deliveries and a store for them. This shop only receives them, so it needs none of that.
- **The receiver's name**, `payments`, is what the route's decorator names. `scheme: 'standard'` checks the three `webhook-` headers, the signature in constant time, and that the signed timestamp is within five minutes of now, which stops a captured request from being replayed later.
- **`PostgresOutboxStore`** keeps the inbox, and the outbox's messages, in the shop's database, in a schema of its own, `nest_outbox`, which it creates and migrates itself when the application starts in development and in tests. Your migrations don't create its tables (see [Keep messages in your database](/reliability/outbox#keep-messages-in-your-database)).

The controller:

```typescript
@@filename(src/payments/payment-webhooks.controller)
import { Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { InjectDrizzle } from '@nestjs/drizzle';
import { ApiSecurity } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { IncomingWebhook, VerifyWebhook } from '@nestjs/webhooks';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { z } from 'zod';
import { OrdersService } from '../orders/orders.service.js';
import type { PaymentEvent } from './payment.js';

const orderId = z.uuid();

// The signature authenticates the provider, not a token. And a provider
// delivers in bursts, from a few addresses: the per-IP limit would refuse them.
@Public()
@ApiSecurity({})
@SkipThrottle()
@Controller('webhooks/payments')
export class PaymentWebhooksController {
  private readonly logger = new Logger(PaymentWebhooksController.name);

  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  @HttpCode(200)
  @VerifyWebhook('payments')
  async receive(@IncomingWebhook() webhook: IncomingWebhook<PaymentEvent>) {
    const { type, data: payment } = webhook.payload;
    if (!orderId.safeParse(payment.reference).success) {
      // Not a payment this shop created: answered 200, so the provider doesn't retry it.
      this.logger.warn(`Ignoring ${type} for ${payment.id}: its reference isn't an order id`);
      return;
    }
    // The event's id is recorded in the inbox in the same transaction as the order's
    // new status: a redelivery, even one racing this request, changes nothing.
    await this.db.transaction(async (tx) =>
      webhook.processInTransaction(tx, () => {
        switch (type) {
          case 'payment.succeeded':
            return this.ordersService.markPaid(tx, payment);
          case 'payment.failed':
            return this.ordersService.cancelUnpaid(tx, payment.reference);
          default:
            // Other types are recorded, and change nothing.
            return undefined;
        }
      }),
    );
  }
}
```

- **`@VerifyWebhook('payments')`** runs before the handler. A request whose signature doesn't match one made with the secret gets a `401`, and the handler never runs. The answer doesn't say what was wrong: a forger learns nothing from it.
- **`@Public()` and `@SkipThrottle()`.** The JWT tutorial's global guard would ask the provider for a token, and its per-IP limit would refuse a burst of deliveries. The signature is the authentication.
- **`processInTransaction()`** is the deduplication by event id. It records the webhook's id in the inbox through `tx`, then runs the callback only if the id is new. The record and the order's change commit together, or roll back together. A redelivery, even one that arrives on another instance while the first is still running, finds the id and changes nothing; the controller still answers `200`, so the provider stops retrying.
- **`@HttpCode(200)`.** The provider retries anything but a `2xx`, for days. A handler that throws rolls the transaction back, the record with it, and the provider's retry gets another chance.
- **Events that aren't about an order are answered too.** A payment whose `reference` isn't an order id (another application on the same provider account, say) is logged and answered `200`; passed on, it would fail the `uuid` comparison with a `500`, retried for days. An event type the switch doesn't know is recorded, and changes nothing.

#### Mark orders paid exactly once

The inbox catches a redelivery of the same event. It can't catch two different events about one order: a `payment.succeeded` that arrives after the customer cancelled, a `payment.failed` from an earlier attempt that arrives after the success, a provider that sends a second event for the same payment. So the order's change is a conditional update too, as every status change in the e-commerce tutorial is. In `OrdersService`, `cancel()` and `ship()` change, `markPaid()`, `cancelUnpaid()`, `cancelPlaced()` and `explainUnpaid()` are new, and the 409 of `refuse()` now names any status, as in `Order is placed`; `checkout()`, `findMine()`, `findOne()` and `items()` stay as they are:

```typescript
@@filename(src/orders/orders.service)
import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { Outbox } from '@nestjs/outbox';
import { and, asc, desc, eq, gte, sql, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Transaction } from '../database/drizzle.js';
import { cartItems, orderItems, orders, products, type Order, type OrderItem } from '../database/schema.js';
import type { Payment } from '../payments/payment.js';

export type OrderWithItems = Order & { items: Omit<OrderItem, 'orderId'>[] };

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly outbox: Outbox<Transaction>,
  ) {}

  // ...

  /** The owner cancels an order that isn't paid yet, and its stock goes back. */
  cancel(userId: string, id: string): Promise<Order> {
    return this.db.transaction(async (tx) => {
      const order = await this.cancelPlaced(tx, and(eq(orders.id, id), eq(orders.userId, userId)));
      return order ?? this.refuse(tx, id, userId);
    });
  }

  /** The provider confirmed the payment. Runs in the webhook's transaction. */
  async markPaid(tx: Transaction, payment: Payment): Promise<Order | undefined> {
    // Conditional: only a placed order, for the amount it totals, becomes paid.
    // A replayed event, or one for a cancelled order, changes nothing.
    const [order] = await tx
      .update(orders)
      .set({ status: 'paid', paymentId: payment.id })
      .where(and(eq(orders.id, payment.reference), eq(orders.status, 'placed'), eq(orders.total, payment.amount)))
      .returning();
    if (!order) {
      await this.explainUnpaid(tx, payment);
      return undefined;
    }
    // Commits with the new status, or not at all: nothing hears of a payment that rolled back.
    await this.outbox.add(tx, {
      topic: 'order.paid',
      key: order.id,
      payload: { orderId: order.id, userId: order.userId, total: order.total, paymentId: payment.id },
    });
    return order;
  }

  /** The provider says the payment failed: the order is cancelled and its stock goes back. */
  cancelUnpaid(tx: Transaction, orderId: string): Promise<Order | undefined> {
    return this.cancelPlaced(tx, eq(orders.id, orderId));
  }

  /** Staff ship a paid order. */
  async ship(id: string): Promise<Order> {
    const [order] = await this.db
      .update(orders)
      .set({ status: 'shipped' })
      .where(and(eq(orders.id, id), eq(orders.status, 'paid')))
      .returning();
    return order ?? this.refuse(this.db, id);
  }

  /** Cancels the order if it's still placed, and puts its stock back, in the caller's transaction. */
  private async cancelPlaced(tx: Transaction, where: SQL | undefined): Promise<Order | undefined> {
    // Conditional: of a cancel and a payment racing for the same order, one wins.
    const [order] = await tx
      .update(orders)
      .set({ status: 'cancelled' })
      .where(and(where, eq(orders.status, 'placed')))
      .returning();
    if (!order) {
      return undefined;
    }
    for (const { productId, quantity } of await this.items(tx, order.id)) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${quantity}` })
        .where(eq(products.id, productId));
    }
    return order;
  }

  /** Logs why a payment changed nothing, unless it's a second event for the same payment. */
  private async explainUnpaid(tx: Transaction, payment: Payment): Promise<void> {
    const [order] = await tx
      .select({ status: orders.status, total: orders.total, paymentId: orders.paymentId })
      .from(orders)
      .where(eq(orders.id, payment.reference));
    if (order?.paymentId === payment.id) {
      return;
    }
    // A payment for a cancelled order, or for the wrong amount: the money has to go back.
    this.logger.warn(
      `Payment ${payment.id} of ${payment.amount} for order ${payment.reference} changed nothing ` +
        `(order ${order ? `${order.status}, total ${order.total}` : 'not found'}): refund it`,
    );
  }

  // ...

  /** Why a conditional update changed nothing: 404 if the order isn't there (or isn't theirs), 409 otherwise. */
  private async refuse(db: Pick<NodePgDatabase, 'select'>, id: string, userId?: string): Promise<never> {
    const [order] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(and(eq(orders.id, id), userId ? eq(orders.userId, userId) : undefined));
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    throw new ConflictException(`Order is ${order.status}`);
  }
}
```

- **`markPaid()` is one `UPDATE`**, whose `WHERE` clause requires the order to be `placed` and the payment to be for its total. A cancelled order stays cancelled, a paid one stays paid, and a payment for the wrong amount pays nothing. There's no read before it, so there's no window in which a cancel could slip in between a check and the write.
- **A customer's cancel and the provider's payment race on the same row**, both conditional on `placed`. PostgreSQL locks the row for the first `UPDATE`; the second waits, then finds the order no longer `placed`, and changes nothing. Exactly one wins, and the stock goes back only if the cancel did.
- **A payment that changed nothing isn't an error.** The handler returns normally, the event is recorded, and the provider gets its `200`. A `409` would make the provider retry for days an event that can never apply. The money did move, though: `explainUnpaid()` logs a warning to refund it, unless the order is already paid by this same payment.
- **`payment.failed` cancels the order** with the e-commerce tutorial's cancel logic, now in `cancelPlaced()`, which both the customer's cancel and the webhook run in their own transaction: the order is cancelled only while it's `placed`, and its stock goes back in the same transaction. The customer's cart is gone since checkout, so they check out again to retry.
- **Customers cancel only orders that aren't paid.** Cancelling a paid order means a refund through the provider, which this tutorial leaves out. And staff now ship only `paid` orders: shipping a `placed` one is a 409, `Order is placed`.

#### Announce paid orders after the commit

Other parts of the shop react to a payment: a confirmation email, the warehouse, the accounting. Sending those from the webhook's handler has the problem the [outbox chapter](/reliability/outbox) describes: sent before the commit, they announce a payment whose transaction might still roll back; sent after it, they're lost when the process dies in between. `markPaid()` adds an `order.paid` message to the outbox through `tx`, so the message commits with the order's new status, and the relay delivers it after the commit, with retries. The handler for it, a stand-in for the confirmation email:

```typescript
@@filename(src/orders/order-paid.handler)
import { Injectable, Logger } from '@nestjs/common';
import { OnOutboxMessage } from '@nestjs/outbox';

export interface OrderPaid {
  orderId: string;
  userId: string;
  total: number;
  paymentId: string;
}

/** Runs after the payment's transaction commits: a stand-in for the confirmation email. */
@Injectable()
export class OrderPaidHandler {
  private readonly logger = new Logger(OrderPaidHandler.name);

  // The consumer's inbox skips a message it has already handled.
  @OnOutboxMessage('order.paid', { consumer: 'order-paid-confirmation' })
  confirm({ orderId, total }: OrderPaid) {
    this.logger.log(`Order ${orderId} paid (${total} cents): sending the confirmation`);
  }
}
```

Its `consumer` has an inbox of its own, so a message the relay delivers twice is handled once (see [Handle order.placed in-process](/reliability/outbox#handle-orderplaced-in-process)). The handler is discovered on providers, so `OrdersModule` registers it, and exports `OrdersService` for the payments module:

```typescript
@@filename(src/orders/orders.module)
import { Module } from '@nestjs/common';
import { OrderPaidHandler } from './order-paid.handler.js';
import { OrderPolicy } from './order.policy.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrderPolicy, OrderPaidHandler],
  exports: [OrdersService],
})
export class OrdersModule {}
```

#### Try it

The fake provider is a script, `scripts/fake-payments-provider.ts`. It creates payments, once per idempotency key, keeps them in memory, and plays the provider's payment page: a `POST` to a payment's `checkoutUrl` is the customer paying, and `?outcome=failed` is a declined card. Then it signs the event the way Standard Webhooks specifies, with the same secret, and posts it to the shop. It can also deliver an event again, with the same id, as a provider does when it didn't get a `2xx` in time:

```typescript
@@filename(scripts/fake-payments-provider)
/**
 * A stand-in for the payment provider, for trying the shop on your machine. It is not a
 * provider: it charges nothing, and it keeps its payments in memory.
 *
 *   POST /v1/payments                          creates a payment, once per Idempotency-Key
 *   POST /checkout/:paymentId?outcome=failed   the customer pays (or the card is declined)
 *   POST /events/:eventId/resend               delivers an event again, with the same id
 *
 * Its webhooks are signed the way Standard Webhooks specifies, with PAYMENTS_WEBHOOK_SECRET,
 * and posted to WEBHOOK_URL (default http://localhost:3000/webhooks/payments).
 */
import { createHmac, randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

const port = Number(process.env.PROVIDER_PORT ?? 4000);
const webhookUrl = process.env.WEBHOOK_URL ?? 'http://localhost:3000/webhooks/payments';
const secret = process.env.PAYMENTS_WEBHOOK_SECRET ?? '';
if (!secret.startsWith('whsec_')) {
  throw new Error('Set PAYMENTS_WEBHOOK_SECRET to the secret the shop was started with');
}
// The key is the base64 after the whsec_ prefix.
const key = Buffer.from(secret.slice('whsec_'.length), 'base64');

const payments = new Map<string, Record<string, unknown>>(); // by idempotency key
const events = new Map<string, string>(); // event id to body

/** Signs and posts an event, as the provider would: HMAC-SHA256 of `id.timestamp.body`. */
async function deliver(id: string, body: string): Promise<number> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'webhook-id': id,
      'webhook-timestamp': String(timestamp),
      'webhook-signature': `v1,${signature}`,
    },
    body,
  });
  return response.status;
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<[number, unknown]> {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  const [, first, id, action] = url.pathname.split('/');

  if (req.method === 'POST' && url.pathname === '/v1/payments') {
    const idempotencyKey = req.headers['idempotency-key'];
    if (typeof idempotencyKey !== 'string' || !req.headers.authorization?.startsWith('Bearer ')) {
      return [400, { error: 'An API key and an Idempotency-Key are required' }];
    }
    let body = '';
    for await (const chunk of req) body += chunk;
    // The same key returns the payment it created the first time.
    if (!payments.has(idempotencyKey)) {
      const paymentId = `pay_${randomUUID().slice(0, 8)}`;
      const checkoutUrl = `http://localhost:${port}/checkout/${paymentId}`;
      payments.set(idempotencyKey, { id: paymentId, ...JSON.parse(body), status: 'requires_payment', checkoutUrl });
    }
    return [200, payments.get(idempotencyKey)];
  }

  if (req.method === 'POST' && first === 'checkout') {
    const payment = [...payments.values()].find((p) => p.id === id);
    if (!payment) {
      return [404, { error: 'No such payment' }];
    }
    payment.status = url.searchParams.get('outcome') === 'failed' ? 'failed' : 'succeeded';
    const eventId = `evt_${randomUUID().replaceAll('-', '').slice(0, 16)}`;
    const body = JSON.stringify({ type: `payment.${payment.status}`, timestamp: new Date().toISOString(), data: payment });
    events.set(eventId, body);
    return [200, { event: eventId, type: `payment.${payment.status}`, delivered: await deliver(eventId, body) }];
  }

  if (req.method === 'POST' && first === 'events' && action === 'resend') {
    const body = events.get(id);
    return body ? [200, { event: id, delivered: await deliver(id, body) }] : [404, { error: 'No such event' }];
  }
  return [404, { error: 'Not found' }];
}

createServer((req, res) => {
  handle(req, res).then(
    ([status, body]) => res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body)),
    (error) => res.writeHead(500).end(String(error)),
  );
}).listen(port, () => console.log(`Fake payment provider on http://localhost:${port}`));
```

Node.js runs the TypeScript file directly (22.18 or later). `--env-file` gives it the shop's secret. The script lives outside `src/`, so `nest build` leaves it out:

```bash
$ node --env-file=.env scripts/fake-payments-provider.ts
Fake payment provider on http://localhost:4000
```

Start the shop in another terminal, with `npm run start`. At startup, the outbox's store creates its schema:

```bash
LOG [OutboxModule] OutboxStorage: PostgresOutboxStore
LOG [OutboxModule] PostgresOutboxStore: migrated schema "nest_outbox" to version 1.
```

As in the e-commerce tutorial, sign in as Ada and Sam (Sam is staff), add a keyboard to the catalog, and check out two of them (tokens and bodies are shortened here and below):

```bash
$ curl localhost:3000/auth/sign-up --json '{"email":"ada@example.com","password":"correct horse battery"}'
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","refreshToken":"...","expiresIn":900}
$ ADA="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
$ SAM="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
$ curl localhost:3000/products -H "$SAM" --json '{"name":"Mechanical keyboard","description":"Hot-swappable switches","price":12900,"stock":5}'
{"id":"dd947855-c8cd-4321-bec7-eb66d8f5f9c2","name":"Mechanical keyboard",...,"stock":5,...}
$ curl -X PUT localhost:3000/cart/items/dd947855-c8cd-4321-bec7-eb66d8f5f9c2 -H "$ADA" --json '{"quantity":2}'
$ curl -X POST localhost:3000/orders -H "$ADA"
{"id":"2145ea60-1156-47f1-b304-ffaa33582c34","userId":"884ebd52-aec8-4eec-b7db-6a3bb7623f36","status":"placed","total":25800,"paymentId":null,"createdAt":"2026-11-19T22:38:15.908Z","items":[...]}
```

Ask for the payment. A second call, such as a retry after a timeout, gets the same payment, because the provider got the same idempotency key. Staff can't ship the order yet, since it isn't paid:

```bash
$ curl -X POST localhost:3000/orders/2145ea60-1156-47f1-b304-ffaa33582c34/payment -H "$ADA"
{"paymentId":"pay_27a152e7","checkoutUrl":"http://localhost:4000/checkout/pay_27a152e7"}
$ curl -X POST localhost:3000/orders/2145ea60-1156-47f1-b304-ffaa33582c34/payment -H "$ADA"
{"paymentId":"pay_27a152e7","checkoutUrl":"http://localhost:4000/checkout/pay_27a152e7"}
$ curl -X POST localhost:3000/orders/2145ea60-1156-47f1-b304-ffaa33582c34/ship -H "$SAM"
{"message":"Order is placed","error":"Conflict","statusCode":409}
```

The customer pays on the provider's page. The fake provider answers with the event it sent, and the status the shop answered it with. The order is paid, so staff can ship it, and the confirmation went out after the commit:

```bash
$ curl -X POST localhost:4000/checkout/pay_27a152e7
{"event":"evt_a194bac0079a448a","type":"payment.succeeded","delivered":200}
$ curl localhost:3000/orders/2145ea60-1156-47f1-b304-ffaa33582c34 -H "$ADA"
{"id":"2145ea60-1156-47f1-b304-ffaa33582c34",...,"status":"paid","total":25800,"paymentId":"pay_27a152e7",...}
$ curl -X POST localhost:3000/orders/2145ea60-1156-47f1-b304-ffaa33582c34/ship -H "$SAM"
{"id":"2145ea60-1156-47f1-b304-ffaa33582c34",...,"status":"shipped","total":25800,"paymentId":"pay_27a152e7",...}
```

The application's log shows the confirmation going out:

```bash
LOG [OrderPaidHandler] Order 2145ea60-1156-47f1-b304-ffaa33582c34 paid (25800 cents): sending the confirmation
```

The provider delivers the event again: the shop answers `200`, and nothing changes. A request signed with anything but the secret is a `401`:

```bash
$ curl -X POST localhost:4000/events/evt_a194bac0079a448a/resend
{"event":"evt_a194bac0079a448a","delivered":200}
$ curl localhost:3000/orders/2145ea60-1156-47f1-b304-ffaa33582c34 -H "$ADA"
{"id":"2145ea60-1156-47f1-b304-ffaa33582c34",...,"status":"shipped",...}
$ curl -i localhost:3000/webhooks/payments -H 'webhook-id: evt_forged' -H "webhook-timestamp: $(date +%s)" -H 'webhook-signature: v1,Zm9yZ2Vk' \
    --json '{"type":"payment.succeeded","timestamp":"2026-11-19T22:30:00.000Z","data":{"id":"pay_forged","amount":25800,...}}'
HTTP/1.1 401 Unauthorized
{"message":"Webhook signature verification failed","error":"Unauthorized","statusCode":401}
```

A declined card cancels the order and puts its stock back: three keyboards were left after the first order, the second order took one, and the decline returned it. If the customer then tries again on the provider's page and the payment succeeds, the late `payment.succeeded` doesn't bring the order back, and the shop logs the refund it owes:

```bash
$ curl -X PUT localhost:3000/cart/items/dd947855-c8cd-4321-bec7-eb66d8f5f9c2 -H "$ADA" --json '{"quantity":1}'
$ curl -X POST localhost:3000/orders -H "$ADA"
{"id":"20b90e94-af9e-4d41-8bca-e3449dc13deb",...,"status":"placed","total":12900,...}
$ curl -X POST localhost:3000/orders/20b90e94-af9e-4d41-8bca-e3449dc13deb/payment -H "$ADA"
{"paymentId":"pay_07c5a5e9","checkoutUrl":"http://localhost:4000/checkout/pay_07c5a5e9"}
$ curl -X POST "localhost:4000/checkout/pay_07c5a5e9?outcome=failed"
{"event":"evt_464c1af968bd4fc8","type":"payment.failed","delivered":200}
$ curl localhost:3000/orders/20b90e94-af9e-4d41-8bca-e3449dc13deb -H "$ADA"
{"id":"20b90e94-af9e-4d41-8bca-e3449dc13deb",...,"status":"cancelled","total":12900,"paymentId":null,...}
$ curl localhost:3000/products/dd947855-c8cd-4321-bec7-eb66d8f5f9c2
{"id":"dd947855-c8cd-4321-bec7-eb66d8f5f9c2","name":"Mechanical keyboard",...,"stock":3,...}
$ curl -X POST localhost:4000/checkout/pay_07c5a5e9
{"event":"evt_95f96f70f1e1419c","type":"payment.succeeded","delivered":200}
$ curl localhost:3000/orders/20b90e94-af9e-4d41-8bca-e3449dc13deb -H "$ADA"
{"id":"20b90e94-af9e-4d41-8bca-e3449dc13deb",...,"status":"cancelled","total":12900,"paymentId":null,...}
```

The log flags the late success for a refund, and the order stays cancelled:

```bash
WARN [OrdersService] Payment pay_07c5a5e9 of 12900 for order 20b90e94-af9e-4d41-8bca-e3449dc13deb changed nothing (order cancelled, total 12900): refund it
```

Stop the fake provider, and asking for a payment gets a `502` once the client's three attempts failed, with the reason in the log, not in the response:

```bash
$ curl -X PUT localhost:3000/cart/items/dd947855-c8cd-4321-bec7-eb66d8f5f9c2 -H "$ADA" --json '{"quantity":1}'
$ curl -X POST localhost:3000/orders -H "$ADA"
{"id":"f43ba16e-fd3e-4f4e-ba12-bcff19c3c3bb",...,"status":"placed","total":12900,...}
$ curl -X POST localhost:3000/orders/f43ba16e-fd3e-4f4e-ba12-bcff19c3c3bb/payment -H "$ADA"
{"message":"Bad Gateway","statusCode":502}
```

The log has the reason the client gave up:

```bash
ERROR [HttpClient] POST http://localhost:4000/v1/payments failed: ECONNREFUSED; answering 502 Bad Gateway
```

#### Test it

The tests play the provider: they sign each webhook with `signWebhook()` from `@nestjs/webhooks/testing`, which produces the body and headers a Standard Webhooks sender would, with the secret the application has. The provider's API is a stubbed `fetch`, so the tests check what the shop sends it, and the shop never reaches a network. As in the e-commerce tutorial, they run against a real PostgreSQL server through a pool, because two copies of an event and a customer's cancel only really race there. Add the payments settings to the environment the tests run with:

```typescript
@@filename(vitest.config.e2e)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    env: {
      DATABASE_URL: 'postgres://unused-in-tests',
      JWT_SECRET: 'test-only-jwt-secret-of-at-least-32-bytes',
      // Never called: the tests stub fetch.
      PAYMENTS_API_URL: 'https://payments.invalid',
      PAYMENTS_API_KEY: 'test-only-key',
      PAYMENTS_WEBHOOK_SECRET: 'whsec_dGVzdC1vbmx5LXdlYmhvb2stc2VjcmV0LTMyLWJ5dGVz',
      // The tests run the outbox relay themselves.
      OUTBOX_RELAY: 'off',
    },
  },
});
```

The tests cover the idempotency key, the provider being down, signed and forged webhooks, duplicates on two instances, wrong amounts, and a payment racing a cancel:

```typescript
@@filename(test/payments.e2e-spec)
import { fileURLToPath } from 'node:url';
import { PasswordHasher } from '@nestjs/authentication';
import { getDrizzleToken } from '@nestjs/drizzle';
import { OutboxRelay } from '@nestjs/outbox';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import { signWebhook } from '@nestjs/webhooks/testing';
import { eq, sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { AppModule } from '../src/app.module.js';
import { orders, products, users } from '../src/database/schema.js';
import { OrderPaidHandler } from '../src/orders/order-paid.handler.js';
import { OrdersService } from '../src/orders/orders.service.js';
import type { PaymentEvent } from '../src/payments/payment.js';

// A real PostgreSQL with a pool, so a redelivery and a cancel really race.
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('Payments (e2e)', () => {
  const db = drizzle({ client: new Pool({ connectionString: url, max: 20 }) });
  // The provider's API: every call the shop makes to it lands here.
  const fetch = vi.fn<typeof globalThis.fetch>();
  let app: NestNodeApplication;
  let other: NestNodeApplication; // a second instance of the API, on a pool of its own
  let relay: OutboxRelay;

  async function createApp(database: NodePgDatabase) {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(database) // the outbox's store runs on it too
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      .compile();
    return moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter(), { rawBody: true }).init();
  }

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    await db.execute(sql`TRUNCATE users, products, refresh_tokens CASCADE`);
    vi.stubGlobal('fetch', fetch);
    app = await createApp(db);
    other = await createApp(drizzle({ client: new Pool({ connectionString: url, max: 10 }) }));
    relay = app.get(OutboxRelay);
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    await other.close();
    await app.close(); // closes the pools too
  });

  let clients = 0;

  async function signUp(email: string) {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password: 'correct horse battery' },
      remoteAddress: `10.0.1.${++clients}`,
    });
    return { authorization: `Bearer ${res.json<{ accessToken: string }>().accessToken}` };
  }

  /** A placed order for 2 of a product with 5 in stock. */
  async function placeOrder() {
    const [product] = await db.insert(products).values({ name: 'Keycaps', description: '', price: 9900, stock: 5 }).returning();
    const headers = await signUp(`buyer-${crypto.randomUUID()}@example.com`);
    await app.inject({ method: 'PUT', url: `/cart/items/${product.id}`, headers, payload: { quantity: 2 } });
    const order = (await app.inject({ method: 'POST', url: '/orders', headers })).json<{ id: string; total: number }>();
    return { ...order, productId: product.id, headers };
  }

  /** The request the provider sends: Standard Webhooks, signed with the shared secret. */
  function event(type: PaymentEvent['type'], order: { id: string; total: number }, secret = process.env.PAYMENTS_WEBHOOK_SECRET!) {
    const data = {
      id: `pay_${order.id.slice(0, 8)}`,
      amount: order.total,
      currency: 'usd',
      reference: order.id,
      status: type === 'payment.succeeded' ? 'succeeded' : 'failed',
      checkoutUrl: 'https://payments.invalid/checkout',
    };
    return signWebhook({ scheme: 'standard', secret, payload: { type, timestamp: new Date().toISOString(), data } });
  }

  const deliver = ({ headers, body }: { headers: Record<string, string>; body: string }, to = app) =>
    to.inject({ method: 'POST', url: '/webhooks/payments', headers, payload: body });

  const statusOf = async (id: string) =>
    (await db.select({ status: orders.status }).from(orders).where(eq(orders.id, id)))[0].status;
  const stockOf = async (id: string) =>
    (await db.select({ stock: products.stock }).from(products).where(eq(products.id, id)))[0].stock;

  it('creates the payment with the order id as the idempotency key, retries included', async () => {
    const order = await placeOrder();
    const payment = { id: 'pay_1', checkoutUrl: 'https://payments.invalid/checkout/pay_1' };
    fetch
      .mockReset()
      .mockResolvedValueOnce(new Response(null, { status: 503 })) // the provider hiccups: retried
      .mockResolvedValueOnce(Response.json(payment))
      .mockResolvedValueOnce(Response.json(payment));

    const first = await app.inject({ method: 'POST', url: `/orders/${order.id}/payment`, headers: order.headers });
    const second = await app.inject({ method: 'POST', url: `/orders/${order.id}/payment`, headers: order.headers });

    expect(first.json()).toEqual({ paymentId: 'pay_1', checkoutUrl: payment.checkoutUrl });
    expect(second.json()).toEqual(first.json());
    expect(fetch).toHaveBeenCalledTimes(3);
    for (const [input, init] of fetch.mock.calls) {
      expect(String(input)).toBe('https://payments.invalid/v1/payments');
      expect(new Headers(init?.headers).get('idempotency-key')).toBe(order.id);
      expect(JSON.parse(String(init?.body))).toEqual({ amount: order.total, currency: 'usd', reference: order.id });
    }
  });

  it('answers 502 when the provider is down', async () => {
    const order = await placeOrder();
    fetch.mockReset().mockRejectedValue(new TypeError('fetch failed'));

    const res = await app.inject({ method: 'POST', url: `/orders/${order.id}/payment`, headers: order.headers });

    expect(res.statusCode).toBe(502);
  });

  it('marks the order paid when a signed payment.succeeded arrives', async () => {
    const order = await placeOrder();
    const confirm = vi.spyOn(app.get(OrderPaidHandler), 'confirm');

    const res = await deliver(event('payment.succeeded', order));

    expect(res.statusCode).toBe(200);
    expect(await statusOf(order.id)).toBe('paid');
    await relay.runOnce(); // order.paid goes out after the commit
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ orderId: order.id }), expect.anything());
  });

  it('rejects a webhook that the provider did not sign', async () => {
    const order = await placeOrder();

    const res = await deliver(event('payment.succeeded', order, 'whsec_c29tZW9uZS1lbHNlcy1zZWNyZXQtb2YtMzItYnl0ZXM='));

    expect(res.statusCode).toBe(401);
    expect(await statusOf(order.id)).toBe('placed');
  });

  it('processes an event once, even when two instances receive it at the same time', async () => {
    const order = await placeOrder();
    const confirm = vi.spyOn(app.get(OrderPaidHandler), 'confirm').mockClear();
    const markPaid = [app, other].map((instance) => vi.spyOn(instance.get(OrdersService), 'markPaid'));
    const paid = event('payment.succeeded', order);

    const results = await Promise.all([deliver(paid, app), deliver(paid, other)]);

    expect(results.map((res) => res.statusCode)).toEqual([200, 200]);
    expect(await statusOf(order.id)).toBe('paid');
    // The inbox record, in the order's transaction, stopped the other copy.
    expect(markPaid[0].mock.calls.length + markPaid[1].mock.calls.length).toBe(1);
    await relay.runOnce();
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('pays nothing for the wrong amount, or for a payment that is not for an order', async () => {
    const order = await placeOrder();

    const wrongAmount = await deliver(event('payment.succeeded', { ...order, total: order.total - 1 }));
    const notAnOrder = await deliver(event('payment.succeeded', { ...order, id: 'invoice-2041' }));

    expect([wrongAmount.statusCode, notAnOrder.statusCode]).toEqual([200, 200]);
    expect(await statusOf(order.id)).toBe('placed');
  });

  it('never brings a cancelled order back', async () => {
    const order = await placeOrder();
    await app.inject({ method: 'POST', url: `/orders/${order.id}/cancel`, headers: order.headers });

    const res = await deliver(event('payment.succeeded', order));

    expect(res.statusCode).toBe(200); // a retry couldn't change anything: no point in one
    expect(await statusOf(order.id)).toBe('cancelled');
    expect(await stockOf(order.productId)).toBe(5);
  });

  it('cancels the order and puts its stock back when the payment fails', async () => {
    const order = await placeOrder();
    expect(await stockOf(order.productId)).toBe(3);

    await deliver(event('payment.failed', order));

    expect(await statusOf(order.id)).toBe('cancelled');
    expect(await stockOf(order.productId)).toBe(5);
  });

  it('lets a payment or a cancel win, never both', async () => {
    const order = await placeOrder();

    await Promise.all([
      deliver(event('payment.succeeded', order)),
      app.inject({ method: 'POST', url: `/orders/${order.id}/cancel`, headers: order.headers }),
    ]);

    const status = await statusOf(order.id);
    expect(['paid', 'cancelled']).toContain(status);
    expect(await stockOf(order.productId)).toBe(status === 'paid' ? 3 : 5);
  });
});
```

- **Every event gets a new id.** `signWebhook()` generates one per call. The inbox lives in `nest_outbox`, which `TRUNCATE` of the shop's tables doesn't empty, so a fixed id would pass on the first run, and be skipped as a duplicate on every run after.
- **The 401 comes from the signature check.** The same request with the right secret gets a `200` in the test before it, so the route isn't refusing for want of a token.
- **The relay runs when the test says so.** With `OUTBOX_RELAY=off`, `relay.runOnce()` delivers the committed `order.paid` messages, and the spy counts the handler's calls.
- **Two instances of the API** receive the same signed request at the same moment, each on its own pool, as two pods behind a load balancer would. One records the id and pays the order; the other's inbox insert waits for that transaction, then finds the id, and `markPaid()` runs once in all.
- **The provider's API answers 503 once.** The client retries the `POST`, with the same idempotency key, and the customer gets the payment: three calls to the provider for two requests, every one with the order's id as its key.

Run them with the e-commerce tutorial's, one file after the other, since they truncate the same tables:

```bash
$ TEST_DATABASE_URL=postgres://postgres:shop@localhost:5432/shop_test npm run test:e2e -- --no-file-parallelism

 Test Files  3 passed (3)
      Tests  18 passed (18)
```

Remove `eq(orders.status, 'placed')` from `markPaid()`, and "never brings a cancelled order back" and "lets a payment or a cancel win, never both" fail: the late payment resurrects the cancelled order, with its stock still returned. Call `markPaid()` directly instead of through `processInTransaction()`, and the two-instance test fails: both instances run it.

#### Switch to a real provider

What this tutorial simulates, and what a real provider changes:

- **The API.** Replace `PaymentsClient.createPayment()` with your provider's create-payment call (or its SDK), and keep the order's id as its idempotency key. Providers keep keys for a limited time, and some refuse a key reused with different parameters: check what yours does. Run it against the provider's test mode, with its test keys, before live keys.
- **The webhooks.** For a provider that follows Standard Webhooks, the receiver stays as it is: only the secret, and the payload type and its event names, change. Stripe signs with its own scheme, which the same module verifies with `scheme: 'stripe'` and no `header`; the event's id is then the payload's `id` (see [Receive the carrier's Stripe-like webhooks](/http/webhooks#receive-the-carriers-stripe-like-webhooks)). Map the provider's events to `markPaid()` and `cancelUnpaid()` in the controller.
- **The URL.** Register `https://<your API>/webhooks/payments` in the provider's dashboard. On your machine, the provider's command-line tool or a tunnel forwards its webhooks to `localhost`.

#### Production checklist

Everything in the e-commerce tutorial's [checklist](/tutorials/ecommerce-backend#production-checklist) applies. For payments in particular:

- **Trust only the webhook.** The browser returning from the provider's page proves nothing: anyone can open that URL. The order is paid when the signed `payment.succeeded` arrives, and the success page reads the order's status.
- **Keep `rawBody: true`, and keep the secret in your platform's secret store.** While the provider rotates the secret, give the receiver both, as an array in its `secret` option: every one is tried.
- **Refund what changed nothing.** A payment for a cancelled order is logged with `refund it`. Alert on that warning, or refund from the handler through the provider's API, keyed by the payment's id.
- **Expire unpaid orders.** A placed order holds its stock until it's paid or cancelled. Cancel the ones left unpaid for, say, an hour, from a [cron job](/application/task-scheduling#declarative-cron-jobs) that runs `cancelUnpaid()` for each, under a [lock](/reliability/locks) so one instance runs it.
- **Apply the outbox's migrations before a deploy**, with `npx @nestjs/outbox migrate`, next to `npx drizzle-kit migrate`. With `NODE_ENV=production`, the store doesn't migrate at startup.
- **Prune the inbox** with `OutboxInbox.prune()` from a cron job, on a window longer than the provider's retry schedule (Stripe retries for three days). A redelivery that arrives after its id was pruned runs the handler again, and only the conditional update stops it.
- **Keep the handler short.** The provider waits for the answer, and times out. Anything slow belongs in an outbox handler, after the commit.
- **Give production its own Observe key pair**, from the project's **API Keys** page, as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the platform's environment: `start:prod` doesn't load `.env`. Then see the provider in your traces: [NestJS Observe](/observability/overview) records each request with a trace of its spans, and the call to the provider's API shows up in it as an outbound request under the method that made it, so a slow provider shows up in the trace of `POST /orders/:id/payment` (see [Queries, outbound calls, and captured requests](/observability/dashboard#queries-outbound-calls-and-captured-requests)).

#### What's next

- Refund paid orders, and cancel them with a refund: another call in `PaymentsClient`, with the payment's id in its idempotency key, and a `payment.refunded` event in the controller.
- Send the confirmation email for real, from the `order.paid` handler: [Mail](/application/mail).
- Tell partners when an order is paid, with signed webhooks of your own: [Webhooks](/http/webhooks#send-ordershipped-and-ordercancelled-after-the-commit).
- Make other endpoints safe to retry with idempotency keys: [Idempotency keys](/reliability/idempotency).
- Watch the payment flow in production, request by request: [Observability](/observability/overview).
