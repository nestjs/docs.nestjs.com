### Supabase

Supabase gives an application a Postgres database, sign-in, file storage and an API that the browser can call directly, which covers a lot without a backend. What it leaves out is the work that needs a secret, a retry or a clock: Stripe webhooks, scheduled jobs, queues, an admin API. Nest takes on that work next to Supabase, on the same database and for the same users.

| Stays in Supabase | Goes in Nest |
| --- | --- |
| Sign-up, sign-in and password resets | Checking who is calling, and what they may do |
| Postgres, its migrations and row level security | Business rules, and queries that span many tables |
| Browser reads and writes that row level security covers | Anything that needs a secret: payments, email, other APIs |
| Storage and Realtime | Stripe webhooks, scheduled jobs, queues and an admin API |

The browser keeps calling Supabase directly for what row level security covers, and calls Nest with the same access token for the rest.

If a short function or two is all you need, [Edge Functions](https://supabase.com/docs/guides/functions) may be enough, with no server to run. They have [limits on CPU time and duration](https://supabase.com/docs/guides/functions/limits) and nowhere to run a queue's worker, so Nest fits better once you have jobs, queues or many routes that share code.

This recipe builds such an application on the local Supabase stack, so that you can run each step as you read. [The finished module](/recipes/supabase#the-finished-module) shows how the pieces are wired together.

#### Create the projects

The local stack needs Docker.

```bash
$ npx @nestjs/cli new my-api
$ cd my-api
$ npx supabase init
$ npx supabase start
```

`npx supabase status -o env` prints the stack's URLs and keys. Put `API_URL`, `PUBLISHABLE_KEY`, `SECRET_KEY` and `DB_URL` in `.env`, under the names this recipe reads:

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

> warning **Warning** The secret key bypasses row level security. It belongs on the server only, and never in anything you ship to a browser or a mobile app.

> info **Hint** A hosted project has the same keys in its dashboard. Supabase is [deprecating](https://supabase.com/docs/guides/api/api-keys) the older `anon` and `service_role` keys by the end of 2026, so use these two.

Load `.env` with [`@nestjs/config`](/application/configuration):

```bash
$ npm i --save @nestjs/config
```

```typescript
@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
```

Keep it first in `imports`, as the modules you'll add after it read `process.env` as they're declared. A module declared in another file reads it earlier, when the file is imported, so use `forRootAsync()` for what you register there.

#### Define a table

The schema stays in Supabase's migrations:

```bash
$ npx supabase migration new notes
```

Write the table in the file this creates under `supabase/migrations`, with a policy that lets users reach only their own rows. `auth.uid()` is the user the request's access token belongs to:

```sql
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null
);

alter table public.notes enable row level security;

create policy "Users manage their own notes" on public.notes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

Apply it to the local database:

```bash
$ npx supabase db reset
```

> warning **Warning** Supabase's API serves the tables in the `public` schema to anyone with the publishable key, and that key is in your browser code. Enable row level security on every table you create there, including those only Nest uses. With it enabled and no policy, the key reads nothing.

#### Verify Supabase tokens

Supabase Auth signs an access token for each signed-in user, and publishes the public keys that verify it. [`@nestjs/authentication`](/security/authentication) can verify tokens from another issuer, so Nest needs no secret from Supabase to know who is calling:

```bash
$ npm i --save @nestjs/authentication
```

```typescript
@@filename(supabase/supabase-auth)
import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, JwtBearerProvider, type JwtClaims } from '@nestjs/authentication';

export interface SupabaseUser {
  id: string;
  email?: string;
  role?: string;
}

@Injectable()
export class SupabaseAuth extends JwtBearerProvider<SupabaseUser> {
  constructor(registry: AuthenticationRegistry) {
    super({
      jwks: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });
    registry.registerProvider(this);
  }

  validate(claims: JwtClaims) {
    if (!claims.sub) {
      return null;
    }
    const { email, app_metadata } = claims as JwtClaims & {
      email?: string;
      app_metadata?: { role?: string };
    };
    return { id: claims.sub, email, role: app_metadata?.role };
  }
}
```

The role comes from `app_metadata`, which only your server can change. A signed-in user can change their own `user_metadata` with `supabase.auth.updateUser()`, so never base a decision on it.

Register the module and the provider:

```typescript
@Module({
  imports: [AuthenticationModule.forRoot({})],
  providers: [SupabaseAuth],
})
export class AppModule {}
```

The module registers a global guard, so every route now answers `401 Unauthorized` without a valid token, including one with a bad signature, another issuer or audience, or an expired one. Mark a route that stays open with `@Public()`, and read the user with `@CurrentUser()`:

```typescript
@@filename(me/me.controller)
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { SupabaseUser } from '../supabase/supabase-auth.js';

@Controller('me')
export class MeController {
  @Get()
  me(@CurrentUser() user: SupabaseUser) {
    return user;
  }
}
```

> info **Hint** A project still on the legacy JWT secret signs tokens with it and publishes no keys. Pass `key: process.env.SUPABASE_JWT_SECRET` instead of `jwks`, until you [migrate to signing keys](https://supabase.com/docs/guides/auth/signing-keys).

#### Call Nest from the browser

The browser sends the access token that Supabase gave it. `getSession()` refreshes the token when it has expired:

```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(`${API_URL}/me`, {
  headers: { Authorization: `Bearer ${session.access_token}` },
});
```

If the browser calls Nest on another origin, [allow that origin](/security/cors) when the application starts:

```typescript
@@filename(main)
app.enableCors({ origin: process.env.WEB_ORIGIN });
```

#### Query as the user, or as the server

`@supabase/supabase-js` is a client for your database's REST API. Generate types from your schema, so that a query on a table or a column that doesn't exist fails to compile, and run this again after each migration:

```bash
$ npm i --save @supabase/supabase-js
$ npx supabase gen types typescript --local > src/supabase/database.types.ts
```

Create one client for the server, and one per request for the user. A client holds no database connection, so that's cheap:

```typescript
@@filename(supabase/supabase.service)
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';

const options = { auth: { persistSession: false, autoRefreshToken: false } };

@Injectable()
export class SupabaseService {
  /** Bypasses row level security. Only for what the server does on its own. */
  readonly admin = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    options,
  );

  /** Queries as the user who sent the token, so row level security applies. */
  forUser(token: string) {
    return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      ...options,
      accessToken: async () => token,
    });
  }
}
```

A small decorator reads the token that the guard has already verified:

```typescript
@@filename(supabase/access-token.decorator)
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const AccessToken = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const { authorization } = context.switchToHttp().getRequest().headers;
  return authorization?.replace(/^Bearer /i, '');
});
```

Prefer `forUser()` in a route that acts for a user. Your policies keep applying, so a query that forgets a filter still returns only that user's rows, and an insert for someone else is refused:

```typescript
@@filename(notes/notes.controller)
import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { AccessToken } from '../supabase/access-token.decorator.js';
import type { SupabaseUser } from '../supabase/supabase-auth.js';
import { SupabaseService } from '../supabase/supabase.service.js';

