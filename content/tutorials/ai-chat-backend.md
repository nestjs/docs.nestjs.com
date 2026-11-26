### Build an AI chat backend in Node.js that streams answers

Build an AI chatbot backend in Node.js with NestJS: tools that read only the user's own data, answers streamed to the browser, and saved conversations.

The assistant works over a notes API: a signed-in user asks about their notes, the model looks them up with tools that run as that user, and the answer streams to the browser as the model writes it. Calling a model takes a few lines. The work is in what surrounds the call: the model must never read another user's notes, a browser that closes mid-answer must stop the paid call, the history sent to the model must stay within a budget, and a double-clicked send must not start two answers. This tutorial spends its time on those parts.

By the end, the API will:

- Call a model configured once, from the environment, through [`@nestjs/ai`](/ai/overview): with timeouts, retries, a cap on the output tokens of each model call, and a token budget for each answer.
- Give the model three tools over the notes, which run as the signed-in user and can't reach anyone else's notes.
- Stream each answer as server-sent events, in the AI SDK's UI message stream protocol that `useChat()` reads, and abort the model call when the browser goes away.
- Keep conversations in PostgreSQL, answer one message at a time per conversation, and send the model the latest history that fits a budget.
- Limit how many messages each user sends per hour.
- Run its end-to-end tests, and a development server, with a fake model instead of a provider, so neither needs an API key.

It starts from the API of [Build a REST API with JWT authentication](/tutorials/rest-api-jwt-authentication), which signs users in with access and refresh tokens, validates requests with Zod, and keeps notes in PostgreSQL through Drizzle. This tutorial doesn't explain those parts again.

These are the endpoints, and the section that adds each one:

| Endpoint | Section |
| --- | --- |
| `POST /auth/sign-up`, `POST /auth/token`, `POST /auth/token/refresh`, `POST /auth/token/revoke`, `GET /me`, `GET /notes`, `GET /notes/:id`, `POST /notes`, `PATCH /notes/:id`, `DELETE /notes/:id`, `GET /health/live`, `GET /health/ready` | [Start from the JWT API](/tutorials/ai-chat-backend#start-from-the-jwt-api) |
| `POST /conversations`, `GET /conversations`, `GET /conversations/:id`, `DELETE /conversations/:id` | [Store conversations](/tutorials/ai-chat-backend#store-conversations) |
| `POST /conversations/:id/messages` | [Stream the answer](/tutorials/ai-chat-backend#stream-the-answer) |

> info **Hint** The finished application is on GitHub as [nestjs/example-ai-chat-backend](https://github.com/nestjs/example-ai-chat-backend), with its tests and a CI workflow.

You need Node.js 22 or later and a PostgreSQL server. For real answers you also need an API key of a model provider; this tutorial uses Anthropic's, as the [AI chapter](/ai/overview) does. Every model answer on this page comes from `FakeModel`, the scripted model of `@nestjs/ai/testing`: a real model writes different text, and decides for itself which tools to call, but the tools, the stream, the history and the limits around them run the same code.

#### Start from the JWT API

Create the project, and install everything this tutorial uses. These are the JWT tutorial's packages plus `@nestjs/ai`, `@nestjs/resilience`, whose policies model calls run on, the [AI SDK](https://ai-sdk.dev) (`ai`), and its Anthropic provider:

```bash
$ npm i -g @nestjs/cli
$ nest new notes-assistant --minimal
$ cd notes-assistant
$ npm uninstall @nestjs/platform-express @types/express
$ npm i --save @nestjs/platform-node zod @nestjs/config @nestjs/drizzle drizzle-orm@rc pg @nestjs/authentication @nestjs/throttler @nestjs/swagger @nestjs/terminus @nestjs/ai @nestjs/resilience ai @ai-sdk/anthropic
$ npm i --save-dev drizzle-kit@rc @types/pg @nestjs/testing vitest vite
```

Then take these files from the [finished JWT tutorial](/tutorials/rest-api-jwt-authentication#sign-users-in-with-jwts), as they are:

- `src/main.ts`, `src/database/schema.ts` and `drizzle.config.ts`
- everything under `src/auth/`, `src/users/`, `src/health/` and `src/notes/`
- `test/refresh-token.store.e2e-spec.ts`

Leave out the JWT tutorial's `drizzle/` folder, since this application's first migration comes from its own schema, and `test/notes.e2e-spec.ts`, which runs on PGlite: this tutorial's tests need a PostgreSQL server. `src/config.ts`, `src/app.module.ts` and `vitest.config.e2e.ts` are shown in full below. Add the test script to `package.json`:

```json
"test:e2e": "vitest run --config ./vitest.config.e2e.ts"
```

Start a database, and add its URL and a `JWT_SECRET` to `.env`, as in the JWT tutorial. Without an API key, set `AI_MODEL=fake`, described in the next section:

```bash
$ docker run -d --name assistant-db -e POSTGRES_PASSWORD=assistant -e POSTGRES_DB=assistant -p 5432:5432 postgres:17
```

Its URL goes in `.env`, with the signing secret and the model setting:

```bash
DATABASE_URL=postgres://postgres:assistant@localhost:5432/assistant
# Generate with: openssl rand -base64 32
JWT_SECRET=
# Either your Anthropic API key...
# ANTHROPIC_API_KEY=
# ...or the scripted model, which needs none (development only).
AI_MODEL=fake
```

#### Configure the model

`@nestjs/ai` registers models by name, and every call through `AiService` runs under the timeouts, retries and limits of its model and of the module (see [Models](/ai/models)). Configure the model once, from the environment. The configuration schema gains three variables:

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
    // An Anthropic model id, or `fake` for a scripted model that needs no API key.
    AI_MODEL: z.string().min(1).default('claude-opus-5-5'),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    // The most output tokens of one model call: an answer makes up to `maxSteps` of them.
    AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(1).max(8_000).default(1_000),
  })
  .superRefine((env, ctx) => {
    if (env.AI_MODEL === 'fake' && env.NODE_ENV === 'production') {
      ctx.addIssue({ code: 'custom', path: ['AI_MODEL'], message: 'The fake model is for development and tests' });
    }
    if (env.AI_MODEL !== 'fake' && !env.ANTHROPIC_API_KEY) {
      ctx.addIssue({ code: 'custom', path: ['ANTHROPIC_API_KEY'], message: `Required for the model ${env.AI_MODEL}` });
    }
  });

export type Env = z.infer<typeof envSchema>;
```

- `AI_MODEL` is the model's id at Anthropic, `claude-opus-5-5` unless you set another. `fake` selects a scripted model, for development and tests, and the schema refuses it in production.
- `ANTHROPIC_API_KEY` is required for any other model, so a missing key stops the application at startup rather than at the first question.
- `AI_MAX_OUTPUT_TOKENS` caps the output of each model call. An answer makes at most five of them (`maxSteps` below), so it writes at most five times that.

The root module builds the model in a factory, from `ConfigService`, as [Async configuration](/ai/overview#async-configuration) describes. With the modules this tutorial adds, it is:

```typescript
@@filename(src/app.module)
import { createAnthropic } from '@ai-sdk/anthropic';
import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AiModule } from '@nestjs/ai';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { DrizzleModule } from '@nestjs/drizzle';
import { createObserveModule } from '@nestjs/observe';
import { ThrottlerGuard, ThrottlerModule, hours, minutes, normalizeIp } from '@nestjs/throttler';
import { drizzle } from 'drizzle-orm/node-postgres';
import { accountEmail } from './auth/account-email.js';
import { AuthModule } from './auth/auth.module.js';
import { ChatModule } from './chat/chat.module.js';
import { envSchema, type Env } from './config.js';
import { HealthModule } from './health/health.module.js';
import { NotesModule } from './notes/notes.module.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'notes-assistant',
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
    AiModule.forRootAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService<Env, true>) => {
        const modelId = config.get('AI_MODEL', { infer: true });
        const model =
          modelId === 'fake'
            ? // Loaded only when configured: production never imports the testing entry point.
              (await import('./chat/fake-model.js')).createFakeModel()
            : createAnthropic({ apiKey: config.get('ANTHROPIC_API_KEY', { infer: true }) })(modelId);
        return {
          models: {
            default: { model, maxOutputTokens: config.get('AI_MAX_OUTPUT_TOKENS', { infer: true }) },
          },
          defaults: {
            timeout: '30s',
            retry: { attempts: 3 },
            // Model calls per answer: the tools' results each take one more.
            maxSteps: 5,
            // Input and output tokens over all the model calls of one answer.
            budget: { maxTokens: 60_000 },
          },
        };
      },
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
      // Per user, on the chat route: counted by ChatThrottlerGuard, once the user is known.
      {
        name: 'chat',
        ttl: hours(1),
        limit: 30,
        skipIf: (context) => !context.switchToHttp().getRequest().user,
        getTracker: (req) => req.user.id,
      },
    ]),
    UsersModule,
    AuthModule,
    NotesModule,
    ChatModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

