### Drizzle ORM

[Drizzle](https://orm.drizzle.team) is a TypeScript ORM for SQL databases. Where most ORMs describe tables with decorated classes, Drizzle uses plain objects, and its query builder maps one method to one SQL clause. `db.select().from(users).where(eq(users.id, id))` becomes `select ... from users where id = $1`. Call `.toSQL()` on any query to read the exact string and parameters it will send. Nothing is generated ahead of time, and no decorator metadata is read at runtime.

Drizzle supports PostgreSQL, MySQL, SQLite, and their many hosted variants. This recipe uses PostgreSQL with the [`node-postgres`](https://node-postgres.com/) driver.

> info **Note** This recipe targets the current stable release, `drizzle-orm@0.45.x` with `drizzle-kit@0.31.x`. Drizzle 1.0 is in RC; see [What changes in Drizzle 1.0](#what-changes-in-drizzle-10) at the end for the differences that affect this setup.

This recipe has two parts. The first builds a working setup from an empty project. The second covers the patterns that start to matter once the schema grows past a handful of tables.

#### Getting started

Create a new Nest application:

```bash
$ npm install -g @nestjs/cli
$ nest new hello-drizzle
$ cd hello-drizzle
```

Install Drizzle, the PostgreSQL driver, and the Drizzle Kit CLI:

```bash
$ npm install drizzle-orm pg
$ npm install --save-dev drizzle-kit @types/pg
```

You also need a PostgreSQL database. If you do not have one running, the quickest option is Docker:

```bash
$ docker run --name drizzle-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:18
```

Add the connection string to a `.env` file at the root of your project:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

> info **Hint** Set up the [ConfigModule](/techniques/configuration) so Nest reads `.env` for you. The Drizzle Kit CLI runs outside Nest, so it loads the file itself through `dotenv`. You will see that in `drizzle.config.ts` below.

#### Define your schema

Drizzle schemas are plain TypeScript. You build each table from the column helpers for your dialect, and Drizzle infers the row types from that definition. You never write a separate model or DTO to describe a row.

Create `src/modules/dal/schema/user.schema.ts`:

```typescript
@@filename(modules/dal/schema/user.schema)
import { type InferInsertModel, type InferSelectModel, sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    email: text('email').notNull(),
    name: text('name'),
    archivedAt: timestamp('archived_at', { mode: 'date' }),
  },
  (table) => [uniqueIndex('users_email_key').on(table.email)],
);

export type UserSelect = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>;
```

`uuidv7()` is a Postgres 18 built-in. It generates a UUID whose leading bytes are a millisecond timestamp, so ids sort in creation order. That property is what makes the [keyset pagination](#keyset-pagination) later in this recipe work. On Postgres 17 or older, use `defaultRandom()` (which calls `gen_random_uuid()` and gives you a random v4) and order by a timestamp column instead.

`InferSelectModel` gives you the shape of a row you read back; `InferInsertModel` gives you the shape you pass to `insert`, with defaulted and generated columns made optional. Both follow the table definition, so renaming a column breaks the build at every call site instead of failing at runtime.

Now `src/modules/dal/schema/post.schema.ts`:

```typescript
@@filename(modules/dal/schema/post.schema)
import { type InferInsertModel, type InferSelectModel, sql } from 'drizzle-orm';
import { index, integer, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const postStatusEnum = pgEnum('post_status', ['draft', 'published']);
export type PostStatus = (typeof postStatusEnum.enumValues)[number];

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    title: text('title').notNull(),
    content: text('content'),
    status: postStatusEnum('status').notNull().default('draft'),
    views: integer('views').notNull().default(0),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [index('posts_author_id_idx').on(table.authorId)],
);

export type PostSelect = InferSelectModel<typeof posts>;
export type PostInsert = InferInsertModel<typeof posts>;
```

Note `PostStatus`. Reading the union off `enumValues` keeps the database enum and the TypeScript type in step. Add a value to one and the other follows.

Finally, a barrel file so the rest of the application imports from one place. Create `src/modules/dal/schema/index.ts`:

```typescript
@@filename(modules/dal/schema/index)
export * from './post.schema';
export * from './user.schema';
```

#### Configure Drizzle Kit

[Drizzle Kit](https://orm.drizzle.team/docs/kit-overview) reads your schema, compares it to the database, and writes SQL migration files. Create `drizzle.config.ts` at the root of your project:

```typescript
@@filename(drizzle.config)
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/modules/dal/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Add the commands you will use to `package.json`:

```json
{
  "scripts": {
    "drizzle:generate": "drizzle-kit generate",
    "drizzle:migrate": "drizzle-kit migrate",
    "drizzle:studio": "drizzle-kit studio"
  }
}
```

Generate the first migration and apply it:

```bash
$ npm run drizzle:generate
$ npm run drizzle:migrate
```

`generate` writes a `.sql` file plus a snapshot into the `drizzle` folder. The files are plain SQL, so you can read them in review and edit them when a change needs care, such as a backfill, a concurrent index, or a rename that would otherwise drop and recreate a column.

```bash
$ tree drizzle
drizzle
├── 0000_lively_shooting_star.sql
└── meta
    ├── 0000_snapshot.json
    └── _journal.json
```

> warning **Note** `drizzle-kit push` applies schema changes straight to the database without writing a migration file. It is convenient for local prototyping, but do not use it against a shared or production database. You lose the reviewable history that `generate` gives you.

#### Create the data access module

Drizzle itself is a thin wrapper around a driver connection. The parts worth putting into Nest are the connection pool, its lifecycle, and a single injectable handle on the database.

Start with the pool. It owns a real resource, so it must close when the application shuts down:

```typescript
@@filename(modules/dal/pool.provider)
import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class PoolProvider implements OnModuleDestroy {
  private readonly logger = new Logger(PoolProvider.name);
  private pool: Pool | null = null;

  constructor(private readonly config: ConfigService) {}

  getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: this.config.getOrThrow<string>('DATABASE_URL'),
        max: 10,
        min: 0,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      });

      this.pool.on('error', (err) => {
        this.logger.error('Unexpected error on idle PostgreSQL client', err.stack);
      });
    }

    return this.pool;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('PostgreSQL pool has been closed');
    }
  }
}
```

> warning **Note** `onModuleDestroy` runs when you call `app.close()`, or when the process receives a signal such as `SIGTERM` and you have called `app.enableShutdownHooks()` in `main.ts`. Without that call there is no listener, so `SIGTERM` kills the process at once: the pool is never drained and in-flight queries are lost. See [Lifecycle events](/fundamentals/lifecycle-events).

Next, the types. Name the database and transaction handles once and you avoid spelling out Drizzle's generics at every call site:

```typescript
@@filename(modules/dal/drizzle.types)
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NodePgDatabase, NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { PgTransaction, PgTransactionConfig } from 'drizzle-orm/pg-core';
import type * as schema from './schema';

