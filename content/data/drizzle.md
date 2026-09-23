### Drizzle

As an alternative to TypeORM, you can use [Drizzle ORM](https://orm.drizzle.team/) with the `@nestjs/drizzle` package. Drizzle is a lightweight, TypeScript-first ORM. You declare tables with plain functions and write queries with a SQL-like query builder (or the relational query API for nested reads), and Drizzle infers every result type from the schema. There are no entity classes, decorators, or code generation steps.

To get started, install the required dependencies. This chapter uses [PostgreSQL](https://www.postgresql.org/) with the `node-postgres` driver, but Drizzle supports many other databases, including MySQL, SQLite, and Microsoft SQL Server, as well as serverless databases such as Neon, Turso, and Cloudflare D1. The steps in this chapter are the same for every database Drizzle supports: install the driver for your database, and import `drizzle()` from the matching [entry point](https://orm.drizzle.team/docs/connect-overview) (e.g., `drizzle-orm/mysql2` or `drizzle-orm/libsql`) instead of `drizzle-orm/node-postgres`.

```bash
$ npm install --save @nestjs/drizzle drizzle-orm@rc pg
$ npm install --save-dev drizzle-kit@rc @types/pg
```

> info **Hint** This chapter uses Drizzle ORM v1, currently published under the `rc` tag. The Drizzle documentation is written for this version. `@nestjs/drizzle` also supports Drizzle v0.35 and later. With v0.x, only relations and relational queries work differently from this chapter (see [Upgrading to v1](https://orm.drizzle.team/docs/upgrade-v1)).

#### Schema

With Drizzle, you write the database schema in TypeScript. You declare each table with a function such as `pgTable()` and export it from a schema file. Let's define the `users` table:

```typescript
@@filename(db/schema)
import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

The `$inferSelect` and `$inferInsert` helpers derive the row types from the table definition, so there's no separate model class to keep in sync with the schema. For the available column types, see [Schema declaration](https://orm.drizzle.team/docs/sql-schema-declaration) in the Drizzle documentation.

#### Registering the database

Once the dependencies are installed and the schema is defined, import the `DrizzleModule` into the root `AppModule`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';

@Module({
  imports: [
    DrizzleModule.forRoot({
      drizzle,
      connection: process.env.DATABASE_URL!,
    }),
  ],
})
export class AppModule {}
```

The `drizzle` option takes the `drizzle()` function of your driver. `DrizzleModule` calls it with the `connection` and the other Drizzle options once for each application instance. Every application, including each one your e2e tests create, therefore gets its own connection pool, which is closed when that application shuts down. Because you pass the function, every driver Drizzle supports works the same way, and TypeScript checks `connection` and the other options against that driver's `drizzle()` signature.

The `forRoot()` method supports the following options:

<table>
  <tr>
    <td><code>drizzle</code></td>
    <td>The <code>drizzle()</code> function of your driver, e.g., the one exported by <code>drizzle-orm/node-postgres</code></td>
  </tr>
  <tr>
    <td><code>connection</code></td>
    <td>A connection string, or the driver's connection options (e.g., a <code>pg</code> pool configuration)</td>
  </tr>
  <tr>
    <td><code>db</code></td>
    <td>A database instance that you created, used instead of <code>drizzle</code> and <code>connection</code> (see below)</td>
  </tr>
  <tr>
    <td><code>autoCloseConnection</code></td>
    <td>If <code>true</code>, the database's client (<code>db.$client</code>) is closed when the application shuts down (default: <code>true</code>)</td>
  </tr>
</table>

Other options, such as `relations`, `logger`, or `casing`, are passed to `drizzle()` as well.

> info **Hint** Like the options of any module, the `forRoot()` options are evaluated when the `AppModule` file is imported, so `process.env.DATABASE_URL` must already be set at that point (e.g., by starting Node.js with the `--env-file=.env` flag). To read the connection string through `ConfigService` instead, use `forRootAsync()`, described in the "Async configuration" section below.

> info **Hint** The client is closed when you call `app.close()`, or when the process receives a termination signal if [shutdown hooks](/fundamentals/lifecycle-events#application-shutdown) are enabled. Pool-based clients (e.g., `node-postgres`, `postgres.js`, `mysql2`) are closed with `end()`, and others (e.g., `better-sqlite3`, `libsql`, PGlite) with `close()`. For a database created with Drizzle's [`withReplicas()`](https://orm.drizzle.team/docs/read-replicas) function, the clients of the primary and all replica databases are closed (with Drizzle v0.44.6 and later; earlier versions don't expose the replicas, so only the primary's client is closed). A client registered under several names is closed only once.

Once the module is registered, you can inject the database anywhere in the project (without importing any modules) with the `@InjectDrizzle()` decorator. For example:

```typescript
@@filename(app.service)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class AppService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) {}
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';

@Injectable()
@Dependencies(getDrizzleToken())
export class AppService {
  constructor(db) {
    this.db = db;
  }
}
```

To register a database that you create yourself, e.g., one that routes reads to replicas with Drizzle's `withReplicas()` function, pass it as `db` instead. Create it in a `forRootAsync()` factory, which runs once for each application:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { withReplicas } from 'drizzle-orm/pg-core';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      useFactory: () => ({
        db: withReplicas(drizzle(process.env.DATABASE_URL!), [
          drizzle(process.env.REPLICA_DATABASE_URL!),
        ]),
      }),
    }),
  ],
})
export class AppModule {}
```

> warning **Warning** You can also pass a `db` instance to `forRoot()`, e.g., one exported by a `db` file that your seed scripts import too. Such an instance is created once, when its file is first imported. Every application created from `AppModule` shares it, and the first application to shut down closes it, which breaks e2e test suites that create a new application for each test. In that case, set `autoCloseConnection` to `false` and close the client yourself.

#### Queries

Unlike the TypeORM integration, Drizzle has no `forFeature()` step. Drizzle tables are plain objects that you import wherever you build queries, and the database is registered globally, so any provider can inject it. Let's implement the `UsersService`:

```typescript
@@filename(users.service)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users, type NewUser, type User } from '../db/schema.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) {}

  findAll(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async findOne(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async create(user: NewUser): Promise<User> {
    const [createdUser] = await this.db.insert(users).values(user).returning();
    return createdUser;
  }

  async remove(id: number): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema.js';

@Injectable()
@Dependencies(getDrizzleToken())
export class UsersService {
  constructor(db) {
    this.db = db;
  }

  findAll() {
    return this.db.select().from(users);
  }

  async findOne(id) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async create(user) {
    const [createdUser] = await this.db.insert(users).values(user).returning();
    return createdUser;
  }

  async remove(id) {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
```

A Drizzle query runs when it's awaited (or returned from an `async` function), and its result type is inferred from the columns it selects. The Drizzle documentation covers [selecting](https://orm.drizzle.team/docs/select), [inserting](https://orm.drizzle.team/docs/insert), [updating](https://orm.drizzle.team/docs/update), and [deleting](https://orm.drizzle.team/docs/delete) rows in detail.

#### Relations

Relations are associations between two or more tables, based on common fields, usually primary and foreign keys. Drizzle's [relational queries](https://orm.drizzle.team/docs/rqb-v2) use them to fetch nested data, such as users together with their photos, without writing joins by hand.

Let's add a `photos` table whose `userId` column references the `users` table:

```typescript
@@filename(db/schema)
export const photos = pgTable('photos', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  url: text().notNull(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
});
```

You declare the relations for the whole schema at once, with the `defineRelations()` function. For example, each user can have many photos, and each photo belongs to one user:

```typescript
@@filename(db/relations)
import { defineRelations } from 'drizzle-orm';
import * as schema from './schema.js';

export const relations = defineRelations(schema, (r) => ({
  users: {
    photos: r.many.photos(),
  },
  photos: {
    user: r.one.users({
      from: r.photos.userId,
      to: r.users.id,
    }),
  },
}));
```

To make the relations available to relational queries, pass them to `drizzle()` with the `relations` option:

```typescript
DrizzleModule.forRoot({
  drizzle,
  connection: process.env.DATABASE_URL!,
  relations,
}),
```

The database type now depends on the relations, so declare it once and reuse it wherever you inject the database:

```typescript
@@filename(db/database)
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { relations } from './relations.js';

export type Database = NodePgDatabase<typeof relations>;
```

With that in place, the `db.query` API is fully typed:

```typescript
@@filename(users.service)
@Injectable()
export class UsersService {
  constructor(
    @InjectDrizzle()
    private readonly db: Database,
  ) {}

  findOneWithPhotos(id: number) {
    return this.db.query.users.findFirst({
      where: { id },
      with: { photos: true },
    });
  }
}
```

> info **Hint** Relations only drive relational queries. Foreign key constraints come from `references()` in the table definition. To learn more, see [Relations](https://orm.drizzle.team/docs/relations-v2) in the Drizzle documentation.

#### Drizzle Transactions

A database transaction is a unit of work that the database management system treats as a whole, independently of other transactions: either all of its changes are applied, or none of them are. To learn more, see [Database transaction](https://en.wikipedia.org/wiki/Database_transaction) on Wikipedia.

To start a [Drizzle transaction](https://orm.drizzle.team/docs/transactions), call the `transaction()` method of the injected database. The callback receives a transaction object (`tx`) that exposes the same query API as the database:

```typescript
async deactivate(id: number) {
  await this.db.transaction(async (tx) => {
    await tx.update(users).set({ isActive: false }).where(eq(users.id, id));
    await tx.delete(photos).where(eq(photos.userId, id));
  });
}
```

If the callback throws or calls `tx.rollback()`, the transaction is rolled back and `transaction()` rejects with the error. Otherwise, the transaction is committed, and `transaction()` resolves with the value the callback returned. Queries that belong to the transaction must run through `tx`, not through the injected database.

> info **Hint** To run code from several providers in one transaction without passing `tx` around, propagate the transaction with `AsyncLocalStorage`. The [`nestjs-cls`](/recipes/async-local-storage#nestjs-cls) package provides a transactional plugin with a [Drizzle adapter](https://papooch.github.io/nestjs-cls/plugins/available-plugins/transactional/drizzle-orm-adapter) that does this.

#### Custom repositories

Drizzle has no repository layer: you build queries from the injected database and the table definitions. To keep the queries for a table in one place, and to make the classes that use them easy to unit test, you can write a repository yourself as a regular provider:

```typescript
@@filename(users.repository)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/database.js';
import { users, type User } from '../db/schema.js';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectDrizzle()
    private readonly db: Database,
  ) {}

  findActive(): Promise<User[]> {
    return this.db.select().from(users).where(eq(users.isActive, true));
  }

  async deactivate(id: number): Promise<void> {
    await this.db.update(users).set({ isActive: false }).where(eq(users.id, id));
  }
}
```

Register `UsersRepository` in the `providers` array of `UsersModule`, and inject it into `UsersService` instead of the database. In unit tests, replace it with a [custom provider](/fundamentals/custom-providers) whose `useValue` is an object implementing the methods your service calls, such as `findActive()`.

> warning **Warning** Repository methods query the injected database, not a transaction's `tx`. With a connection pool, they run on a different connection than a transaction started elsewhere with `db.transaction()`, so they aren't part of it. To run them in a transaction, accept `tx` as a parameter, or propagate the transaction with `nestjs-cls` as described above.

#### Migrations

[Migrations](https://orm.drizzle.team/docs/migrations) incrementally update the database schema to keep it in sync with the application's data model, while preserving the existing data. To generate and run migrations, Drizzle provides a dedicated CLI, [Drizzle Kit](https://orm.drizzle.team/docs/kit-overview), which reads its settings from a `drizzle.config.ts` file in the root directory of your project:

```typescript
@@filename(drizzle.config)
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

With that file in place, `npx drizzle-kit generate` creates SQL migration files from your schema changes, and `npx drizzle-kit migrate` applies them to the database.

Drizzle Kit runs outside your Nest application, so migrations can't use dependency injection or other Nest-specific features. Drizzle Kit loads the `.env` file from the directory you run it in, so `process.env.DATABASE_URL` is available in `drizzle.config.ts` without `ConfigModule`. Variables already set in the environment take precedence over the file.

To apply pending migrations when the application starts instead, create the database in a `forRootAsync()` factory and apply them there. The factory can be `async`, and Nest doesn't create the providers that inject the database until it resolves:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

DrizzleModule.forRootAsync({
  useFactory: async () => {
    const db = drizzle(process.env.DATABASE_URL!, { relations });
    await migrate(db, { migrationsFolder: './drizzle' });
    return { db };
  },
}),
```

> warning **Warning** When several instances of your application start at the same time, each of them tries to apply the migrations. In such deployments, run `drizzle-kit migrate` as a separate step of your release process instead.

<app-banner-courses></app-banner-courses>

#### Multiple databases

Some projects require multiple database connections, and the `DrizzleModule` supports this as well. Register each database with its own `DrizzleModule` import. In this case, every database except one must have a name:

```typescript
@Module({
  imports: [
    DrizzleModule.forRoot({
      drizzle,
      connection: process.env.DATABASE_URL!,
      relations,
    }),
    DrizzleModule.forRoot({
      name: 'analytics',
      drizzle,
      connection: process.env.ANALYTICS_DATABASE_URL!,
    }),
  ],
})
export class AppModule {}
```

> warning **Notice** A database registered without a `name` is named `default`. Don't register multiple databases without a name, or with the same name: they would share one injection token, and only one of them would be injected.

The databases don't have to share a driver: `analytics` could just as well be a SQLite file opened with the `drizzle()` function from `drizzle-orm/better-sqlite3`. To inject a database other than the default one, pass its name to the `@InjectDrizzle()` decorator:

```typescript
@Injectable()
export class ReportsService {
  constructor(
    @InjectDrizzle('analytics')
    private readonly analyticsDb: NodePgDatabase,
  ) {}
}
```

You can also inject any database into a factory provider with the `getDrizzleToken()` function, which returns the injection token of the database with the given name:

```typescript
@Module({
  providers: [
    {
      provide: ReportsService,
      useFactory: (analyticsDb: NodePgDatabase) => {
        return new ReportsService(analyticsDb);
      },
      inject: [getDrizzleToken('analytics')],
    },
  ],
})
export class ReportsModule {}
```

#### Testing

When unit testing an application, you usually want to avoid connecting to a database, to keep test suites independent and fast. However, your classes depend on the database injected with `@InjectDrizzle()`. To solve this, replace the database with a mock, using a [custom provider](/fundamentals/custom-providers). The `getDrizzleToken()` function returns the injection token of the default database (or of the database whose name you pass):

```typescript
@Module({
  providers: [
    UsersService,
    {
      provide: getDrizzleToken(),
      useValue: mockDb,
    },
  ],
})
export class UsersModule {}
```

Nest now injects the `mockDb` object wherever a class requests the database with the `@InjectDrizzle()` decorator. Drizzle's query builder is chainable (e.g., `select().from().where()`), so a mock has to implement every method in the chain your code calls. For anything beyond simple queries, either move the queries into [custom repositories](/data/drizzle#custom-repositories) and mock those, or run these tests against a real database.

#### Async configuration

To pass the `DrizzleModule` options asynchronously instead of statically, use the `forRootAsync()` method. It supports several ways to provide the options.

One approach is a factory function. The factory behaves like any other [asynchronous provider](/fundamentals/async-providers): it can be `async`, and it can inject dependencies through `inject`. It returns the same options as `forRoot()` (except `name`), either `drizzle` and `connection` or a `db` instance:

```typescript
DrizzleModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    drizzle,
    connection: configService.getOrThrow<string>('DATABASE_URL'),
    relations,
  }),
  inject: [ConfigService],
});
```

Alternatively, you can use the `useClass` syntax:

```typescript
DrizzleModule.forRootAsync({
  imports: [ConfigModule],
  useClass: DrizzleConfigService,
});
```

With this construction, `DrizzleModule` instantiates `DrizzleConfigService`, resolving its dependencies from the modules in `imports`, and calls its `createDrizzleOptions()` method to get the options. `DrizzleConfigService` must therefore implement the `DrizzleOptionsFactory` interface:

```typescript
@Injectable()
class DrizzleConfigService implements DrizzleOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createDrizzleOptions(): DrizzleModuleFactoryOptions {
    return {
      drizzle,
      connection: this.configService.getOrThrow<string>('DATABASE_URL'),
      relations,
    };
  }
}
```

> info **Hint** `createDrizzleOptions()` receives the name of the database being registered (`undefined` for the default one), so a single class can configure several databases.

To reuse a provider from another module instead of instantiating `DrizzleConfigService` inside `DrizzleModule`, use the `useExisting` syntax:

```typescript
DrizzleModule.forRootAsync({
  imports: [DatabaseConfigModule],
  useExisting: DrizzleConfigService,
});
```

This works like `useClass`, with one critical difference: `DrizzleModule` reuses the `DrizzleConfigService` instance exported by an imported module (here, `DatabaseConfigModule`) instead of creating a new one.