- `isGlobal: true` lets the chat module inject `AiService`.
- `maxOutputTokens` in the `default` model's definition is sent with every model call to it. A model call that reaches it stops there, with the finish reason `'length'`.
- `defaults` apply to every call. An attempt may take 30 seconds, which for a streamed answer is the time until its first chunk. What the provider marks retryable, 408, 409, 429 and 5xx responses and failed connections, gets three attempts, with backoff (see [Retries, timeouts and fallback](/ai/models#retries-timeouts-and-fallback)). `maxSteps` caps the model calls of one answer: each round of tool results the model reads takes one more. `budget` stops an answer before its next model call once its model calls have used 60,000 tokens, input and output. It's checked before each model call, so the last one can take an answer a little over (see [Usage, cost and budgets](/ai/models#usage-cost-and-budgets)).
- The fake model is imported only when `AI_MODEL` is `fake`, so a production process never loads `@nestjs/ai/testing`.
- The throttler's `chat` definition is explained in [Limit each user](/tutorials/ai-chat-backend#limit-each-user), and `ChatModule` in the sections before it.

A configuration that can't work stops the application before it serves a request:

```bash
$ NODE_ENV=production AI_MODEL=fake npm run start
ERROR [ExceptionHandler] Error: Config validation error: AI_MODEL: The fake model is for development and tests
$ AI_MODEL=claude-opus-5-5 npm run start
ERROR [ExceptionHandler] Error: Config validation error: ANTHROPIC_API_KEY: Required for the model claude-opus-5-5
```

##### Develop without an API key

`FakeModel` answers each call with what you script, and records the calls it receives (see [The fake model](/ai/testing#the-fake-model)). It's a real language model to the AI SDK, so with it the application runs as it does with a provider: the model's tool calls run the real tools, as the signed-in user, and its answer streams in word-sized chunks. This one searches the notes for the last word of the question, then names the notes it found:

```typescript
@@filename(src/chat/fake-model)
import { FakeModel } from '@nestjs/ai/testing';

/**
 * A scripted model, for development without an API key: it searches the notes for the last word
 * of the question, with the real search-notes tool, then streams the titles it found.
 */
export function createFakeModel() {
  return new FakeModel((call) => {
    if (call.toolResults.length === 0) {
      const words = call.lastUserMessage?.match(/[\p{L}\p{N}]+/gu) ?? ['note'];
      return { toolCalls: [{ name: 'search-notes', input: { query: words[words.length - 1] } }] };
    }
    const found = call.toolResults[0].output;
    if (!Array.isArray(found)) {
      return `The search failed: ${String(found)}`;
    }
    const titles = found.map((note: { title: string }) => `"${note.title}"`).join(', ');
    const text = found.length === 0 ? 'None of your notes mention that.' : `Your notes mention it in ${titles}.`;
    return { text, chunkDelay: 40 };
  });
}
```

The development server, the frontend and the tests then need no API key, and cost nothing.

#### Store conversations

The browser could send the whole conversation with each message, as the AI chapter's [chat route](/ai/agents#streaming-to-the-browser) does. The client would then decide what the model reads, tool results included, and could make them up. Here the server keeps each conversation, and the client sends only its new message.

Two tables join the JWT tutorial's schema, which needs `bigint` and `integer` in its imports:

```typescript
@@filename(src/database/schema)
import type { ModelMessage } from 'ai';
import { bigint, boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
// ...

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    // Set while an answer is being written: one answer at a time per conversation.
    answeringUntil: at('answering_until'),
    createdAt: at('created_at').notNull().defaultNow(),
    updatedAt: at('updated_at').notNull().defaultNow(),
  },
  (table) => [index('conversations_owner_id_updated_at_idx').on(table.ownerId, table.updatedAt)],
);

export const messages = pgTable(
  'messages',
  {
    // Increasing, so the messages of a turn keep the order they were inserted in.
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    // A message as the model reads it: the user's text, the model's answer and tool calls, or the tools' results.
    content: jsonb('content').$type<ModelMessage>().notNull(),
    // An estimate of its size in tokens, which the history is trimmed by.
    tokens: integer('tokens').notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  (table) => [index('messages_conversation_id_id_idx').on(table.conversationId, table.id)],
);

// ...

export type Note = typeof notes.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
```

- **A message is stored as the model reads it**: an AI SDK `ModelMessage`, in `jsonb`. That's the user's question, the model's answers and tool calls, and the tools' results, so sending the history is reading the rows back.
- **The `id` is an identity column.** The messages of a turn are inserted by one statement, so they share their `created_at`; their ids keep them in order.
- **`tokens` is an estimate of each message's size**, about four characters per token, which the history's budget adds up. The exact count is the provider's, and differs by model; the budget leaves room for the difference.
- **`answering_until` is set while an answer is written**, so that a conversation answers one message at a time.

Generate the migration and apply it (see [Migrations](/data/drizzle#migrations)):

```bash
$ npx drizzle-kit generate --name=chat
$ npx drizzle-kit migrate
```

The request bodies:

```typescript
@@filename(src/chat/chat.schemas)
import { z } from 'zod';

export const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(200).default('New conversation'),
});
export type CreateConversationDto = z.infer<typeof createConversationSchema>;

export const sendMessageSchema = z.object({
  text: z.string().trim().min(1).max(4_000),
});
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
```

`ConversationsService` reads and writes conversations, always with their owner in the statement, as `NotesService` does for notes:

```typescript
@@filename(src/chat/conversations.service)
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { ModelMessage } from 'ai';
import { and, asc, desc, eq, isNull, lt, or, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { conversations, messages, type Conversation } from '../database/schema.js';

/** The most an answer may take, tools included: then its call is aborted, and the conversation freed. */
export const ANSWER_TIMEOUT_MS = 120_000;
/** A claim outlives its answer, so only a process that died mid-answer leaves one behind. */
const CLAIM_SECONDS = ANSWER_TIMEOUT_MS / 1000 + 30;
/** The history sent to the model, at most, in estimated tokens. */
const HISTORY_BUDGET = 8_000;

/** About four characters per token, for English text and JSON: an estimate, not the model's count. */
const estimateTokens = (message: ModelMessage) => Math.ceil(JSON.stringify(message.content).length / 4);

@Injectable()
export class ConversationsService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async create(ownerId: string, title: string): Promise<Conversation> {
    const [conversation] = await this.db.insert(conversations).values({ ownerId, title }).returning();
    return conversation;
  }

  findAll(ownerId: string): Promise<Conversation[]> {
    return this.db
      .select()
      .from(conversations)
      .where(eq(conversations.ownerId, ownerId))
      .orderBy(desc(conversations.updatedAt))
      .limit(100);
  }

  async findOne(ownerId: string, id: string) {
    const [conversation] = await this.db.select().from(conversations).where(this.owned(ownerId, id));
    if (!conversation) {
      notFound();
    }
    const rows = await this.db
      .select({ content: messages.content, createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.id));
    return { ...conversation, messages: rows.map(({ content, createdAt }) => ({ ...content, createdAt })) };
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const deleted = await this.db
      .delete(conversations)
      .where(this.owned(ownerId, id))
      .returning({ id: conversations.id });
    if (deleted.length === 0) {
      notFound();
    }
  }

  /** Marks the conversation as answering, or throws: 404 if it isn't the owner's, 409 while another answer runs. */
  async claim(ownerId: string, id: string): Promise<void> {
    // One conditional statement: of two messages sent at once, one claims the conversation.
    const claimed = await this.db
      .update(conversations)
      .set({ answeringUntil: sql`now() + make_interval(secs => ${CLAIM_SECONDS})` })
      .where(
        and(
          this.owned(ownerId, id),
          // A claim past its time was left by a process that died mid-answer.
          or(isNull(conversations.answeringUntil), lt(conversations.answeringUntil, sql`now()`)),
        ),
      )
      .returning({ id: conversations.id });
    if (claimed.length === 0) {
      const [exists] = await this.db.select({ id: conversations.id }).from(conversations).where(this.owned(ownerId, id));
      if (!exists) {
        notFound();
      }
      throw new ConflictException('The assistant is still answering in this conversation');
    }
  }

  /** The latest messages that fit the budget, starting at a question of the user. */
  async history(id: string): Promise<ModelMessage[]> {
    const rows = await this.db
      .select({ content: messages.content, tokens: messages.tokens })
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(desc(messages.id))
      .limit(200);
    const kept: ModelMessage[] = [];
    let total = 0;
    for (const { content, tokens } of rows) {
      if (total + tokens > HISTORY_BUDGET) {
        break;
      }
      total += tokens;
      kept.push(content);
    }
    // Cut at a user message: a tool result whose tool call was trimmed away is refused by providers.
    while (kept.length > 0 && kept[kept.length - 1].role !== 'user') {
      kept.pop();
    }
    return kept.reverse();
  }

  /** Saves a whole turn, the question and everything the call added, and frees the conversation. */
  async saveTurn(id: string, turn: ModelMessage[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      // One statement for the turn: its messages are stored together, in order, or not at all.
      await tx
        .insert(messages)
        .values(turn.map((content) => ({ conversationId: id, content, tokens: estimateTokens(content) })));
      await tx
        .update(conversations)
        .set({ answeringUntil: null, updatedAt: new Date() })
        .where(eq(conversations.id, id));
    });
  }

  /** Frees the conversation after an answer that failed or was cancelled. Nothing of the turn is kept. */
  async release(id: string): Promise<void> {
    await this.db.update(conversations).set({ answeringUntil: null }).where(eq(conversations.id, id));
  }

  private owned(ownerId: string, id: string) {
    return and(eq(conversations.id, id), eq(conversations.ownerId, ownerId));
  }
}

function notFound(): never {
  throw new NotFoundException('Conversation not found');
}
```

- **`claim()` is one conditional `UPDATE`.** A double-clicked send, or a second tab, posts two messages to one conversation at the same moment. Both would read the same history, both would start a paid model call, and the second answer wouldn't know about the first. PostgreSQL locks the row while it updates it, so of two claims at the same moment, the second waits for the first, then finds `answering_until` set, changes nothing, and answers 409. An answer is aborted after `ANSWER_TIMEOUT_MS`, as the next section shows, and a claim lasts 30 seconds longer, so one past its time was left by a process that died mid-answer, and is taken over. A [test](/tutorials/ai-chat-backend#test-it) sends ten messages at once; a claim that reads the row, checks it in JavaScript and then writes it let five or six of them through in every run.
- **`history()` walks back from the newest message** until the budget is spent, then drops messages from the oldest end until the history starts with a question. A history that started with a tool's result, whose tool call the budget cut off, is refused by providers.
- **`saveTurn()` inserts the whole turn with one statement**, and frees the conversation in the same transaction. A turn is saved complete or not at all, so the history never holds a question without its answer, or a tool call without its result.

#### Give the model tools

An agent function is a method of one of your providers that the model may call, with arguments it fills in (see [Tools](/ai/tools)). The assistant gets three, over `NotesService`, which needs a search for the first:

```typescript
@@filename(src/notes/notes.service)
import { and, desc, eq, ilike, or } from 'drizzle-orm';
// ...

@Injectable()
export class NotesService {
  // ...

  /** The owner's notes whose title or body contains `query`, newest first. */
  search(ownerId: string, query: string, limit = 10): Promise<Note[]> {
    const pattern = `%${escapeLike(query)}%`;
    return this.db
      .select()
      .from(notes)
      .where(and(eq(notes.ownerId, ownerId), or(ilike(notes.title, pattern), ilike(notes.body, pattern))))
      .orderBy(desc(notes.updatedAt), desc(notes.id))
      .limit(limit);
  }

  // ...
}

// ...

/** `%` and `_` in the search are literal characters, not wildcards. */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);
```

The model picks a tool by its name and description, and fills in the arguments from their `.describe()` texts:

```typescript
@@filename(src/notes/notes.tools)
import { Injectable } from '@nestjs/common';
import { AgentFunction, type AgentFunctionContext } from '@nestjs/ai';
import { CurrentUser } from '@nestjs/authentication';
import { SkipThrottle } from '@nestjs/throttler';
import { z } from 'zod';
import type { Note } from '../database/schema.js';
import { createNoteSchema, type CreateNoteDto } from './notes.schemas.js';
import { NotesService } from './notes.service.js';

/** What the model reads about a note: no owner, no internal columns. */
const view = ({ id, title, body, updatedAt }: Note) => ({ id, title, body, updatedAt });

// Global guards run on agent function calls too, and the throttler's would count
// every call of every user as one client: the chat route is limited instead.
@SkipThrottle({ default: true, account: true, chat: true })
@Injectable()
export class NotesTools {
  constructor(private readonly notesService: NotesService) {}

  @AgentFunction({
    name: 'search-notes',
    description: "Search the user's notes for a word or phrase, in titles and bodies. Returns up to 10, newest first.",
    inputSchema: z.object({
      query: z.string().trim().min(1).max(100).describe('A word or phrase to look for, such as "dentist"'),
    }),
  })
  async search({ query }: { query: string }, _ctx: AgentFunctionContext, @CurrentUser('id') userId: string) {
    const found = await this.notesService.search(userId, query);
    return found.map(view);
  }

  @AgentFunction({
    name: 'read-note',
    description: "Read one of the user's notes in full, by its id.",
    inputSchema: z.object({ noteId: z.uuid().describe('The id of a note, from search-notes') }),
  })
  async read({ noteId }: { noteId: string }, _ctx: AgentFunctionContext, @CurrentUser('id') userId: string) {
    // Someone else's note is "Note not found", as on GET /notes/:id.
    return view(await this.notesService.findOne(userId, noteId));
  }

  @AgentFunction({
    name: 'create-note',
    description: 'Save a new note for the user, when they ask you to remember or write something down.',
    inputSchema: createNoteSchema,
  })
  async create(dto: CreateNoteDto, _ctx: AgentFunctionContext, @CurrentUser('id') userId: string) {
    return view(await this.notesService.create(userId, dto));
  }
}
```

Register the tools in the notes module, next to the service they call:

```typescript
@@filename(src/notes/notes.module)
import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller.js';
import { NotesService } from './notes.service.js';
import { NotesTools } from './notes.tools.js';

@Module({
  controllers: [NotesController],
  providers: [NotesService, NotesTools],
})
export class NotesModule {}
```

- **The owner never comes from the model.** No input schema has a user id. `@CurrentUser('id')` reads the user that the authentication guard loaded for the request the call runs in (see [With @nestjs/authentication and @nestjs/authorization](/ai/tools#with-nestjsauthentication-and-nestjsauthorization)), and `NotesService` puts it in the `WHERE` clause of each statement, as for the routes. Whatever id the model passes, it reaches only the user's own notes: someone else's note is `Note not found`, which the model reads as the tool's error. A note whose text tells the model to do something can make it call a tool, but still only as the same user.
- **Global guards run on agent function calls too.** That's how authentication reaches them, and it's also why the class skips all three throttler definitions: the global `ThrottlerGuard` reads an HTTP request that a tool call doesn't have, and counts every tool call of every user as one client. Without it, after 100 tool calls in a minute, across all users, every tool fails with `ThrottlerException: Too Many Requests`. The chat route is limited per user instead.
- **The model reads what the methods return**, as JSON. `view()` leaves out the owner's id, which the model has no use for.
- **`create-note` reuses the route's schema.** Arguments it refuses never reach the method: the model is told what's wrong, and can try again.

`AiModule` finds the agent functions of every module of the application, so registering `NotesTools` as a provider of `NotesModule` is all it takes.

#### Stream the answer

`ChatService` claims the conversation, sends the model the history and the new question, and returns the answer as a stream:

```typescript
@@filename(src/chat/chat.service)
import { Injectable, Logger } from '@nestjs/common';
import { AiModelError, AiService } from '@nestjs/ai';
import type { ModelMessage } from 'ai';
import { NotesTools } from '../notes/notes.tools.js';
import { ANSWER_TIMEOUT_MS, ConversationsService } from './conversations.service.js';

const instructions =
  "You are the assistant of a notes app. Answer from the user's notes: search them before you answer " +
  'a question about them, and say so when nothing matches. Save a note only when the user asks you to. ' +
  'Keep answers short.';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly ai: AiService,
    private readonly conversationsService: ConversationsService,
  ) {}

  /** Streams the answer to `text` as the AI SDK's UI message stream, and saves the turn once it's complete. */
  async answer(userId: string, conversationId: string, text: string, request: unknown): Promise<Response> {
    await this.conversationsService.claim(userId, conversationId);
    try {
      return await this.stream(conversationId, text, request);
    } catch (error) {
      await this.conversationsService.release(conversationId);
      throw error;
    }
  }

  private async stream(conversationId: string, text: string, request: unknown): Promise<Response> {
    const question: ModelMessage = { role: 'user', content: text };
    const history = await this.conversationsService.history(conversationId);
    const answer = this.ai.streamText({
      label: 'chat',
      instructions,
      messages: [...history, question],
      tools: [NotesTools],
      // The agent functions run as the user who sent the request.
      caller: { request },
      abortSignal: AbortSignal.timeout(ANSWER_TIMEOUT_MS),
    });

    // When the call ends, the whole turn is saved; when it fails or is cancelled, none of it is.
    const settled = answer.responseMessages
      .then(
        (added) => this.conversationsService.saveTurn(conversationId, [question, ...added]),
        () => this.conversationsService.release(conversationId),
      )
      .catch((error: unknown) => this.logger.error(`Could not save the turn of ${conversationId}`, error));

    const response = answer.toUIMessageStreamResponse({
      errorText: (error) =>
        error instanceof AiModelError ? 'The assistant is unavailable. Try again in a minute.' : 'Something went wrong.',
    });
    // The stream ends once the turn is saved, so the client's next message finds it in the history.
    const body = response.body!.pipeThrough(new TransformStream({ flush: () => settled }));
    return new Response(body, response);
  }
}
```

- **`streamText()` starts the call and returns at once.** `tools` offers the model every agent function of `NotesTools`, and `caller` passes the request, which is how the agent functions know the user.
- **`abortSignal` ends an answer that runs longer than `ANSWER_TIMEOUT_MS`**, tools included. That's what makes a claim older than it safe to take over.
- **`toUIMessageStreamResponse()` returns the answer as a web-standard `Response`** of server-sent events, in the AI SDK's UI message stream protocol, with the header `x-accel-buffering: no`, which tells nginx not to buffer it. After 15 seconds without a chunk, as while a tool works, it sends a `: keep-alive` comment, so that proxies don't close the connection as idle.
- **When the call ends, the turn is saved**, from `responseMessages`. When it fails, or is cancelled, the conversation is freed, and nothing of the turn is kept: the browser still shows the question, and can send it again.
- **The stream ends once that's done.** The `TransformStream`'s `flush()` holds the end of the stream until the turn is saved. Without it, the stream ends as soon as the model finishes, a moment before the save, and a client that sends its next message right away can get a 409, or a history without the last turn.

The handler returns the `Response`, and Nest sends it as the model writes it (see [Streaming responses](/http/streaming-responses)). When the browser goes away, Nest cancels the response's body. The cancellation travels through `pipeThrough()` to the stream of `streamText()`, and cancelling that aborts the model call and the `signal` of any agent function running, so no one pays for an answer nobody reads (see [Client disconnection](/http/streaming-responses#client-disconnection)).

The response's status, 200, goes out when the stream starts, so a model call that fails reaches the browser in the stream: an `error` chunk, with the text `errorText` gives it. An `AiModelError` means every attempt failed, because the provider is down, stays overloaded past the retries, or refuses the API key, so the user is asked to try again. Any other error, such as an answer that has spent its budget, gets a message that says nothing about the server. The AI chapter's `pipeUIMessageStreamToResponse()` waits for the first chunk instead, so that exception filters can answer an early failure with an error status, but it ends the response itself, which leaves no place to save the turn before the end.

The controller:

```typescript
@@filename(src/chat/chat.controller)
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { NodeRequest } from '@nestjs/platform-node';
import { z } from 'zod';
import { ChatThrottlerGuard } from './chat-throttler.guard.js';
import {
  createConversationSchema,
  sendMessageSchema,
  type CreateConversationDto,
  type SendMessageDto,
} from './chat.schemas.js';
import { ChatService } from './chat.service.js';
import { ConversationsService } from './conversations.service.js';

const conversationId = { schema: z.uuid() };

@Controller('conversations')
export class ChatController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly chatService: ChatService,
  ) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body({ schema: createConversationSchema }) dto: CreateConversationDto) {
    return this.conversationsService.create(userId, dto.title);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.conversationsService.findAll(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id', conversationId) id: string) {
    return this.conversationsService.findOne(userId, id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser('id') userId: string, @Param('id', conversationId) id: string) {
    return this.conversationsService.remove(userId, id);
  }

  // Answers with a stream of server-sent events, which Nest sends as the model writes them.
  @Post(':id/messages')
  @UseGuards(ChatThrottlerGuard)
  send(
    @CurrentUser('id') userId: string,
    @Param('id', conversationId) id: string,
    @Body({ schema: sendMessageSchema }) { text }: SendMessageDto,
    @Req() request: NodeRequest,
  ) {
    return this.chatService.answer(userId, id, text, request);
  }
}
```

The chat module registers the controller, and the services that keep conversations and run the agent:

```typescript
@@filename(src/chat/chat.module)
import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { ConversationsService } from './conversations.service.js';

@Module({
  controllers: [ChatController],
  providers: [ConversationsService, ChatService],
})
export class ChatModule {}
```

> info **Hint** Returning a `Response` from a handler needs `@nestjs/core` 12.4.0 or later. Its status is always the `Response`'s own, so the `POST` route answers 200 rather than 201, and `@HttpCode()` has no effect on it.

##### In the browser

`useChat()` from `@ai-sdk/react` reads this stream as it reads the AI chapter's (see [Streaming to the browser](/ai/agents#streaming-to-the-browser)). By default it posts the whole conversation. This server keeps the conversation, so give `useChat()` a transport that sends the new message's text alone:

```typescript
import { DefaultChatTransport } from 'ai';

const transport = new DefaultChatTransport({
  api: `/conversations/${conversationId}/messages`,
  headers: { Authorization: `Bearer ${accessToken}` },
  // The server keeps the history: send the new message's text alone.
  prepareSendMessagesRequest: ({ messages }) => ({
    body: {
      text: messages
        .at(-1)!
        .parts.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join(''),
    },
  }),
});
```

The answer arrives as one message, whose `parts` hold its text, and its tool calls as `tool-search-notes` parts, with their `input` and `output`. To show a past conversation, read it from `GET /conversations/:id`.

#### Limit each user

Every message costs model calls, so limit how many each user sends. A limit per IP address, like the one on the sign-in routes, would share one allowance among everyone behind an office's address, and let a single user spend it. The `chat` [throttler definition](/security/rate-limiting#multiple-throttler-definitions) in `AppModule` counts per user, 30 messages an hour, with the user's id as its tracker.

The global `ThrottlerGuard` runs before the authentication guard, which is what lets it count requests with guessed tokens, but it means the user isn't known yet when it runs. So it skips `chat`, whose `skipIf` finds no user, and a guard bound to the chat route counts it, after authentication:

```typescript
@@filename(src/chat/chat-throttler.guard)
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerRequest } from '@nestjs/throttler';

/**
 * Counts the `chat` limit per signed-in user. Bound to the chat route, it runs after the global
 * guards, authentication's included, so the user is known; the global throttler guard skips
 * `chat` (it runs before authentication), and this one counts nothing else.
 */
@Injectable()
export class ChatThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    return requestProps.throttler.name === 'chat' ? super.handleRequest(requestProps) : true;
  }
}
```

`@UseGuards(ChatThrottlerGuard)` on the route runs after the global guards. The guard counts only `chat`, since the global guard has counted the other definitions already. The 31st message within an hour gets a 429, whose `Retry-After-chat` header is the number of seconds until the user may send again, and other users aren't affected.

With the cap and the budget, this bounds what one user can spend in an hour: 30 answers, each of at most five model calls of at most 1,000 output tokens, and none starting a model call once it has used 60,000 tokens.

> info **Hint** The throttler counts in memory by default, so each instance of the API allows 30 messages an hour of its own. With more than one instance, use shared [storage](/security/rate-limiting#storages).

#### Try it

Start the application, with `AI_MODEL=fake` in `.env`. The answers below are the fake model's, and the tool calls are the ones it scripts; everything else is the application's:

```bash
$ npm run start
```

Sign up, and write a few notes (tokens and response bodies are shortened here and below):

```bash
$ curl localhost:3000/auth/sign-up --json '{"email":"ada@example.com","password":"correct horse battery"}'
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","refreshToken":"...","expiresIn":900}
$ ADA="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
$ curl localhost:3000/notes -H "$ADA" --json '{"title":"Buy milk","body":"Oat milk, 2 litres"}'
$ curl localhost:3000/notes -H "$ADA" --json '{"title":"Dentist on Tuesday","body":"9:00, and ask about the milk teeth"}'
$ curl localhost:3000/notes -H "$ADA" --json '{"title":"Book club","body":"Finish chapter 3"}'
```

Start a conversation, and ask. `-N` turns off curl's buffering, so the events appear as the server sends them: the tool call, what the tool returned, then the answer, a word at a time:

```bash
$ curl localhost:3000/conversations -H "$ADA" --json '{"title":"Errands"}'
{"id":"a399d467-1c20-4927-9361-365e90dee98a","ownerId":"861e2960-fd51-4e00-aa97-6fa35d805417","title":"Errands","answeringUntil":null,"createdAt":"2026-11-19T22:14:15.991Z","updatedAt":"2026-11-19T22:14:15.991Z"}
$ curl -N -i localhost:3000/conversations/a399d467-1c20-4927-9361-365e90dee98a/messages -H "$ADA" --json '{"text":"What did I write about milk?"}'
HTTP/1.1 200 OK
X-RateLimit-Limit-chat: 30
X-RateLimit-Remaining-chat: 29
content-type: text/event-stream; charset=utf-8
x-accel-buffering: no
x-vercel-ai-ui-message-stream: v1

data: {"type":"start"}

data: {"type":"start-step"}

data: {"type":"tool-input-available","toolCallId":"call-1","toolName":"search-notes","input":{"query":"milk"}}

data: {"type":"tool-output-available","toolCallId":"call-1","output":[{"id":"def5fe96-8183-4db4-aa7e-e37a6a95dcc0","title":"Dentist on Tuesday","body":"9:00, and ask about the milk teeth","updatedAt":"2026-11-19T22:14:15.960Z"},{"id":"9e1ac526-c3b4-46b1-8941-fef441506ddc","title":"Buy milk","body":"Oat milk, 2 litres","updatedAt":"2026-11-19T22:14:15.942Z"}]}

data: {"type":"finish-step"}

data: {"type":"start-step"}

data: {"type":"text-start","id":"text-0"}

data: {"type":"text-delta","id":"text-0","delta":"Your "}

data: {"type":"text-delta","id":"text-0","delta":"notes "}

data: {"type":"text-delta","id":"text-0","delta":"mention "}

...

data: {"type":"text-delta","id":"text-0","delta":"milk\"."}

data: {"type":"text-end","id":"text-0"}

data: {"type":"finish-step"}

data: {"type":"finish","finishReason":"stop"}

data: [DONE]
```

The search found the two notes that mention milk, in a title or a body, and left the third out. Two messages sent to one conversation at the same moment, here from two curl commands started together, get one answer and one 409:

```bash
$ curl localhost:3000/conversations/a399d467-1c20-4927-9361-365e90dee98a/messages -H "$ADA" --json '{"text":"And the book club?"}'
{"message":"The assistant is still answering in this conversation","error":"Conflict","statusCode":409}
```

Each answered message is saved as a turn: the question, the tool call, the tool's result and the answer, in order:

```bash
$ curl localhost:3000/conversations/a399d467-1c20-4927-9361-365e90dee98a -H "$ADA"
{"id":"a399d467-...","title":"Errands","answeringUntil":null,...,"messages":[{"role":"user","content":"What did I write about milk?","createdAt":"2026-11-19T22:14:16.753Z"},{"role":"assistant","content":[{"type":"tool-call","input":{"query":"milk"},"toolName":"search-notes","toolCallId":"call-1"}],...},{"role":"tool","content":[{"type":"tool-result","output":{"type":"json","value":[...]},"toolName":"search-notes","toolCallId":"call-1"}],...},{"role":"assistant","content":[{"text":"Your notes mention it in \"Dentist on Tuesday\", \"Buy milk\".","type":"text"}],...},{"role":"user","content":"And the book club?",...},...]}
```

Another user gets a 404 for Ada's conversation, for reading it and for sending to it:

```bash
$ BOB="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
$ curl localhost:3000/conversations/a399d467-1c20-4927-9361-365e90dee98a/messages -H "$BOB" --json '{"text":"Hi"}'
{"message":"Conversation not found","error":"Not Found","statusCode":404}
```

After 30 messages in an hour, Ada's next one gets a 429. Deleting the conversation deletes its messages:

```bash
$ curl -i localhost:3000/conversations/a399d467-1c20-4927-9361-365e90dee98a/messages -H "$ADA" --json '{"text":"One more about milk?"}'
HTTP/1.1 429 Too Many Requests
Retry-After-chat: 3600
{"statusCode":429,"message":"ThrottlerException: Too Many Requests"}
$ curl -X DELETE localhost:3000/conversations/a399d467-1c20-4927-9361-365e90dee98a -H "$ADA"
$ curl localhost:3000/conversations/a399d467-1c20-4927-9361-365e90dee98a -H "$ADA"
{"message":"Conversation not found","error":"Not Found","statusCode":404}
```

#### Test it

The end-to-end tests boot the real `AppModule`, with a `FakeModel` in place of the configured model. `overrideModels()` from `@nestjs/ai/testing` replaces it by name, and keeps the rest of its definition: `maxOutputTokens`, timeouts and retries (see [Overriding models in end-to-end tests](/ai/testing#overriding-models-in-end-to-end-tests)). The agent functions run for real, with their guards, on a real PostgreSQL server through a connection pool, where two claims of a conversation really race. And the application listens on a port, because the tests read answers as they stream, and hang up mid-answer, which `app.inject()`, which hands back the whole response at once, can't do.

The test configuration sets `AI_MODEL` to `fake`, so the tests need no API key either:

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
      // The tests put fake models in place of this one: no API key needed.
      AI_MODEL: 'fake',
    },
  },
});
```

The tests sign users up, script the fake model's answers, and check the tools, the stream, the abort, the history budget and the limits:

```typescript
@@filename(test/chat.e2e-spec)
import { fileURLToPath } from 'node:url';
import { PasswordHasher } from '@nestjs/authentication';
import { FakeModel, overrideModels, providerError } from '@nestjs/ai/testing';
import { getDrizzleToken } from '@nestjs/drizzle';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { AppModule } from '../src/app.module.js';
import { conversations } from '../src/database/schema.js';

// A real PostgreSQL with a pool, so two messages sent at once really race.
const url = process.env.TEST_DATABASE_URL;

type Chunk = { type: string; [key: string]: any };

describe.skipIf(!url)('Chat API (e2e)', () => {
  const db = drizzle({ client: new Pool({ connectionString: url, max: 10 }) });
  const model = new FakeModel();
  let app: NestNodeApplication;
  let baseUrl: string;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    await db.execute(sql`TRUNCATE users, refresh_tokens CASCADE`);
    const moduleRef = await overrideModels(Test.createTestingModule({ imports: [AppModule] }), { default: model })
      .overrideProvider(getDrizzleToken())
      .useValue(db)
      // scrypt at the default cost takes 128 MiB and a few hundred ms per hash.
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      .compile();
    app = moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter());
    // A real server: the tests read the answer chunk by chunk, and hang up mid-answer.
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(() => app.close()); // closes the pool too

  let clients = 0;

  /** Signs a user up, with a note, and returns the headers that authenticate as them. */
  async function signUp(email: string, note = { title: 'Buy milk', body: 'Oat milk, 2 litres' }) {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password: 'correct horse battery' },
      // Sign-up is rate-limited per IP address: each user signs up from their own.
      remoteAddress: `10.0.0.${++clients}`,
    });
    const headers = { authorization: `Bearer ${res.json<{ accessToken: string }>().accessToken}` };
    const created = await app.inject({ method: 'POST', url: '/notes', headers, payload: note });
    return { headers, noteId: created.json<{ id: string }>().id };
  }

  async function startConversation(headers: Record<string, string>) {
    const res = await app.inject({ method: 'POST', url: '/conversations', headers, payload: {} });
    return res.json<{ id: string }>().id;
  }

  function send(headers: Record<string, string>, conversationId: string, text: string, signal?: AbortSignal) {
    return fetch(`${baseUrl}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
      signal,
    });
  }

  /** The server-sent events of a response, as UI message chunks, read as they arrive. */
  async function* events(response: Response): AsyncGenerator<Chunk> {
    const decoder = new TextDecoder();
    let buffer = '';
    for await (const bytes of response.body!) {
      buffer += decoder.decode(bytes, { stream: true });
      let end: number;
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        const event = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (event.startsWith('data: {')) {
          yield JSON.parse(event.slice('data: '.length));
        }
      }
    }
  }

  async function readAll(response: Response) {
    const chunks: Chunk[] = [];
    for await (const chunk of events(response)) {
      chunks.push(chunk);
    }
    return chunks;
  }

  const textOf = (chunks: Chunk[]) =>
    chunks
      .filter((chunk) => chunk.type === 'text-delta')
      .map((chunk) => chunk.delta)
      .join('');

  it("answers from the user's own notes, and saves the turn", async () => {
    const ada = await signUp('ada@example.com');
    await signUp('bob@example.com', { title: 'Milk for the cat', body: "Bob's note" });
    const conversationId = await startConversation(ada.headers);
    model.reply({ toolCalls: [{ name: 'search-notes', input: { query: 'milk' } }] }, (call) => {
      const notes = call.toolResults[0].output as Array<{ title: string }>;
      return `You have ${notes.length} note: ${notes[0].title}.`;
    });

    const response = await send(ada.headers, conversationId, 'What did I write about milk?');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const chunks = await readAll(response);

    // Bob's note matches too, and the tool never saw it.
    const output = chunks.find((chunk) => chunk.type === 'tool-output-available')?.output;
    expect(output).toEqual([expect.objectContaining({ title: 'Buy milk' })]);
    expect(textOf(chunks)).toBe('You have 1 note: Buy milk.');
    expect(model.lastCall?.options.maxOutputTokens).toBe(1000);

    // The stream ended once the turn was saved: a message sent right away gets the history.
    model.reply('Anything else?');
    const next = await send(ada.headers, conversationId, 'Thanks!');
    expect(next.status).toBe(200);
    await readAll(next);
    expect(model.lastCall?.options.prompt.map((message) => message.role)).toEqual([
      'system',
      'user',
      'assistant',
      'tool',
      'assistant',
      'user',
    ]);
  });

  it('runs the tools as the signed-in user only', async () => {
    const carol = await signUp('carol@example.com');
    const dave = await signUp('dave@example.com', { title: "Dave's diary", body: 'Private' });
    const conversationId = await startConversation(carol.headers);
    model.reply(
      { toolCalls: [{ name: 'read-note', input: { noteId: dave.noteId } }] },
      { toolCalls: [{ name: 'create-note', input: { title: 'Call mum' } }] },
      'Saved.',
    );

    await readAll(await send(carol.headers, conversationId, `Read note ${dave.noteId}, then remind me to call mum`));

    // Dave's note is as missing as one that doesn't exist.
    expect(model.calls.at(-2)?.toolResults).toEqual([
      expect.objectContaining({ toolName: 'read-note', output: 'Note not found' }),
    ]);
    const notes = await app.inject({ method: 'GET', url: '/notes', headers: carol.headers });
    expect(notes.json().map((note: { title: string }) => note.title)).toEqual(['Call mum', 'Buy milk']);
  });

  it('streams the answer as the model writes it', async () => {
    const { headers } = await signUp('erin@example.com');
    const conversationId = await startConversation(headers);
    model.reply({ text: 'One two three four five', chunkDelay: 100 });

    const arrivals: number[] = [];
    for await (const chunk of events(await send(headers, conversationId, 'Count to five'))) {
      if (chunk.type === 'text-delta') {
        arrivals.push(performance.now());
      }
    }

    expect(arrivals).toHaveLength(5);
    // Each word arrived on its own, about 100 ms after the one before.
    expect(arrivals[4] - arrivals[0]).toBeGreaterThan(300);
  });

  it('aborts the model call when the client goes away', async () => {
    const { headers } = await signUp('frank@example.com');
    const conversationId = await startConversation(headers);
    model.reply({ text: 'A long answer that nobody reads to its end', chunkDelay: 200 });
    const client = new AbortController();

    const response = await send(headers, conversationId, 'Tell me a long story', client.signal);
    for await (const chunk of events(response)) {
      if (chunk.type === 'text-delta') {
        break;
      }
    }
    client.abort(); // the browser tab closes
    await vi.waitFor(() => expect(model.lastCall?.options.abortSignal?.aborted).toBe(true));

    // Nothing of the turn was kept, and the conversation takes the next message.
    await vi.waitFor(async () => {
      const saved = await app.inject({ method: 'GET', url: `/conversations/${conversationId}`, headers });
      expect(saved.json()).toMatchObject({ answeringUntil: null, messages: [] });
    });
    model.reply('Here is a shorter one.');
    const next = await send(headers, conversationId, 'A shorter one, then');
    expect(textOf(await readAll(next))).toBe('Here is a shorter one.');
  });

  it('answers one message at a time per conversation', async () => {
    const { headers } = await signUp('grace@example.com');
    const conversationId = await startConversation(headers);
    // One answer: only one of the messages reaches the model.
    model.reply({ text: 'First', delay: 200 });

    // Open the pool's connections first, so no request waits for one: they all race.
    await Promise.all(Array.from({ length: 10 }, () => db.execute(sql`select pg_sleep(0.05)`)));
    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        app.inject({ method: 'POST', url: `/conversations/${conversationId}/messages`, headers, payload: { text: 'Hi' } }),
      ),
    );

    expect(responses.map((res) => res.statusCode).sort()).toEqual([200, ...Array(9).fill(409)]);

    // A claim left behind by a process that died, past its time, is taken over.
    await db
      .update(conversations)
      .set({ answeringUntil: new Date(Date.now() - 1_000) })
      .where(eq(conversations.id, conversationId));
    model.reply('Back.');
    expect(textOf(await readAll(await send(headers, conversationId, 'Still there?')))).toBe('Back.');
  });

  it('sends the model the latest history that fits the budget, from a question', async () => {
    // Every search returns this note: about 2,500 tokens per turn.
    const { headers } = await signUp('heidi@example.com', { title: 'Long', body: 'x'.repeat(10_000) });
    const conversationId = await startConversation(headers);
    for (let turn = 1; turn <= 4; turn++) {
      model.reply({ toolCalls: [{ name: 'search-notes', input: { query: 'long' } }] }, 'Found it.');
      await readAll(await send(headers, conversationId, `Question ${turn}`));
    }
    model.reply('Done.');

    await readAll(await send(headers, conversationId, 'Question 5'));

    const prompt = model.lastCall!.options.prompt;
    // The first turn didn't fit, and the history starts at a question, never at a tool result.
    expect(prompt[1].role).toBe('user');
    const questions = prompt.filter((message) => message.role === 'user').map((message) => message.content);
    expect(JSON.stringify(questions)).not.toContain('Question 1');
    expect(JSON.stringify(questions)).toContain('Question 2');
  });

  it('retries an overloaded provider, and tells the user when it fails', async () => {
    const { headers } = await signUp('ivan@example.com');
    const conversationId = await startConversation(headers);
    const unavailable = { type: 'error', errorText: 'The assistant is unavailable. Try again in a minute.' };
    // Overloaded, then answers: retried.
    model.reply(providerError(529), 'Back again.');
    expect(textOf(await readAll(await send(headers, conversationId, 'Hello?')))).toBe('Back again.');

    // A revoked API key: not retried, and the stream says so.
    model.reply(providerError(401, { message: 'Invalid API key' }));
    const refused = await send(headers, conversationId, 'Are you there?');
    expect(refused.status).toBe(200);
    expect(await readAll(refused)).toContainEqual(unavailable);

    // A stream that breaks after its first words ends with the same error.
    model.reply({ text: 'Your notes say', streamError: providerError(500) });
    const broken = await readAll(await send(headers, conversationId, 'What do my notes say?'));
    expect(textOf(broken)).toBe('Your notes say');
    expect(broken.at(-1)).toEqual(unavailable);

    // Only the answered turn was kept.
    const saved = await app.inject({ method: 'GET', url: `/conversations/${conversationId}`, headers });
    expect(saved.json()).toMatchObject({ answeringUntil: null });
    expect(saved.json().messages).toHaveLength(2);
  });

  it('limits how many messages each user sends', async () => {
    const { headers } = await signUp('ken@example.com');
    const conversationId = await startConversation(headers);
    model.reply(...Array.from({ length: 30 }, () => 'OK.'));
    for (let i = 0; i < 30; i++) {
      await readAll(await send(headers, conversationId, `Message ${i}`));
    }

    const limited = await send(headers, conversationId, 'One more');
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after-chat')).toBeTruthy();

    // Another user isn't limited by Ken's messages.
    const other = await signUp('lena@example.com');
    model.reply('Hi Lena.');
    expect((await send(other.headers, await startConversation(other.headers), 'Hi')).status).toBe(200);
  });
});
```

- **One `FakeModel` serves every test**, which queues the answers each test needs with `reply()`. A test that leaves an answer unused hands it to the next test, so the race test queues one answer: only one of its ten messages reaches the model.
- **The race test opens the pool's connections first.** Otherwise the first request gets the connection the pool has open, while the others wait for new ones, and it claims the conversation before they arrive. It then backdates the claim, as a process that died would leave it, and the next message takes it over.
- **`model.lastCall` is what the model was sent**: `options.prompt` is the history and the question, as the provider would get them, and `options.maxOutputTokens` the cap. A tool's failure is in the next call's `toolResults`, as the model reads it.
- **`providerError()` is the error a provider package throws** for an HTTP status (see [Retries, timeouts and fallback](/ai/testing#retries-timeouts-and-fallback)). The 401 isn't retried, and the 529 is, after a backoff of up to a second, so the test waits that long.

Run them against a database of their own, one file after the other, since both truncate tables:

```bash
$ docker exec assistant-db psql -U postgres -c "CREATE DATABASE assistant_test"
$ TEST_DATABASE_URL=postgres://postgres:assistant@localhost:5432/assistant_test npm run test:e2e -- --no-file-parallelism

 Test Files  2 passed (2)
      Tests  13 passed (13)
```

Replace the conditional `UPDATE` in `claim()` with a read, a check in JavaScript and a write, and "answers one message at a time per conversation" fails: five or six of the ten messages get past the claim. Pass `preventCancel: true` to `pipeThrough()`, so the cancellation stops at the wrapper, and "aborts the model call when the client goes away" fails: the model call is never aborted.

#### Production checklist

Everything in the JWT tutorial's [checklist](/tutorials/rest-api-jwt-authentication#production-checklist) applies. For the assistant in particular:

- **Keep `ANTHROPIC_API_KEY` in your platform's secret store**, injected at runtime, and set `NODE_ENV` to `production`, which refuses the fake model.
- **Let the stream through.** A proxy or load balancer in front of the API must pass `text/event-stream` responses on as they come, and keep a connection open for as long as an answer takes. The `x-accel-buffering` header covers nginx, and the keep-alive comments cover idle timeouts of 15 seconds or more. Don't put the [compression](/http/compression) middleware on the chat route: it buffers.
- **Share the throttler's storage** once you run more than one instance, or each one allows every user 30 messages an hour.
- **Meter what each user spends.** Give the model its `pricing`, and record the usage events of each call per user, with the call's `onUsage` (see [Usage, cost and budgets](/ai/models#usage-cost-and-budgets)).
- **Decide how long conversations live.** A turn keeps what its tools returned, so a deleted note stays in the conversations that read it, until they're deleted too. Delete conversations past a retention period, and when a user asks.
- **Keep the tools to what the user may do anyway.** Text in a note, written by the user or pasted from anywhere, reaches the model and can steer it. The tools run as the user, so the worst it can do is what the user could do. Leave out tools that destroy data, or make them wait for a person's approval, as [Durable agent runs](/ai/agents#durable-agent-runs) do.
- **Give production its own Observe key pair**, from the project's **API Keys** page, as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the platform's environment: `start:prod` doesn't load `.env`. [NestJS Observe](/observability/overview) then records every call to a model provider on its outbound span in the request's trace, with the model, the input, output and cached tokens, and for a stream the time to its first event; prompts and answers are never sent to Observe (see [Model calls](/observability/sdk#model-calls)). A [production rule](/observability/production-rules) can bound how many model calls a request makes.

#### What's next

- Find notes by what they mean, not only by their words: [Embeddings](/ai/embeddings).
- Serve the same tools to MCP clients, such as a desktop assistant: [Serving MCP clients too](/ai/tools#serving-mcp-clients-too).
- Let an agent wait for a person's approval, across restarts: [Durable agent runs](/ai/agents#durable-agent-runs).
- Test agent functions on their own, and structured output: [Testing](/ai/testing).
- See the model calls of each request in production: [Observability](/observability/overview).