export type DrizzleSchema = typeof schema;

export type DrizzleDatabase = NodePgDatabase<DrizzleSchema>;

export type DrizzleTransaction = PgTransaction<
  NodePgQueryResultHKT,
  DrizzleSchema,
  ExtractTablesWithRelations<DrizzleSchema>
>;

/** Either handle. A repository method that accepts one composes into a caller's transaction. */
export type DrizzleExecutor = DrizzleDatabase | DrizzleTransaction;

export type DrizzleTransactionOptions = PgTransactionConfig;
```

`DrizzleExecutor` is the one that matters. A transaction handle exposes the same query builder methods as the base handle, so a method typed against the union runs the same either way, on its own or inside someone else's transaction. See [Composable repository methods](#composable-repository-methods).

Now the service that owns the handle:

```typescript
@@filename(modules/dal/drizzle.service)
import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { DrizzleDatabase, DrizzleExecutor } from './drizzle.types';
import { PoolProvider } from './pool.provider';
import * as schema from './schema';

@Injectable()
export class DrizzleService {
  private readonly db: DrizzleDatabase;

  constructor(private readonly poolProvider: PoolProvider) {
    this.db = drizzle(this.poolProvider.getPool(), { schema });
  }

  getDb(): DrizzleDatabase {
    return this.db;
  }

  /**
   * The executor for a single statement: an ongoing transaction when one is supplied
   * (so the work joins the caller's unit of work), otherwise the base handle.
   */
  resolveExecutor(executor?: DrizzleExecutor): DrizzleExecutor {
    return executor ?? this.db;
  }