@Controller('notes')
export class NotesController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async findAll(@AccessToken() token: string) {
    const { data, error } = await this.supabase.forUser(token).from('notes').select('body');
    if (error) {
      throw error;
    }
    return data;
  }

  @Post()
  async create(
    @AccessToken() token: string,
    @CurrentUser() user: SupabaseUser,
    @Body('body') body: string,
  ) {
    const { error } = await this.supabase.forUser(token).from('notes').insert({ user_id: user.id, body });
    if (error) {
      throw error;
    }
  }
}
```

Use `admin` for what the server does on its own behalf, where no user is involved, as in a job or a webhook.

#### Query Postgres directly

For transactions and for queries that the REST API can't express, connect to the database with [`@nestjs/drizzle`](/data/drizzle) or another [database integration](/data/overview). The webhooks and jobs below use this connection too:

```bash
$ npm i --save @nestjs/drizzle drizzle-orm pg
```

```typescript
DrizzleModule.forRoot({ drizzle, connection: process.env.DATABASE_URL! }),
```

Locally, `DATABASE_URL` is the stack's `DB_URL`. On a hosted project, Nest is a persistent backend, so use the [direct connection string](https://supabase.com/docs/guides/database/connecting-to-postgres), or the shared pooler in session mode if your host only has IPv4. The pooler's transaction mode doesn't support prepared statements, nor the `LISTEN` that BullMQ's PostgreSQL backend uses.

Supabase's migrations stay the source of truth, so the Drizzle schema only describes the tables to query:

```typescript
@@filename(database/schema)
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  body: text('body').notNull(),
});
```

> warning **Warning** Row level security doesn't protect these queries. The `postgres` role bypasses it, so a query with no filter returns every user's rows, and each query has to check the owner itself.

To keep your policies on a direct query instead, run it in a transaction as the `authenticated` role, with the claims that `auth.uid()` reads:

```typescript
@@filename(database/row-level-security)
import { Injectable } from '@nestjs/common';
import type { JwtClaims } from '@nestjs/authentication';
import { InjectDrizzle } from '@nestjs/drizzle';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

