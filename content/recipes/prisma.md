### Prisma

[Prisma](https://www.prisma.io/) provides access to your database via a powerful type-safe database client. Instead of writing SQL or using a NoSQL API, you can query your database with auto-generated crud operations exposed in the Prisma package (e.g., `prisma.user.findOne({{ '{' }} where: {{ '{' }} id: "someid" {{ '}' }} {{ '}' }}))`. In this chapter we won't go into details about Prisma, so head over to [their website](https://www.prisma.io/) and have a look at what features are available.

> warning **Notice** In this article, you'll learn how to integrate `Prisma` into the Nest framework. We assume that you **have a instance of postgres running**, are already familiar with the GraphQL concepts and the `@nestjs/graphql` module.

#### Dependencies

First, we need to install the required packages:

```bash
$ npm install --save @prisma/client
```

#### Setup Prisma

Prisma works by introspecting your database to understand your data structures. It then maps these to a schema file which models those structures. You then use prisma to generate the type-safe database access client, which exposes the easy-to-use crud operations to your database (e.g. prisma.user.findOne({ where: { id: "someid" } })).

1.  Install the Prisma CLI - `npm install -g @prisma/client`
2.  Initialize prisma in your project - `prisma init`

If you find yourself in trouble jump over to their [Quick Start](https://v1.prisma.io/docs/1.34/get-started/01-setting-up-prisma-existing-database-JAVASCRIPT-a003/) section for further details. Eventually you should see two new files in your project directory, `schema.prisma` introspection file and and `.env` file:

```
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Introspect database & generate client

Now you use the prisma cli to introspect your database and generate the type-safe database client.

1. Introspect your database - **must have a running db**

```bash
$ prisma introspect
```

Your `prisma.schema` file should be updated with the results of the introspection (note - might be different for your database).

```
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                     String            @id
  username               String            @unique
  password               String
}
```

2.  Now you generate database access client with Prisma CLI - 

```bash
$ prisma generate
```

This will autogenerate the database access client/methods, which we can later access in our codebase by importing them from the `@prisma/cli` package.

#### Integration

Almost done. Now, let's create a module for our Prisma integration.

```typescript
@@filename(prisma.service)
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super()
  }

  async onModuleInit() {
    await this.connect()
  }

  async onModuleDestroy() {
    await this.disconnect()
  }
}
```

Once `PrismaService` is ready, we need to create a corresponding module.

```typescript
@@filename(prisma.module)
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

> info **Hint** To create new modules and services in no time we can make use of the [Nest CLI](/cli/overview). To create a `PrismaModule` type `nest g module prisma` and for the service `nest g service prisma`

#### Usage

To use your new service we are going to import the `PrismaModule` and inject the `PrismaService` into `UsersResolver`.

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UsersResolver],
})
export class UsersModule {}
```

Importing `PrismaModule` makes exported `PrismaService` available in the `UsersModule` context.

```typescript
@@filename(users.resolver)
import { Query, Resolver, Args, Info } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Resolver()
export class UsersResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query('users')
  async getUsers(@Args() args): Promise<User[]> {
    return this.prisma.users.findMany(args);
  }
}
```

#### Example

A slightly modified example is available [here](https://github.com/nestjs/nest/tree/master/sample/22-graphql-prisma).