  /**
   * Runs `fn` in a transaction. An existing executor is reused, so the work joins the
   * caller's transaction; otherwise a fresh one is opened. Use it for multi-statement
   * methods that must be atomic and still compose into a larger transaction.
   */
  runInTransaction<T>(
    executor: DrizzleExecutor | undefined,
    fn: (tx: DrizzleExecutor) => Promise<T>,
  ): Promise<T> {
    return executor ? fn(executor) : this.db.transaction(fn);
  }
}
```

Wire it up in a module. Marking it `@Global()` lets feature modules inject `DrizzleService` without importing `DalModule` first:

```typescript
@@filename(modules/dal/dal.module)
import { Global, Module } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';
import { PoolProvider } from './pool.provider';

@Global()
@Module({
  providers: [PoolProvider, DrizzleService],
  exports: [PoolProvider, DrizzleService],
})
export class DalModule {}
```

> info **Hint** [Making everything global](/modules#global-modules) is a poor default. A connection pool is one of the cases that fits, because every feature needs it and you register it once in the root module. Keep feature modules out of the global scope and export them through `imports` as usual.

And register it in the root module:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DalModule } from './modules/dal/dal.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DalModule],
})
export class AppModule {}
```

#### Write a repository

Drizzle has no repository abstraction of its own. You can inject `DrizzleService` into a Nest service and query directly, and for a small application that is fine. A repository class per feature earns its place once the queries multiply. It keeps query building out of your service methods, and it puts every query against a table in one file, where you can compare them.

Create `src/modules/feature/post/post.repository.ts`:

```typescript
@@filename(modules/feature/post/post.repository)
import { Injectable } from '@nestjs/common';
import { and, asc, count, eq, gt, ilike, type SQL } from 'drizzle-orm';
import { DrizzleService } from '../../dal/drizzle.service';
import type { DrizzleExecutor } from '../../dal/drizzle.types';
import { type PostSelect, type PostStatus, posts, users } from '../../dal/schema';

// One projection shared by every query in this repository, so `findById` and `list`
// can never drift apart. `satisfies` binds it to the row type: a renamed column
// fails here rather than silently at a call site.
const postColumns = {
  id: posts.id,
  title: posts.title,
  content: posts.content,
  status: posts.status,
  views: posts.views,
  authorId: posts.authorId,
} satisfies Partial<Record<keyof PostSelect, unknown>>;

export type PostRow = Pick<PostSelect, keyof typeof postColumns>;

@Injectable()
export class PostRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string, executor?: DrizzleExecutor) {
    const [row] = await this.drizzle
      .resolveExecutor(executor)
      .select({ ...postColumns, authorName: users.name })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id))
      .limit(1);

    return row ?? null;
  }

  async list(params: {
    status?: PostStatus;
    search?: string;
    afterId?: string;
    limit: number;
  }) {
    const db = this.drizzle.getDb();
    const conditions = this.buildListConditions(params);

    // One extra row tells you whether a next page exists, without a second count query.
    const rows = await db
      .select(postColumns)
      .from(posts)
      .where(conditions)
      .orderBy(asc(posts.id))
      .limit(params.limit + 1);

    const hasMore = rows.length > params.limit;

    return {
      rows: hasMore ? rows.slice(0, params.limit) : rows,
      nextCursor: hasMore ? (rows[params.limit - 1]?.id ?? null) : null,
    };
  }

  async count(params: { status?: PostStatus; search?: string }): Promise<number> {
    const [row] = await this.drizzle
      .getDb()
      .select({ total: count() })
      .from(posts)
      .where(this.buildListConditions(params));

    return row?.total ?? 0;
  }

  async create(
    values: { title: string; content?: string; authorId: string },
    executor?: DrizzleExecutor,
  ): Promise<PostRow> {
    const [row] = await this.drizzle
      .resolveExecutor(executor)
      .insert(posts)
      .values(values)
      .returning(postColumns);

    return row!;
  }

  async publish(id: string, executor?: DrizzleExecutor): Promise<PostRow | null> {
    const [row] = await this.drizzle
      .resolveExecutor(executor)
      .update(posts)
      .set({ status: 'published' })
      .where(eq(posts.id, id))
      .returning(postColumns);

    return row ?? null;
  }

  async remove(id: string, executor?: DrizzleExecutor): Promise<void> {
    await this.drizzle.resolveExecutor(executor).delete(posts).where(eq(posts.id, id));
  }

  // Collect optional filters into an array, then combine. `where(undefined)` is a no-op
  // in Drizzle, so there is one query chain regardless of how many filters were passed.
  private buildListConditions(params: {
    status?: PostStatus;
    search?: string;
    afterId?: string;
  }): SQL | undefined {
    const parts: SQL[] = [];

    if (params.status !== undefined) parts.push(eq(posts.status, params.status));
    if (params.search !== undefined) parts.push(ilike(posts.title, `%${params.search}%`));
    if (params.afterId !== undefined) parts.push(gt(posts.id, params.afterId));

    return parts.length ? and(...parts) : undefined;
  }
}
```