type Transaction = Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];

@Injectable()
export class RowLevelSecurity {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  asUser<T>(claims: JwtClaims, work: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`
        select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true),
               set_config('role', 'authenticated', true)
      `);
      return work(tx);
    });
  }
}
```

Both settings end with the transaction, so they never reach the next query on that connection. Here's each way side by side, with `@CurrentSession()` giving a route the verified claims:

```typescript
@@filename(notes/notes.repository)
import { Injectable } from '@nestjs/common';
import type { JwtClaims } from '@nestjs/authentication';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { RowLevelSecurity } from '../database/row-level-security.js';
import { notes } from '../database/schema.js';
import type { SupabaseUser } from '../supabase/supabase-auth.js';

@Injectable()
export class NotesRepository {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly rls: RowLevelSecurity,
  ) {}

  /** Checks the owner itself. */
  findAll(user: SupabaseUser) {
    return this.db.select({ body: notes.body }).from(notes).where(eq(notes.userId, user.id));
  }

  /** Leaves the owner to the table's policy. */
  findAllAsUser(claims: JwtClaims) {
    return this.rls.asUser(claims, (tx) => tx.select({ body: notes.body }).from(notes));
  }
}
```

#### Protect an admin API

An admin API is what the browser can't do itself, as it needs the secret key. Keep a user's role in `app_metadata`, which `SupabaseAuth` already reads, and set it from the server:

```typescript
await supabase.admin.auth.admin.updateUserById(userId, {
  app_metadata: { role: 'admin' },
});
```

The role is in the user's next token, so someone already signed in gets it when their token refreshes, within an hour by default.

Check it with [`@nestjs/authorization`](/security/authorization):

```bash
$ npm i --save @nestjs/authorization
```

```typescript
@@filename(admin/admin.policy)
import { Policy } from '@nestjs/authorization';
import type { SupabaseUser } from '../supabase/supabase-auth.js';

@Policy()
export class AdminPolicy {
  manage(user: SupabaseUser | null) {
    return user?.role === 'admin';
  }
}
```

```typescript
@@filename(admin/admin-users.controller)
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthorizationGuard, Can } from '@nestjs/authorization';
import { SupabaseService } from '../supabase/supabase.service.js';
import { AdminPolicy } from './admin.policy.js';

@UseGuards(AuthorizationGuard)
@Can(AdminPolicy, 'manage')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async findAll() {
    const { data, error } = await this.supabase.admin.auth.admin.listUsers();
    if (error) {
      throw error;
    }
    return data.users.map(({ id, email }) => ({ id, email }));
  }
}
```

Register the module with `AuthorizationModule.forRoot({{ '{' }} globalGuard: false {{ '}' }})`, and `AdminPolicy` in `providers`. Its global guard is on by default and denies every route that has no `@Can()`, which would also close the routes above. A guest gets `401`, a user without the role `403`.

#### Receive Stripe webhooks

[`@nestjs/webhooks`](/http/webhooks) verifies a webhook's signature and remembers which events it has processed. It keeps its state in your database, through `@nestjs/outbox`, in schemas of their own. Supabase's API doesn't serve those schemas, so they stay private:

```bash
$ npm i --save @nestjs/webhooks @nestjs/outbox
```

The signature covers the exact bytes that Stripe sent, so create the application with `rawBody`:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule, { rawBody: true });
```

