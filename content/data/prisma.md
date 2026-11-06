### Prisma

[Prisma](https://www.prisma.io) is an [open-source](https://github.com/prisma/prisma) ORM for Node.js and TypeScript. You can use it as an **alternative** to writing plain SQL or to other database access tools, such as SQL query builders (like [knex.js](https://knexjs.org/)) or other ORMs (like [TypeORM](https://typeorm.io/) and [Sequelize](https://sequelize.org/)). This chapter uses Prisma ORM 8 with PostgreSQL. Prisma ORM 8 also targets MongoDB; for MySQL, SQL Server, SQLite, and CockroachDB, use [Prisma ORM 7](https://www.prisma.io/docs/orm/v7), which the [supported databases](https://www.prisma.io/docs/orm/supported-databases) page tracks.

While you can use Prisma with plain JavaScript, it embraces TypeScript and provides a level of type safety that goes beyond the guarantees of other ORMs in the TypeScript ecosystem.

Prisma has no Nest-specific package. Instead, you describe your data in a **contract**, emit a typed description of it, create a database client from that contract, wrap the client in a provider, and inject that provider wherever you need database access. This chapter sets up that integration with a PostgreSQL database.

> info **Note** For an overview of how Prisma ORM 8 works, follow the [Getting started](https://www.prisma.io/docs/getting-started) guide in the [Prisma documentation](https://www.prisma.io/docs). Prisma ORM 8 is a release candidate at the time of writing; see the [release status](https://www.prisma.io/docs/orm/release-status) page for the current state. If you are migrating from TypeORM, read [Switching from a SQL ORM to Prisma](https://www.prisma.io/docs/guides/switch-to-prisma-orm/from-sql-orms).

#### Installation

Prisma ORM 8 requires Node.js 22.18, 24.11, or 26 and newer, and PostgreSQL 15 or newer. In your NestJS project, run the `orm init` command of the Prisma CLI:

```bash
$ npx prisma@latest orm init --target postgres --authoring psl
```

Without the `--target` and `--authoring` options, the command asks you for the database and the schema language interactively. It installs the `prisma` CLI as a development dependency and the `@prisma/orm-postgres` and `dotenv` packages as dependencies, and creates the following files:

- `prisma.config.ts`: The Prisma configuration file, created in the project root. It sets the location of the contract and reads the database connection URL from the `DATABASE_URL` environment variable.
- `src/prisma/contract.prisma`: Your data contract, with a starter `User` and `Post` model that you'll replace below
- `src/prisma/contract.json` and `src/prisma/contract.d.ts`: The emitted contract, which the database client reads at runtime and TypeScript reads for the query types
- `src/prisma/db.ts`: A module-level database client for scripts. A NestJS application creates the client inside a provider instead, so you can delete this file.
- `.env.example`: A template for the `.env` file with the `DATABASE_URL` variable

It also adds a `contract:emit` script to your `package.json` file and `.env` to your `.gitignore` file.

> warning **Warning** The `latest` tag of the `prisma` package on npm points to Prisma ORM 8, which is a different CLI from Prisma ORM 7. It doesn't provide the `prisma generate` and `prisma migrate` commands, and it doesn't read a `schema.prisma` file. A project on Prisma ORM 7 should pin `prisma` and `@prisma/client` to `^7`.

#### Set the database connection

Prisma reads the connection URL from the `DATABASE_URL` environment variable. If you don't have a PostgreSQL server yet, create a free Prisma Postgres database and write its URL to the `.env` file in one step:

```bash
$ npx create-db@latest --env .env
```

The command prints a claim URL. The database is deleted after 24 hours unless you open that URL and add the database to a Prisma account. With your own PostgreSQL server, copy `.env.example` to `.env` and set the URL yourself:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
```

Replace the uppercase placeholders with your database credentials. If you're unsure what to provide for the `SCHEMA` placeholder, it's most likely the default value `public`. Any PostgreSQL connection URI works.

The Prisma configuration file points the CLI at the contract and at the database:

```typescript
import 'dotenv/config';
import { definePrismaConfig } from 'prisma/config';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    db: {
      connection: process.env.DATABASE_URL!,
    },
  }),
});
```

The `import 'dotenv/config'` line is what loads `.env` for the Prisma CLI. Your NestJS application doesn't load `.env` automatically, though. Install the `@nestjs/config` package and register the [`ConfigModule`](/application/configuration) globally in your `AppModule`, so that `PrismaService` can read `DATABASE_URL` through `ConfigService`:

```bash
$ npm install @nestjs/config
```

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
})
export class AppModule {}
```