Every query returns a precisely typed result. `findById` returns a `PostRow` with an added `authorName` of `string | null`, or `null` when no row matches. Drizzle derives the nullable `authorName` from the `leftJoin`; the outer `null` is the `row ?? null` return.

#### Add a controller

```typescript
@@filename(modules/feature/post/post.controller)
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PostRepository } from './post.repository';
import type { PostStatus } from '../../dal/schema';

@Controller('posts')
export class PostController {
  constructor(private readonly postRepository: PostRepository) {}

  @Get()
  list(
    @Query('status') status?: PostStatus,
    @Query('search') search?: string,
    @Query('after') afterId?: string,
  ) {
    return this.postRepository.list({ status, search, afterId, limit: 20 });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundException(`Post ${id} not found`);
    return post;
  }

  @Post()
  create(@Body() body: { title: string; content?: string; authorId: string }) {
    return this.postRepository.create(body);
  }

  @Put(':id/publish')
  async publish(@Param('id', ParseUUIDPipe) id: string) {
    const post = await this.postRepository.publish(id);
    if (!post) throw new NotFoundException(`Post ${id} not found`);
    return post;
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.postRepository.remove(id);
  }
}
```

Register the feature module:

```typescript
@@filename(modules/feature/post/post.module)
import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostRepository } from './post.repository';

@Module({
  controllers: [PostController],
  providers: [PostRepository],
  exports: [PostRepository],
})
export class PostModule {}
```

Add `PostModule` to the `imports` array of `AppModule`, run `npm run start:dev`, and the API is live. Note that `DalModule` is global, so `PostModule` imports nothing to reach the database.

#### Run migrations at startup

Committed SQL files still have to reach the database. A separate migration script makes that a deliberate step in your deploy, rather than something that happens whenever a container boots.

Create `src/migrate.ts`:

```typescript
@@filename(migrate)
import 'dotenv/config';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  await migrate(db, { migrationsFolder: path.join(__dirname, '../drizzle') });
  await pool.end();
}

main().catch((err: unknown) => {
  console.error('Database migration failed', err);
  process.exit(1);
});
```

Run it with `node dist/migrate` after your build, before the application starts. `migrate()` records what it has applied in a table of its own, so re-running it is safe.

> warning **Note** Run migrations from one process, not from every replica at once. Drizzle's migrator takes no lock: two processes can both read the same last-applied migration and then both try to apply it. A deploy job or an init container is the right place.

### Patterns

The setup above is enough to ship. What follows is what holds up once the schema reaches dozens of tables and several people are working in it.

#### Shared column blocks

Most tables carry the same housekeeping columns. Define them once and spread them in:

```typescript
@@filename(modules/dal/utils)
import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

export const timestamps = {
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
};

export const timestampsWithSoftDelete = {
  ...timestamps,
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
};
```

```typescript
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...timestamps,
  title: text('title').notNull(),
});
```

The `timestamp` columns above use `mode: 'date'` with no time zone, so they only behave if your application and your database both run in UTC. If either one drifts you get wrong times rather than an error. Pass `withTimezone: true` if you cannot guarantee that.

`$onUpdate` sets the value on every `update` Drizzle issues. It runs in your application, not the database, so a statement from psql or a migration will not trigger it. Add a database trigger as well if that matters to you.

#### Branded id types

A multi-tenant schema has tables holding several `uuid` foreign keys. Both are `string` to TypeScript, so nothing stops you passing a `businessId` where a `userId` was expected. The code compiles, the query runs, and it returns zero rows.

Branded types close that gap. Give each id a distinct nominal type and a mismatch fails the build:

