### Send emails and run background jobs in Node.js

Send emails and run background jobs in Node.js with NestJS and BullMQ: retries, emails that never go out twice, scheduled jobs, and clean shutdown.

It adds email to the notes API of the JWT tutorial: a welcome email after sign-up, and an evening digest of the notes each user changed that day, sent from a BullMQ queue so that no request waits for a mail server. Sending an email is one call. Sending it from the background, reliably, is where the work is: the job must not be lost between the database and the queue, a job that runs twice must not send twice, a scheduled job must run once however many instances the API has, and a deploy must not cut a send in half.

By the end, the API will:

- Send mail with [`@nestjs/mail`](/application/mail): mail classes that render escaped HTML, written to the console in development and sent over SMTP in production.
- Send every email from a [BullMQ](/application/queues) queue, with retries and exponential backoff, and finished jobs removed on a schedule you set.
- Hand the welcome email from the sign-up transaction to the queue with the [transactional outbox](/reliability/outbox), so a crash or a Redis outage can't lose it, and sign-up doesn't fail when Redis is down.
- Send each email once, even when its job runs twice at the same moment.
- Queue the evening digest with [`@nestjs/schedule`](/application/task-scheduling), on one instance of the application, with [`@nestjs/locks`](/reliability/locks).
- Finish the email in flight when a deploy stops the process, and run the workers in a process of their own when you need to.
- Prove all of it in tests against PostgreSQL and Redis.

It starts from the API of [Build a REST API with JWT authentication](/tutorials/rest-api-jwt-authentication), which signs users in and keeps their notes in PostgreSQL through Drizzle. This tutorial doesn't explain those parts again. It adds no endpoints; these are the emails, and the section that adds each one:

