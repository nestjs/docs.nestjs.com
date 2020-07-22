### Prisma

[Prisma](https://www.prisma.io) is an [open-source](https://github.com/prisma/prisma) database toolkit. You can use it to query data from a database inside a Node.js or TypeScript application. Prisma and NestJS go great together since you can use Prisma in your _services_ to fulfill the data needs from your _controllers_. 

Prisma is used as an alternative to writing plain SQL, or using another database access tool such as SQL query builders (like [knex.js](http://knexjs.org/)) or ORMs (like [TypeORM](http://typeorm.io/) and [Sequelize](https://sequelize.org/)). Prisma currently supports PostgreSQL, MySQL and SQLite. 

While Prisma is a _toolkit_ that contains _multiple_ tools, the focus of this guide will be on using [Prisma Client](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client). Prisma Client is an auto-generated and type-safe query builder that lets you read and write data in your database.

> **Note** If you want to get a quick overview of how Prisma works, you can follow the [Quickstart](https://www.prisma.io/docs/getting-started/quickstart) or read the [Introduction](https://www.prisma.io/docs/understand-prisma/introduction) in the [documentation](https://www.prisma.io/docs/). There also is a great [`nestjs-prisma-starter`](https://github.com/fivethree-team/nestjs-prisma-starter) project available if you want to get started using NestJS with Prisma in production.

#### Getting started

In this recipe, you'll learn how to get started with NestJS and Prisma from scratch. You are going to build a sample NestJS application with a REST API that can read and write data in a database. 

For the purpose of this guide, you'll use a [SQLite](http://sqlite.org/) database to save the overhead of setting up a database server. Note that you can still follow this guide, even if you're using PostgreSQL or MySQL – you'll get extra instructions for using these databases at the right places.

In the following sections, you will:

1. Create your NestJS project
1. Set up Prisma
1. Create your SQLite database file and set the database connection
1. Create two database tables
1. Introspect your database to obtain your Prisma models in the Prisma schema
1. Install and generate Prisma Client
1. Use Prisma Client in your NestJS services
1. Implement your REST API routes in the main app controller

##### 1. Create your NestJS project

To get started, install the NestJS CLI and create your app skeleton with the following commands:

```bash
npm install -g @nestjs/cli
nest create hello-prisma
```

See the [First steps](https://docs.nestjs.com/first-steps) page to learn more about the project files created by this command. Note also that you can now run `npm start` to start your application. The REST API running at `http://localhost:3000/` currently serves a single route that's implemented in `src/app.controller.ts`. Over the course of this guide, you'll implement additional routes to store and retrieve data about _users_ and _posts_. 

##### 2. Set up Prisma

Start by installing the Prisma CLI as a development dependency in your project:

```bash
$ npm install @prisma/cli --save-dev
```

As a best practice, it's recommended to invoke the CLI locally by prefixing it with `npx`:

```bash
$ npx prisma
```

<details><summary>Expand if you're using Yarn</summary>

If you're using Yarn, then you can install the Prisma CLI as follows:

```bash
$ yarn add @prisma/cli --dev
```

Once installed, you can invoke it by prefixing it with `yarn`:

```bash
$ yarn prisma
```

</details>

Now create your initial Prisma setup using the `init` command of the Prisma CLI:

```bash
$ npx prisma init
```

This command created a new `prisma` directory with the following contents:

- `schema.prisma`: Specifies your database connection and contains the database schema
- `.env`: A [dotenv](https://github.com/motdotla/dotenv) file, typically used to store your database credentials in an environment variable

##### 3. Create your SQLite database file and set the database connection

SQLite databases are simple files, no server is required to use a SQLite database. You can therefore create a new SQLite database by manually creating a new file on your file system.

Navigate into the new `prisma` directory and create a file called `dev.db` inside of it. 

Next, open up `schema.prisma` and adjust the `provider` field of the `datasource` block to `sqlite`:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

Now, open up `.env` and adjust the `DATABASE_URL` environment variable to look as follows:

```bash
DATABASE_URL="file:./dev.db"
```

<details><summary>Expand if you're using PostgreSQL or MySQL</summary>

#### PostgreSQL

If you're using PostgreSQL, you have to adjust the `schema.prisma` and `.env` files as follows:

**`schema.prisma`**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```


**`.env`**

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
```

Replace the placeholders spelled in all uppercase letters with your database credentials. Note that if you're unsure what to provide for the `SCHEMA` placeholder, it's most likely the default value `public`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

If you want to learn how to set up a PostgreSQL database, you can  follow this guide on [setting up a free PostgreSQL database on Heroku](https://dev.to/prisma/how-to-setup-a-free-postgresql-database-on-heroku-1dc1).


#### MySQL

If you're using MySQL, you have to adjust the `schema.prisma` and `.env` files as follows:

**`schema.prisma`**

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**`.env`**

```bash
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Replace the placeholders spelled in all uppercase letters with your database credentials.

</details>

##### 4. Create two database tables

In this section, you'll create two new tables in your database. Run the following SQL statements in your terminal:

**Mac OS / Linux**

```bash
$ sqlite3 dev.db \
'CREATE TABLE "User" (
  "id"    INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name"  TEXT,
  "email" TEXT    NOT NULL UNIQUE
);
CREATE TABLE "Post" (
  "id"        INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "title"     TEXT    NOT NULL,
  "content"   TEXT,
  "published" BOOLEAN DEFAULT false,
  "authorId"  INTEGER REFERENCES "User"(id)
);
'
```

**Windows**

```bash
$ sqlite3 ./prisma/dev.db 
CREATE TABLE "User" (
  "id"    INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name"  TEXT,
  "email" TEXT    NOT NULL UNIQUE
);
CREATE TABLE "Post" (
  "id"        INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "title"     TEXT    NOT NULL,
  "content"   TEXT,
  "published" BOOLEAN DEFAULT false,
  "authorId"  INTEGER REFERENCES "User"(id)
);
```

Note that Prisma also features a _schema migration_ tool called [Prisma Migrate](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-migrate). Prisma Migrate lets you manually define your models in your Prisma schema and takes care of creating the tables in your database. Because Prisma Migrate is currently considered experimental, this guide uses an alternative workflow of using plain SQL to create your database tables and generate Prisma models via [introspection](https://www.prisma.io/docs/reference/tools-and-interfaces/introspection). 

##### 5. Introspect your database to obtain your Prisma models in the Prisma schema

Now that you created your database tables, you can _introspect_ the database to generate your [Prisma models](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-schema/models). After that, you will install and generate Prisma Client which will expose queries that are _tailored_ to these models.

To introspect your database, run the following command in your terminal:

```bash
$ npx prisma introspect
```

This reads your SQL schema and translates each table into a corresponding Prisma model. Your `schema.prisma` file now looks as follows:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  email String  @unique
  id    Int     @default(autoincrement()) @id
  name  String?
  Post  Post[]
}

model Post {
  authorId  Int?
  content   String?
  id        Int      @default(autoincrement()) @id
  published Boolean? @default(false)
  title     String
  User      User?    @relation(fields: [authorId], references: [id])
}
```

With your Prisma models in place, you can install and generate Prisma Client.

##### 6. Install and generate Prisma Client

To install Prisma Client in your project, run the following command in your terminal:

```bash
$ npm install @prisma/client
```

Note that this command automatically invokes the `prisma generate` command for you. In the future, you need to run this command after _every_ change to your Prisma models to update your generated Prisma Client.

> **Note** The `prisma generate` command reads your Prisma schema and updates the generated Prisma Client library inside `node_modules/@prisma/client`.


##### 7. Use Prisma Client in your NestJS services

You're now able to send database queries with Prisma Client! If you want to learn about the possible queries with Prisma Client, check out the [API documentation](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/crud).

When setting up your NestJS application, you'll want to abstract away the Prisma Client API for database queries within a _service_. To get started, you can create a new `PrismaService` that takes care of instantiating `PrismaClient` and connecting to your database.

Inside the `src` directory, create a new file called `prisma.service.ts` and add the following code to it:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
  }
  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }
}
```

Next, you can write services that you can use to make database calls for the `User` and `Post` models from your Prisma schema.

Still inside the `src` directory, create a new file called `user.service.ts` and add the following code to it:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  UserUpdateInput,
  User,
  UserCreateInput,
  UserWhereUniqueInput,
  UserWhereInput,
  UserOrderByInput,
} from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async user(userWhereUniqueInput: UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findOne({
      where: userWhereUniqueInput,
    });
  }

  async users(params: {
    skip?: number,
    take?: number,
    cursor?: UserWhereUniqueInput,
    where?: UserWhereInput,
    orderBy?: UserOrderByInput,
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createUser(data: UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: {
    where: UserWhereUniqueInput,
    data: UserUpdateInput,
  }): Promise<User> {
    const { where, data } = params
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
```

Notice how you're using Prisma Client's generated types to ensure that the methods that are exposed by your service are properly typed! You therefore save the boilerplate of typing your models and creating additional interface or DTO files.

Now do the same for the `Post` model.


Still inside the `src` directory, create a new file called `post.service.ts` and add the following code to it:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  PostUpdateInput,
  Post,
  PostCreateInput,
  PostWhereUniqueInput,
  PostWhereInput,
  PostOrderByInput,
} from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async post(postWhereUniqueInput: PostWhereUniqueInput): Promise<Post | null> {
    return this.prisma.post.findOne({
      where: postWhereUniqueInput,
    });
  }

  async posts(params: {
    skip?: number,
    take?: number,
    cursor?: PostWhereUniqueInput,
    where?: PostWhereInput,
    orderBy?: PostOrderByInput,
  }): Promise<Post[]> {
    const { skip, take, cursor, where, orderBy } = params
    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createPost(data: PostCreateInput): Promise<Post> {
    return this.prisma.post.create({
      data,
    });
  }

  async updatePost(params: {
    where: PostWhereUniqueInput,
    data: PostUpdateInput,
  }): Promise<Post> {
    const { data, where } = params
    return this.prisma.post.update({
      data,
      where,
    });
  }

  async deletePost(where: PostWhereUniqueInput): Promise<Post> {
    return this.prisma.post.delete({
      where,
    });
  }
}
```

Your `UserService` and `PostService` currently wrap the CRUD queries that are available in Prisma Client. In a real world application, the service would also be the place to add business logic to your application. For example, you could have a method called `updatePassword` inside the `UserService` that would be responsible for updating the password of a user.

##### 8. Implement your REST API routes in the main app controller

Finally, you'll use the services you created in the previous sections to implement the different routes of your app. For the purpose of this guide, you'll put all your routes into the already existing `AppController` class.

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
import { UserService } from './user.service';
import { PostService } from './post.service';
import { User as UserModel, Post as PostModel } from '@prisma/client';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService,
  ) {}

  @Get('/post/:id')
  async getPostById(@Param('id') id: string): Promise<PostModel> {
    return this.postService.post({ id: Number(id) });
  }

  @Get('/feed')
  async getPublishedPosts(): Promise<PostModel[]> {
    return this.postService.posts({
      where: { published: true },
    });
  }

  @Get('/filterPosts/:searchString')
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

  @Post('/post')
  async createDraft(
    @Body() postData: { title: string; content?: string; authorEmail: string },
  ): Promise<PostModel> {
    const { title, content, authorEmail } = postData
    return this.postService.createPost({
      title,
      content,
      User: {
        connect: { email: authorEmail}
      }
    });
  }

  @Post('/user')
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

  @Delete('/post:id')
  async deletePost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.deletePost({ id: Number(id) });
  }
}
```

This controller implements the following routes:


###### `GET`

- `/post/:id`: Fetch a single post by its `id`
- `/feed`: Fetch all _published_ posts
- `/filterPosts/:searchString`: Filter posts by `title` or `content`

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

In this guide, you learned how to implement a use NestJS together with Prisma to implement a REST API. The controller who implements the routes of the API is calling a `PrismaService` which in turn uses Prisma Client to send queries to a database to fulfill the data needs of incoming requests.

If you want to learn more about Prisma, be sure to check out the [documentation](https://www.prisma.io/docs/). 