```typescript
@@filename(modules/dal/schema/ids)
declare const __idBrand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [__idBrand]: B };

export type UserId = Brand<string, 'UserId'>;
export type PostId = Brand<string, 'PostId'>;

/** Mints a branded id from a value you have already validated. */
export const asId = <TId extends Brand<string, string>>(value: string): TId => value as TId;
```

Attach the brand to columns with `.$type<>()`:

```typescript
@@filename(modules/dal/schema/post.schema)
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { users } from './user.schema';
import type { PostId, UserId } from './ids';

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().default(sql`uuidv7()`).$type<PostId>(),
  title: text('title').notNull(),
  authorId: uuid('author_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .$type<UserId>(),
});
```

The brand now carries through `InferSelectModel`, through query results, and into every repository signature. Call `asId<PostId>(value)` once at each trust boundary, meaning a route parameter, a JWT claim, or a request body, after validation has run:

```typescript
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) {
  return this.postRepository.findById(asId<PostId>(id));
}
```

Brands exist only at compile time. At runtime these are plain strings, so they cost nothing in speed or memory.

A helper keeps the primary key definition tidy:

```typescript
export const brandedPk = <TId>() => ({
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`)
    .$type<TId>(),
});

export const posts = pgTable('posts', {
  ...brandedPk<PostId>(),
  ...timestamps,
  title: text('title').notNull(),
});
```

#### Composable repository methods

Add `executor?: DrizzleExecutor` to every repository method and the transaction boundary stops belonging to the repository. Each method works on its own, and the caller decides what has to be atomic:

```typescript
// Standalone: opens and commits its own implicit transaction.
await this.postRepository.publish(postId);

// Joined: part of a larger unit of work, rolls back with everything else.
await this.drizzle.getDb().transaction(async (tx) => {
  await this.postRepository.publish(postId, tx);
  await this.notificationRepository.create({ postId }, tx);
});
```

Without the parameter you end up writing each method twice, or opening nested transactions that do not roll back together.

`runInTransaction` covers the case where a method needs several statements of its own and must still compose:

```typescript
async archiveAuthor(authorId: UserId, executor?: DrizzleExecutor): Promise<void> {
  await this.drizzle.runInTransaction(executor, async (tx) => {
    await tx.update(posts).set({ status: 'draft' }).where(eq(posts.authorId, authorId));
    await tx.update(users).set({ archivedAt: new Date() }).where(eq(users.id, authorId));
  });
}
```

Called on its own it opens a transaction. Called with a `tx` it reuses that one. No nesting, one commit.

#### A unit-of-work service

When several repositories take part in one operation, a small service gives the transaction a name and one place to log from:

```typescript
@@filename(modules/dal/unit-of-work.service)
import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';
import type { DrizzleTransaction, DrizzleTransactionOptions } from './drizzle.types';

@Injectable()
export class UnitOfWorkService {
  private readonly logger = new Logger(UnitOfWorkService.name);

  constructor(private readonly drizzle: DrizzleService) {}