#### Data contract

The contract describes your models in the Prisma schema language. The first line of the file opts it into Prisma ORM 8; the CLI refuses a contract file without it. This chapter uses two models. Replace the starter models in `src/prisma/contract.prisma` with them:

```groovy
// use prisma-8

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}
```

Whenever you change the contract, emit it again:

```bash
$ npx prisma contract emit
```

This rewrites `src/prisma/contract.json` and `src/prisma/contract.d.ts`. Commit both files to version control: the application reads `contract.json` at runtime, and `contract.d.ts` provides the types for every query, so there is no generated client directory and no build step for the client.

#### Database schema

Create the tables in the database with the `db init` command. It applies the contract to an empty database and signs the database with the contract's hash:

```bash
$ npx prisma db init
```

In development, after each contract change, bring the database up to date with the `db update` command. Prisma plans the change from the difference between the signed contract and the new one:

```bash
$ npx prisma db update
```

A change that would lose data, such as dropping a column, stops with the `CLI.CONSENT_REQUIRED` error and lists the `--delete` and `--rename` options you need to pass to confirm each operation.

For production, record the change as a migration file instead. `migration plan` writes a migration directory under `migrations/app` with the SQL to review, and `db migrate` applies the migrations that the database hasn't seen yet:

```bash
$ npx prisma migration plan --name init
$ npx prisma db migrate
```

