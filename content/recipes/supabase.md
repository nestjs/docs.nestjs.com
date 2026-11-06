### Supabase

A Supabase application can use Nest for the backend work that its client libraries and Edge Functions aren't built for: webhooks, scheduled jobs, an admin API. Sign-in, Postgres and row level security stay in Supabase.

| Stays in Supabase | Goes in Nest |
| --- | --- |
| Sign-up, sign-in and password resets | Checking who is calling, and what they may do |
| Postgres, its migrations and row level security | Business rules, and queries that span many tables |
| Browser reads and writes that row level security covers | Anything that needs a secret: payments, email, other APIs |
| Storage and Realtime | Stripe webhooks, scheduled jobs, queues and an admin API |

The browser keeps calling Supabase directly for what row level security covers, and calls Nest with the same access token for the rest.

#### Installation

```bash
$ npm i --save @nestjs/authentication @supabase/supabase-js
```

Add your project's URL and API keys to `.env`. You'll find them in the Supabase dashboard:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

> warning **Warning** The secret key bypasses row level security. It belongs on the server only, and never in anything you ship to a browser or a mobile app.

#### Verify Supabase tokens

Supabase Auth signs an access token for each signed-in user, and publishes the public keys that verify it. [`@nestjs/authentication`](/security/authentication) can verify tokens from another issuer, so Nest needs no secret from Supabase to know who is calling:

```typescript
@@filename(supabase/supabase-auth)
import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, JwtBearerProvider, type JwtClaims } from '@nestjs/authentication';

export interface SupabaseUser {
  id: string;
  email?: string;
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

  validate({ sub, email }: JwtClaims) {
    return sub ? { id: sub, email: email as string | undefined } : null;
  }
}
```

Register the module and the provider:

```typescript
@@filename(app.module)
@Module({
  imports: [AuthenticationModule.forRoot({})],
  providers: [SupabaseAuth],
})
export class AppModule {}
```

The module registers a global guard, so every route now answers `401 Unauthorized` without a valid token, including one with a bad signature, another issuer or audience, or an expired one. Mark a route that stays open with `@Public()`, and read the user with `@CurrentUser()`:

```typescript
@@filename(me/me.controller)
@Controller('me')
export class MeController {
  @Get()
  me(@CurrentUser() user: SupabaseUser) {
    return user;
  }
}
```

> info **Hint** A project still on the legacy JWT secret signs tokens with it and publishes no keys. Pass `key: process.env.SUPABASE_JWT_SECRET` instead of `jwks`, until you [migrate to signing keys](https://supabase.com/docs/guides/auth/signing-keys).

The browser sends the access token that Supabase gave it:

```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(`${API_URL}/me`, {
  headers: { Authorization: `Bearer ${session.access_token}` },
});
```

If the browser calls Nest on another origin, allow it with [`app.enableCors()`](/security/cors).

#### Query as the user, or as the server

`@supabase/supabase-js` is a client for your database's REST API. Create one for the server, and one per request for the user:

```typescript
@@filename(supabase/supabase.service)
import { Injectable } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const options = { auth: { persistSession: false, autoRefreshToken: false } };

@Injectable()
export class SupabaseService {
  /** Bypasses row level security. Only for what the server does on its own. */
  readonly admin: SupabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    options,
  );

  /** Queries as the user who sent the token, so row level security applies. */
  forUser(token: string): SupabaseClient {
    return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      ...options,
      accessToken: async () => token,
    });
  }
}
```

Prefer `forUser()` in a route that acts for a user. Your policies keep applying, so a query that forgets a filter still returns only that user's rows:

```typescript
@@filename(notes/notes.controller)
@Controller('notes')
export class NotesController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async findAll(@Headers('authorization') authorization: string) {
    const token = authorization.replace(/^Bearer /i, '');
    const { data, error } = await this.supabase.forUser(token).from('notes').select('body');
    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }
}
```

#### Query Postgres directly

For transactions and queries that the REST API can't express, connect to the database with [`@nestjs/drizzle`](/data/drizzle) or another [database integration](/data/overview). Nest is a persistent backend, so use the [direct connection string](https://supabase.com/docs/guides/database/connecting-to-postgres), or the shared pooler in session mode if your host only has IPv4. The pooler's transaction mode doesn't support prepared statements.

> warning **Warning** Row level security doesn't protect these queries. The `postgres` role bypasses it, so a query with no filter returns every user's rows, and each query has to check the owner itself.

```typescript
@@filename(notes/notes.repository)
findAll(user: SupabaseUser) {
  return this.db.select().from(notes).where(eq(notes.userId, user.id));
}
```

#### Receive Stripe webhooks

[`@nestjs/webhooks`](/http/webhooks) verifies a webhook's signature on the bytes that were signed, so create the application with `rawBody`:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule, { rawBody: true });
```

Name the sender in the module's `receivers`, with the signing secret from the Stripe dashboard:

```typescript
@@filename(app.module)
WebhooksModule.forRoot({
  worker: { enabled: false }, // this application only receives webhooks
  receivers: {
    stripe: { scheme: 'stripe', secret: process.env.STRIPE_WEBHOOK_SECRET! },
  },
}),
```

The route is `@Public()`, as the signature is what authenticates it. `processInTransaction()` records the event's id in the same transaction as your change, so a redelivery changes nothing:

```typescript
@@filename(billing/stripe-webhooks.controller)
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
    await this.db.transaction(async (tx) =>
      webhook.processInTransaction(tx, async () => {
        const active = data.object.status === 'active';
        await tx
          .insert(subscriptions)
          .values({ stripeCustomer: data.object.customer, active })
          .onConflictDoUpdate({ target: subscriptions.stripeCustomer, set: { active } });
      }),
    );
  }
}
```

The package and `@nestjs/outbox` keep their state in your database, in schemas of their own. [Register their two stores](/http/webhooks#keep-webhooks-in-your-database), which work with Supabase's Postgres as with any other.

#### Run scheduled jobs

[`@nestjs/schedule`](/application/task-scheduling) runs a job inside the application, next to the code it calls:

```typescript
@@filename(billing/expire-subscriptions.job)
@Injectable()
export class ExpireSubscriptionsJob {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  @Cron(CronExpression.EVERY_HOUR)
  async run() {
    await this.db
      .update(subscriptions)
      .set({ active: false })
      .where(and(eq(subscriptions.active, true), lt(subscriptions.expiresAt, new Date())));
  }
}
```

If you run several instances, add [`@OnOneInstance()`](/reliability/locks) so that only one of them runs each tick.

#### Deployment

Supabase Edge Functions run on Deno, so Nest deploys separately, on anything that runs Node.js (see [Deployment](/deployment)). Host it close to your database's region, as every query crosses that distance.