  async execute<T>(
    work: (tx: DrizzleTransaction) => Promise<T>,
    options?: DrizzleTransactionOptions,
  ): Promise<T> {
    try {
      const result = await this.drizzle.getDb().transaction(work, options);
      this.logger.debug('Transaction committed');
      return result;
    } catch (error) {
      this.logger.error(
        'Transaction rolled back',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
```

Add it to the `providers` and `exports` of `DalModule`, then use it from any service:

```typescript
@@filename(modules/feature/post/post.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { posts } from '../../dal/schema';
import type { PostId } from '../../dal/schema/ids';
import { UnitOfWorkService } from '../../dal/unit-of-work.service';
import { PostRepository, type PostRow } from './post.repository';

@Injectable()
export class PostService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly unitOfWork: UnitOfWorkService,
  ) {}

  async publishAndCount(id: PostId): Promise<PostRow> {
    return this.unitOfWork.execute(async (tx) => {
      const published = await this.postRepository.publish(id, tx);
      if (!published) throw new NotFoundException(`Post ${id} not found`);

      await tx
        .update(posts)
        .set({ views: sql`${posts.views} + 1` })
        .where(eq(posts.id, id));

      return published;
    });
  }
}
```

Throwing inside the callback rolls the whole transaction back, so the `NotFoundException` above undoes the update as well as reaching the client.

`options` takes a Postgres isolation level and access mode when you need them:

```typescript
await this.unitOfWork.execute(work, { isolationLevel: 'serializable' });
```

#### Optional filters

Collect conditions into an `SQL[]`, then combine with `and(...parts)`. `where(undefined)` is a no-op in Drizzle, so a single query chain covers every combination of filters:

```typescript
// Do this.
private buildListConditions(params: ListParams): SQL | undefined {
  const parts: SQL[] = [];

  if (params.status !== undefined) parts.push(eq(posts.status, params.status));
  if (params.search !== undefined) parts.push(ilike(posts.title, `%${params.search}%`));
  if (params.authorId !== undefined) parts.push(eq(posts.authorId, params.authorId));

  return parts.length ? and(...parts) : undefined;
}

const rows = await db.select(postColumns).from(posts).where(conditions).limit(20);
```

```typescript
// Not this. The whole chain is duplicated, and it grows with every new filter.
const rows = conditions
  ? await db.select(postColumns).from(posts).where(conditions).limit(20)
  : await db.select(postColumns).from(posts).limit(20);
```

Type `parts` as `SQL[]`, not as `ReturnType<typeof eq>[]`. The narrower type excludes the result of `or(...)` and will not compile the moment you add one.

#### Keyset pagination

`OFFSET` gets slower the deeper you page, because the database still has to walk every skipped row. Keyset pagination carries a cursor instead: fetch `limit + 1` rows, and if you got more than `limit`, there is another page.

```typescript
const rows = await db
  .select(postColumns)
  .from(posts)
  .where(and(conditions, afterId ? gt(posts.id, afterId) : undefined))
  .orderBy(asc(posts.id))
  .limit(limit + 1);

const hasMore = rows.length > limit;
const pageRows = hasMore ? rows.slice(0, limit) : rows;
const nextCursor = hasMore ? (pageRows[pageRows.length - 1]?.id ?? null) : null;
```

Use `gt` when ordering ascending and `lt` when descending. This depends on the primary key sorting in insertion order, which is why the schema above uses `uuidv7()` rather than a random v4. Postgres compares `uuid` values byte by byte, and a v7 UUID starts with a millisecond timestamp, so ordering by id orders by creation time. With a random `defaultRandom()` key you still get stable pages, but they are in arbitrary order, so add a timestamp column to the sort and the cursor. Encode the cursor (base64 is enough) before it reaches a client, and decode it in the controller. The repository should receive an `afterId` that is already a plain value.

#### Joins for optional relations

Use `innerJoin` when the relation must exist and `leftJoin` when it may not. Drizzle types the result accordingly: columns from a `leftJoin` come back nullable, so the compiler makes you handle the missing case.

```typescript
// users.email is notNull, so an innerJoin keeps it non-nullable.
const rows = await db
  .select({ ...postColumns, authorEmail: users.email })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id)); // authorEmail: string

// A leftJoin may match no row, so every joined column widens to include null.
const rows = await db
  .select({ ...postColumns, authorEmail: users.email })
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id)); // authorEmail: string | null
```

For counts and other aggregates over a related table, one grouped query beats a query per row:

```typescript
async attachPostCounts(rows: UserRow[]): Promise<(UserRow & { postCount: number })[]> {
  if (rows.length === 0) return [];

  const grouped = await this.drizzle
    .getDb()
    .select({ authorId: posts.authorId, total: count() })
    .from(posts)
    .where(inArray(posts.authorId, rows.map((r) => r.id)))
    .groupBy(posts.authorId);

  const counts = new Map(grouped.map((g) => [g.authorId, g.total]));

  return rows.map((row) => ({ ...row, postCount: counts.get(row.id) ?? 0 }));
}
```

#### Raw SQL, safely

The `sql` template tag parameterises everything you interpolate, so values never reach the database as text. Use it for expressions the query builder does not cover:

```typescript
import { sql } from 'drizzle-orm';

// Correlated subquery as a select field.
const rows = await db
  .select({
    ...postColumns,
    commentCount: sql<number>`(
      SELECT count(*)::int8
      FROM comments c
      WHERE c.post_id = ${posts.id}
    )`.mapWith(Number),
  })
  .from(posts);

// Atomic increment, computed by the database rather than read-modify-write.
await db
  .update(posts)
  .set({ views: sql`${posts.views} + 1` })
  .where(eq(posts.id, id));