Name the sender in the module's `receivers`, with the signing secret from the Stripe dashboard or from `stripe listen`. This application only receives webhooks, so it needs neither of the background workers:

```typescript
OutboxModule.forRoot({ relay: { enabled: false } }),
WebhooksModule.forRoot({
  worker: { enabled: false },
  receivers: {
    stripe: { scheme: 'stripe', secret: process.env.STRIPE_WEBHOOK_SECRET! },
  },
}),
```

Register the two stores in `providers`. `migrate: true` creates their schemas at startup, which suits development (see [Deployment](/recipes/supabase#deployment) for production):

```typescript
{
  provide: PostgresOutboxStore,
  inject: [getDrizzleToken(), OutboxStorage],
  useFactory: (db: NodePgDatabase, storage: OutboxStorage) =>
    new PostgresOutboxStore({ executor: fromDrizzle(db), migrate: true }, storage),
},
{
  provide: PostgresWebhookStore,
  inject: [getDrizzleToken(), WebhooksStorage],
  useFactory: (db: NodePgDatabase, storage: WebhooksStorage) =>
    new PostgresWebhookStore({ executor: fromDrizzle(db), migrate: true }, storage),
},
```

Add a table for what the webhook changes. Only Nest reads it, and the policy-less row level security keeps it from the browser. Add it to a new migration:

```sql
create table public.subscriptions (
  stripe_customer text primary key,
  active boolean not null,
  expires_at timestamptz
);

alter table public.subscriptions enable row level security;
```

```typescript
@@filename(database/schema)
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const subscriptions = pgTable('subscriptions', {
  stripeCustomer: text('stripe_customer').primaryKey(),
  active: boolean('active').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});
```

The route is `@Public()`, as the signature is what authenticates it, and an invalid one gets `401`. `processInTransaction()` records the event's id in the same transaction as your change, so a redelivery changes nothing:

```typescript
@@filename(billing/stripe-webhooks.controller)
import { Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { InjectDrizzle } from '@nestjs/drizzle';
import { IncomingWebhook, VerifyWebhook } from '@nestjs/webhooks';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { subscriptions } from '../database/schema.js';

interface StripeEvent {
  id: string;
  type: string;
  data: { object: { customer: string; status: string; cancel_at: number | null } };
}

@Public()
@Controller('webhooks/stripe')
export class StripeWebhooksController {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  @Post()
  @HttpCode(200)
  @VerifyWebhook('stripe')
  async receive(@IncomingWebhook() webhook: IncomingWebhook<StripeEvent>) {
    const { type, data } = webhook.payload;
    if (type !== 'customer.subscription.updated') {
      return;
    }
    const { customer, status, cancel_at } = data.object;
    const values = {
      active: status === 'active',
      expiresAt: cancel_at ? new Date(cancel_at * 1000) : null,
    };
    await this.db.transaction(async (tx) =>
      webhook.processInTransaction(tx, async () => {
        await tx
          .insert(subscriptions)
          .values({ stripeCustomer: customer, ...values })
          .onConflictDoUpdate({ target: subscriptions.stripeCustomer, set: values });
      }),
    );
  }
}
```

To try it, forward events to your application with the [Stripe CLI](https://docs.stripe.com/stripe-cli), which prints the signing secret to put in `STRIPE_WEBHOOK_SECRET`:

```bash
$ stripe listen --forward-to localhost:3000/webhooks/stripe
$ stripe trigger customer.subscription.updated
```

#### Run scheduled jobs

There are two ways to run a job in Nest. Both work on any number of instances, and each run happens on one of them:

|  | `@nestjs/schedule` with `@nestjs/locks` | BullMQ |
| --- | --- | --- |
| **Where it runs** | In the instance that holds the lease | In a worker that picks it up |
| **If a run fails** | It waits for the next tick | It retries, with a backoff |
| **If every instance is down** | The tick is missed | The job waits in the queue |
| **What it adds to Postgres** | One table | A schema of its own |
| **What else it does** | Nothing else | Jobs enqueued from your code, priorities and flows |
| **Choose it for** | A job that's safe to skip, as the next tick catches up | A job that mustn't be lost, or runs for long |

Both can call the same code:

```typescript
@@filename(billing/subscriptions.service)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq, lt } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { subscriptions } from '../database/schema.js';

@Injectable()
export class SubscriptionsService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  /** Catches a subscription whose cancellation event never arrived. */
  async expireOverdue() {
    await this.db
      .update(subscriptions)
      .set({ active: false })
      .where(and(eq(subscriptions.active, true), lt(subscriptions.expiresAt, new Date())));
  }
}
```

> info **Hint** [Supabase Cron](https://supabase.com/docs/guides/cron) schedules SQL inside Postgres, with no application involved. It's a good fit for a job that's only SQL, such as deleting old rows.

##### With `@nestjs/schedule` and `@nestjs/locks`

[`@nestjs/schedule`](/application/task-scheduling) runs a job inside the application, next to the code it calls. On its own, it runs the job on every instance. [`@nestjs/locks`](/reliability/locks) adds `@OnOneInstance()`: the first instance to fire takes a lease and runs every tick while it's up, and the others skip them. When it stops, another takes over, about a second after a clean shutdown and within 30 seconds after a crash:

```bash
$ npm i --save @nestjs/schedule @nestjs/locks
```

```typescript
@@filename(billing/expire-subscriptions.job)
import { Injectable } from '@nestjs/common';
import { OnOneInstance } from '@nestjs/locks';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service.js';

@Injectable()
export class ExpireSubscriptionsJob {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  @OnOneInstance({ key: 'subscriptions:expire' })
  async run() {
    await this.subscriptions.expireOverdue();
  }
}
```

```typescript
ScheduleModule.forRoot(),
LocksModule.forRoot(),
```

The lease has to live somewhere that all instances share, and in production the application refuses to start with only the default in-memory store. Keep it in your database, with a table in a new migration:

```sql
create table public.locks (
  key text primary key,
  owner text,
  fencing_token bigint not null,
  expires_at timestamptz not null
);

alter table public.locks enable row level security;

create sequence public.locks_fencing_token_seq;
```

Then copy the Drizzle table and `DrizzleLockStore` from [Keep locks in your database](/reliability/locks#keep-locks-in-your-database), and add the store to `providers`.

##### With BullMQ

[BullMQ](/application/queues) keeps jobs in a queue, with retries and a backoff. It usually runs on Redis, and it also has a PostgreSQL backend, so on Supabase it can use the database you already have:

```bash
$ npm i --save @nestjs/bullmq bullmq
```

```typescript
BullModule.forRoot({
  backendFactory: createPostgresBackend,
  connection: { connectionString: process.env.DATABASE_URL!, migrate: true },
}),
BullModule.registerQueue({ name: 'billing' }),
```

`migrate: true` creates the `bullmq` schema at startup, which Supabase's API doesn't serve. The migration takes an advisory lock, so several instances starting together apply it once.

> info **Hint** To use Redis, install `ioredis` and replace those options with `connection: {{ '{' }} host, port {{ '}' }}`. Nothing else changes.

A job scheduler creates the job on each tick. The id makes it one schedule, however many instances declare it:

```typescript
@@filename(billing/billing.scheduler)
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';

@Injectable()
export class BillingScheduler implements OnApplicationBootstrap {
  constructor(@InjectQueue('billing') private readonly billing: Queue) {}

  async onApplicationBootstrap() {
    await this.billing.upsertJobScheduler(
      'expire-subscriptions',
      { pattern: '0 * * * *' },
      {
        name: 'expire-subscriptions',
        opts: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
      },
    );
  }
}
```

The processor runs it, on whichever instance is free:

```typescript
@@filename(billing/billing.processor)
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { SubscriptionsService } from './subscriptions.service.js';

@Processor('billing')
export class BillingProcessor extends WorkerHost {
  constructor(private readonly subscriptions: SubscriptionsService) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'expire-subscriptions') {
      await this.subscriptions.expireOverdue();
    }
  }
}
```

The same queue takes jobs from your own code, such as a route that shouldn't wait for an email. Inject it with `@InjectQueue('billing')`, and add a case for the job to the processor:

```typescript
await this.billing.add('send-invoice', { customer }, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
});
```

#### Hand out file uploads

A browser can upload to Supabase Storage directly, under policies on the `storage.objects` table. When the decision belongs on the server, such as a quota or a paid plan, keep the bucket private and let Nest sign each upload. Create the bucket in a migration:

```sql
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false);
```

```typescript
@@filename(uploads/uploads.controller)
import { randomUUID } from 'node:crypto';
import { Controller, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { SupabaseUser } from '../supabase/supabase-auth.js';
import { SupabaseService } from '../supabase/supabase.service.js';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post()
  async create(@CurrentUser() user: SupabaseUser) {
    const path = `${user.id}/${randomUUID()}`;
    const { data, error } = await this.supabase.admin.storage.from('uploads').createSignedUploadUrl(path);
    if (error) {
      throw error;
    }
    return { path: data.path, token: data.token };
  }
}
```

The browser then uploads straight to Supabase, so the file never passes through your application:

```typescript
await supabase.storage.from('uploads').uploadToSignedUrl(path, token, file);
```

To hand a file back, `createSignedUrl(path, 60)` on the admin client makes a link that works for 60 seconds.

#### Test against the local stack

An end-to-end test can use real tokens and your real policies, as the stack gives you both. Put it in `test/`, and run `npx supabase start` and `npx supabase db reset` before it:

```typescript
@@filename(notes.e2e-spec)
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { SupabaseService } from '../src/supabase/supabase.service.js';

describe('Notes', () => {
  let app: INestApplication;

  const signUp = async () => {
    const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.signUp({
      email: `${randomUUID()}@example.test`,
      password: randomUUID(),
    });
    if (error) {
      throw error;
    }
    return { id: data.user!.id, token: data.session!.access_token };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('shows a user only their own notes', async () => {
    const [alice, bob] = [await signUp(), await signUp()];
    await app.get(SupabaseService).admin.from('notes').insert([
      { user_id: alice.id, body: 'from alice' },
      { user_id: bob.id, body: 'from bob' },
    ]);

    const { body } = await request(app.getHttpServer())
      .get('/notes')
      .set('Authorization', `Bearer ${alice.token}`)
      .expect(200);

    expect(body).toEqual([{ body: 'from alice' }]);
  });
});
```

#### Move an Edge Function to Nest

Most of a function has a direct counterpart, and you can move them one at a time, as both use the same tokens and database:

| In an Edge Function | In Nest |
| --- | --- |
| Reading the `Authorization` header and calling `supabase.auth.getUser()` | `SupabaseAuth` and `@CurrentUser()` |
| A client created with the caller's header | `SupabaseService.forUser()` |
| A client created with the secret key | `SupabaseService.admin` |
| Verifying Stripe's signature by hand | `@VerifyWebhook('stripe')` |
| `pg_cron` calling the function over HTTP | `@Cron()`, or a BullMQ job scheduler |
| `supabase secrets set` | Your host's environment variables |
| `supabase.functions.invoke('name')` in the browser | `fetch()` with the access token |

#### The finished module

Here's everything above wired together, with both ways of running a job, of which you'll keep one:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { AuthenticationModule } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';
import { LocksModule } from '@nestjs/locks';
import { OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { ScheduleModule } from '@nestjs/schedule';
import { WebhooksModule, WebhooksStorage } from '@nestjs/webhooks';
import { fromDrizzle, PostgresWebhookStore } from '@nestjs/webhooks/postgres';
import { createPostgresBackend } from 'bullmq';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AdminUsersController } from './admin/admin-users.controller.js';
import { AdminPolicy } from './admin/admin.policy.js';
import { BillingProcessor } from './billing/billing.processor.js';
import { BillingScheduler } from './billing/billing.scheduler.js';
import { ExpireSubscriptionsJob } from './billing/expire-subscriptions.job.js';
import { StripeWebhooksController } from './billing/stripe-webhooks.controller.js';
import { SubscriptionsService } from './billing/subscriptions.service.js';
import { DrizzleLockStore } from './database/drizzle-lock.store.js';
import { RowLevelSecurity } from './database/row-level-security.js';
import { MeController } from './me/me.controller.js';
import { NotesController } from './notes/notes.controller.js';
import { NotesRepository } from './notes/notes.repository.js';
import { SupabaseAuth } from './supabase/supabase-auth.js';
import { SupabaseService } from './supabase/supabase.service.js';
import { UploadsController } from './uploads/uploads.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot(), // first, as the lines below read process.env
    AuthenticationModule.forRoot({}),
    AuthorizationModule.forRoot({ globalGuard: false }),
    DrizzleModule.forRoot({ drizzle, connection: process.env.DATABASE_URL! }),
    OutboxModule.forRoot({ relay: { enabled: false } }),
    WebhooksModule.forRoot({
      worker: { enabled: false },
      receivers: {
        stripe: { scheme: 'stripe', secret: process.env.STRIPE_WEBHOOK_SECRET! },
      },
    }),
    // Jobs with @nestjs/schedule and @nestjs/locks
    ScheduleModule.forRoot(),
    LocksModule.forRoot(),
    // Jobs with BullMQ
    BullModule.forRoot({
      backendFactory: createPostgresBackend,
      connection: { connectionString: process.env.DATABASE_URL!, migrate: true },
    }),
    BullModule.registerQueue({ name: 'billing' }),
  ],
  controllers: [
    MeController,
    NotesController,
    AdminUsersController,
    StripeWebhooksController,
    UploadsController,
  ],
  providers: [
    SupabaseAuth,
    SupabaseService,
    RowLevelSecurity,
    NotesRepository,
    AdminPolicy,
    SubscriptionsService,
    {
      provide: PostgresOutboxStore,
      inject: [getDrizzleToken(), OutboxStorage],
      useFactory: (db: NodePgDatabase, storage: OutboxStorage) =>
        new PostgresOutboxStore({ executor: fromDrizzle(db), migrate: true }, storage),
    },
    {
      provide: PostgresWebhookStore,
      inject: [getDrizzleToken(), WebhooksStorage],
      useFactory: (db: NodePgDatabase, storage: WebhooksStorage) =>
        new PostgresWebhookStore({ executor: fromDrizzle(db), migrate: true }, storage),
    },
    // Jobs with @nestjs/schedule and @nestjs/locks
    ExpireSubscriptionsJob,
    DrizzleLockStore,
    // Jobs with BullMQ
    BillingScheduler,
    BillingProcessor,
  ],
})
export class AppModule {}
```

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors({ origin: process.env.WEB_ORIGIN });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

`enableShutdownHooks()` lets a running job finish and passes its lease on when a deploy stops an instance.

#### Deployment

Nest deploys separately from Supabase, on anything that runs Node.js (see [Deployment](/deployment)). Host it close to your database's region, as every query crosses that distance.

Apply your migrations to the hosted project:

```bash
$ npx supabase link --project-ref your-project-ref
$ npx supabase db push
```

Set the same environment variables on your host, with the hosted project's values and the connection string from [Query Postgres directly](/recipes/supabase#query-postgres-directly). Each instance opens its own connections, for Drizzle and for BullMQ, so count them against your project's [connection limit](https://supabase.com/docs/guides/database/connection-management).

The webhook stores shouldn't change a schema while a new version boots, in the middle of a rolling deploy. Remove `migrate: true` from those two, and apply their migrations as a step before the new version starts, with `DATABASE_URL` set. BullMQ's can stay, as it runs in one transaction under an advisory lock:

```bash
$ npx @nestjs/webhooks migrate
$ npx @nestjs/outbox migrate
```
