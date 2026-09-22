### Prisma

[Prisma](https://www.prisma.io) is an [open-source](https://github.com/prisma/prisma) ORM for Node.js and TypeScript. You can use it as an **alternative** to writing plain SQL or to other database access tools, such as SQL query builders (like [knex.js](https://knexjs.org/)) or other ORMs (like [TypeORM](https://typeorm.io/) and [Sequelize](https://sequelize.org/)). Prisma supports PostgreSQL, MySQL, SQL Server, SQLite, CockroachDB, and MongoDB (see [supported databases](https://www.prisma.io/docs/orm/reference/supported-databases)). This recipe uses Prisma ORM 7, which works with the SQL databases; MongoDB projects stay on Prisma ORM 6 for now.

While you can use Prisma with plain JavaScript, it embraces TypeScript and provides a level of type safety that goes beyond the guarantees of other ORMs in the TypeScript ecosystem. See the [comparison of the type safety guarantees of Prisma and TypeORM](https://www.prisma.io/docs/orm/more/comparisons/prisma-and-typeorm#type-safety) for details.

> info **Note** For a quick overview of how Prisma works, follow the [Quickstart](https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres) or read the [Introduction](https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma) in the [Prisma documentation](https://www.prisma.io/docs). There are also ready-to-run examples for [REST](https://github.com/prisma/prisma-examples/tree/b53fad046a6d55f0090ddce9fd17ec3f9b95cab3/orm/nest) and [GraphQL](https://github.com/prisma/prisma-examples/tree/b53fad046a6d55f0090ddce9fd17ec3f9b95cab3/orm/nest-graphql) in the [`prisma-examples`](https://github.com/prisma/prisma-examples/) repository.

#### Getting started

In this recipe, you'll learn how to get started with NestJS and Prisma from scratch. You'll build a sample NestJS application with a REST API that reads and writes data in a database.

This guide uses a [SQLite](https://sqlite.org/) database to save you the overhead of setting up a database server. You can still follow along if you're using PostgreSQL, MySQL, or SQL Server: the relevant steps include extra instructions for those databases.

> info **Note** If you have an existing project and are considering migrating to Prisma, follow the guide for [adding Prisma to an existing project](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project-typescript-postgres). If you are migrating from TypeORM, read [Migrating from TypeORM to Prisma](https://www.prisma.io/docs/guides/migrate-from-typeorm).

#### Create your NestJS project

To get started, install the NestJS CLI and create your app skeleton with the following commands:

```bash
$ npm install -g @nestjs/cli
$ nest new hello-prisma
```

See the [First steps](/first-steps) page to learn more about the project files this command creates. You can now run `npm start` to start your application. The REST API running at `http://localhost:3000/` currently serves a single route, implemented in `src/app.controller.ts`. Over the course of this guide, you'll implement additional routes to store and retrieve data about _users_ and _posts_.

This guide assumes the ESM project layout, which is the default when `nest new` asks which module system to use. If you choose CommonJS instead, follow the extra step in [Configure the module format](#configure-the-module-format).

#### Set up Prisma

Start by installing the Prisma CLI as a development dependency in your project, together with `dotenv`, which the generated Prisma configuration file uses to load your `.env` file:

```bash
$ cd hello-prisma
$ npm install prisma@7 dotenv --save-dev
```

> warning **Warning** Install Prisma ORM 7 explicitly, as shown above. At the time of writing, the `latest` tag of the `prisma` package on npm points to a Prisma 8 pre-release, which is a different CLI that doesn't provide the `prisma migrate` and `prisma generate` commands used in this guide. Keep `prisma` and `@prisma/client` on the same major version.

The following steps use the [Prisma CLI](https://www.prisma.io/docs/orm/tools/prisma-cli). As a best practice, invoke the CLI locally by prefixing it with `npx`:

```bash
$ npx prisma
```

<details><summary>Expand if you're using Yarn</summary>

If you're using Yarn, install the Prisma CLI as follows:

```bash
$ yarn add prisma@7 dotenv --dev
```

Once installed, invoke it by prefixing it with `yarn`:

```bash
$ yarn prisma
```

</details>

Now create your initial Prisma setup with the `init` command of the Prisma CLI:

```bash
$ npx prisma init
```

This command creates the following files:

- `prisma/schema.prisma`: Contains your database schema, including the data source provider and the Prisma Client generator
- `prisma7.config.ts`: The Prisma configuration file, created in the project root. It sets the location of the schema and migrations, and reads the database connection URL from the `DATABASE_URL` environment variable. Prisma ORM releases before 7.10 name this file `prisma.config.ts`, which Prisma still recognizes.
- `.env`: A [dotenv](https://github.com/motdotla/dotenv) file, typically used to store your database credentials in a group of environment variables

#### Set the generator output path

Prisma Client is generated into the directory set by the `output` field of the `generator` block. By default, `prisma init` sets it to `../generated/prisma`, which is outside of the `src` directory. Place the client inside `src` instead, so that it's compiled along with the rest of your application. Either pass `--output ../src/generated/prisma` to `prisma init`, or set the path directly in your Prisma schema:

```groovy
generator client {
  provider        = "prisma-client"
  output          = "../src/generated/prisma"
}
```

#### Configure the module format

Prisma ORM 7 generates an ES module by default, which is what an ESM NestJS project expects, so no extra configuration is needed for the default project layout.

If your project uses CommonJS, set `moduleFormat` in the generator to `cjs`:

```groovy
generator client {
  provider        = "prisma-client"
  output          = "../src/generated/prisma"
  moduleFormat    = "cjs"
}
```

> info **Note** The generated ESM client relies on `import.meta`, which isn't available in CommonJS. Setting `moduleFormat` to `cjs` makes Prisma generate a CommonJS client instead. If you set it, keep it in the `generator` block in the following steps.

#### Set the database connection

The `datasource` block in your `schema.prisma` file defines which database you use. By default, its `provider` is set to `postgresql`. Since this guide uses SQLite, change the `provider` field of the `datasource` block to `sqlite`:

```groovy
datasource db {
  provider = "sqlite"
}

generator client {
  provider      = "prisma-client"
  output        = "../src/generated/prisma"
}
```

The connection URL itself isn't part of the schema: the Prisma configuration file reads it from the `DATABASE_URL` environment variable. Open `.env` and set `DATABASE_URL` as follows:

```bash
DATABASE_URL="file:./dev.db"
```

A SQLite database is a plain file, and no server is required to use it. So instead of configuring a connection URL with a _host_ and _port_, you point it to a local file, in this case `dev.db`. The file is created in the project root in the next step.

The Prisma CLI loads `.env` through the `dotenv/config` import at the top of the Prisma configuration file. Your NestJS application doesn't load `.env` automatically, though. To make `DATABASE_URL` available at runtime, register the [`ConfigModule`](/techniques/configuration) in your `AppModule` (or start Node.js with the `--env-file=.env` flag).

<details><summary>Expand if you're using PostgreSQL, MySQL, SQL Server, or Azure SQL</summary>

With PostgreSQL, MySQL, and SQL Server, you need to configure the connection URL to point to the _database server_. See the [connection URL reference](https://www.prisma.io/docs/orm/reference/connection-urls) for the required format.

**PostgreSQL**

If you're using PostgreSQL, adjust the `schema.prisma` and `.env` files as follows:

**`schema.prisma`**

```groovy
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

**`.env`**

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
```

Replace the uppercase placeholders with your database credentials. If you're unsure what to provide for the `SCHEMA` placeholder, it's most likely the default value `public`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

If you don't have a PostgreSQL server yet, run `npx prisma dev` to start a local Prisma Postgres database in your terminal.

**MySQL**

If you're using MySQL, adjust the `schema.prisma` and `.env` files as follows:

**`schema.prisma`**

```groovy
datasource db {
  provider = "mysql"
}

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

**`.env`**

```bash
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Replace the uppercase placeholders with your database credentials.

**Microsoft SQL Server / Azure SQL Server**

If you're using Microsoft SQL Server or Azure SQL Server, adjust the `schema.prisma` and `.env` files as follows:

**`schema.prisma`**

```groovy
datasource db {
  provider = "sqlserver"
}

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

**`.env`**

Replace the uppercase placeholders with your database credentials. If you're unsure what to provide for the `encrypt` option, it's most likely the default value `true`:

```bash
DATABASE_URL="sqlserver://HOST:PORT;database=DATABASE;user=USER;password=PASSWORD;encrypt=true"
```

</details>

#### Create two database tables with Prisma Migrate

In this section, you'll create two new tables in your database using [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate/getting-started). Prisma Migrate generates SQL migration files from the declarative data model in your Prisma schema. These migration files are fully customizable, so you can configure additional features of the underlying database or include additional commands (e.g., for seeding).

Add the following two models to your `schema.prisma` file:

```groovy
model User {
  id    Int     @default(autoincrement()) @id
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @default(autoincrement()) @id
  title     String
  content   String?
  published Boolean? @default(false)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}
```

With your Prisma models in place, you can generate your SQL migration files and run them against the database. Run the following command in your terminal:

```bash
$ npx prisma migrate dev --name init
```

The `prisma migrate dev` command generates SQL files and runs them against the database directly. Because the database doesn't exist yet, it also creates the `dev.db` file in the project root. The following migration files are created in the existing `prisma` directory:

```bash
$ tree prisma
prisma
├── migrations
│   ├── 20201207100915_init
│   │   └── migration.sql
│   └── migration_lock.toml
└── schema.prisma
```

<details><summary>Expand to view the generated SQL statements</summary>

The following tables were created in your SQLite database:

```sql
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN DEFAULT false,
    "authorId" INTEGER,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
```

</details>

#### Install and generate Prisma Client

Prisma Client is a type-safe database client that's _generated_ from your Prisma model definition. This approach lets Prisma Client expose [CRUD](https://www.prisma.io/docs/orm/prisma-client/queries/crud) operations that are _tailored_ specifically to your models.

To install Prisma Client in your project, run the following command in your terminal:

```bash
$ npm install @prisma/client@7
```

Once it's installed, run the `generate` command to generate the client and the types for your project. `prisma migrate dev` doesn't do this for you, and whenever you change your schema, you need to rerun `generate` to keep the client and types in sync.

```bash
$ npx prisma generate
```

In addition to Prisma Client, you need a driver adapter for the database you're working with. For SQLite, install the `@prisma/adapter-better-sqlite3` adapter, which also installs the `better-sqlite3` driver:

```bash
$ npm install @prisma/adapter-better-sqlite3
```

<details><summary>Expand if you're using PostgreSQL, MySQL, SQL Server, or Azure SQL</summary>

- For PostgreSQL:

```bash
$ npm install @prisma/adapter-pg
```

- For MySQL (and MariaDB):

```bash
$ npm install @prisma/adapter-mariadb
```

- For SQL Server and Azure SQL:

```bash
$ npm install @prisma/adapter-mssql
```

Each adapter package includes its database driver. In the `PrismaService` shown below, replace `PrismaBetterSqlite3` with the matching adapter class (`PrismaPg`, `PrismaMariaDb`, or `PrismaMssql`), and pass it the connection settings its driver expects.

</details>

#### Use Prisma Client in your NestJS services

You can now send database queries with Prisma Client. To learn more about building queries with Prisma Client, see the [Prisma Client API reference](https://www.prisma.io/docs/orm/reference/prisma-client-reference).

In a NestJS application, you'll typically abstract the Prisma Client API for database queries away behind a service. To get started, create a new `PrismaService` that instantiates `PrismaClient` with the driver adapter for your database.

Inside the `src` directory, create a new file called `prisma.service.ts` and add the following code to it:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
    super({ adapter });
  }
}
```

Next, write the services that make database calls for the `User` and `Post` models from your Prisma schema.

Still inside the `src` directory, create a new file called `user.service.ts` and add the following code to it:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { User, Prisma } from './generated/prisma/client.js';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
```

The service uses Prisma Client's generated types to ensure that the methods it exposes are properly typed. This saves you the boilerplate of typing your models and creating additional interface or DTO files.

Now do the same for the `Post` model.

Still inside the `src` directory, create a new file called `post.service.ts` and add the following code to it:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { Post, Prisma } from './generated/prisma/client.js';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async post(
    postWhereUniqueInput: Prisma.PostWhereUniqueInput,
  ): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: postWhereUniqueInput,
    });
  }

  async posts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createPost(data: Prisma.PostCreateInput): Promise<Post> {
    return this.prisma.post.create({
      data,
    });
  }

  async updatePost(params: {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.PostUpdateInput;
  }): Promise<Post> {
    const { data, where } = params;
    return this.prisma.post.update({
      data,
      where,
    });
  }

  async deletePost(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    return this.prisma.post.delete({
      where,
    });
  }
}
```

Your `UsersService` and `PostsService` currently wrap the CRUD queries that are available in Prisma Client. In a real-world application, the service is also the place for your business logic. For example, the `UsersService` could have an `updatePassword()` method responsible for updating a user's password.

Remember to add `PrismaService`, `UsersService`, and `PostsService` to the `providers` array of your `AppModule`.

##### Implement your REST API routes in the main app controller

Finally, you'll use the services you created in the previous sections to implement the routes of your app. To keep this guide short, you'll put all your routes into the existing `AppController` class.

Replace the contents of the `app.controller.ts` file with the following code:

```typescript
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { UsersService } from './user.service.js';
import { PostsService } from './post.service.js';
import { User as UserModel, Post as PostModel } from './generated/prisma/client.js';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UsersService,
    private readonly postService: PostsService,
  ) {}

  @Get('post/:id')
  async getPostById(@Param('id') id: string): Promise<PostModel | null> {
    return this.postService.post({ id: Number(id) });
  }

  @Get('feed')
  async getPublishedPosts(): Promise<PostModel[]> {
    return this.postService.posts({
      where: { published: true },
    });
  }

  @Get('filtered-posts/:searchString')
  async getFilteredPosts(
    @Param('searchString') searchString: string,
  ): Promise<PostModel[]> {
    return this.postService.posts({
      where: {
        OR: [
          {
            title: { contains: searchString },
          },
          {
            content: { contains: searchString },
          },
        ],
      },
    });
  }

  @Post('post')
  async createDraft(
    @Body() postData: { title: string; content?: string; authorEmail: string },
  ): Promise<PostModel> {
    const { title, content, authorEmail } = postData;
    return this.postService.createPost({
      title,
      content,
      author: {
        connect: { email: authorEmail },
      },
    });
  }

  @Post('user')
  async signupUser(
    @Body() userData: { name?: string; email: string },
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }

  @Put('publish/:id')
  async publishPost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.updatePost({
      where: { id: Number(id) },
      data: { published: true },
    });
  }

  @Delete('post/:id')
  async deletePost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.deletePost({ id: Number(id) });
  }
}
```

This controller implements the following routes:

###### `GET`

- `/post/:id`: Fetch a single post by its `id`
- `/feed`: Fetch all _published_ posts
- `/filtered-posts/:searchString`: Filter posts by `title` or `content`

###### `POST`

- `/post`: Create a new post
  - Body:
    - `title: String` (required): The title of the post
    - `content: String` (optional): The content of the post
    - `authorEmail: String` (required): The email of the user that creates the post
- `/user`: Create a new user
  - Body:
    - `email: String` (required): The email address of the user
    - `name: String` (optional): The name of the user

###### `PUT`

- `/publish/:id`: Publish a post by its `id`

###### `DELETE`

- `/post/:id`: Delete a post by its `id`

#### Summary

In this recipe, you learned how to use Prisma with NestJS to implement a REST API. The controller that implements the API routes calls the `UsersService` and `PostsService`, which use the `PrismaService` (and, through it, Prisma Client) to send queries to the database and fulfill the data needs of incoming requests.

To learn more about using NestJS with Prisma, check out the following resources:

- [NestJS & Prisma](https://www.prisma.io/nestjs)
- [Ready-to-run example projects for REST & GraphQL](https://github.com/prisma/prisma-examples/)
- [Production-ready starter kit](https://github.com/notiz-dev/nestjs-prisma-starter#instructions)
- [Video: Accessing Databases using NestJS with Prisma (5min)](https://www.youtube.com/watch?v=UlVJ340UEuk&ab_channel=Prisma) by [Marc Stammerjohann](https://github.com/marcjulian)