Run `npx prisma migration status` to see which migrations a database has. See [How migrations work](https://www.prisma.io/docs/orm/migrations/how-migrations-work) in the Prisma documentation for the complete workflow.

#### PrismaService

In a NestJS application, you expose the database client through a provider. The client is created by the `postgres()` function from `@prisma/orm-postgres/runtime`, which takes the contract and the connection URL and returns a client whose query surface is typed against the contract. Create a `PrismaService` class that owns one client and exposes it as its `db` property.

Create a `prisma.service.ts` file in the `src/prisma` directory, next to the contract:

```typescript
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import postgres, { type PostgresClient } from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from './contract.d.ts';
import contractJson from './contract.json' with { type: 'json' };

const contract = contractFromJson<Contract>(contractJson);

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly db: PostgresClient<Contract>;

  constructor(configService: ConfigService) {
    this.db = postgres({
      contract,
      url: configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async onModuleInit() {
    await this.db.connect();
  }

  async onModuleDestroy() {
    await this.db.close();
  }
}
```

`contractFromJson()` validates the emitted contract once and gives it the `Contract` type from `contract.d.ts`, so the `db` property knows every model and field. The constructor reads `DATABASE_URL` through `ConfigService`. The `getOrThrow()` method throws an error if the variable isn't set, so a missing connection URL stops the application at startup. The `onModuleInit()` and `onModuleDestroy()` hooks manage the connection pool, as described in [Connection lifecycle](#connection-lifecycle).

The `contract.json` import uses an import attribute, which Node.js requires for JSON modules in an ES module project (the default for new NestJS projects). Because the file is imported, `nest build` copies it into the `dist` directory along with the compiled code.

> info **Hint** If you don't use `@nestjs/config`, start Node.js with the `--env-file=.env` flag and read `process.env.DATABASE_URL` in the constructor instead.

#### Connection lifecycle

The client connects lazily: `postgres()` returns at once, and the connection pool opens on the first query. Calling `connect()` in the `onModuleInit()` hook opens the pool during application bootstrap instead, so a misconfigured connection fails at startup rather than on the first request.

Calling `close()` in the `onModuleDestroy()` hook waits for the queries that are still running, then ends the pool. Nest calls `onModuleDestroy()` when you call `app.close()`. To also call it when the process receives a termination signal, such as `SIGTERM`, enable shutdown hooks in your `main.ts` file:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

See [Application shutdown](/fundamentals/lifecycle-events#application-shutdown) to learn more about shutdown hooks.

> info **Hint** Create one client for the whole application and never call `close()` in a request handler. A closed client refuses every further query, and the pool is shared by all requests.

#### PrismaModule

Register `PrismaService` in a dedicated module that exports it. Create a `prisma.module.ts` file next to the service:

```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Import `PrismaModule` into every module that needs database access. Providers are singletons by default, so all importing modules share the same `PrismaService` instance and its connection pool.

> info **Hint** If most of your modules need database access, you can decorate `PrismaModule` with `@Global()` and import it only once, in your root module. See [Global modules](/modules#global-modules) for the trade-offs.

#### Querying from services

With `PrismaModule` in place, inject `PrismaService` into your providers and query the database through the `db.orm` property of the client. Models are addressed by their PostgreSQL schema, so the `User` model lives at `db.orm.public.User`. Each model is a collection that you narrow with chained calls (`where()`, `orderBy()`, `offset()`, `limit()`) before a terminal call runs the query: `all()` returns every matching row, `first()` returns one row or `null`, and `create()`, `update()`, and `delete()` write a row and return it.

The following `UsersService` wraps the CRUD queries for the `User` model:

```typescript
import { Injectable } from '@nestjs/common';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import {
  or,
  type CreateInput,
  type ScalarUpdateInput,
} from '@prisma/orm-postgres/orm-client';
import type { Contract, Models } from '../prisma/contract.d.ts';
import { PrismaService } from '../prisma/prisma.service.js';

export type User = Scalars<Models.public_User>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async user(id: number): Promise<User | null> {
    return this.prisma.db.orm.public.User.first({ id });
  }

  async users(params: {
    skip?: number;
    take?: number;
    search?: string;
  }): Promise<User[]> {
    const { skip = 0, take = 20, search } = params;
    const users = this.prisma.db.orm.public.User.orderBy((u) => u.id.asc())
      .offset(skip)
      .limit(take);
    if (!search) {
      return users.all();
    }
    return users
      .where((u) =>
        or(u.name.ilike(`%${search}%`), u.email.ilike(`%${search}%`)),
      )
      .all();
  }

  async createUser(data: CreateInput<Contract, 'User'>): Promise<User> {
    return this.prisma.db.orm.public.User.create(data);
  }

  async updateUser(
    id: number,
    data: ScalarUpdateInput<Contract, 'User'>,
  ): Promise<User | null> {
    return this.prisma.db.orm.public.User.where({ id }).update(data);
  }

  async deleteUser(id: number): Promise<User | null> {
    return this.prisma.db.orm.public.User.where({ id }).delete();
  }
}
```

The types come from the emitted contract, so you don't need to write separate interfaces for your models. `Models.public_User` is the `User` model with its relations, and `Scalars<...>` strips the relations down to the row that a query returns. `CreateInput` and `ScalarUpdateInput` describe the data that `create()` and `update()` accept. The `where()` method takes either an object with the fields to match or a callback over the model's fields, where operators such as `eq()`, `ilike()`, `gt()`, and `in()` are combined with `and()`, `or()`, and `not()` from `@prisma/orm-postgres/orm-client`. See [Reading data](https://www.prisma.io/docs/orm/fundamentals/reading-data) in the Prisma documentation for the full query API. In a real-world application, the service is also the place for your business logic. For example, a `UsersService` could have an `updatePassword()` method responsible for updating a user's password.

A controller then exposes the service through route handlers:

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { type User, UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query('search') search?: string): Promise<User[]> {
    return this.usersService.users({ search });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.usersService.user(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  @Post()
  async create(
    @Body() userData: { name?: string; email: string },
  ): Promise<User> {
    return this.usersService.createUser(userData);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<User | null> {
    return this.usersService.deleteUser(id);
  }
}
```

> info **Hint** The contract types exist only at compile time, so the `ValidationPipe` can't use them to validate request payloads. To validate a request body, declare a DTO class, as described in [Validation](/application/validation).

Finally, register the controller and the service in a `UsersModule` that imports `PrismaModule`, and import `UsersModule` into your `AppModule`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

#### Relations and aggregates

Load related rows with `include()`, which takes the relation name and a callback that narrows the related collection. Count, sum, and other aggregates run through `aggregate()`, which takes a callback that names each value:

```typescript
async userWithPosts(id: number) {
  return this.prisma.db.orm.public.User.where({ id })
    .include('posts', (posts) => posts.where({ published: true }))
    .first();
}

async publishedPosts(skip: number, take: number) {
  const published = this.prisma.db.orm.public.Post.where({ published: true });
  const [posts, totals] = await Promise.all([
    published.orderBy((p) => p.id.asc()).offset(skip).limit(take).all(),
    published.aggregate((a) => ({ count: a.count() })),
  ]);
  return { posts, total: totals.count };
}
```

Collections are immutable, so `published` can be reused for both queries. There is no `count()` method on a collection itself; counting always goes through `aggregate()`. See [Relations and joins](https://www.prisma.io/docs/orm/fundamentals/relations-and-joins) in the Prisma documentation for nested includes and relation filters.

#### Transactions

To run several queries in one transaction, pass an async function to `db.transaction()`. Prisma commits the transaction when the function resolves and rolls it back when it throws:

```typescript
async deleteUserWithPosts(id: number): Promise<User | null> {
  return this.prisma.db.transaction(async (tx) => {
    await tx.orm.public.Post.where({ authorId: id }).deleteAll();
    return tx.orm.public.User.where({ id }).delete();
  });
}
```

Inside the function, send every query through the transaction client (`tx`) that Prisma passes to it. Queries sent through `this.prisma.db` run outside the transaction. The function's return value becomes the result of `transaction()`. `update()` and `delete()` affect the single row that `first()` would return; `updateAll()` and `deleteAll()` affect every row that matches the filter, and both compile only on a collection that has a `where()` clause. See [Transactions](https://www.prisma.io/docs/orm/fundamentals/transactions) in the Prisma documentation for the details.

Passing `tx` through every method that takes part in a transaction couples your services to one another. To declare transaction boundaries with a decorator instead, keep the active transaction client in [async local storage](/recipes/async-local-storage) and read it from there in your services.

#### Testing

When you unit test a provider that depends on `PrismaService`, you usually want to avoid a database connection. Because `PrismaService` is a regular class provider, you can replace it with a mock using the class itself as the injection token and any of the standard [custom provider](/fundamentals/custom-providers) techniques, such as `useValue`. The mock only needs the part of the `db` property that the test touches:

```typescript
import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let usersService: UsersService;
  const first = vi.fn();
  const prismaMock = {
    db: { orm: { public: { User: { first } } } },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    usersService = moduleRef.get(UsersService);
  });

  it('returns a user by id', async () => {
    const user = { id: 1, email: 'alice@prisma.io', name: 'Alice' };
    first.mockResolvedValue(user);

    expect(await usersService.user(1)).toEqual(user);
    expect(first).toHaveBeenCalledWith({ id: 1 });
  });
});
```

The mock replaces `PrismaService` entirely, so its `onModuleInit()` hook doesn't run and the test never opens a database connection. When you test a module that imports `PrismaModule`, replace the provider with `overrideProvider(PrismaService)` instead. See [Testing](/fundamentals/testing) for more testing utilities.

#### Example

To start from a ready-made project instead, scaffold one with `create-prisma`, which sets up a NestJS application with Prisma ORM 8 and a `PrismaService`:

```bash
$ npm create prisma@latest -- my-nest-api --template nest --provider postgres
```

For more resources, see the [NestJS guide](https://www.prisma.io/docs/guides/frameworks/nestjs) in the Prisma documentation.
