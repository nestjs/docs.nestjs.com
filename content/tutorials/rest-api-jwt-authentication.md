### Build a REST API with JWT authentication in Node.js

Build a production-ready REST API with JWT authentication in Node.js and TypeScript with NestJS and PostgreSQL, from one file to a deployable app.

The API stores personal notes. Users sign up with an email and a password, get a short-lived JWT access token and a rotating refresh token, and read and write only their own notes. Each building block has its own chapter in this documentation; this tutorial puts them together in the order a real project needs them, and links to the chapter whenever you want the details.

By the end, the API will:

- Validate every request body, query string and route parameter with [Zod](https://zod.dev/) schemas, which also type the handlers.
- Sign users in with [`@nestjs/authentication`](/security/authentication): passwords hashed with scrypt, HS256 access tokens, and refresh tokens that rotate on every use and revoke their whole family when one is reused.
- Keep users, notes and refresh tokens in PostgreSQL, through [Drizzle](/data/drizzle).
- Refuse to start when its configuration is missing or malformed.
- Limit how fast anyone can guess passwords.
- Send security headers with every response, and accept browser requests only from the origins you list.
- Describe itself in an OpenAPI document, with Swagger UI.
- Answer liveness and readiness checks, and shut down cleanly on `SIGTERM`.
- Write its logs as JSON in production, with passwords and tokens masked.
- Run end-to-end tests without a database server.

These are the endpoints, and the section that adds each one:

| Endpoint | Section |
| --- | --- |
| `GET /notes`, `GET /notes/:id`, `POST /notes`, `PATCH /notes/:id`, `DELETE /notes/:id` | [Start with one file](/tutorials/rest-api-jwt-authentication#start-with-one-file) |
| `POST /auth/sign-up`, `POST /auth/token`, `POST /auth/token/refresh`, `POST /auth/token/revoke`, `GET /me` | [Sign users in with JWTs](/tutorials/rest-api-jwt-authentication#sign-users-in-with-jwts) |
| `GET /docs` | [Describe the API with OpenAPI](/tutorials/rest-api-jwt-authentication#describe-the-api-with-openapi) |
| `GET /health/live`, `GET /health/ready` | [Add health checks](/tutorials/rest-api-jwt-authentication#add-health-checks) |

> info **Hint** The finished application is on GitHub as [nestjs/example-rest-api-jwt-authentication](https://github.com/nestjs/example-rest-api-jwt-authentication), with its tests and a CI workflow.

You need Node.js 22 or later, and a PostgreSQL server for the second section onwards.

#### Start with one file

Create the project with the [Nest CLI](/cli/overview). `--minimal` generates an application whose code is a single file, `src/main.ts` (see [One-file projects](/cli/usages#one-file-projects)). It also installs the [NestJS Observe SDK](/observability/sdk), `@nestjs/observe`, and wires it into that file; the application's own files keep it:

```bash
$ npm i -g @nestjs/cli
$ nest new notes-api --minimal
$ cd notes-api
```

Install the [Node adapter](/http/performance#node-adapter), which runs Nest directly on `node:http` and is the fastest of the three, and Zod. The Express adapter that the CLI installed is no longer needed:

```bash
$ npm i --save @nestjs/platform-node zod
$ npm uninstall @nestjs/platform-express @types/express
```

Replace `src/main.ts` with the first version of the API. It keeps notes in memory for now:

```typescript
@@filename(src/main)
import { randomUUID } from 'node:crypto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { NodeAdapter } from '@nestjs/platform-node';
import { z } from 'zod';

const { ObserveModule, ObserveInstrument } = createObserveModule();

const title = z.string().trim().min(1).max(200);
const body = z.string().max(10_000);

const createNoteSchema = z.object({ title, body: body.default('') });
type CreateNoteDto = z.infer<typeof createNoteSchema>;

// Every field optional, none nullable: a null title is a 400.
const updateNoteSchema = z.object({ title, body }).partial();
type UpdateNoteDto = z.infer<typeof updateNoteSchema>;

interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
class NotesService {
  private readonly notes = new Map<string, Note>();

  findAll(): Note[] {
    return [...this.notes.values()];
  }

  findOne(id: string): Note {
    const note = this.notes.get(id);
    if (!note) {
      throw new NotFoundException();
    }
    return note;
  }

  create(dto: CreateNoteDto): Note {
    const now = new Date();
    const note: Note = { id: randomUUID(), ...dto, createdAt: now, updatedAt: now };
    this.notes.set(note.id, note);
    return note;
  }

  update(id: string, dto: UpdateNoteDto): Note {
    const note = this.findOne(id);
    Object.assign(note, dto, { updatedAt: new Date() });
    return note;
  }

  remove(id: string): void {
    if (!this.notes.delete(id)) {
      throw new NotFoundException();
    }
  }
}

const noteId = { schema: z.uuid() };

@Controller('notes')
class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll() {
    return this.notesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', noteId) id: string) {
    return this.notesService.findOne(id);
  }

  @Post()
  create(@Body({ schema: createNoteSchema }) dto: CreateNoteDto) {
    return this.notesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', noteId) id: string, @Body({ schema: updateNoteSchema }) dto: UpdateNoteDto) {
    return this.notesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', noteId) id: string) {
    this.notesService.remove(id);
  }
}

const app = await NestFactory.create(
  {
    imports: [
      ObserveModule.forRoot({
        // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
        appKey: process.env.OBSERVE_APP_KEY ?? '',
        appSecret: process.env.OBSERVE_APP_SECRET ?? '',
        serviceId: 'notes-api',
      }),
    ],
    controllers: [NotesController],
    providers: [NotesService],
  },
  new NodeAdapter(),
  { instrument: ObserveInstrument },
);
app.useGlobalPipes(new StandardSchemaValidationPipe());
await app.listen(process.env.PORT ?? 3000);
```

- There's no module class: `NestFactory.create()` takes the root module's metadata directly (see [Root module from metadata](/modules#root-module-from-metadata)). The class comes back in the next section, when the application has modules of its own to import. With an adapter, the application options, `instrument` among them, are the third argument.
- `StandardSchemaValidationPipe` validates every parameter that declares a `schema`, with Zod or any other [Standard Schema](https://standardschema.dev/) library, and passes the schema's output to the handler, so `body` defaults to an empty string and `title` arrives trimmed. Each schema's inferred type is the parameter's type, so there are no DTO classes to keep in sync. See [Schema-based validation](/application/validation#schema-based-validation).
- `updateNoteSchema` is built from the same field schemas, not with `createNoteSchema.partial()`. Zod still applies a default inside `partial()`, so a `PATCH` that only renames a note would reset its body to the empty string.
- Optional fields aren't nullable. A `PATCH` with a `null` title gets a 400, rather than reaching the database's `NOT NULL` constraint as a 500.

Start the application, and try it from another terminal (`--json`, curl 7.82 or later, sends a `POST` with a JSON body):

```bash
$ npm run start:dev
```

Create a note, then try a few requests that fail validation:

```bash
$ curl localhost:3000/notes --json '{"title":"Buy milk"}'
{"id":"d90a31d3-2df2-447d-8d5e-c2b2e241a8eb","title":"Buy milk","body":"","createdAt":"2026-11-19T19:42:46.765Z","updatedAt":"2026-11-19T19:42:46.765Z"}
$ curl localhost:3000/notes --json '{"title":""}'
{"message":["title: Too small: expected string to have >=1 characters"],"error":"Bad Request","statusCode":400}
$ curl -X PATCH localhost:3000/notes/d90a31d3-2df2-447d-8d5e-c2b2e241a8eb --json '{"title":null}'
{"message":["title: Invalid input: expected string, received null"],"error":"Bad Request","statusCode":400}
$ curl localhost:3000/notes/not-a-uuid
{"message":["Invalid UUID"],"error":"Bad Request","statusCode":400}
```

#### Store notes in PostgreSQL

The notes are lost on every restart. Move them to PostgreSQL, through [`@nestjs/drizzle`](/data/drizzle), and read the database's URL from the environment with [`@nestjs/config`](/application/configuration):

```bash
$ npm i --save @nestjs/config @nestjs/drizzle drizzle-orm@rc pg
$ npm i --save-dev drizzle-kit@rc @types/pg
```

For a local database, a container is enough:

```bash
$ docker run -d --name notes-db -e POSTGRES_PASSWORD=notes -e POSTGRES_DB=notes -p 5432:5432 postgres:17
```

Add its URL to a `.env` file in the project's root directory. `ConfigModule` loads the file at startup, and `drizzle-kit` reads it too:

```bash
DATABASE_URL=postgres://postgres:notes@localhost:5432/notes
```

The file is getting long, so this is a good moment to give it some structure. Each part moves to a file of its own under `src/`, and the root module becomes a class again, because it now imports other modules:

<div class="file-tree">
  <div class="item">src</div>
  <div class="children">
    <div class="item">database</div>
    <div class="children">
      <div class="item">schema.ts</div>
    </div>
    <div class="item">notes</div>
    <div class="children">
      <div class="item">notes.controller.ts</div>
      <div class="item">notes.module.ts</div>
      <div class="item">notes.schemas.ts</div>
      <div class="item">notes.service.ts</div>
    </div>
    <div class="item">app.module.ts</div>
    <div class="item">config.ts</div>
    <div class="item">main.ts</div>
  </div>
</div>

The configuration is a Zod schema too. `ConfigModule` validates the environment against it at startup, and serves the values the schema returns, so `PORT` is a number:

```typescript
@@filename(src/config)
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;
```

The table, in Drizzle's schema language:

```typescript
@@filename(src/database/schema)
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  createdAt: at('created_at').notNull().defaultNow(),
  updatedAt: at('updated_at').notNull().defaultNow(),
});

export type Note = typeof notes.$inferSelect;
```

The schemas move to their own file. The list now takes a page size and an offset, with a cap, so no request reads the whole table:

```typescript
@@filename(src/notes/notes.schemas)
import { z } from 'zod';

const title = z.string().trim().min(1).max(200);
const body = z.string().max(10_000);

export const createNoteSchema = z.object({ title, body: body.default('') });
export type CreateNoteDto = z.infer<typeof createNoteSchema>;

// Every field optional, none nullable: a null title is a 400.
// Not createNoteSchema.partial(): the default would reset `body` on every update.
export const updateNoteSchema = z.object({ title, body }).partial();
export type UpdateNoteDto = z.infer<typeof updateNoteSchema>;

export const listNotesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;
```

The service queries the database, which `@InjectDrizzle()` injects:

```typescript
@@filename(src/notes/notes.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { notes, type Note } from '../database/schema.js';
import type { CreateNoteDto, ListNotesQuery, UpdateNoteDto } from './notes.schemas.js';

@Injectable()
export class NotesService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  findAll({ limit, offset }: ListNotesQuery): Promise<Note[]> {
    return this.db
      .select()
      .from(notes)
      .orderBy(desc(notes.createdAt), desc(notes.id))
      .limit(limit)
      .offset(offset);
  }

  async findOne(id: string): Promise<Note> {
    const [note] = await this.db.select().from(notes).where(eq(notes.id, id));
    return note ?? notFound();
  }

  async create(dto: CreateNoteDto): Promise<Note> {
    const [note] = await this.db.insert(notes).values(dto).returning();
    return note;
  }

  async update(id: string, dto: UpdateNoteDto): Promise<Note> {
    // One statement, no read before the write: a concurrent DELETE can't be undone.
    const [note] = await this.db
      .update(notes)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();
    return note ?? notFound();
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.db.delete(notes).where(eq(notes.id, id)).returning({ id: notes.id });
    if (deleted.length === 0) {
      notFound();
    }
  }
}

function notFound(): never {
  throw new NotFoundException('Note not found');
}
```

`update()` and `remove()` find out whether the note exists from what the statement changed. A service that reads the row first and then saves it has a gap between the two, where another request can delete the note; the save would then write it back.

```typescript
@@filename(src/notes/notes.controller)
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import {
  createNoteSchema,
  listNotesQuerySchema,
  updateNoteSchema,
  type CreateNoteDto,
  type ListNotesQuery,
  type UpdateNoteDto,
} from './notes.schemas.js';
import { NotesService } from './notes.service.js';

const noteId = { schema: z.uuid() };

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(@Query({ schema: listNotesQuerySchema }) query: ListNotesQuery) {
    return this.notesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', noteId) id: string) {
    return this.notesService.findOne(id);
  }

  @Post()
  create(@Body({ schema: createNoteSchema }) dto: CreateNoteDto) {
    return this.notesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', noteId) id: string, @Body({ schema: updateNoteSchema }) dto: UpdateNoteDto) {
    return this.notesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', noteId) id: string) {
    return this.notesService.remove(id);
  }
}
```

The notes module registers the controller and the service:

```typescript
@@filename(src/notes/notes.module)
import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller.js';
import { NotesService } from './notes.service.js';

@Module({
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
```

The root module registers the configuration, the database and the validation pipe. `DrizzleModule.forRootAsync()` reads the URL from `ConfigService`, opens a `pg` pool, and closes it when the application shuts down:

```typescript
@@filename(src/app.module)
import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { createObserveModule } from '@nestjs/observe';
import { drizzle } from 'drizzle-orm/node-postgres';
import { envSchema, type Env } from './config.js';
import { NotesModule } from './notes/notes.module.js';

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
    NotesModule,
  ],
  providers: [{ provide: APP_PIPE, useClass: StandardSchemaValidationPipe }],
})
export class AppModule {}
```

- **`ObserveModule` comes first** in `imports`, as the [SDK's quick start](/observability/sdk#quick-start) does: modules shut down in reverse order, so it stops last, and sends what the others recorded (see [Shutdown](/observability/sdk#shutdown)). `createObserveModule()` returns it with `ObserveInstrument`, which `main.ts` passes to Nest.
- **The key pair is empty until you link the project.** Without one, the SDK sends nothing, and says so at startup. `npx @nestjs/observe link` writes `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` into `.env`, and adds `--env-file .env` to the `start` scripts, so they're in the environment before `AppModule` is imported, when the SDK reads them: `ConfigModule` loads the file too late for that (see [Linking from the terminal](/observability/sdk#linking-from-the-terminal)). An empty value falls back to the environment, as the placeholders `nest new` writes do (see [Reading the key pair from the environment](/observability/sdk#reading-the-key-pair-from-the-environment)).

The pipe moved from `main.ts` to an `APP_PIPE` provider. It still applies to every route, and it's now part of `AppModule`, so the end-to-end tests at the end of this tutorial get it too, without repeating the `main.ts` setup. `main.ts` imports `ObserveInstrument` from the root module, and passes it in the application options:

```typescript
@@filename(src/main)
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { AppModule, ObserveInstrument } from './app.module.js';
import type { Env } from './config.js';

const app = await NestFactory.create<NestNodeApplication>(AppModule, new NodeAdapter(), {
  instrument: ObserveInstrument,
});
app.enableShutdownHooks();

const config = app.get<ConfigService<Env, true>>(ConfigService);
await app.listen(config.get('PORT', { infer: true }));
```

`enableShutdownHooks()` makes the application close on `SIGTERM`, which is what a container platform sends on every deploy: the HTTP server stops accepting connections and the pool is closed. Without it, the process just ends.

Add a `drizzle.config.ts` to the project's root directory:

```typescript
@@filename(drizzle.config)
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Generate the first migration from the schema, and apply it (see [Migrations](/data/drizzle#migrations)):

```bash
$ npx drizzle-kit generate --name=notes
$ npx drizzle-kit migrate
```

Restart the application. Notes now survive a restart, and a configuration error stops the application before it serves a request:

```bash
$ DATABASE_URL=not-a-url npm run start
ERROR [ExceptionHandler] Error: Config validation error: DATABASE_URL: Invalid URL
```

#### Sign users in with JWTs

Anyone can read and change every note. Next, users sign up, sign in for tokens, and see only their own notes. [`@nestjs/authentication`](/security/authentication) does the security-sensitive parts: hashing passwords, signing and verifying tokens, and rotating refresh tokens. It also registers a global guard, so every route requires a signed-in user unless you mark it public:

```bash
$ npm i --save @nestjs/authentication
```

Add a signing secret to `.env`. It must be at least 32 bytes:

```bash
# Generate with: openssl rand -base64 32
JWT_SECRET=
```

The configuration schema requires it:

```typescript
@@filename(src/config)
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.url(),
  // Signs the access tokens: at least 32 bytes.
  JWT_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof envSchema>;
```

Three tables join the schema: the users, a `refresh_tokens` table for the package's refresh tokens, and an owner on every note:

```typescript
@@filename(src/database/schema)
import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: at('created_at').notNull().defaultNow(),
});

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
    updatedAt: at('updated_at').notNull().defaultNow(),
  },
  (table) => [index('notes_owner_id_created_at_idx').on(table.ownerId, table.createdAt)],
);

// What @nestjs/authentication keeps for refresh tokens, stored by their SHA-256.
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: text('id').primaryKey(),
    familyId: text('family_id').notNull(),
    userId: text('user_id').notNull(),
    createdAt: at('created_at').notNull(),
    expiresAt: at('expires_at').notNull(),
    familyExpiresAt: at('family_expires_at').notNull(),
    usedAt: at('used_at'),
    // A family is revoked when any of its tokens is.
    revoked: boolean('revoked').notNull().default(false),
    claims: jsonb('claims').$type<Record<string, unknown>>(),
  },
  (table) => [
    index('refresh_tokens_family_id_idx').on(table.familyId),
    index('refresh_tokens_user_id_idx').on(table.userId),
    index('refresh_tokens_family_expires_at_idx').on(table.familyExpiresAt),
  ],
);

export type Note = typeof notes.$inferSelect;
```

Generate the migration and apply it. `owner_id` is required, and the notes you created in the previous section have no owner, so empty the table first (in development):

```bash
$ docker exec notes-db psql -U postgres -d notes -c "TRUNCATE notes"
$ npx drizzle-kit generate --name=users
$ npx drizzle-kit migrate
```

##### Users

The package never reads your users table. It asks your code for a user, and your code decides what a user is:

```typescript
@@filename(src/users/user)
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}
```

The repository is the only code that sees password hashes. Everything it returns is a `User` without one, so a user can be returned from a route or logged without leaking the hash:

```typescript
@@filename(src/users/users.repository)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from '../database/schema.js';
import type { User } from './user.js';

const columns = { id: users.id, email: users.email, createdAt: users.createdAt };

/** Only `User` objects leave this class: password hashes stay inside. */
@Injectable()
export class UsersRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  /** The new user, or `null` when the email is taken. */
  async create(email: string, passwordHash: string): Promise<User | null> {
    // One statement: two sign-ups with the same email can't both succeed.
    const [user] = await this.db
      .insert(users)
      .values({ email: normalize(email), passwordHash })
      .onConflictDoNothing({ target: users.email })
      .returning(columns);
    return user ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db.select(columns).from(users).where(eq(users.id, id));
    return user ?? null;
  }

  /** For password sign-in only. */
  async findCredentials(email: string): Promise<{ user: User; passwordHash: string } | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, normalize(email)));
    if (!row) {
      return null;
    }
    const { passwordHash, ...user } = row;
    return { user, passwordHash };
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.db.update(users).set({ passwordHash }).where(eq(users.id, id));
  }
}

const normalize = (email: string) => email.trim().normalize('NFC').toLowerCase();
```

`GET /me` returns the signed-in user. `@CurrentUser()` injects the user that the authentication guard loaded for the request:

```typescript
@@filename(src/users/me.controller)
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from './user.js';

@Controller('me')
export class MeController {
  @Get()
  me(@CurrentUser() user: User) {
    return user;
  }
}
```

The users module registers the controller and the repository, and exports the repository for the authentication code:

```typescript
@@filename(src/users/users.module)
import { Module } from '@nestjs/common';
import { MeController } from './me.controller.js';
import { UsersRepository } from './users.repository.js';

@Module({
  controllers: [MeController],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
```

Tell the package your user type once, and `@CurrentUser('id')` accepts only keys of `User`:

```typescript
@@filename(src/auth/auth-types)
import type { User } from '../users/user.js';

declare module '@nestjs/authentication' {
  interface AuthenticationTypes {
    user: User;
  }
}
```

##### Passwords and tokens

`PasswordHasher` hashes passwords with scrypt from `node:crypto`, at the parameters OWASP recommends, on the libuv thread pool. A service wraps the two things the controller needs:

```typescript
@@filename(src/auth/credentials.service)
import { ConflictException, Injectable } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import type { User } from '../users/user.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async register(email: string, password: string): Promise<User> {
    const user = await this.usersRepository.create(email, await this.passwordHasher.hash(password));
    if (!user) {
      throw new ConflictException('Email already registered');
    }
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

`verify()` always calls `passwordHasher.verify()`, even when there's no such user. Returning early for an unknown email would answer it in a few milliseconds, against a few hundred for a wrong password, and anyone could tell from the response time which emails have accounts.

A **credential provider** turns a request into a user. `JwtBearerProvider` reads the `Authorization` header, checks the token's signature, `exp`, `iss` and `aud`, and passes the verified claims to your `validate()`, which loads the user:

```typescript
@@filename(src/auth/jwt-auth.provider)
import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, JwtBearerProvider, type JwtClaims } from '@nestjs/authentication';
import type { User } from '../users/user.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class JwtAuth extends JwtBearerProvider<User> {
  constructor(
    private readonly usersRepository: UsersRepository,
    registry: AuthenticationRegistry,
  ) {
    // The key, issuer and audience come from the `accessToken` options.
    super({ realm: 'notes' });
    registry.registerProvider(this);
  }

  // Called once the signature, `exp`, `iss` and `aud` checked out.
  // Returning null (the user was deleted) rejects the token.
  validate({ sub }: JwtClaims) {
    return sub ? this.usersRepository.findById(sub) : null;
  }
}
```

The request bodies of the sign-in routes:

```typescript
@@filename(src/auth/auth.schemas)
import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(12).max(128),
});
export type SignUpDto = z.infer<typeof signUpSchema>;

// No minimum here: a password set under an older rule still signs in.
export const signInSchema = z.object({
  email: z.email(),
  password: z.string().max(128),
});
export type SignInDto = z.infer<typeof signInSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
```

The controller issues tokens with `TokenService`:

```typescript
@@filename(src/auth/auth.controller)
import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { Public, TokenService } from '@nestjs/authentication';
import {
  refreshTokenSchema,
  signInSchema,
  signUpSchema,
  type RefreshTokenDto,
  type SignInDto,
  type SignUpDto,
} from './auth.schemas.js';
import { CredentialsService } from './credentials.service.js';

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('sign-up')
  async signUp(@Body({ schema: signUpSchema }) body: SignUpDto) {
    const user = await this.credentialsService.register(body.email, body.password);
    return this.tokenService.issue(user.id, { method: 'password', claims: { amr: ['pwd'] } });
  }

  @Post('token')
  @HttpCode(200)
  async token(@Body({ schema: signInSchema }) body: SignInDto) {
    const user = await this.credentialsService.verify(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.tokenService.issue(user.id, { method: 'password', claims: { amr: ['pwd'] } });
  }

  // An unknown, expired or reused refresh token gets a 401.
  @Post('token/refresh')
  @HttpCode(200)
  refresh(@Body({ schema: refreshTokenSchema }) body: RefreshTokenDto) {
    return this.tokenService.refresh(body.refreshToken);
  }

  // Signs this device out. Unknown tokens get the same answer, as in RFC 7009.
  @Post('token/revoke')
  @HttpCode(204)
  async revoke(@Body({ schema: refreshTokenSchema }) body: RefreshTokenDto) {
    await this.tokenService.revoke(body.refreshToken);
  }
}
```

- `@Public()` on the class skips authentication for these four routes. Every other route of the application requires a valid access token.
- `POST` routes answer `201 Created` by default. Issuing tokens for an existing account creates nothing, so `token` and `refresh` set `@HttpCode(200)`.
- `issue()` returns an access token, signed with the `accessToken` options of the next step, a refresh token, and `expiresIn`, the access token's lifetime in seconds. `refresh()` spends a refresh token and returns its successor with a new access token. If a spent refresh token comes back, two parties hold it, a thief and the client, so the package revokes the whole family and both have to sign in again. See [Issue tokens to the mobile app](/security/authentication#issue-tokens-to-the-mobile-app).

##### Store the refresh tokens

Refresh tokens are state, and the package keeps state through stores that you register. Without one, it keeps them in memory, which loses them on restart and doesn't share them between instances, and with `NODE_ENV` set to `production` it refuses to start that way. The store implements `RefreshTokenStore` with Drizzle, and registers itself from its constructor:

```typescript
@@filename(src/auth/drizzle-refresh-token.store)
import { Injectable } from '@nestjs/common';
import { AuthenticationStorage, type RefreshTokenRecord, type RefreshTokenStore } from '@nestjs/authentication';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq, isNull, lte } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { refreshTokens } from '../database/schema.js';

/** Refresh tokens in PostgreSQL, shared by every instance of the API. */
@Injectable()
export class DrizzleRefreshTokenStore implements RefreshTokenStore {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    storage: AuthenticationStorage,
  ) {
    storage.registerSource({ refreshTokens: this });
  }

  async getRefreshToken(id: string): Promise<RefreshTokenRecord | undefined> {
    const [row] = await this.db.select().from(refreshTokens).where(eq(refreshTokens.id, id));
    if (!row) {
      return undefined;
    }
    const { revoked: _, usedAt, claims, ...token } = row;
    return { ...token, usedAt: usedAt ?? undefined, claims: claims ?? undefined };
  }

  async saveRefreshToken(record: RefreshTokenRecord): Promise<void> {
    await this.db.insert(refreshTokens).values(record);
    // Families past their absolute lifetime can go.
    await this.db.delete(refreshTokens).where(lte(refreshTokens.familyExpiresAt, record.createdAt));
  }

  async markRefreshTokenUsed(id: string, at: Date): Promise<boolean> {
    // Conditional: of two refreshes with the same token, one updates the row.
    const updated = await this.db
      .update(refreshTokens)
      .set({ usedAt: at })
      .where(and(eq(refreshTokens.id, id), isNull(refreshTokens.usedAt)))
      .returning({ id: refreshTokens.id });
    return updated.length === 1;
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await this.db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.familyId, familyId));
  }

  async isRefreshTokenFamilyRevoked(familyId: string): Promise<boolean> {
    const revoked = await this.db
      .select({ id: refreshTokens.id })
      .from(refreshTokens)
      .where(and(eq(refreshTokens.familyId, familyId), eq(refreshTokens.revoked, true)))
      .limit(1);
    return revoked.length > 0;
  }

  async revokeUserRefreshTokens(userId: string): Promise<void> {
    await this.db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.userId, userId));
  }
}
```

`markRefreshTokenUsed()` is the method that matters most. It's one conditional `UPDATE`, so when a thief and the client refresh with the same token at the same moment, exactly one of them wins, and the other one's attempt revokes the family. A store that read the row, checked `usedAt` and then wrote it would let both through. [The store contract](/security/authentication#the-store-contract) lists the rule for every method, and the [tests](/tutorials/rest-api-jwt-authentication#test-it) at the end of this tutorial check them.

```typescript
@@filename(src/auth/auth.module)
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { CredentialsService } from './credentials.service.js';
import { DrizzleRefreshTokenStore } from './drizzle-refresh-token.store.js';
import { JwtAuth } from './jwt-auth.provider.js';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [JwtAuth, CredentialsService, DrizzleRefreshTokenStore],
})
export class AuthModule {}
```

##### Register the module

Register `AuthenticationModule` in the root module, with the access tokens' key, issuer, audience and lifetime, and the refresh tokens' lifetimes:

```typescript
@@filename(src/app.module)
import { AuthenticationModule } from '@nestjs/authentication';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
// ...

@Module({
  imports: [
    ObserveModule.forRoot({
      // ...
    }),
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
    DrizzleModule.forRootAsync({
      // ...
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
    UsersModule,
    AuthModule,
    NotesModule,
  ],
  providers: [{ provide: APP_PIPE, useClass: StandardSchemaValidationPipe }],
})
export class AppModule {}
```

With a secret as the key, tokens are signed with HS256. An access token lives 15 minutes, a refresh token 30 days, and a family of refresh tokens at most 90 days, however often it rotates. Lifetimes are milliseconds or strings such as `'15m'`; unlike `@nestjs/jwt`, a plain number isn't seconds.

##### Notes belong to their owner

Every note query now includes the owner. The service takes the user's id as its first argument:

```typescript
@@filename(src/notes/notes.service)
import { and, desc, eq } from 'drizzle-orm';
// ...

@Injectable()
export class NotesService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  findAll(ownerId: string, { limit, offset }: ListNotesQuery): Promise<Note[]> {
    return this.db
      .select()
      .from(notes)
      .where(eq(notes.ownerId, ownerId))
      .orderBy(desc(notes.createdAt), desc(notes.id))
      .limit(limit)
      .offset(offset);
  }

  async findOne(ownerId: string, id: string): Promise<Note> {
    const [note] = await this.db.select().from(notes).where(this.owned(ownerId, id));
    return note ?? notFound();
  }

  async create(ownerId: string, dto: CreateNoteDto): Promise<Note> {
    const [note] = await this.db
      .insert(notes)
      .values({ ...dto, ownerId })
      .returning();
    return note;
  }

  async update(ownerId: string, id: string, dto: UpdateNoteDto): Promise<Note> {
    // One conditional statement: no read-then-write window, and another
    // user's note is as missing as one that doesn't exist.
    const [note] = await this.db
      .update(notes)
      .set({ ...dto, updatedAt: new Date() })
      .where(this.owned(ownerId, id))
      .returning();
    return note ?? notFound();
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const deleted = await this.db.delete(notes).where(this.owned(ownerId, id)).returning({ id: notes.id });
    if (deleted.length === 0) {
      notFound();
    }
  }

  private owned(ownerId: string, id: string) {
    return and(eq(notes.id, id), eq(notes.ownerId, ownerId));
  }
}
```

The owner is part of each statement's `WHERE` clause rather than checked after a read, so there's nothing to forget and no window between a check and a write. Someone else's note gets a 404, the same answer as a note that doesn't exist, which doesn't tell anyone which ids are in use.

The controller passes the signed-in user's id, with `@CurrentUser('id')`:

```typescript
@@filename(src/notes/notes.controller)
import { CurrentUser } from '@nestjs/authentication';
// ...

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query({ schema: listNotesQuerySchema }) query: ListNotesQuery) {
    return this.notesService.findAll(userId, query);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id', noteId) id: string) {
    return this.notesService.findOne(userId, id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body({ schema: createNoteSchema }) dto: CreateNoteDto) {
    return this.notesService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', noteId) id: string,
    @Body({ schema: updateNoteSchema }) dto: UpdateNoteDto,
  ) {
    return this.notesService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser('id') userId: string, @Param('id', noteId) id: string) {
    return this.notesService.remove(userId, id);
  }
}
```

Restart the application. At startup, the module logs the provider chain and where the refresh tokens live:

```bash
LOG [AuthenticationModule] AuthenticationRegistry: providers JwtAuth
LOG [AuthenticationModule] AuthenticationStorage: DrizzleRefreshTokenStore (refreshTokens)
```

Requests without a token get a 401 that says what the API accepts:

```bash
$ curl -i localhost:3000/notes
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="notes"
{"message":"Unauthorized","statusCode":401,"errorCode":"missing_credentials"}
```

Sign up. The response carries the tokens (shortened here and below):

```bash
$ curl localhost:3000/auth/sign-up --json '{"email":"ada@example.com","password":"correct horse battery"}'
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","refreshToken":"6fUCXRhy1e5O-3wb...","expiresIn":900}
```

Use the access token for the notes:

```bash
$ TOKEN=eyJhbGciOiJIUzI1NiIs...
$ curl localhost:3000/notes -H "Authorization: Bearer $TOKEN" --json '{"title":"Ship the guide"}'
{"id":"30694f2b-551c-40ab-b0ed-f789acd6381b","ownerId":"43bec047-ad99-4c34-b3e7-3f415127213d","title":"Ship the guide","body":"","createdAt":"2026-11-19T19:57:21.213Z","updatedAt":"2026-11-19T19:57:21.213Z"}
$ curl localhost:3000/me -H "Authorization: Bearer $TOKEN"
{"id":"43bec047-ad99-4c34-b3e7-3f415127213d","email":"ada@example.com","createdAt":"2026-11-19T19:57:21.095Z"}
```

A second user who signs up gets a 404 for Ada's note, and an empty list. When the access token expires, the client trades the refresh token for new ones. Using the same refresh token twice revokes its family, so even the successor stops working:

```bash
$ curl localhost:3000/auth/token/refresh --json '{"refreshToken":"6fUCXRhy1e5O-3wb..."}'
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","refreshToken":"6CnPc_hiBJUwDubp...","expiresIn":900}
$ curl localhost:3000/auth/token/refresh --json '{"refreshToken":"6fUCXRhy1e5O-3wb..."}'
{"message":"Refresh token reused","error":"Unauthorized","statusCode":401}
$ curl localhost:3000/auth/token/refresh --json '{"refreshToken":"6CnPc_hiBJUwDubp..."}'
{"message":"Refresh token invalid","error":"Unauthorized","statusCode":401}
```

A tampered or expired access token gets a 401 that tells the client why, as RFC 6750 describes:

```bash
WWW-Authenticate: Bearer realm="notes", error="invalid_token", error_description="invalid signature"
```

#### Rate-limit sign-in

Nothing stops a script from trying passwords as fast as the server answers. [`@nestjs/throttler`](/security/rate-limiting) limits request rates:

```bash
$ npm i --save @nestjs/throttler
```

A limit per IP address alone is too coarse for sign-in: users behind one office or carrier address share it. Use two [throttler definitions](/security/rate-limiting#multiple-throttler-definitions), as the [authentication chapter](/security/authentication#rate-limit-sign-in) does. `default` counts per IP address on every route, and `account` counts per email and IP address wherever the request body names an account:

```typescript
@@filename(src/auth/account-email)
/** The address the request body names, trimmed, lowercased and in Unicode NFC, or `''`. */
export function accountEmail(req: { body?: { email?: unknown } }): string {
  const email = req.body?.email;
  return typeof email === 'string' ? email.trim().normalize('NFC').toLowerCase() : '';
}
```

Register both definitions in the root module, with `ThrottlerGuard` as a global guard:

```typescript
@@filename(src/app.module)
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, minutes, normalizeIp } from '@nestjs/throttler';
import { accountEmail } from './auth/account-email.js';
// ...

@Module({
  imports: [
    // ...
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
    UsersModule,
    AuthModule,
    NotesModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

The throttler's guard is registered in the root module, so it runs before the authentication guard, and requests with guessed tokens count against the limit too. Tighten the sign-in routes:

```typescript
@@filename(src/auth/auth.controller)
import { SkipThrottle, Throttle, hours, minutes } from '@nestjs/throttler';
// ...

@SkipThrottle({ account: true })
@Throttle({ default: { limit: 10, ttl: hours(1) } })
@Post('sign-up')
// ...

@Throttle({
  default: { limit: 30, ttl: minutes(15) },
  account: { limit: 5, ttl: minutes(15) },
})
@Post('token')
// ...
```

Sign-up names a new address each time, so it skips the `account` limit and is limited per IP address instead. After five wrong passwords for one account, the sixth attempt gets a 429, while other accounts can still sign in from the same address:

```bash
$ curl -i localhost:3000/auth/token --json '{"email":"dave@example.com","password":"guess 6"}'
HTTP/1.1 429 Too Many Requests
Retry-After-account: 900
{"statusCode":429,"message":"ThrottlerException: Too Many Requests"}
```

> info **Hint** The throttler counts in memory by default, so every instance counts on its own. With more than one instance, use shared [storage](/security/rate-limiting#storages) such as Redis. Behind a load balancer, pass the `trustProxy` option to `NodeAdapter` (see [Node adapter options](/http/performance#node-adapter-options)), so the tracker sees the client's address rather than the proxy's.

#### Set security headers and CORS

Two more settings belong at the edge of any API that browsers call. Security headers tell browsers to turn on protections such as refusing to frame the page, or to guess a response's content type. CORS decides which websites' scripts may call the API from a visitor's browser and read the answers.

`app.useSecurityHeaders()`, built into Nest since v12.1, sends the headers [Helmet](https://helmetjs.github.io/) would, with its defaults, and needs no package (see [Security headers](/security/helmet)). Call it right after creating the application, so its headers are on every response, errors included. CORS takes the origins from the configuration:

```typescript
@@filename(src/main)
// ...

const app = await NestFactory.create<NestNodeApplication>(AppModule, new NodeAdapter(), {
  instrument: ObserveInstrument,
});
app.useSecurityHeaders();
app.enableShutdownHooks();

const config = app.get<ConfigService<Env, true>>(ConfigService);
app.enableCors({ origin: config.get('CORS_ORIGINS', { infer: true }) });

await app.listen(config.get('PORT', { infer: true }));
```

The origins are a comma-separated variable, which the configuration schema turns into a list of URLs, and rejects at startup if one isn't a URL:

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
});

export type Env = z.infer<typeof envSchema>;
```

List your web app's origins in `.env`:

```bash
CORS_ORIGINS=https://app.example.com
```

- **No origin is allowed by default.** Called without an `origin`, `enableCors()` answers every website with `Access-Control-Allow-Origin: *`, so any page a signed-in user visits could call the API from their browser and read the answers (see [Default allowed origins](/security/cors#default-allowed-origins)). With an empty list, no website can; `curl`, mobile apps and other servers aren't affected, since CORS is enforced by browsers.
- **No `credentials` option.** The API authenticates with a bearer token, which the web app sends in the `Authorization` header itself. Cookies, and the `credentials: true` that goes with them, aren't involved.
- **Swagger UI keeps working.** It loads its scripts and stylesheets from the application, which the default `Content-Security-Policy` allows. Served over plain HTTP from anywhere but `localhost`, though, its assets are upgraded to HTTPS and fail to load; see [Swagger UI and GraphQL IDEs](/security/helmet#swagger-ui-and-graphql-ides).

Every response now carries the headers (some omitted here):

```bash
$ curl -i localhost:3000/health/live
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
...
```

A browser asks before a cross-origin `PATCH` with an `Authorization` header. The listed origin gets its answer:

```bash
$ curl -i -X OPTIONS localhost:3000/notes -H "Origin: https://app.example.com" -H "Access-Control-Request-Method: PATCH" -H "Access-Control-Request-Headers: authorization,content-type"
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Vary: Origin, Access-Control-Request-Headers
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: authorization,content-type
```

Any other origin gets no `Access-Control-Allow-Origin` header, so its browser refuses to send the request:

```bash
$ curl -i -X OPTIONS localhost:3000/notes -H "Origin: https://evil.example" -H "Access-Control-Request-Method: PATCH" -H "Access-Control-Request-Headers: authorization"
HTTP/1.1 204 No Content
Vary: Origin, Access-Control-Request-Headers
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: authorization
```

#### Describe the API with OpenAPI

[`@nestjs/swagger`](/openapi/introduction) generates an OpenAPI document from the controllers. Zod 4.2 and later exposes JSON Schema itself, so the request bodies and query parameters come from the same schemas that validate them, with nothing to configure (see [Standard Schema](/openapi/introduction#standard-schema-zod-valibot)):

```bash
$ npm i --save @nestjs/swagger
```

Build the document and serve Swagger UI from `main.ts`. `addSecurityRequirements('bearer')` declares that every operation needs the bearer token, which is how the API behaves: the authentication guard is global, and only the routes marked `@Public()` skip it:

```typescript
@@filename(src/main)
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// ...

const app = await NestFactory.create<NestNodeApplication>(AppModule, new NodeAdapter(), {
  instrument: ObserveInstrument,
});
app.useSecurityHeaders();
// ...

const document = new DocumentBuilder()
  .setTitle('Notes API')
  .setVersion('1.0')
  .addBearerAuth()
  .addSecurityRequirements('bearer')
  .build();
SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, document));
```

Swagger doesn't know about `@Public()`, so mark the public routes for it too. `@ApiSecurity()` with an empty requirement tells OpenAPI that an operation needs no authentication, and Swagger UI shows no lock next to it:

```typescript
@@filename(src/auth/auth.controller)
import { ApiSecurity } from '@nestjs/swagger';
// ...

@Public()
@ApiSecurity({})
@Controller('auth')
export class AuthController {
  // ...
}
```

Swagger UI is at `http://localhost:3000/docs`, and the document at `http://localhost:3000/docs-json`. Enter a token under **Authorize**, and Swagger UI sends it with every request that needs one. The `POST /notes` body there is the Zod schema, converted:

```json
{
  "type": "object",
  "properties": {
    "title": { "type": "string", "minLength": 1, "maxLength": 200 },
    "body": { "default": "", "type": "string", "maxLength": 10000 }
  },
  "required": ["title"]
}
```

#### Add health checks

A container platform asks two questions: is the process alive, and can it serve requests right now. [`@nestjs/terminus`](/reliability/terminus) answers both:

```bash
$ npm i --save @nestjs/terminus
```

Terminus has no indicator for Drizzle, so the readiness check runs a query through a [custom indicator](/reliability/terminus#custom-health-indicator):

```typescript
@@filename(src/health/database.health)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { HealthIndicatorService } from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @InjectDrizzle() private readonly db: NodePgDatabase,
  ) {}

  isHealthy(key: string) {
    return this.healthIndicatorService
      .check(key)
      .attempt(async () => {
        await this.db.execute(sql`select 1`);
      })
      .withTimeout('1s');
  }
}
```

The controller exposes the two checks, public and outside the rate limit:

```typescript
@@filename(src/health/health.controller)
import { Controller, Get } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { ApiSecurity } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { DatabaseHealthIndicator } from './database.health.js';

@Public()
@ApiSecurity({})
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([() => this.database.isHealthy('database')]);
  }
}
```

The health module imports Terminus and provides the indicator:

```typescript
@@filename(src/health/health.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator],
})
export class HealthModule {}
```

Add `HealthModule` to the imports of `AppModule`. The checks are public, and skip the rate limit, since the platform calls them every few seconds. The liveness check doesn't look at the database: a restart wouldn't repair it. When the database stops answering, the readiness check fails within its one-second timeout, and the platform stops sending traffic to the instance until it passes again:

```bash
$ curl localhost:3000/health/ready
{"status":"ok","info":{"database":{"responseTime":2,"status":"up"}},"error":{},"details":{"database":{"responseTime":2,"status":"up"}}}
$ docker pause notes-db
$ curl -i localhost:3000/health/ready
HTTP/1.1 503 Service Unavailable
{"status":"error","info":{},"error":{"database":{"message":"timeout of 1000ms exceeded","responseTime":1001,"status":"down"}},"details":{"database":{"message":"timeout of 1000ms exceeded","responseTime":1001,"status":"down"}}}
$ docker unpause notes-db
```

#### Log in JSON

In development, Nest's logger writes readable lines. In production, the platform collects what the process writes to stdout, and a log search is far more useful when every line is a JSON object it can filter by level, context or any field. Nest's `ConsoleLogger` writes JSON itself (see [JSON logging](/application/logger#json-logging)):

```typescript
@@filename(src/main)
import { ConsoleLogger } from '@nestjs/common';
// ...

const production = process.env.NODE_ENV === 'production';
const app = await NestFactory.create<NestNodeApplication>(AppModule, new NodeAdapter(), {
  instrument: ObserveInstrument,
  logger: new ConsoleLogger({
    // One JSON object per line in production; readable text in development.
    json: production,
    // Masks these properties wherever they appear in a logged object.
    redact: ['password', 'authorization', 'accessToken', 'refreshToken'],
  }),
});
app.useSecurityHeaders();
// ...
```

- **The logger is created before `ConfigModule` reads `.env`**, so it reads `NODE_ENV` from the process environment, which is where your platform sets it in production.
- **`redact` is a safety net.** Wherever a property with one of these names appears in a logged object, at any depth and in any letter case, its value is written as `"[REDACTED]"`. The day someone logs a whole request body or the headers while debugging, the password and the tokens stay out of the logs. It covers objects, not strings: the message itself is printed as it is, so never interpolate a secret into it (see [Redacting sensitive values](/application/logger#redacting-sensitive-values)).

A log line worth having: a failed sign-in, with the address as a structured param, not in the message:

```typescript
@@filename(src/auth/auth.controller)
import { Body, Controller, HttpCode, Logger, Post, UnauthorizedException } from '@nestjs/common';
// ...

export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  // ...
  async token(@Body({ schema: signInSchema }) body: SignInDto) {
    const user = await this.credentialsService.verify(body.email, body.password);
    if (!user) {
      this.logger.warn('Sign-in failed', { email: body.email });
      throw new UnauthorizedException('Invalid email or password');
    }
    // ...
  }
}
```

A wrong password in development:

```bash
WARN [AuthController] Sign-in failed { email: 'ada@example.com' }
```

The same in production, with `NODE_ENV=production`:

```json
{"level":"warn","pid":19998,"timestamp":1795163181664,"message":"Sign-in failed","context":"AuthController","params":{"email":"ada@example.com"}}
```

A log search can now count failed sign-ins per address, which is how you notice someone guessing at one account despite the rate limit. With [NestJS Observe](/observability/overview) installed, each line written during a request also carries that request's trace id (see [Logging in production](/application/logger#logging-in-production)).

#### Test it

End-to-end tests boot the real `AppModule` with two changes. The database is [PGlite](https://pglite.dev), PostgreSQL compiled to WebAssembly, with the real migrations applied, so the tests need no server. And `PasswordHasher` uses a cheaper scrypt cost, since the default one takes a few hundred milliseconds and 128 MiB of memory per hash, on purpose. The tests use the Vitest setup of a standard Nest project, and send requests with `app.inject()`, which the Node adapter provides, so they don't need a listening server either:

```bash
$ npm i --save-dev @nestjs/testing vitest vite @electric-sql/pglite
```

The test configuration gives the application the environment it validates at startup:

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
    },
  },
});
```

The tests cover a request without a token, notes that only their owner sees, and refresh-token rotation:

```typescript
@@filename(test/notes.e2e-spec)
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { PasswordHasher } from '@nestjs/authentication';
import { getDrizzleToken } from '@nestjs/drizzle';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { AppModule } from '../src/app.module.js';

describe('Notes API (e2e)', () => {
  const pglite = new PGlite(); // PostgreSQL in-process: no server to start
  let app: NestNodeApplication;

  beforeAll(async () => {
    const db = drizzle({ client: pglite });
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(db)
      // scrypt at the default cost takes 128 MiB and a few hundred ms per hash.
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      .compile();
    app = moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await pglite.close();
  });

  async function signUp(email: string) {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password: 'correct horse battery' },
    });
    expect(res.statusCode).toBe(201);
    return res.json<{ accessToken: string; refreshToken: string }>();
  }

  it('rejects requests without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/notes' });
    expect(res.statusCode).toBe(401);
  });

  it('creates, updates and lists notes for their owner only', async () => {
    const ada = await signUp('ada@example.com');
    const bob = await signUp('bob@example.com');
    const asAda = { authorization: `Bearer ${ada.accessToken}` };
    const asBob = { authorization: `Bearer ${bob.accessToken}` };

    const created = await app.inject({
      method: 'POST',
      url: '/notes',
      headers: asAda,
      payload: { title: 'Buy milk', body: '2 litres' },
    });
    expect(created.statusCode).toBe(201);
    const { id } = created.json<{ id: string }>();

    const nulled = await app.inject({ method: 'PATCH', url: `/notes/${id}`, headers: asAda, payload: { title: null } });
    expect(nulled.statusCode).toBe(400);

    const renamed = await app.inject({ method: 'PATCH', url: `/notes/${id}`, headers: asAda, payload: { title: 'Buy oat milk' } });
    expect(renamed.json()).toMatchObject({ title: 'Buy oat milk', body: '2 litres' });

    const stolen = await app.inject({ method: 'GET', url: `/notes/${id}`, headers: asBob });
    expect(stolen.statusCode).toBe(404);
    const bobsList = await app.inject({ method: 'GET', url: '/notes', headers: asBob });
    expect(bobsList.json()).toEqual([]);
  });

  it('rotates refresh tokens and revokes the family on reuse', async () => {
    const { refreshToken } = await signUp('carol@example.com');
    const refresh = (token: string) =>
      app.inject({ method: 'POST', url: '/auth/token/refresh', payload: { refreshToken: token } });

    const first = await refresh(refreshToken);
    expect(first.statusCode).toBe(200);
    const successor = first.json<{ refreshToken: string }>().refreshToken;

    expect((await refresh(refreshToken)).statusCode).toBe(401); // reused: the family is revoked
    expect((await refresh(successor)).statusCode).toBe(401);
  });
});
```

PGlite has a single connection, so two requests never truly race there. The refresh-token store's guarantees are about races, so test the store itself on a real PostgreSQL server, with a connection pool, against the cases `@nestjs/authentication/testing` provides. `concurrent: true` adds parallel refreshes of one token, which a store that reads and then writes fails:

```typescript
@@filename(test/refresh-token.store.e2e-spec)
import { fileURLToPath } from 'node:url';
import { AuthenticationStorage } from '@nestjs/authentication';
import { authenticationStoreContract } from '@nestjs/authentication/testing';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { DrizzleRefreshTokenStore } from '../src/auth/drizzle-refresh-token.store.js';

// A real PostgreSQL with a pool, where parallel calls really race.
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('DrizzleRefreshTokenStore', () => {
  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool });

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
  });
  afterAll(() => pool.end());

  /** The store on an empty table, registered nowhere: the suite builds its own registry. */
  async function emptyStore() {
    await pool.query('TRUNCATE refresh_tokens');
    return { refreshTokens: new DrizzleRefreshTokenStore(db, new AuthenticationStorage()) };
  }

  for (const c of authenticationStoreContract(emptyStore, { contracts: ['refreshTokens'], concurrent: true })) {
    it(c.name, c.run);
  }
});
```

Add a script to `package.json`, and run both against a database of their own (the store test truncates its table):

```json
"test:e2e": "vitest run --config ./vitest.config.e2e.ts"
```

Create the test database once, then run both files:

```bash
$ docker exec notes-db psql -U postgres -c "CREATE DATABASE notes_test"
$ TEST_DATABASE_URL=postgres://postgres:notes@localhost:5432/notes_test npm run test:e2e

 Test Files  2 passed (2)
      Tests  8 passed (8)
```

#### Production checklist

- **Set `NODE_ENV` to `production`.** The authentication module then refuses to start while a feature it uses has no store, instead of keeping tokens in one process's memory.
- **Keep `JWT_SECRET` in your platform's secret store**, injected at runtime, not in an image or a committed `.env` file. Anyone who has it can sign tokens for any user.
- **Run `drizzle-kit migrate` as a release step**, before the new version starts, not from every instance at startup.
- **Set `CORS_ORIGINS` to your web app's origins**, with their scheme (`https://`) and no path. Leave it empty if no browser calls the API.
- **Collect the JSON logs from stdout** with your platform's log driver, rather than writing files from the process.
- **Use shared storage for the throttler** once you run more than one instance, and pass `trustProxy` to `NodeAdapter` behind a load balancer.
- **Size the servers for scrypt.** Each hash at the default cost uses 128 MiB, on the libuv thread pool (four threads unless you set `UV_THREADPOOL_SIZE`). Sign-in bursts queue behind each other; the throttler bounds them.
- **Point the platform's probes at the health checks**: liveness at `/health/live`, readiness at `/health/ready`. Shutdown hooks are on, so a deploy's `SIGTERM` closes the server and the pool before the process exits.
- **Give production its own Observe key pair**, from the project's **API Keys** page, as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the platform's environment: `start:prod` doesn't load `.env`. [NestJS Observe](/observability/overview) then records requests per route with their latency and failure rate, a trace of each one with its SQL queries, and unhandled errors grouped into defects, with an email when a new one appears (see [Error monitoring](/observability/error-monitoring)). Shutdown hooks are on, so the SDK sends its last batch on a deploy's `SIGTERM`.
- **Decide what a password reset or a stolen device ends.** `TokenService.revokeAll()` revokes every refresh token of a user, and access tokens that were already issued expire within 15 minutes.

The [authentication chapter's checklist](/security/authentication#production-checklist) covers the rest, for when the API adds sessions for a web app, email verification or two-factor authentication.

#### What's next

The API has the parts most production APIs need, and each one can grow from its chapter:

- Let users reset a forgotten password and verify their email address: [Authentication](/security/authentication#verify-email-addresses).
- Share notes, with permissions checked per record: [Authorization](/security/authorization).
- Send email, or run work in the background: [Mail](/application/mail) and [Queues](/application/queues).
- See what it does in production, request by request: [Observability](/observability/overview).
- Build on the same foundation: an [e-commerce backend](/tutorials/ecommerce-backend), a [multi-tenant SaaS backend](/tutorials/multi-tenant-saas), a [project-management API](/tutorials/project-management-api), a [real-time chat backend](/tutorials/realtime-chat), a [booking system](/tutorials/booking-system), [emails and background jobs](/tutorials/background-jobs), a [file upload service](/tutorials/file-uploads), or an [AI chat backend](/tutorials/ai-chat-backend).