```

A correlated subquery runs once per row, so it needs an index on the column it filters by, here `comments.post_id`. Without one the planner scans the whole `comments` table for every post returned. Note the `::int8` cast too. `count(*)` returns a `bigint`, and casting to a 32-bit `int` throws once the table passes about 2.1 billion rows.

Two more details. `sql<number>` only asserts the shape; `.mapWith(Number)` does the conversion, and you need it because the `pg` driver returns raw `count(*)` and `bigint` results as strings. Drizzle's own `count()` helper already calls `.mapWith(Number)` for you, so it is only raw `sql` that needs the hint. Second, never build the SQL string with a JavaScript template literal first. `sql.raw()` and string concatenation both skip parameterisation and open you to injection. Interpolate through the tag.

#### Handling constraint violations

A unique index turns a race condition into a database error rather than a corrupt row. Catch it by constraint name and translate it into something your callers can act on:

```typescript
@@filename(common/db-error)
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505' &&
    'constraint' in error &&
    error.constraint === constraint
  );
}
```

```typescript
try {
  return await this.userRepository.create(values);
} catch (error) {
  if (isUniqueViolation(error, 'users_email_key')) {
    throw new ConflictException('That email address is already registered.');
  }
  throw error;
}
```

Checking the named constraint rather than the bare `23505` code matters on tables with more than one unique index. Otherwise every conflict reports the same message.

#### Testing

Drizzle builds real SQL, so mocking the query builder tests almost nothing. Two approaches work.

For unit tests of services, mock the repository. It is an ordinary class with plain method signatures:

```typescript
const postRepository = {
  publish: jest.fn().mockResolvedValue({ id: 'a-uuid', status: 'published' }),
};

const moduleRef = await Test.createTestingModule({
  providers: [
    PostService,
    { provide: PostRepository, useValue: postRepository },
    {
      provide: UnitOfWorkService,
      useValue: { execute: (work: any) => work({}) },
    },
  ],
}).compile();
```

For the repositories themselves, run against a real PostgreSQL. [Testcontainers](https://node.testcontainers.org/) starts one per suite. Truncate between tests to isolate them:

```typescript
beforeEach(async () => {
  await pool.query('TRUNCATE TABLE posts, users RESTART IDENTITY CASCADE');
});
```

> warning **Note** A tempting alternative is to wrap each test in a transaction and roll it back in `afterEach`. Written as `pool.query('BEGIN')` and `pool.query('ROLLBACK')` it does nothing: `pool.query()` checks out any idle client, so the `ROLLBACK` usually lands on a different connection from the one that did the writes. To make that pattern work you have to check out one client with `pool.connect()`, build the Drizzle handle from that single client, and run the whole test through it. Truncating is simpler and it also covers writes made by the application under test, which gets its own connection.

Only a real database catches the failures that matter: a constraint you forgot, a cascade that deletes more than you meant, an index the planner ignores.

#### What changes in Drizzle 1.0

Drizzle 1.0 is in release candidate. Know what differs before you pin a version:

- **Relations are declared separately.** The `relations()` helper is replaced by a `defineRelations()` config passed to `drizzle()`. Types come from that config rather than from the schema barrel, so `NodePgDatabase<typeof schema>` becomes `NodePgDatabase<EmptyRelations>` when you do not use the relational query builder.
- **Casing moves to the table.** Automatic snake_case is not new. The `casing: 'snake_case'` option on `drizzle()` has existed since 0.34. What changes is where you set it. 1.0 replaces that one connection-level option with per-table helpers such as `pgTable.snakeCase`, so `createdAt` maps to `created_at` without you writing the string twice.
- **A rewritten relational query builder.** `db.query.*` and `with:` were rebuilt for better SQL and better types.

Until 1.0 is stable, `0.45.x` is the version to build on. The query builder, the migration workflow, and every Nest pattern in this recipe carry across unchanged.

#### Summary

Drizzle gives you a data layer built from typed objects and a query builder, with no code generation, no decorators, and no runtime metadata. Nest holds it together. A global `DalModule` owns the pool, a `DrizzleService` hands out the database, a repository per feature keeps the queries together, and the `executor` parameter lets any of them join a caller's transaction.

To read further:

- [Drizzle documentation](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit migrations](https://orm.drizzle.team/docs/kit-overview)
- [Query builder reference](https://orm.drizzle.team/docs/select)
- [Drizzle with PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