| Email | Sent when | Section |
| --- | --- | --- |
| Welcome | `POST /auth/sign-up` commits | [Hand the welcome email to the queue](/tutorials/background-jobs#hand-the-welcome-email-to-the-queue) |
| Digest | Every evening at 18:00 UTC, to each user who changed notes that day | [Send the digest from one instance](/tutorials/background-jobs#send-the-digest-from-one-instance) |

> info **Hint** The finished application is on GitHub as [nestjs/example-background-jobs](https://github.com/nestjs/example-background-jobs), with its tests and a CI workflow.

#### Start from the JWT API

Create the project, and install the JWT tutorial's packages, plus the five this tutorial adds: the mailer, BullMQ with its Nest module and its Redis client, the outbox, the scheduler and the locks:

```bash
$ npm i -g @nestjs/cli
$ nest new notes-api --minimal
$ cd notes-api
$ npm uninstall @nestjs/platform-express @types/express
$ npm i --save @nestjs/platform-node zod @nestjs/config @nestjs/drizzle drizzle-orm@rc pg @nestjs/authentication @nestjs/throttler @nestjs/swagger @nestjs/terminus
$ npm i --save @nestjs/mail @nestjs/bullmq bullmq ioredis @nestjs/outbox @nestjs/schedule @nestjs/locks
$ npm i --save-dev drizzle-kit@rc @types/pg @nestjs/testing vitest vite
```

Then take these files from the [finished JWT tutorial](/tutorials/rest-api-jwt-authentication#test-it), as they are:

- `src/main.ts` and `drizzle.config.ts`
- everything under `src/auth/`, `src/users/`, `src/notes/` and `src/health/`, and `src/database/schema.ts`
- `test/refresh-token.store.e2e-spec.ts`

Leave out the JWT tutorial's `drizzle/` folder, since the next steps change the schema and generate one migration for all of it, and `test/notes.e2e-spec.ts`, which runs the application on PGlite: from now on the application also needs Redis, and the tests at the end of this tutorial run it against both servers. Add the test script to `package.json`:

```json
"test:e2e": "vitest run --config ./vitest.config.e2e.ts"
```

BullMQ keeps its jobs in [Redis](https://redis.io). Run one next to the JWT tutorial's PostgreSQL container:

```bash
$ docker run -d --name notes-redis -p 6379:6379 redis:7
```

Add its URL to `.env`, next to `DATABASE_URL` and `JWT_SECRET`:

```bash
REDIS_URL=redis://localhost:6379
```

The configuration schema gains the Redis URL and the mail settings. A missing `SMTP_URL` stops the application at startup when it's needed, instead of failing the first email:

```typescript
@@filename(src/config)
import { z } from 'zod';

export const envSchema = z
  .object({
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
    // The queue's jobs and the locks. A database number in the path: redis://host:6379/1
    REDIS_URL: z.url(),
    // `log` writes each mail to the console instead of sending it.
    MAIL_TRANSPORT: z.enum(['log', 'smtp']).default('log'),
    SMTP_URL: z.url().optional(),
    MAIL_FROM: z.string().default('Notes <notes@example.com>'),
  })
  .refine((env) => env.MAIL_TRANSPORT !== 'smtp' || env.SMTP_URL, {
    message: 'SMTP_URL is required when MAIL_TRANSPORT is "smtp"',
    path: ['SMTP_URL'],
  });

export type Env = z.infer<typeof envSchema>;
```

One table joins the schema, after `notes`. Each row is an email the workers send, keyed by what makes it unique, and the next sections explain its columns:

```typescript
@@filename(src/database/schema)
// ...

// One row per email the workers send, keyed by what makes it unique:
// `welcome-<user id>`, or `digest-<user id>-<day>`.
export const sentEmails = pgTable('sent_emails', {
  key: text('key').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // When a worker took the email on; another one may take it over 5 minutes later.
  claimedAt: at('claimed_at').notNull().defaultNow(),
  // Null until the mail server accepted it.
  sentAt: at('sent_at'),
});
```

Generate the migration and apply it, as in the JWT tutorial:

```bash
$ npx drizzle-kit generate --name=notes
$ npx drizzle-kit migrate
```

The root module registers everything this tutorial adds. Each part is explained in the section that uses it:

```typescript
@@filename(src/app.module)
import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { BullModule } from '@nestjs/bullmq';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';
import { LocksModule } from '@nestjs/locks';
import { MailModule } from '@nestjs/mail';
import { createObserveModule } from '@nestjs/observe';
import { OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { fromDrizzle, PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule, minutes, normalizeIp } from '@nestjs/throttler';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { accountEmail } from './auth/account-email.js';
import { AuthModule } from './auth/auth.module.js';
import { envSchema, type Env } from './config.js';
import { EmailsModule } from './emails/emails.module.js';
import { mailTransport } from './emails/mail-transport.js';
import { HealthModule } from './health/health.module.js';
import { NotesModule } from './notes/notes.module.js';
import { RedisLockStore } from './redis/redis-lock.store.js';
import { RedisModule } from './redis/redis.module.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'notes-api',
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
          issuer: 'notes-api',
          audience: 'notes-api',
          ttl: '15m',
        },
        refreshToken: { ttl: '30d', absoluteTtl: '90d' },
      }),
    }),
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
    MailModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        transport: mailTransport(config.get('MAIL_TRANSPORT', { infer: true }), config.get('SMTP_URL', { infer: true })),
        from: config.get('MAIL_FROM', { infer: true }),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        connection: { url: config.get('REDIS_URL', { infer: true }) },
      }),
    }),
    OutboxModule.forRoot(),
    ScheduleModule.forRoot(),
    LocksModule.forRoot(),
    RedisModule,
    UsersModule,
    AuthModule,
    NotesModule,
    EmailsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      // The outbox's messages, in the application's database, in a schema of their own (nest_outbox).
      provide: PostgresOutboxStore,
      inject: [getDrizzleToken(), OutboxStorage],
      useFactory: (db: NodePgDatabase, outboxStorage: OutboxStorage) =>
        new PostgresOutboxStore({ executor: fromDrizzle(db) }, outboxStorage),
    },
    // The locks of @OnOneInstance(), in Redis.
    RedisLockStore,
  ],
})
export class AppModule {}
```

- `MailModule` sends the mail ([Write the emails](/tutorials/background-jobs#write-the-emails)).
- `BullModule.forRootAsync()` connects BullMQ to Redis, from `REDIS_URL`. A database number in the URL's path, such as `redis://localhost:6379/1`, keeps the jobs apart from anything else on the server.
- `OutboxModule` and `PostgresOutboxStore` take the welcome email from the sign-up transaction to the queue ([Hand the welcome email to the queue](/tutorials/background-jobs#hand-the-welcome-email-to-the-queue)).
- `ScheduleModule`, `LocksModule`, `RedisModule` and `RedisLockStore` run the digest on one instance ([Send the digest from one instance](/tutorials/background-jobs#send-the-digest-from-one-instance)).

#### Write the emails

`MailModule` takes a **transport**, which is how mail leaves the application, and a default sender. Pick the transport from the environment, so the same build runs everywhere:

```typescript
@@filename(src/emails/mail-transport)
import { LogMailTransport, SmtpTransport, type MailTransport } from '@nestjs/mail';

/** `log` in development: every mail goes to the console. `smtp` in production. */
export function mailTransport(kind: 'log' | 'smtp', smtpUrl?: string): MailTransport {
  return kind === 'smtp'
    ? new SmtpTransport({ url: smtpUrl!, pool: true }) // smtp://user:password@smtp.example.com:587
    : new LogMailTransport();
}
```

`LogMailTransport` writes each mail to the console, the recipients and the subject at `log` level and the text at `debug`, and sends nothing, which is what you want while you develop. `SmtpTransport` speaks SMTP itself, requires STARTTLS on port 587, and with `pool: true` reuses its connections. [Send in production](/application/mail#send-in-production) covers its options and the HTTP providers' transports (Resend, Postmark, SendGrid, SES), any of which takes its place here.

An email is a **mail class**: a provider whose `render()` turns typed data into a subject and a body. The welcome email gets the user:

```typescript
@@filename(src/emails/welcome.mail)
import { Injectable } from '@nestjs/common';
import { html, type Mailable } from '@nestjs/mail';
import type { User } from '../users/user.js';

@Injectable()
export class WelcomeMail implements Mailable<User> {
  render(user: User) {
    return {
      subject: 'Welcome to Notes',
      // `html` escapes every value it inserts.
      html: html`
        <p>Hi ${user.email},</p>
        <p>your account is ready. On the days you change notes, we'll send you a digest of them in the evening.</p>
      `,
    };
  }
}
```

The digest gets the day and the titles of the notes changed that day:

```typescript
@@filename(src/emails/digest.mail)
import { Injectable } from '@nestjs/common';
import { html, type Mailable } from '@nestjs/mail';

export interface Digest {
  /** The UTC day, as YYYY-MM-DD. */
  day: string;
  titles: string[];
}

@Injectable()
export class DigestMail implements Mailable<Digest> {
  render({ day, titles }: Digest) {
    return {
      subject: `Your notes on ${day}`,
      // Titles are user input: `html` escapes them, so a title can't inject markup.
      html: html`
        <p>You changed ${titles.length} ${titles.length === 1 ? 'note' : 'notes'} today:</p>
        <ul>
          ${titles.map((title) => html`<li>${title}</li>`)}
        </ul>
      `,
    };
  }
}
```

The `html` tagged template escapes every value it inserts, so a note titled `<script>` reaches the mail as `&lt;script&gt;`, and arrays of nested `html` templates, like the list items, are inserted as they are. The mailer derives the plain-text part from the HTML. Longer mails can live in template files instead, rendered by `FileTemplateEngine` in a layout every mail shares: see [Write the order confirmation mail](/application/mail#write-the-order-confirmation-mail).

#### Queue the emails

A mail server takes hundreds of milliseconds to accept a message, sometimes seconds, and sometimes it's down. None of that belongs in a request. The API adds a **job** to a queue instead, and a **worker** sends the email in the background, retrying when the server fails.

The producer is a small provider. Each job carries ids, not the email address, so the worker reads the user when it runs, and always sends to the current address:

```typescript
@@filename(src/emails/email.jobs)
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { JobsOptions, Queue } from 'bullmq';

export const EMAILS_QUEUE = 'emails';

// What each kind of job carries: ids, not the user's email address, which may change before the job runs.
export interface WelcomeJob {
  userId: string;
}
export interface DigestJob {
  userId: string;
  /** The UTC day, as YYYY-MM-DD. */
  day: string;
}

/** What makes an email unique: its job id, its row in `sent_emails`, and its idempotency key. */
export const welcomeKey = (userId: string) => `welcome-${userId}`;
export const digestKey = (userId: string, day: string) => `digest-${userId}-${day}`;

const jobOptions = {
  // 10 attempts, 2 s apart and doubling: the last one runs about 17 minutes after the first.
  attempts: 10,
  backoff: { type: 'exponential', delay: 2_000 },
  // Finished jobs stay for inspection, for a day if they completed and a week if they failed.
  // Without these, Redis keeps every job forever.
  removeOnComplete: { age: 24 * 3600, count: 10_000 },
  removeOnFail: { age: 7 * 24 * 3600 },
} satisfies JobsOptions;

@Injectable()
export class EmailJobs {
  constructor(@InjectQueue(EMAILS_QUEUE) private readonly queue: Queue) {}

  async welcome(userId: string): Promise<void> {
    const data: WelcomeJob = { userId };
    // A job whose id exists already isn't added again.
    await this.queue.add('welcome', data, { ...jobOptions, jobId: welcomeKey(userId) });
  }

  async digests(day: string, userIds: string[]): Promise<void> {
    await this.queue.addBulk(
      userIds.map((userId) => ({
        name: 'digest',
        data: { userId, day } satisfies DigestJob,
        opts: { ...jobOptions, jobId: digestKey(userId, day) },
      })),
    );
  }
}
```

- **`attempts` and `backoff`.** A job fails when the worker throws, and BullMQ runs it again after the backoff: 2 seconds, then 4, 8 and so on, ten attempts over about 17 minutes. Size it to the outages you expect from your mail provider. After the last attempt the job moves to the failed set.
- **`removeOnComplete` and `removeOnFail`.** By default BullMQ keeps every finished job in Redis, forever. Here completed jobs go after a day (or past the 10,000 most recent), and failed ones after a week, long enough to look at them. Ages are in seconds.
- **`jobId`.** Every email has a key, such as `welcome-<user id>`. Used as the job's id, it makes adding the same email twice a no-op while the first job is still in Redis. Once `removeOnComplete` removed it, the same id can be added again, so the job id alone doesn't make an email unique: the `sent_emails` table does, in [Send each email once](/tutorials/background-jobs#send-each-email-once). BullMQ refuses integer ids, and most ids with a `:` in them, hence the dashes.

The options are passed on every `add()`, rather than as the queue's defaults, so they sit next to the jobs they apply to. [Job options](/application/queues#job-options) lists the others, such as `delay` and `priority`.

The feature module registers the queue, and the providers of the next sections:

```typescript
@@filename(src/emails/emails.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UsersModule } from '../users/users.module.js';
import { DigestMail } from './digest.mail.js';
import { DigestRepository } from './digest.repository.js';
import { DigestScheduler } from './digest.scheduler.js';
import { EMAILS_QUEUE, EmailJobs } from './email.jobs.js';
import { EmailProcessor } from './email.processor.js';
import { SentEmailsRepository } from './sent-emails.repository.js';
import { WelcomeMail } from './welcome.mail.js';
import { WelcomeMailHandler } from './welcome-mail.handler.js';

@Module({
  imports: [BullModule.registerQueue({ name: EMAILS_QUEUE }), UsersModule],
  providers: [
    EmailJobs,
    // With MAIL_WORKER=off, this process adds jobs and leaves running them to others.
    ...(process.env.MAIL_WORKER === 'off' ? [] : [EmailProcessor]),
    WelcomeMail,
    DigestMail,
    DigestRepository,
    SentEmailsRepository,
    DigestScheduler,
    WelcomeMailHandler,
  ],
  exports: [EmailJobs],
})
export class EmailsModule {}
```

#### Hand the welcome email to the queue

Sign-up inserts the user. Where should it add the welcome job?

- **Inside the database transaction, before it commits:** Redis isn't part of the transaction. The worker can pick the job up before the commit, and find no user. Or the transaction rolls back after the job was added, and someone gets a welcome email for an account that doesn't exist.
- **After the commit:** the job always finds the user. But the two writes still go to two systems with nothing tying them together. A crash or a deploy between the commit and `queue.add()` loses the email, and while Redis is down, sign-up fails with a 500 for an account that was created, and the user may try again.

For a welcome email, the second option with the error caught and logged may be enough. When the job must not be lost, use the [transactional outbox](/reliability/outbox). `outbox.add()` writes a message to a table of the same database, **in the same transaction** as the user, so both commit or neither does. A relay then hands committed messages to a handler, and retries it with backoff until it succeeds:

```typescript
@@filename(src/auth/credentials.service)
import { ConflictException, Injectable } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { InjectDrizzle } from '@nestjs/drizzle';
import { Outbox } from '@nestjs/outbox';
import type { NodePgDatabase, NodePgTransaction } from 'drizzle-orm/node-postgres';
import type { UserSignedUp } from '../emails/welcome-mail.handler.js';
import type { User } from '../users/user.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly outbox: Outbox<NodePgTransaction<{}>>,
  ) {}

  async register(email: string, password: string): Promise<User> {
    const passwordHash = await this.passwordHasher.hash(password);
    const user = await this.db.transaction(async (tx) => {
      const user = await this.usersRepository.create(email, passwordHash, tx);
      if (!user) {
        throw new ConflictException('Email already registered');
      }
      // Same transaction: the message commits with the user, or neither does.
      await this.outbox.add<UserSignedUp>(tx, { topic: 'user.signed-up', payload: { userId: user.id } });
      return user;
    });
    this.outbox.notify(); // hand it to the queue now, not at the next poll
    return user;
  }

  /** The user, or `null` when the email or the password is wrong. */
  async verify(email: string, password: string): Promise<User | null> {
    const found = await this.usersRepository.findCredentials(email);
    // With no account, verify() checks a dummy hash, so the response
    // time doesn't reveal which emails are registered.
    const valid = await this.passwordHasher.verify(password, found?.passwordHash);
    if (!valid || !found) {
      return null;
    }
    if (this.passwordHasher.needsRehash(found.passwordHash)) {
      await this.usersRepository.updatePasswordHash(found.user.id, await this.passwordHasher.hash(password));
    }
    return found.user;
  }
}
```

`UsersRepository.create()` takes the transaction, so the insert runs in it:

```typescript
@@filename(src/users/users.repository)
// ...
  /** The new user, or `null` when the email is taken. Pass a transaction as `db` to insert in it. */
  async create(email: string, passwordHash: string, db: Pick<NodePgDatabase, 'insert'> = this.db): Promise<User | null> {
    // One statement: two sign-ups with the same email can't both succeed.
    const [user] = await db
      .insert(users)
      .values({ email: normalize(email), passwordHash })
      .onConflictDoNothing({ target: users.email })
      .returning(columns);
    return user ?? null;
  }
```

The handler runs after the commit, and adds the job:

```typescript
@@filename(src/emails/welcome-mail.handler)
import { Injectable } from '@nestjs/common';
import { OnOutboxMessage } from '@nestjs/outbox';
import { EmailJobs } from './email.jobs.js';

export interface UserSignedUp {
  userId: string;
}

@Injectable()
export class WelcomeMailHandler {
  constructor(private readonly emailJobs: EmailJobs) {}

  // Runs once the sign-up committed. If Redis is down, the outbox retries with backoff.
  @OnOutboxMessage('user.signed-up', { consumer: 'welcome-mail' })
  async queueWelcome({ userId }: UserSignedUp) {
    await this.emailJobs.welcome(userId);
  }
}
```

- **Nothing to create.** `PostgresOutboxStore`, registered in the root module, keeps its messages in a schema of its own, `nest_outbox`, which it creates and migrates at startup outside production. In production, apply its migrations as a release step with `npx @nestjs/outbox migrate`, next to `npx drizzle-kit migrate` (see [Keep messages in your database](/reliability/outbox#keep-messages-in-your-database)).
- **Pass the transaction, never the database.** `outbox.add()` refuses the database itself, whose writes would commit on their own.
- **`notify()`** wakes the relay right after the commit. Without it, the message goes out at the next poll, a second later.
- **Redis down is a delay, not an error.** While `queue.add()` fails or hangs, the relay counts each attempt as failed and retries it with backoff, 20 times by default over 30 to 60 minutes. Sign-up has already answered 201. A message that never succeeds moves to the outbox's dead letters (see [Retries and the dead-letter queue](/reliability/outbox#retries-and-the-dead-letter-queue)).
- **Twice is harmless.** The relay delivers at least once, and the handler's inbox (`consumer`) skips most repeats. One that slips through adds a job whose id already exists, and BullMQ ignores it.

#### Send each email once

A job can run more than once. BullMQ retries a job that failed, even when its email had already gone out before the failure, and runs a job again when its worker stopped renewing its lock, after a crash or a long event-loop stall. The producer can add the same email twice too: the outbox delivers at least once, and the digest could be queued again after its job was removed. Each of these must not reach the user as a second email.

The `sent_emails` table records each email by its key. Before a worker sends, it **claims** the email with one conditional statement, and records it as sent once the mail server accepted it:

```typescript
@@filename(src/emails/sent-emails.repository)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sentEmails } from '../database/schema.js';

export class EmailInProgressError extends Error {}

@Injectable()
export class SentEmailsRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  /**
   * Runs `send` unless the email with this key was sent already. Of two workers that run the
   * same email at once, one sends it; the other throws EmailInProgressError, and its retry
   * finds it sent.
   */
  async sendOnce(key: string, userId: string, send: () => Promise<unknown>): Promise<'sent' | 'already sent'> {
    if (!(await this.claim(key, userId))) {
      const [row] = await this.db.select({ sentAt: sentEmails.sentAt }).from(sentEmails).where(eq(sentEmails.key, key));
      if (row?.sentAt) {
        return 'already sent';
      }
      throw new EmailInProgressError(`Email ${key} is being sent by another worker`);
    }
    try {
      await send();
    } catch (error) {
      // Give the claim back, so the job's retry can take it again.
      await this.db.delete(sentEmails).where(and(eq(sentEmails.key, key), isNull(sentEmails.sentAt)));
      throw error;
    }
    await this.db.update(sentEmails).set({ sentAt: sql`now()` }).where(eq(sentEmails.key, key));
    return 'sent';
  }

  /** One statement: inserts the claim, or takes over one that a crashed worker left behind. */
  private async claim(key: string, userId: string): Promise<boolean> {
    const claimed = await this.db
      .insert(sentEmails)
      .values({ key, userId })
      .onConflictDoUpdate({
        target: sentEmails.key,
        set: { claimedAt: sql`now()` },
        setWhere: sql`${sentEmails.sentAt} is null and ${sentEmails.claimedAt} < now() - interval '5 minutes'`,
      })
      .returning({ key: sentEmails.key });
    return claimed.length === 1;
  }
}
```

- **The claim is one statement.** `INSERT ... ON CONFLICT DO UPDATE ... WHERE` inserts the row, or takes over a claim that nobody finished within 5 minutes. Of two workers racing for the same email, PostgreSQL lets one of them insert the row; the other's statement waits for that insert to commit, then changes nothing. A `SELECT` to check for the row followed by an `INSERT` would let both through: the test at the end of this tutorial shows it.
- **The loser doesn't send.** If the email is marked sent, its job completes as `already sent`. If it's still being sent, the job throws, and BullMQ's retry, a few seconds later, finds it sent.
- **A failed send gives the claim back.** The job's next attempt claims it again. Without that, a mail server that refused the first attempt would leave a claim that blocks every retry for 5 minutes.
- **No transaction is held open during the send.** The claim commits on its own, so the send holds no database connection and no row lock for as long as the mail server takes.
- **A window remains.** A worker that crashes after the mail server accepted the email, before the `UPDATE`, leaves a claim without `sent_at`. Five minutes later a retry sends it again, with the same `idempotencyKey` (below), so the duplicate carries the same `Message-ID`, which Gmail and other receivers use to drop it. Over Resend, the key is an idempotency key the provider enforces. That's as close to exactly once as email gets.

The worker is a **processor**: a provider that extends `WorkerHost`, whose `process()` BullMQ calls for each job (see [Consumers](/application/queues#consumers)):

```typescript
@@filename(src/emails/email.processor)
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { MailError, Mailer } from '@nestjs/mail';
import { UnrecoverableError, type Job } from 'bullmq';
import { UsersRepository } from '../users/users.repository.js';
import { DigestMail } from './digest.mail.js';
import { DigestRepository } from './digest.repository.js';
import { digestKey, EMAILS_QUEUE, welcomeKey, type DigestJob, type WelcomeJob } from './email.jobs.js';
import { SentEmailsRepository } from './sent-emails.repository.js';
import { WelcomeMail } from './welcome.mail.js';

const sendOptions = (key: string) => ({
  // BullMQ retries the job: one attempt per run.
  retry: false as const,
  // A resend of the same email keeps its Message-ID.
  idempotencyKey: key,
  // Well under the 5-minute claim, so no send outlives it.
  signal: AbortSignal.timeout(60_000),
});

// Up to 5 jobs at once, in each process that runs the worker.
@Processor(EMAILS_QUEUE, { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  constructor(
    private readonly mailer: Mailer,
    private readonly usersRepository: UsersRepository,
    private readonly digestRepository: DigestRepository,
    private readonly sentEmails: SentEmailsRepository,
  ) {
    super();
  }

  async process(job: Job): Promise<string> {
    try {
      switch (job.name) {
        case 'welcome':
          return await this.welcome(job.data);
        case 'digest':
          return await this.digest(job.data);
        default:
          throw new UnrecoverableError(`Unknown job ${job.name}`);
      }
    } catch (error) {
      // A refused address won't be accepted on the next attempt: fail the job now.
      if (error instanceof MailError && error.permanent) {
        throw new UnrecoverableError(error.message);
      }
      throw error;
    }
  }

  private async welcome({ userId }: WelcomeJob) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      return 'user deleted';
    }
    const key = welcomeKey(userId);
    return this.sentEmails.sendOnce(key, userId, () =>
      this.mailer.send(WelcomeMail, { to: user.email, data: user, ...sendOptions(key) }),
    );
  }

  private async digest({ userId, day }: DigestJob) {
    const user = await this.usersRepository.findById(userId);
    const titles = await this.digestRepository.titlesOn(userId, day);
    if (!user || titles.length === 0) {
      return 'nothing to send';
    }
    const key = digestKey(userId, day);
    return this.sentEmails.sendOnce(key, userId, () =>
      this.mailer.send(DigestMail, { to: user.email, data: { day, titles }, ...sendOptions(key) }),
    );
  }
}
```

- **`retry: false`.** The mailer retries transient failures three times by default. BullMQ retries the job already, over minutes instead of seconds; retries at both layers would multiply.
- **`idempotencyKey`** is the email's key. The mailer derives the `Message-ID` header from it, so a resend of the same email carries the same one.
- **`signal`** aborts a send after a minute, and the job's retry tries again. The claim lasts 5 minutes, so it must outlive the longest send: an SMTP exchange can otherwise take up to 5 minutes for the message data alone, and a second worker would take the claim over while the first one is still sending.
- **`UnrecoverableError`** is BullMQ's: a job that throws it fails at once, without its remaining attempts. A mail error whose `permanent` flag is set, such as a 5xx SMTP reply (`550 User unknown`), won't succeed on the next attempt either. Every other error, a 4xx reply, a timeout or a dropped connection, is retried with the backoff.
- **`concurrency: 5`** lets one process send five emails at a time. Each process that runs the worker adds five more.
- **The user is read when the job runs.** A user deleted in the meantime gets nothing, and one who changed their address gets the email at the new one.

#### Send the digest from one instance

Every evening at 18:00 UTC, each user who changed notes that day gets a digest of them. Two queries, one for who gets a digest and one for its content:

```typescript
@@filename(src/emails/digest.repository)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, eq, gte, lt } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { notes } from '../database/schema.js';

/** The UTC day of `date`, as YYYY-MM-DD. */
export const utcDay = (date: Date) => date.toISOString().slice(0, 10);

@Injectable()
export class DigestRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  /** The users who changed a note on `day`. */
  async authorsOn(day: string): Promise<string[]> {
    const rows = await this.db.selectDistinct({ ownerId: notes.ownerId }).from(notes).where(changedOn(day));
    return rows.map((row) => row.ownerId);
  }

  /** The titles of the notes a user changed on `day`, oldest first. */
  async titlesOn(userId: string, day: string): Promise<string[]> {
    const rows = await this.db
      .select({ title: notes.title })
      .from(notes)
      .where(and(eq(notes.ownerId, userId), changedOn(day)))
      .orderBy(asc(notes.updatedAt))
      .limit(50);
    return rows.map((row) => row.title);
  }
}

function changedOn(day: string) {
  const start = new Date(`${day}T00:00:00Z`);
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  return and(gte(notes.updatedAt, start), lt(notes.updatedAt, end));
}
```

A scheduled job queues one email job per user. Queuing is fast, and each digest then has its own retries: a mail server that refuses one address delays nobody else's digest:

```typescript
@@filename(src/emails/digest.scheduler)
import { Injectable, Logger } from '@nestjs/common';
import { OnOneInstance } from '@nestjs/locks';
import { Cron } from '@nestjs/schedule';
import { DigestRepository, utcDay } from './digest.repository.js';
import { EmailJobs } from './email.jobs.js';

@Injectable()
export class DigestScheduler {
  private readonly logger = new Logger(DigestScheduler.name);

  constructor(
    private readonly digestRepository: DigestRepository,
    private readonly emailJobs: EmailJobs,
  ) {}

  // Every evening at 18:00 UTC, on one instance of the application.
  @Cron(process.env.DIGEST_CRON ?? '0 18 * * *', { name: 'daily-digest', timeZone: 'UTC' })
  @OnOneInstance({ key: 'mail:daily-digest' })
  async enqueueDigests(): Promise<number> {
    const day = utcDay(new Date());
    const userIds = await this.digestRepository.authorsOn(day);
    // One job per user: a slow or failing send delays nobody else's digest.
    await this.emailJobs.digests(day, userIds);
    this.logger.log(`Digests of ${day}: ${userIds.length} queued`);
    return userIds.length;
  }
}
```

`@nestjs/schedule` runs the method on every instance of the application. With three instances, three of them would query the notes and queue the same jobs. The job ids would make the extra jobs no-ops, but the work would still run three times, and a job that does something without a natural key, such as calling another service, would do it three times. `@OnOneInstance()` runs the method on one instance: the first one whose scheduler fires takes a lease on the job, renews it while it's up, and runs every tick, and the others skip theirs. If the owner dies, another instance takes over at its first tick after the lease expired, 30 seconds later. [Run each job on one instance](/reliability/locks#run-each-job-on-one-instance) explains the lease, and why ticks aren't caught up.

The cron expression comes from `process.env.DIGEST_CRON`, read when the file is loaded, which is before `ConfigModule` reads `.env`. Set it in the process's environment, as the [Try it](/tutorials/background-jobs#try-it) section does, to see a digest without waiting for the evening.

The instances agree on who holds the lease through a **lock store** they share. `@nestjs/locks` defines the contract, `LockStore`, and keeps the locks in memory until you register one, which only excludes callers in the same process: with `NODE_ENV` set to `production`, it refuses to start that way. The API has Redis already, so the store is the one from [The store on Redis](/reliability/locks#the-store-on-redis), on its own ioredis client:

```typescript
@@filename(src/redis/redis.module)
import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { Env } from '../config.js';

export const REDIS = Symbol('REDIS');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => new Redis(config.get('REDIS_URL', { infer: true })),
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  // After onModuleDestroy(), where running jobs finish and hand their locks back.
  async onApplicationShutdown() {
    await this.redis.quit();
  }
}
```

The lock store implements `LockStore` on that client:

```typescript
@@filename(src/redis/redis-lock.store)
import { Inject, Injectable } from '@nestjs/common';
import { LocksStorage, type LockAcquireResult, type LockStore } from '@nestjs/locks';
import type { Redis } from 'ioredis';
import { REDIS } from './redis.module.js';

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
    @Inject(REDIS) private readonly redis: Redis,
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

Each method is one Lua script, which Redis runs atomically: of any number of instances that try to acquire the lease at the same moment, one gets it. Give that Redis persistence and `maxmemory-policy noeviction`: an evicted lock is a lost lock, and the fencing counter must never go back. `RedisLockStore` is registered in the root module, next to the outbox's store.

#### Shut down without losing an email

A deploy stops each old instance with `SIGTERM`. `main.ts` already calls `app.enableShutdownHooks()`, from the JWT tutorial, and every part of this tutorial uses the hooks it enables:

1. In the first phase, BullMQ's workers close: they take no new jobs, and wait for the jobs they're running to finish. The digest's lease goes back, so another instance's next tick takes it without waiting 30 seconds, and the outbox relay finishes what it's publishing.
2. In the last phase, the queues close their Redis connections, the lock store's client quits, and the database pool ends. Nothing that a finishing job needs is closed before it finished.

The platform waits for that, but not forever: Kubernetes sends `SIGKILL` 30 seconds after `SIGTERM` by default (`terminationGracePeriodSeconds`). Keep it longer than your longest job. A process killed in the middle of a job loses nothing: BullMQ notices that the job's lock expired, and runs it again on another worker (see [stalled jobs](https://docs.bullmq.io/guide/workers/stalled-jobs) in the BullMQ documentation), where `sent_emails` takes care of the email that may have gone out.

##### Run the workers in a process of their own

Everything so far runs in one process: the API, the workers, the relay and the scheduler. That's a good start. Once sending mail competes with requests for CPU, or you want to scale the two apart, run the workers in their own processes. The application context runs the same modules without the HTTP server:

```typescript
@@filename(src/worker)
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

// The same application without the HTTP server: it runs the email jobs, the outbox relay and the digest.
const app = await NestFactory.createApplicationContext(AppModule, { instrument: ObserveInstrument });
app.enableShutdownHooks();
```

Add a script for it to `package.json`:

```json
"start:worker": "node dist/worker"
```

Then start the API instances with `MAIL_WORKER=off`, which leaves `EmailProcessor` out of `EmailsModule` (it's read when the module file loads, like `DIGEST_CRON`, so set it in the environment), and the workers with `npm run start:worker`. The API instances add jobs, and the worker processes send them. The outbox relay and the digest scheduler can run in either kind of process: the relay shares its work through leases in PostgreSQL, and the digest runs on one instance wherever it is.

#### Try it

Build the application and start it, with the digest every ten seconds instead of every evening (a six-field expression starts with the seconds):

```bash
$ npm run build
$ DIGEST_CRON='*/10 * * * * *' npm run start:prod
```

At startup, the outbox and the locks log their stores, and on the first start the outbox's store creates its schema:

```bash
LOG [OutboxModule] OutboxStorage: PostgresOutboxStore
LOG [LocksModule] LocksStorage: RedisLockStore
LOG [OutboxModule] PostgresOutboxStore: migrated schema "nest_outbox" to version 1.
```

Sign up. The response comes back before any email is sent (tokens shortened):

```bash
$ curl localhost:3000/auth/sign-up --json '{"email":"ada@example.com","password":"correct horse battery"}'
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","refreshToken":"...","expiresIn":900}
```

A moment later the worker sends the welcome email, which the log transport writes to the console:

```bash
LOG [LogMailTransport] "Welcome to Notes" to ada@example.com
DEBUG [LogMailTransport] Hi ada@example.com,

your account is ready. On the days you change notes, we'll send you a digest of them in the evening.
```

Add two notes, one of them with markup in its title:

```bash
$ TOKEN=eyJhbGciOiJIUzI1NiIs...
$ curl localhost:3000/notes -H "Authorization: Bearer $TOKEN" --json '{"title":"Plan the trip"}'
$ curl localhost:3000/notes -H "Authorization: Bearer $TOKEN" --json '{"title":"Fix the <script> tag"}'
```

At the next tick, the instance takes the digest's lease and queues Ada's digest. The text part shows the title as Ada wrote it; in the HTML part, it's escaped:

```bash
LOG [Locks] DigestScheduler.enqueueDigests runs on this instance (lease "mail:daily-digest:owner", fencing token 1)
LOG [DigestScheduler] Digests of 2026-11-19: 1 queued
LOG [LogMailTransport] "Your notes on 2026-11-19" to ada@example.com
DEBUG [LogMailTransport] You changed 2 notes today:

- Plan the trip
- Fix the <script> tag
```

Start a second instance from another terminal. Its ticks are skipped, since the first instance holds the lease:

```bash
$ PORT=3001 DIGEST_CRON='*/10 * * * * *' npm run start:prod
DEBUG [Locks] Skipped DigestScheduler.enqueueDigests: it runs on another instance
DEBUG [Locks] Skipped DigestScheduler.enqueueDigests: it runs on another instance
```

The first instance keeps queuing Ada's digest every ten seconds, and no second digest goes out: the job's id is still in Redis, so BullMQ doesn't add it again, and the job ran once. Each email was sent once:

```bash
$ docker exec notes-db psql -U postgres -d notes -c "SELECT key, sent_at FROM sent_emails"
                          key                           |            sent_at
--------------------------------------------------------+-------------------------------
 welcome-43a07bfa-3964-429c-b940-1d592c4d0f6a           | 2026-11-19 22:15:13.292295+00
 digest-43a07bfa-3964-429c-b940-1d592c4d0f6a-2026-11-19 | 2026-11-19 22:15:20.026325+00
```

Finally, stop Redis and sign up again. Sign-up still succeeds, as fast as before:

```bash
$ docker stop notes-redis
$ curl -s -o /dev/null -w '%{http_code} in %{time_total}s\n' localhost:3000/auth/sign-up --json '{"email":"grace@example.com","password":"correct horse battery"}'
201 in 0.434314s
```

The outbox can't hand the message to the queue, and retries. The digest's ticks fail too, since the lock store doesn't answer, and are skipped; ioredis also logs the refused connections. Start Redis again, and the welcome email goes out:

```bash
WARN [OutboxRelay] Retrying user.signed-up 01a1f5e1-0d77-7110-8846-f7efc7ed9ad8 in 772ms (attempt 1 of 20 failed): OutboxPublishTimeoutError: Publish did not settle within 10000ms
ERROR [Scheduler] Error: DigestScheduler.enqueueDigests did not run: the lock store failed (RedisLockStore.acquire() for the lock "mail:daily-digest:owner" did not answer within 10000ms (storeTimeout))
$ docker start notes-redis
LOG [LogMailTransport] "Welcome to Notes" to grace@example.com
```

#### Test it

The tests run the real application against a real PostgreSQL server, through a pool, where two runs of the same job really race, and a real Redis, where BullMQ runs the jobs. Only delivery is replaced: `InMemoryMailTransport` from `@nestjs/mail` keeps every mail it receives, with helpers that find one, and `failNext()` makes the next send fail (see [Testing](/application/mail#testing)). A small subclass can also hold the next send open, as a slow mail server would.

The Vitest configuration points the application at the tests' own Redis database, and moves the digest's schedule to a date that never comes during a test run, since the tests call it themselves:

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
      // A Redis database of the tests' own: they empty it.
      REDIS_URL: process.env.TEST_REDIS_URL ?? 'redis://localhost:6379/15',
      // February 29th, 3 AM: the tests run the digest themselves.
      DIGEST_CRON: '0 3 29 2 *',
    },
  },
});
```

The tests check the welcome email, a job running three times at once, retries and refusals, the digest on two instances, and shutdown:

```typescript
@@filename(test/emails.e2e-spec)
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { PasswordHasher } from '@nestjs/authentication';
import { getQueueToken } from '@nestjs/bullmq';
import { getDrizzleToken } from '@nestjs/drizzle';
import { InMemoryMailTransport, MailSmtpError, MailTransport, type MailMessage } from '@nestjs/mail';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { AppModule } from '../src/app.module.js';
import { sentEmails, users } from '../src/database/schema.js';
import { DigestMail } from '../src/emails/digest.mail.js';
import { DigestScheduler } from '../src/emails/digest.scheduler.js';
import { EMAILS_QUEUE, EmailJobs, welcomeKey } from '../src/emails/email.jobs.js';
import { WelcomeMail } from '../src/emails/welcome.mail.js';

/** Keeps the mails, and can hold the next send open, as a slow mail server would. */
class Mailbox extends InMemoryMailTransport {
  private gate?: { started: () => void; released: Promise<void> };

  holdNext() {
    let started!: () => void;
    let release!: () => void;
    const sending = new Promise<void>((resolve) => (started = resolve));
    this.gate = { started, released: new Promise((resolve) => (release = resolve)) };
    return { sending, release };
  }

  override async send(message: MailMessage) {
    const gate = this.gate;
    this.gate = undefined;
    gate?.started();
    await gate?.released;
    return super.send(message);
  }
}

// A real PostgreSQL with a pool, so two runs of one job really race.
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('Emails (e2e)', () => {
  const db = drizzle({ client: new Pool({ connectionString: url, max: 20 }) });
  const mailbox = new Mailbox();
  let app: NestNodeApplication;
  let queue: Queue;

  /** An instance of the application, on a pool of its own. Several share the queue and the locks. */
  async function start() {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(drizzle({ client: new Pool({ connectionString: url }) }))
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      .overrideProvider(MailTransport)
      .useValue(mailbox)
      .compile();
    const instance = moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter());
    await instance.init();
    return instance;
  }

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    await db.execute(sql`TRUNCATE users, refresh_tokens CASCADE`);
    await db.execute(sql`DROP SCHEMA IF EXISTS nest_outbox CASCADE`); // the store creates it again
    // Jobs and locks left over from an earlier run would be processed at startup.
    const redis = new Redis(process.env.REDIS_URL!);
    await redis.flushdb();
    await redis.quit();
    app = await start();
    queue = app.get<Queue>(getQueueToken(EMAILS_QUEUE));
  });

  afterAll(() => db.$client.end());
  beforeEach(() => mailbox.clear());

  let clients = 0;

  async function signUp(email: string) {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password: 'correct horse battery' },
      remoteAddress: `10.0.0.${++clients}`, // sign-up is rate-limited per IP address
    });
    expect(res.statusCode).toBe(201);
    return { authorization: `Bearer ${res.json<{ accessToken: string }>().accessToken}` };
  }

  /** A user inserted directly, so no welcome job is queued for them. */
  async function createUser(email: string) {
    const [user] = await db.insert(users).values({ email, passwordHash: 'unused' }).returning();
    return user.id;
  }

  /** Waits for a job to finish, and returns it. */
  function finished(id: string) {
    return vi.waitUntil(
      async () => {
        const job = await queue.getJob(id);
        return job?.finishedOn ? job : undefined;
      },
      { timeout: 10_000 },
    );
  }

  it('sends a welcome email after sign-up, outside the request', async () => {
    await signUp('ada@example.com');

    const mail = await vi.waitUntil(() => mailbox.find({ to: 'ada@example.com', mail: WelcomeMail }));
    expect(mail.subject).toBe('Welcome to Notes');
  });

  it('sends one email, however many times its job runs at once', async () => {
    const userId = await createUser('bob@example.com');
    const { sending, release } = mailbox.holdNext(); // the first send takes a moment
    const options = { attempts: 3, backoff: { type: 'fixed', delay: 500 } };

    // Three copies of the job: a redelivery, or a job added again after the first was removed.
    const jobs = await Promise.all([1, 2, 3].map(() => queue.add('welcome', { userId }, options)));
    await sending;
    await sleep(200); // the other two copies run meanwhile
    release();
    const results = await Promise.all(jobs.map((job) => finished(job.id!)));

    expect(results.map((job) => job.returnvalue).sort()).toEqual(['already sent', 'already sent', 'sent']);
    expect(results.map((job) => job.attemptsMade).sort()).toEqual([1, 2, 2]); // the copies waited for the first
    expect(mailbox.filter({ to: 'bob@example.com' })).toHaveLength(1);
  });

  it('retries a send that failed', async () => {
    mailbox.failNext(new MailSmtpError('DATA', { code: 451, text: 'Try again later' }));
    const userId = await createUser('carol@example.com');

    await app.get(EmailJobs).welcome(userId);
    const job = await finished(welcomeKey(userId));

    expect(job.attemptsMade).toBe(2); // the second attempt, 2 seconds later, sent it
    mailbox.assertSent({ to: 'carol@example.com', mail: WelcomeMail });
  });

  it('fails a send that the mail server refuses, without retrying', async () => {
    mailbox.failNext(new MailSmtpError('RCPT TO', { code: 550, text: 'User unknown' }));
    const userId = await createUser('nobody@example.com');

    await app.get(EmailJobs).welcome(userId);
    const job = await finished(welcomeKey(userId));

    expect(await job.getState()).toBe('failed');
    expect(job.attemptsMade).toBe(1);
    const claims = await db.select().from(sentEmails).where(eq(sentEmails.userId, userId));
    expect(claims).toEqual([]); // released: sending it again later is possible
  });

  it('queues the digests on one instance, and escapes what users wrote', async () => {
    const dave = await signUp('dave@example.com');
    await app.inject({ method: 'POST', url: '/notes', headers: dave, payload: { title: 'Fix <script> tag' } });
    const other = await start();

    // Both instances' schedulers fire at the same moment.
    const runs = await Promise.all([app, other].map((instance) => instance.get(DigestScheduler).enqueueDigests()));
    await other.close();

    expect(runs.filter((run) => run !== undefined)).toEqual([1]); // the other instance skipped it
    const mail = await vi.waitUntil(() => mailbox.find({ to: 'dave@example.com', mail: DigestMail }));
    expect(mail.html).toContain('<li>Fix &lt;script&gt; tag</li>');
  });

  it('finishes the email in flight before it shuts down', async () => {
    const { sending, release } = mailbox.holdNext();
    const userId = await createUser('erin@example.com');
    await app.get(EmailJobs).welcome(userId);
    await sending;

    let closed = false;
    const closing = app.close().then(() => (closed = true));
    await sleep(500);
    expect(closed).toBe(false); // waiting for the worker's job
    release();
    await closing;

    mailbox.assertSent({ to: 'erin@example.com' });
    const [claim] = await db.select().from(sentEmails).where(eq(sentEmails.userId, userId));
    expect(claim.sentAt).not.toBeNull();
  });
});
```

- **Copies of a job race.** The first copy's send is held open, so the other two run while it's in flight: they find the claim, fail their first attempt, and their retries find the email sent. `attemptsMade` shows the race happened.
- **The retry test uses the application's own job options.** The 451 reply is transient, so the job runs again after the 2-second backoff, and the second attempt sends the email.
- **Two instances, one digest run.** Both instances' schedulers fire at once, and only one of the calls runs; the other resolves without running.
- **Shutdown waits for the job in flight**, and the email's row is marked sent before `close()` resolves.

Create the test database, and run the tests with a Redis database number of their own, since they empty it. Both test files use the same database, so they run one after the other:

```bash
$ docker exec notes-db psql -U postgres -c "CREATE DATABASE notes_test"
$ TEST_DATABASE_URL=postgres://postgres:notes@localhost:5432/notes_test TEST_REDIS_URL=redis://localhost:6379/1 npm run test:e2e -- --no-file-parallelism

 Test Files  2 passed (2)
      Tests  11 passed (11)
```

Replace the claim in `sendOnce()` with a `SELECT` for the row and an `INSERT` after the send, and "sends one email, however many times its job runs at once" fails: two of the three copies send the email.

#### Production checklist

Everything in the JWT tutorial's [checklist](/tutorials/rest-api-jwt-authentication#production-checklist) applies. For the emails and the jobs in particular:

- **Send through a real transport.** Set `MAIL_TRANSPORT=smtp` and `SMTP_URL`, or swap in an HTTP provider's transport. With `NODE_ENV=production`, the mail module warns at startup that `LogMailTransport` doesn't deliver mail. Configure SPF, DKIM and DMARC for the sending domain; the [mail chapter's checklist](/application/mail#production-checklist) covers the rest.
- **Give Redis persistence and `maxmemory-policy noeviction`.** The queue's jobs and the locks live there. An evicted job is an email that never goes out, and an evicted lock lets a second instance run the digest.
- **Apply the outbox's migrations on deploy**, with `npx @nestjs/outbox migrate`, next to `npx drizzle-kit migrate`. With `NODE_ENV=production`, the store doesn't migrate at startup, and refuses to start while its schema is behind. `npx @nestjs/outbox status` checks it in CI.
- **Keep the grace period longer than the longest job**, so a deploy's `SIGTERM` lets the email in flight finish.
- **Watch the failed set and the dead letters.** A job that used up its attempts stays in BullMQ's failed set for a week, and a message the outbox couldn't hand over moves to its dead letters. Alert on both.
- **Prune what grows.** `sent_emails` gains a row per email, and the outbox's inbox a row per message: delete old rows from a scheduled job, keeping more than any redelivery window. Once notes grow, index `notes.updated_at` for the digest's query.
- **Send at the rate your provider allows.** BullMQ's worker can take a rate limit (see [Rate limiting](https://docs.bullmq.io/guide/rate-limiting) in the BullMQ documentation); `concurrency` alone bounds parallel sends, not sends per second.
- **Give production its own Observe key pair**, from the project's **API Keys** page, as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment of the API and the worker processes: `start:prod` and `start:worker` don't load `.env`. [NestJS Observe](/observability/dashboard) then records the email jobs and the digest's cron runs as jobs, with their queue wait time, attempt number and failure reason next to their duration, and a **job silence** rule alerts when a named job, such as the digest, hasn't reported for longer than you allow. `ObserveModule` comes before `BullModule` in `imports`, so a job still running at a deploy's `SIGTERM` is reported too (see [Shutdown](/observability/sdk#shutdown)).

#### What's next

- Verify email addresses and reset passwords, with the mail this tutorial set up: [Authentication](/security/authentication#verify-email-addresses).
- Translate the emails into each user's language: [Send it in the customer's language](/application/mail#send-it-in-the-customers-language).
- Run jobs on PostgreSQL instead of Redis: [Pluggable backends](/application/queues#pluggable-backends-postgresql).
- Learn what the outbox guarantees, and how its relay shares work between instances: [Outbox](/reliability/outbox#delivery-guarantees).
- Keep a long scheduled job from overlapping itself, and fence its writes: [Distributed locks](/reliability/locks#dont-let-a-long-run-overlap-itself).
