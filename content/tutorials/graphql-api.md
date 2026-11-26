### Build a GraphQL API in Node.js

Build a GraphQL API in Node.js and TypeScript with NestJS, Apollo and PostgreSQL: batched resolvers, sign-in, error codes and subscriptions.

The API serves a blog: users write posts, keep them as drafts until they publish them, and comment on each other's posts. A GraphQL server for that takes minutes to start, and most examples stop there. This tutorial spends its time on what they leave out: the N+1 queries that nested fields cause, a draft that leaks through a field nobody thought of, errors a client can't tell apart, and a WebSocket that skips the checks every HTTP request gets.

By the end, the API will:

- Generate its schema from TypeScript classes ([code first](/graphql/quick-start#code-first)), served by Apollo Server on the Node adapter.
- Keep users, posts and comments in PostgreSQL through [Drizzle](/data/drizzle), and page through posts with a cursor.
- Load nested fields in batches, so the number of SQL queries doesn't grow with a list.
- Sign users in with mutations and [`@nestjs/authentication`](/security/authentication): access tokens, and refresh tokens that rotate.
- Show a draft to its author only, through every path, and an email address to its owner only.
- Answer with codes a client can act on (`UNAUTHENTICATED`, `FORBIDDEN`, `BAD_USER_INPUT`, `NOT_FOUND`), and hide unexpected errors in production.
- Push new comments to signed-in subscribers over `graphql-ws`.
- Prove it in tests against PostgreSQL, over HTTP and a real WebSocket.

These are the operations, and the section that adds each one:

| Operation | Section |
| --- | --- |
| `posts`, `post`, `createPost`, `updatePost`, `publishPost`, `addComment` | [Read and write posts](/tutorials/graphql-api#read-and-write-posts) |
| `Post.author`, `Post.comments`, `User.posts`, `User.email`, `me` | [Batch nested fields with DataLoader](/tutorials/graphql-api#batch-nested-fields-with-dataloader) |
| `signUp`, `signIn`, `refreshToken` | [Sign users in with mutations](/tutorials/graphql-api#sign-users-in-with-mutations) |
| `commentAdded` | [Push new comments with subscriptions](/tutorials/graphql-api#push-new-comments-with-subscriptions) |

> info **Hint** The finished application is on GitHub as [nestjs/example-graphql-api](https://github.com/nestjs/example-graphql-api), with its tests and a CI workflow.

You need Node.js 22.18 or later, which runs the subscription script's TypeScript directly and has a WebSocket client built in, and Docker to run PostgreSQL locally.

#### Create the project

Create the project with the [Nest CLI](/cli/overview). `--minimal` generates an application whose code is one file, which this tutorial replaces. It also installs the [NestJS Observe SDK](/observability/sdk), `@nestjs/observe`, and wires it into that file; the application's own files keep it:

```bash
$ npm i -g @nestjs/cli
$ nest new blog-api --minimal
$ cd blog-api
```

Install the [Node adapter](/http/performance#node-adapter) in place of Express, the GraphQL packages, DataLoader, class-validator, and the packages for configuration, the database, sign-in and rate limiting:

```bash
$ npm uninstall @nestjs/platform-express @types/express
$ npm i --save @nestjs/platform-node @nestjs/graphql @nestjs/apollo @apollo/server @as-integrations/express5 graphql graphql-ws graphql-subscriptions dataloader class-validator class-transformer zod @nestjs/config @nestjs/drizzle drizzle-orm@rc pg @nestjs/authentication @nestjs/throttler
$ npm i --save-dev drizzle-kit@rc @types/pg @nestjs/testing vitest vite
```

The Apollo driver serves GraphQL through Apollo Server's Express integration on the Node adapter too, whose requests and responses have the Express API: without `@as-integrations/express5`, the application stops at startup with `The "@as-integrations/express5" package is missing`. `@nestjs/graphql` depends on `graphql-ws` already; the tests and a script import its client.

Delete `src/main.ts`: [Assemble the application](/tutorials/graphql-api#assemble-the-application) writes a new one. Start PostgreSQL in a container:

```bash
$ docker run -d --name blog-db -e POSTGRES_PASSWORD=blog -e POSTGRES_DB=blog -p 5432:5432 postgres:17
```

Create a `.env` file in the project's root directory, which `ConfigModule` and `drizzle-kit` read:

```bash
DATABASE_URL=postgres://postgres:blog@localhost:5432/blog
# Generate with: openssl rand -base64 32
JWT_SECRET=
```

The configuration is a Zod schema, which `ConfigModule` validates at startup, as in the [other tutorials](/tutorials/rest-api-jwt-authentication#store-notes-in-postgresql). The application refuses to start when a variable is missing or malformed:

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

#### Store the blog in PostgreSQL

The tables, in Drizzle's schema language. `refresh_tokens` is what `@nestjs/authentication` keeps for refresh tokens, as in [tutorial 1](/tutorials/rest-api-jwt-authentication#store-the-refresh-tokens):

```typescript
@@filename(src/database/schema)
import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Milliseconds, like a JavaScript Date: a cursor holds the exact value it compares with.
const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'date', precision: 3 });

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: at('created_at').notNull().defaultNow(),
});

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    // Null while the post is a draft.
    publishedAt: at('published_at'),
    createdAt: at('created_at').notNull().defaultNow(),
    updatedAt: at('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // The published list, newest first, with the id as the tiebreaker.
    index('posts_published_at_id_idx').on(table.publishedAt.desc(), table.id.desc()),
    index('posts_author_id_created_at_idx').on(table.authorId, table.createdAt),
  ],
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  (table) => [index('comments_post_id_created_at_idx').on(table.postId, table.createdAt)],
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

export type UserRow = typeof users.$inferSelect;
export type PostRow = typeof posts.$inferSelect;
export type CommentRow = typeof comments.$inferSelect;
```

A draft is a post without `publishedAt`. PostgreSQL keeps microseconds by default, and a JavaScript `Date` milliseconds, so the timestamps have a precision of 3: a cursor then holds exactly the value it's compared with. Add a `drizzle.config.ts` to the project's root directory:

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
$ npx drizzle-kit generate --name=init
$ npx drizzle-kit migrate
```

#### Define the schema in TypeScript

In the code first approach, Nest generates the GraphQL schema from classes and their decorators (see [Object types](/graphql/resolvers#object-types)). A user:

```typescript
@@filename(src/users/user.model)
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  // Not a @Field: UsersResolver adds it to the schema, for the user themselves only.
  email: string;

  @Field()
  createdAt: Date;
}
```

`email` is a property, but not a field: only a field resolver that checks who is asking [puts it in the schema](/tutorials/graphql-api#batch-nested-fields-with-dataloader). A post, and the connection that a list of posts comes in, the shape Relay and most clients page with:

```typescript
@@filename(src/posts/post.model)
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Post {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  body: string;

  @Field(() => Date, { nullable: true, description: 'Null while the post is a draft.' })
  publishedAt: Date | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Resolved by PostsResolver as `author`.
  authorId: string;
}

@ObjectType()
export class PostEdge {
  @Field()
  cursor: string;

  @Field(() => Post)
  node: Post;
}

@ObjectType()
export class PageInfo {
  @Field()
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor: string | null;
}

@ObjectType()
export class PostConnection {
  @Field(() => [PostEdge])
  edges: PostEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}
```

A comment:

```typescript
@@filename(src/posts/comment.model)
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Comment {
  @Field(() => ID)
  id: string;

  @Field()
  body: string;

  @Field()
  createdAt: Date;

  postId: string;
  // Resolved by CommentsResolver as `author`.
  authorId: string;
}
```

A post's author and comments aren't properties of these classes: they're fields with resolvers of their own, which load them in batches.

##### Validate arguments with class-validator

The arguments are `@ArgsType()` and `@InputType()` classes with class-validator rules, which the global `ValidationPipe` checks before a resolver runs (see [Validation](/application/validation)). One class defines both the GraphQL type and its rules, so the two can't drift apart. GraphQL refuses a value of the wrong type; the rules check the rest, such as a UUID's format or a title's length:

```typescript
@@filename(src/posts/posts.inputs)
import { ArgsType, Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min, ValidateIf } from 'class-validator';

// Optional, but never null: @IsOptional() would let a null through to a NOT NULL column.
const ifSent = ValidateIf((_object, value) => value !== undefined);

@ArgsType()
export class PostArgs {
  @Field(() => ID)
  @IsUUID()
  id: string;
}

/** The size of a list, such as a post's comments. */
@ArgsType()
export class FirstArgs {
  @Field(() => Int, { defaultValue: 10 })
  @Min(1)
  @Max(50)
  first: number;
}

@ArgsType()
export class PostsArgs extends FirstArgs {
  @Field(() => String, { nullable: true, description: 'The endCursor of the previous page.' })
  @IsOptional()
  @MaxLength(100)
  after?: string | null;
}

@InputType()
export class CreatePostInput {
  @Field()
  @Length(1, 200)
  title: string;

  @Field()
  @MaxLength(50_000)
  body: string;
}

@InputType()
export class UpdatePostInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => String, { nullable: true })
  @ifSent
  @IsString()
  @Length(1, 200)
  title?: string;

  @Field(() => String, { nullable: true })
  @ifSent
  @IsString()
  @MaxLength(50_000)
  body?: string;
}

@InputType()
export class AddCommentInput {
  @Field(() => ID)
  @IsUUID()
  postId: string;

  @Field()
  @Length(1, 5_000)
  body: string;
}

@ArgsType()
export class CommentAddedArgs {
  @Field(() => ID)
  @IsUUID()
  postId: string;
}
```

- **Optional, never null.** A client may send `null` for any nullable argument. `@IsOptional()` skips the rules for `null` too, so `title: null` would reach the `NOT NULL` column and fail there, as an internal error. `ifSent` skips them only when the field is missing.
- **Every list has a maximum**, and ids must be UUIDs: PostgreSQL would refuse any other string with an error of its own.

#### Read and write posts

Every query that reads posts adds one condition, so whether a draft is visible is decided in one place:

```typescript
@@filename(src/posts/visibility)
import { eq, isNotNull, or, type SQL } from 'drizzle-orm';
import { posts } from '../database/schema.js';

/** The posts a viewer may see: every published post, and their own drafts. Every query that reads posts uses it. */
export function visibleTo(viewerId: string | null): SQL {
  const published = isNotNull(posts.publishedAt);
  return viewerId ? or(published, eq(posts.authorId, viewerId))! : published;
}
```

Nest's GraphQL driver turns an `HttpException` into an error with a code: 400 becomes `BAD_REQUEST`, 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`, 422 `BAD_USER_INPUT`, and every other status, 404 and 409 among them, `INTERNAL_SERVER_ERROR`, which tells a client nothing. The other answers are `GraphQLError`s with a code of their own:

```typescript
@@filename(src/graphql/errors)
import { Catch, type ValidationError } from '@nestjs/common';
import type { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

export function notFound(what: string): never {
  throw new GraphQLError(`${what} not found`, { extensions: { code: 'NOT_FOUND' } });
}

/** The validation pipe's errors: BAD_USER_INPUT, with every message, by field. */
export function badUserInput(errors: ValidationError[]): GraphQLError {
  const fields = Object.fromEntries(errors.map((error) => [error.property, Object.values(error.constraints ?? {})]));
  return new GraphQLError(Object.values(fields).flat().join('; '), {
    extensions: { code: 'BAD_USER_INPUT', fields },
  });
}

/** A GraphQLError is an answer the code chose: pass it on. Nest would log it as an unexpected error. */
@Catch(GraphQLError)
export class GraphQLErrorFilter implements GqlExceptionFilter {
  catch(error: GraphQLError) {
    return error;
  }
}
```

- **`badUserInput()`** replaces the `ValidationPipe`'s default exception, a 400, which the driver reports as `BAD_REQUEST`, with the messages in `extensions.originalError`.
- **`GraphQLErrorFilter`** is an [exception filter](/graphql/other-features#exception-filters). Nest logs every error that isn't an `HttpException` as unexpected, with its stack trace: without the filter, every `NOT_FOUND` would be one.

The service reads and writes posts and comments:

```typescript
@@filename(src/posts/posts.service)
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { isUUID } from 'class-validator';
import { and, desc, eq, isNotNull, lt, or, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { GraphQLError } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import { comments, posts, type CommentRow, type PostRow } from '../database/schema.js';
import { notFound } from '../graphql/errors.js';
import type { AddCommentInput, CreatePostInput, PostsArgs, UpdatePostInput } from './posts.inputs.js';
import { visibleTo } from './visibility.js';

export const PUB_SUB = Symbol('PUB_SUB');
// One topic per post: a comment wakes the subscribers of its own post only.
export const commentAddedTopic = (postId: string) => `commentAdded.${postId}`;

@Injectable()
export class PostsService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  /** Published posts, newest first, one page at a time. */
  async list({ first, after }: PostsArgs) {
    const cursor = after ? decodeCursor(after) : undefined;
    const rows = await this.db
      .select()
      .from(posts)
      .where(
        and(
          isNotNull(posts.publishedAt),
          // After the cursor: published earlier, or in the same millisecond with a smaller id.
          cursor &&
            or(
              lt(posts.publishedAt, cursor.publishedAt),
              and(eq(posts.publishedAt, cursor.publishedAt), lt(posts.id, cursor.id)),
            ),
        ),
      )
      .orderBy(desc(posts.publishedAt), desc(posts.id))
      // One more than a page: if it comes back, there's a next page.
      .limit(first + 1);
    const edges = rows.slice(0, first).map((node) => ({ node, cursor: encodeCursor(node) }));
    return { edges, pageInfo: { hasNextPage: rows.length > first, endCursor: edges.at(-1)?.cursor ?? null } };
  }

  /** The post, if the viewer may see it: someone else's draft is as missing as an unknown id. */
  async findVisible(id: string, viewerId: string | null): Promise<PostRow | null> {
    const [post] = await this.db
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), visibleTo(viewerId)));
    return post ?? null;
  }

  async create(authorId: string, input: CreatePostInput): Promise<PostRow> {
    const [post] = await this.db
      .insert(posts)
      .values({ ...input, authorId })
      .returning();
    return post;
  }

  async update(authorId: string, { id, ...changes }: UpdatePostInput): Promise<PostRow> {
    // The author is part of the statement: no window between a check and the write.
    const [post] = await this.db
      .update(posts)
      .set({ ...changes, updatedAt: new Date() })
      .where(and(eq(posts.id, id), eq(posts.authorId, authorId)))
      .returning();
    return post ?? this.refuse(id, authorId);
  }

  async publish(authorId: string, id: string): Promise<PostRow> {
    // coalesce(): publishing a published post again keeps its date.
    const [post] = await this.db
      .update(posts)
      .set({ publishedAt: sql`coalesce(${posts.publishedAt}, now())` })
      .where(and(eq(posts.id, id), eq(posts.authorId, authorId)))
      .returning();
    return post ?? this.refuse(id, authorId);
  }

  async addComment(authorId: string, { postId, body }: AddCommentInput): Promise<CommentRow> {
    // Published posts only: to anyone, the author included, a draft takes no comments.
    if (!(await this.findVisible(postId, null))) {
      notFound('Post');
    }
    const [comment] = await this.db.insert(comments).values({ postId, authorId, body }).returning();
    await this.pubSub.publish(commentAddedTopic(postId), { commentAdded: comment });
    return comment;
  }

  /** Why a write matched nothing: someone else's post is FORBIDDEN, if the user may see it. */
  private async refuse(id: string, userId: string): Promise<never> {
    if (await this.findVisible(id, userId)) {
      throw new ForbiddenException('Only the author can change this post');
    }
    notFound('Post');
  }
}

// The cursor is the last post's publication time and id: opaque to clients,
// but client input all the same, checked before it reaches a query.
function encodeCursor(post: PostRow): string {
  return Buffer.from(`${post.publishedAt!.getTime()}:${post.id}`).toString('base64url');
}

function decodeCursor(cursor: string): { publishedAt: Date; id: string } {
  const [, time, id] = /^(\d{1,15}):([0-9a-f-]{36})$/.exec(Buffer.from(cursor, 'base64url').toString()) ?? [];
  if (!time || !isUUID(id)) {
    throw new GraphQLError('Invalid cursor', { extensions: { code: 'BAD_USER_INPUT' } });
  }
  return { publishedAt: new Date(Number(time)), id };
}
```

- **The list pages with a cursor**: the last post's publication time and id, with the id as the tiebreaker in the order, the index and the condition. Unlike an offset, a cursor doesn't shift when a post is published while someone reads page 1. It's client input all the same, checked before it reaches a query.
- **Writes are one statement, with the author in the `WHERE` clause.** When it matches nothing, `refuse()` finds out why: a post the user may see, but someone else's, is `FORBIDDEN`. Anything else, another user's draft included, is `NOT_FOUND`, the same as an id that doesn't exist.

The resolver maps the queries, mutations and fields of `Post` to the service (see [Resolvers](/graphql/resolvers) and [Mutations](/graphql/mutations)):

```typescript
@@filename(src/posts/posts.resolver)
import { Authenticate, CurrentUser } from '@nestjs/authentication';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { User } from '../users/user.model.js';
import { UsersLoader } from '../users/users.loader.js';
import { CommentsLoader } from './comments.loader.js';
import { Comment } from './comment.model.js';
import { Post, PostConnection } from './post.model.js';
import { CreatePostInput, FirstArgs, PostArgs, PostsArgs, UpdatePostInput } from './posts.inputs.js';
import { PostsService } from './posts.service.js';

// Anyone may read; a signed-in viewer also sees their own drafts.
@Authenticate({ optional: true })
@Resolver(() => Post)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersLoader: UsersLoader,
    private readonly commentsLoader: CommentsLoader,
  ) {}

  @Query(() => PostConnection)
  posts(@Args() args: PostsArgs) {
    return this.postsService.list(args);
  }

  @Query(() => Post, { nullable: true })
  post(@Args() { id }: PostArgs, @CurrentUser('id') viewerId: string | null) {
    return this.postsService.findVisible(id, viewerId ?? null);
  }

  @ResolveField(() => User)
  author(@Parent() post: Post) {
    return this.usersLoader.load(post.authorId);
  }

  @ResolveField(() => [Comment])
  comments(@Parent() post: Post, @Args() { first }: FirstArgs) {
    return this.commentsLoader.load(post.id, first);
  }

  @Authenticate({ optional: false })
  @Mutation(() => Post)
  createPost(@CurrentUser('id') userId: string, @Args('input') input: CreatePostInput) {
    return this.postsService.create(userId, input);
  }

  @Authenticate({ optional: false })
  @Mutation(() => Post)
  updatePost(@CurrentUser('id') userId: string, @Args('input') input: UpdatePostInput) {
    return this.postsService.update(userId, input);
  }

  @Authenticate({ optional: false })
  @Mutation(() => Post)
  publishPost(@CurrentUser('id') userId: string, @Args() { id }: PostArgs) {
    return this.postsService.publish(userId, id);
  }
}
```

- **Reads are open to everyone.** `@nestjs/authentication`'s global guard requires a user on every operation, unless it says otherwise. With `optional`, anonymous readers get through, and `@CurrentUser()` still gets the user when the request has a valid token, so authors see their drafts. A `@Public()` operation runs no authentication, and `@CurrentUser()` is always `null` there.
- **Mutations require a user again**, with `optional` set to `false`: method options are merged over the class's.
- **`author` and `comments` go through `UsersLoader` and `CommentsLoader`**, which the next section writes.

#### Batch nested fields with DataLoader

A query for 50 posts with their authors runs the `author` resolver 50 times, and if each one sent its own query, the request would send 51: the N+1 problem. [DataLoader](https://github.com/graphql/dataloader), a small library from the GraphQL project that this documentation doesn't otherwise cover, collects the keys resolvers ask for in one tick, and loads them with one call of a batch function. Each table has its own loader, in its feature's folder: a new field adds a method to the loader of the table it reads, not to a shared class. Users by id:

```typescript
@@filename(src/users/users.loader)
import { Injectable, Scope } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import DataLoader from 'dataloader';
import { getColumns, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from '../database/schema.js';
import type { User } from './user.model.js';

const { passwordHash: _, ...columns } = getColumns(users);

/** Users by id, for one request. */
@Injectable({ scope: Scope.REQUEST })
export class UsersLoader {
  // Batching without a cache: a subscription is one request for as long as it runs,
  // and each of its events must see the rows as they are now.
  private readonly byId = new DataLoader<string, User | undefined>(
    async (ids) => {
      const rows = await this.db.select(columns).from(users).where(inArray(users.id, [...ids]));
      return ids.map((id) => rows.find((row) => row.id === id));
    },
    { cache: false },
  );

  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  load(id: string): Promise<User | undefined> {
    return this.byId.load(id);
  }
}
```

- **Request-scoped.** Nest creates a new instance for every request (see [Injection scopes](/fundamentals/provider-scopes)), so a request's batches never mix with another viewer's, and nothing it loaded outlives it. The scope bubbles up: the resolvers that inject a loader are request-scoped too. In GraphQL, a request is one operation, and a subscription is one request for as long as it runs, whatever else its socket carries.
- **No cache.** With DataLoader's cache on, the subscription's later events would be served the rows its first event loaded: a comment that arrives after its author publishes a post would still list the author's posts as they were.

The first comments of each post: `row_number()` numbers each post's comments separately, where a `LIMIT` would count all of them together, and each `first` gets its own DataLoader, since it changes the query:

```typescript
@@filename(src/posts/comments.loader)
import { Injectable, Scope } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import DataLoader from 'dataloader';
import { getColumns, inArray, lte, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { comments, type CommentRow } from '../database/schema.js';

/** The first comments of each post, oldest first, for one request. */
@Injectable({ scope: Scope.REQUEST })
export class CommentsLoader {
  // One DataLoader per `first`.
  private readonly byFirst = new Map<number, DataLoader<string, CommentRow[]>>();

  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  load(postId: string, first: number): Promise<CommentRow[]> {
    let loader = this.byFirst.get(first);
    if (!loader) {
      // No cache, as in UsersLoader.
      loader = new DataLoader((postIds) => this.firstOfEach([...postIds], first), { cache: false });
      this.byFirst.set(first, loader);
    }
    return loader.load(postId);
  }

  private async firstOfEach(postIds: string[], first: number): Promise<CommentRow[][]> {
    const ranked = this.db
      .select({
        ...getColumns(comments),
        rank: sql<number>`row_number() over (partition by ${comments.postId} order by ${comments.createdAt}, ${comments.id})`.as('rank'),
      })
      .from(comments)
      .where(inArray(comments.postId, postIds))
      .as('ranked');
    const rows = await this.db.select().from(ranked).where(lte(ranked.rank, first)).orderBy(ranked.rank);
    return postIds.map((id) => rows.filter((row) => row.postId === id));
  }
}
```

The latest posts of each author that the viewer may see. A request has one viewer, so the key leaves it out; a singleton would keep the first viewer it saw:

```typescript
@@filename(src/posts/posts.loader)
import { Injectable, Scope } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import DataLoader from 'dataloader';
import { and, getColumns, inArray, lte, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { posts, type PostRow } from '../database/schema.js';
import { visibleTo } from './visibility.js';

/** The latest posts of each author that the viewer may see, for one request. */
@Injectable({ scope: Scope.REQUEST })
export class PostsLoader {
  // One DataLoader per `first`; a request has one viewer.
  private readonly byFirst = new Map<number, DataLoader<string, PostRow[]>>();

  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  load(authorId: string, first: number, viewerId: string | null): Promise<PostRow[]> {
    let loader = this.byFirst.get(first);
    if (!loader) {
      // No cache, as in UsersLoader.
      loader = new DataLoader((authorIds) => this.latestOfEach([...authorIds], first, viewerId), { cache: false });
      this.byFirst.set(first, loader);
    }
    return loader.load(authorId);
  }

  private async latestOfEach(authorIds: string[], first: number, viewerId: string | null): Promise<PostRow[][]> {
    const ranked = this.db
      .select({
        ...getColumns(posts),
        rank: sql<number>`row_number() over (partition by ${posts.authorId} order by ${posts.publishedAt} desc nulls first, ${posts.id} desc)`.as('rank'),
      })
      .from(posts)
      .where(and(inArray(posts.authorId, authorIds), visibleTo(viewerId)))
      .as('ranked');
    const rows = await this.db.select().from(ranked).where(lte(ranked.rank, first)).orderBy(ranked.rank);
    return authorIds.map((id) => rows.filter((row) => row.authorId === id));
  }
}
```

`User.posts` reads posts, so its resolver lives in the posts folder: `PostsModule` imports `UsersModule` for `UsersLoader`, and never the reverse, so the modules don't import each other:

```typescript
@@filename(src/posts/user-posts.resolver)
import { Authenticate, CurrentUser } from '@nestjs/authentication';
import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { User } from '../users/user.model.js';
import { Post } from './post.model.js';
import { FirstArgs } from './posts.inputs.js';
import { PostsLoader } from './posts.loader.js';

// A field of User, resolved here, in the posts feature: PostsModule imports UsersModule, never the reverse.
@Authenticate({ optional: true })
@Resolver(() => User)
export class UserPostsResolver {
  constructor(private readonly postsLoader: PostsLoader) {}

  @ResolveField(() => [Post])
  posts(@Parent() user: User, @Args() { first }: FirstArgs, @CurrentUser('id') viewerId: string | null) {
    return this.postsLoader.load(user.id, first, viewerId ?? null);
  }
}
```

The user resolver has `me` and `email`:

```typescript
@@filename(src/users/users.resolver)
import { Authenticate, CurrentUser } from '@nestjs/authentication';
import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { User } from './user.model.js';

@Authenticate({ optional: true })
@Resolver(() => User)
export class UsersResolver {
  @Authenticate({ optional: false })
  @Query(() => User)
  me(@CurrentUser() user: User) {
    return user;
  }

  // Only the user themselves sees their address; anyone else gets null.
  @ResolveField(() => String, { nullable: true })
  email(@Parent() user: User, @CurrentUser('id') viewerId: string | null) {
    return user.id === viewerId ? user.email : null;
  }
}
```

`email` is a field resolver, not a [field middleware](/graphql/field-middleware): middleware only has the context, whose `req.user` over `graphql-ws` is the socket's last authenticated operation's (see [GraphQL and WebSockets](/security/authentication#graphql-and-websockets)), and `@CurrentUser()` is this operation's.

#### Sign users in with mutations

Sign-up, sign-in and refresh work as in [tutorial 1](/tutorials/rest-api-jwt-authentication#sign-users-in-with-jwts): an access token that lives 15 minutes, and a refresh token that rotates on every use. Here they're mutations, and three files differ from tutorial 1's: users have a name, the user type is the GraphQL model, and the realm is the blog's. The users repository is the only code that sees password hashes:

```typescript
@@filename(src/users/users.repository)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from '../database/schema.js';
import type { User } from './user.model.js';

const columns = { id: users.id, email: users.email, name: users.name, createdAt: users.createdAt };

/** Only `User` objects leave this class: password hashes stay inside. */
@Injectable()
export class UsersRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  /** The new user, or `null` when the email is taken. */
  async create(email: string, name: string, passwordHash: string): Promise<User | null> {
    // One statement: two sign-ups with the same email can't both succeed.
    const [user] = await this.db
      .insert(users)
      .values({ email: normalize(email), name, passwordHash })
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
}

export const normalize = (email: string) => email.trim().normalize('NFC').toLowerCase();
```

The users module provides it to the authentication code, and `UsersLoader` to the posts feature:

```typescript
@@filename(src/users/users.module)
import { Module } from '@nestjs/common';
import { UsersLoader } from './users.loader.js';
import { UsersRepository } from './users.repository.js';
import { UsersResolver } from './users.resolver.js';

@Module({
  providers: [UsersRepository, UsersLoader, UsersResolver],
  exports: [UsersRepository, UsersLoader],
})
export class UsersModule {}
```

`PasswordHasher` hashes passwords with scrypt. `verify()` checks a dummy hash when there's no such account, so the response time doesn't reveal which emails are registered:

```typescript
@@filename(src/auth/credentials.service)
import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { GraphQLError } from 'graphql';
import type { User } from '../users/user.model.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async register(email: string, name: string, password: string): Promise<User> {
    const user = await this.usersRepository.create(email, name, await this.passwordHasher.hash(password));
    if (!user) {
      throw new GraphQLError('Email already registered', { extensions: { code: 'EMAIL_TAKEN' } });
    }
    return user;
  }

  /** The user, or `null` when the email or the password is wrong. */
  async verify(email: string, password: string): Promise<User | null> {
    const found = await this.usersRepository.findCredentials(email);
    // With no account, verify() checks a dummy hash, so the response
    // time doesn't reveal which emails are registered.
    const valid = await this.passwordHasher.verify(password, found?.passwordHash);
    return valid && found ? found.user : null;
  }
}
```

`JwtBearerProvider` reads the `Authorization` header, checks the token's signature, expiry, issuer and audience, and passes its claims to `validate()`:

```typescript
@@filename(src/auth/jwt-auth.provider)
import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, JwtBearerProvider, type JwtClaims } from '@nestjs/authentication';
import type { User } from '../users/user.model.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class JwtAuth extends JwtBearerProvider<User> {
  constructor(
    private readonly usersRepository: UsersRepository,
    registry: AuthenticationRegistry,
  ) {
    // The key, issuer and audience come from the `accessToken` options.
    super({ realm: 'blog' });
    registry.registerProvider(this);
  }

  // Called once the signature, `exp`, `iss` and `aud` checked out.
  // Returning null (the user was deleted) rejects the token.
  validate({ sub }: JwtClaims) {
    return sub ? this.usersRepository.findById(sub) : null;
  }
}
```

Two files are tutorial 1's. Copy `src/auth/drizzle-refresh-token.store.ts` from [Store the refresh tokens](/tutorials/rest-api-jwt-authentication#store-the-refresh-tokens) as it is: it keeps the refresh tokens in PostgreSQL, and its conditional `UPDATE` lets exactly one of two refreshes with the same token win. Copy `src/auth/auth-types.ts` from [Users](/tutorials/rest-api-jwt-authentication#users), with `User` imported from `../users/user.model.js` instead of `../users/user.js`, so `@CurrentUser('id')` accepts only keys of `User`.

The mutations' inputs, and what they return:

```typescript
@@filename(src/auth/auth.inputs)
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, Length, MaxLength } from 'class-validator';

@InputType()
export class SignUpInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(1, 100)
  name: string;

  @Field()
  @Length(12, 128)
  password: string;
}

@InputType()
export class SignInInput {
  @Field()
  @IsEmail()
  email: string;

  // No minimum here: a password set under an older rule still signs in.
  @Field()
  @MaxLength(128)
  password: string;
}

@InputType()
export class RefreshTokenInput {
  @Field()
  @IsNotEmpty()
  refreshToken: string;
}

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field(() => Int, { description: "The access token's lifetime, in seconds." })
  expiresIn: number;
}
```

The resolver issues the tokens with `TokenService`. A reused refresh token means two parties hold it, so `TokenService` revokes its family, and throws an `AuthenticationError`, which the client gets as `UNAUTHENTICATED` (see [Issue tokens to the mobile app](/security/authentication#issue-tokens-to-the-mobile-app)):

```typescript
@@filename(src/auth/auth.resolver)
import { Logger, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Public, TokenService } from '@nestjs/authentication';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SkipThrottle, Throttle, hours, minutes } from '@nestjs/throttler';
import { AuthPayload, RefreshTokenInput, SignInInput, SignUpInput } from './auth.inputs.js';
import { CredentialsService } from './credentials.service.js';
import { GqlThrottlerGuard } from './gql-throttler.guard.js';

@Public()
@UseGuards(GqlThrottlerGuard)
@Resolver()
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name);

  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly tokenService: TokenService,
  ) {}

  @SkipThrottle({ account: true })
  @Throttle({ default: { limit: 10, ttl: hours(1) } })
  @Mutation(() => AuthPayload)
  async signUp(@Args('input') { email, name, password }: SignUpInput) {
    const user = await this.credentialsService.register(email, name, password);
    return this.tokenService.issue(user.id, { method: 'password', claims: { amr: ['pwd'] } });
  }

  @Throttle({
    default: { limit: 30, ttl: minutes(15) },
    account: { limit: 5, ttl: minutes(15) },
  })
  @Mutation(() => AuthPayload)
  async signIn(@Args('input') { email, password }: SignInInput) {
    const user = await this.credentialsService.verify(email, password);
    if (!user) {
      this.logger.warn('Sign-in failed', { email });
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.tokenService.issue(user.id, { method: 'password', claims: { amr: ['pwd'] } });
  }

  // An unknown, expired or reused refresh token is UNAUTHENTICATED; reuse revokes the family.
  @Mutation(() => AuthPayload)
  refreshToken(@Args('input') { refreshToken }: RefreshTokenInput) {
    return this.tokenService.refresh(refreshToken);
  }
}
```

The auth module:

```typescript
@@filename(src/auth/auth.module)
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { AuthResolver } from './auth.resolver.js';
import { CredentialsService } from './credentials.service.js';
import { DrizzleRefreshTokenStore } from './drizzle-refresh-token.store.js';
import { JwtAuth } from './jwt-auth.provider.js';

@Module({
  imports: [UsersModule],
  providers: [AuthResolver, JwtAuth, CredentialsService, DrizzleRefreshTokenStore],
})
export class AuthModule {}
```

##### Rate-limit sign-in

The limits are [tutorial 1's](/tutorials/rest-api-jwt-authentication#rate-limit-sign-in). `GqlThrottlerGuard`, in `src/auth/gql-throttler.guard.ts`, is the guard from [GraphQL](/security/rate-limiting#graphql), applied to `AuthResolver` only, since with `fieldResolverEnhancers` a global guard would count every field resolved. It also overrides `throwThrottlingException()` to throw a `GraphQLError` with the code `TOO_MANY_REQUESTS` and `retryAfter`, the seconds until the block lifts (`timeToBlockExpire`): a 429 would reach the client as `INTERNAL_SERVER_ERROR`. What's this app's own is the `account` tracker, which `AppModule` configures, and which reads the email from the mutation's arguments rather than a request body, normalized with the users repository's `normalize()`. The same file exports it:

```typescript
@@filename(src/auth/gql-throttler.guard)
// ...

/** The address the mutation's `input` names, normalized as the users table stores it, or `''`. */
export function accountEmail(context: ExecutionContext): string {
  const email = GqlExecutionContext.create(context).getArgs<{ input?: { email?: unknown } }>().input?.email;
  return typeof email === 'string' ? normalize(email) : '';
}
```

#### Configure the GraphQL module

The GraphQL module's options come from a class, which Nest creates with its dependencies (see [Async configuration](/graphql/quick-start#async-configuration)):

```typescript
@@filename(src/graphql/graphql.config)
import type { IncomingMessage } from 'node:http';
import type { ApolloDriverConfig } from '@nestjs/apollo';
import { Injectable } from '@nestjs/common';
import { WsAuthenticator } from '@nestjs/authentication';
import type { GqlOptionsFactory } from '@nestjs/graphql';
import { GraphQLError, getOperationAST, parse } from 'graphql';
import type { Context, SubscribePayload } from 'graphql-ws';
import type { Extra } from 'graphql-ws/use/ws';

type SocketContext = Context<Record<string, unknown> | undefined, Extra>;

@Injectable()
export class GraphqlConfig implements GqlOptionsFactory<ApolloDriverConfig> {
  constructor(private readonly wsAuthenticator: WsAuthenticator) {}

  createGqlOptions(): ApolloDriverConfig {
    const production = process.env.NODE_ENV === 'production';
    return {
      autoSchemaFile: true,
      sortSchema: true,
      subscriptions: {
        'graphql-ws': {
          onConnect: (context) => this.authenticateSocket(context as SocketContext),
          onSubscribe: (_context, _id, payload) => this.checkSocketOperation(payload),
        },
      },
      // Called for every operation. Over graphql-ws, the socket's upgrade request stands in for `req`.
      context: ({ req, res, extra }: { req?: IncomingMessage; res?: unknown; extra?: Extra }) => ({
        req: req ?? extra?.request,
        res,
      }),
      fieldResolverEnhancers: ['guards', 'interceptors', 'filters'],
      formatError: (error) =>
        // In production, an error nobody threw on purpose tells the client nothing.
        production && error.extensions?.code === 'INTERNAL_SERVER_ERROR'
          ? { message: 'Internal server error', path: error.path, extensions: { code: 'INTERNAL_SERVER_ERROR' } }
          : error,
    };
  }

  /** Runs once per socket: `false` closes it with 4403 Forbidden. */
  private async authenticateSocket({ connectionParams, extra }: SocketContext) {
    // Browsers can't set headers on a WebSocket: the token comes in connectionParams,
    // and goes on the upgrade request, where the guard reads it for every operation.
    if (typeof connectionParams?.authorization === 'string') {
      extra.request.headers.authorization = connectionParams.authorization;
    }
    const result = await this.wsAuthenticator.authenticateConnection(extra.socket, extra.request, { required: false });
    return result !== null;
  }

  /**
   * graphql-ws runs operations outside Apollo Server, whose plugins don't apply to them.
   * The socket serves subscriptions only; queries and mutations go over HTTP.
   */
  private checkSocketOperation({ query, operationName }: SubscribePayload) {
    let document;
    try {
      document = parse(query);
    } catch (error) {
      return [error as GraphQLError];
    }
    if (getOperationAST(document, operationName)?.operation !== 'subscription') {
      return [new GraphQLError('Only subscriptions are served over WebSocket: send queries and mutations over HTTP')];
    }
    return undefined;
  }
}
```

- **`context` is a function**, as [GraphQL and WebSockets](/security/authentication#graphql-and-websockets) requires: the guard reads the headers of the context's `req`.
- **`fieldResolverEnhancers`** makes Nest run guards, interceptors and filters on field resolvers too (see [Execute enhancers at the field resolver level](/graphql/other-features#execute-enhancers-at-the-field-resolver-level)). The guard gives them `@CurrentUser()`. The filters log what they throw: without them, an error in `Post.author` reaches the client without a line in the logs.
- **`formatError` hides unexpected errors in production.** Apollo Server leaves out the stack trace there, but keeps the message, such as a database error naming a host.
- **The socket is authenticated once, when it opens.** A browser can't set headers on a WebSocket, so clients send the token in `connectionParams`. `authenticateSocket()` copies it to the upgrade request, and checks it with `WsAuthenticator`, which runs the guard's providers. `false` closes the socket with 4403 before any operation.
- **The socket serves subscriptions only.** `graphql-ws` executes what it receives itself, outside Apollo Server, so Apollo Server's plugins never see it, and it runs a query or a mutation as readily as a subscription. The Apollo driver applies the `introspection` setting to the socket since `@nestjs/apollo` 14.2.2; before that, an introspection query got the schema over the socket even in production. `checkSocketOperation()` refuses everything but subscriptions, so the only way to send a query or a mutation is HTTP, with Apollo Server's checks.

#### Push new comments with subscriptions

Two resolvers serve comments: one for the `author` field, which injects `UsersLoader`, and one for the `addComment` mutation and the `commentAdded` subscription (see [Subscriptions](/graphql/subscriptions)). Nest requires a resolver with a `@Subscription()` to be a singleton, so it can't inject a request-scoped provider:

```typescript
@@filename(src/posts/comments.resolver)
import { Inject } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@nestjs/authentication';
import { Args, Mutation, Parent, ResolveField, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { notFound } from '../graphql/errors.js';
import { User } from '../users/user.model.js';
import { UsersLoader } from '../users/users.loader.js';
import { Comment } from './comment.model.js';
import { AddCommentInput, CommentAddedArgs } from './posts.inputs.js';
import { PostsService, PUB_SUB, commentAddedTopic } from './posts.service.js';

// Request-scoped, since it injects UsersLoader.
@Authenticate({ optional: true })
@Resolver(() => Comment)
export class CommentAuthorResolver {
  constructor(private readonly usersLoader: UsersLoader) {}

  @ResolveField(() => User)
  author(@Parent() comment: Comment) {
    return this.usersLoader.load(comment.authorId);
  }
}

// A singleton: Nest requires one for a resolver with a @Subscription().
@Resolver(() => Comment)
export class CommentsResolver {
  constructor(
    private readonly postsService: PostsService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Mutation(() => Comment)
  addComment(@CurrentUser('id') userId: string, @Args('input') input: AddCommentInput) {
    return this.postsService.addComment(userId, input);
  }

  @Subscription(() => Comment)
  async commentAdded(@Args() { postId }: CommentAddedArgs, @CurrentUser('id') userId: string) {
    // Subscribing to someone else's draft is the same as to a post that doesn't exist.
    if (!(await this.postsService.findVisible(postId, userId))) {
      notFound('Post');
    }
    // One topic per post: a comment wakes only the subscribers of its own post.
    return this.pubSub.asyncIterableIterator(commentAddedTopic(postId));
  }
}
```

- **Authenticated per operation.** The guard runs for the subscription, with the token the socket opened with.
- **Someone else's draft is `NOT_FOUND`.** Drafts take no comments, but any other answer would tell the client the draft exists.
- **One topic per post**, rather than one topic and a [`filter`](/graphql/subscriptions#filtering-subscriptions), which would run for every subscriber of every post on every comment.

The posts module provides the four resolvers, the service, the two loaders and the `PubSub`:

```typescript
@@filename(src/posts/posts.module)
import { Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { UsersModule } from '../users/users.module.js';
import { CommentAuthorResolver, CommentsResolver } from './comments.resolver.js';
import { CommentsLoader } from './comments.loader.js';
import { PostsLoader } from './posts.loader.js';
import { PostsResolver } from './posts.resolver.js';
import { PostsService, PUB_SUB } from './posts.service.js';
import { UserPostsResolver } from './user-posts.resolver.js';

@Module({
  // For UsersLoader. UsersModule imports nothing of the posts feature.
  imports: [UsersModule],
  providers: [
    PostsResolver,
    CommentsResolver,
    CommentAuthorResolver,
    UserPostsResolver,
    PostsService,
    PostsLoader,
    CommentsLoader,
    // In memory, in this process: see the production checklist.
    { provide: PUB_SUB, useValue: new PubSub() },
  ],
  exports: [PostsLoader, CommentsLoader],
})
export class PostsModule {}
```

#### Assemble the application

The root module registers the configuration, the database, authentication, GraphQL and the rate limits, and the pipe and filter that apply to every operation:

```typescript
@@filename(src/app.module)
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AuthenticationModule } from '@nestjs/authentication';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { GraphQLModule } from '@nestjs/graphql';
import { createObserveModule } from '@nestjs/observe';
import { ThrottlerModule, minutes, normalizeIp } from '@nestjs/throttler';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AuthModule } from './auth/auth.module.js';
import { accountEmail } from './auth/gql-throttler.guard.js';
import { envSchema, type Env } from './config.js';
import { badUserInput, GraphQLErrorFilter } from './graphql/errors.js';
import { GraphqlConfig } from './graphql/graphql.config.js';
import { PostsModule } from './posts/posts.module.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'blog-api',
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
          issuer: 'blog-api',
          audience: 'blog-api',
          ttl: '15m',
        },
        refreshToken: { ttl: '30d', absoluteTtl: '90d' },
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useClass: GraphqlConfig,
    }),
    ThrottlerModule.forRoot([
      // Per IP address, on the mutations that sign users in.
      { name: 'default', ttl: minutes(1), limit: 100 },
      // Per email and IP address, wherever the mutation's input names an account.
      {
        name: 'account',
        ttl: minutes(15),
        limit: 5,
        skipIf: (context) => !accountEmail(context),
        getTracker: (req, context) => `${accountEmail(context)}|${normalizeIp(req.ip)}`,
      },
    ]),
    UsersModule,
    AuthModule,
    PostsModule,
  ],
  providers: [
    { provide: APP_PIPE, useValue: new ValidationPipe({ transform: true, exceptionFactory: badUserInput }) },
    { provide: APP_FILTER, useClass: GraphQLErrorFilter },
  ],
})
export class AppModule {}
```

- **`ObserveModule` comes first** in `imports`, as the [SDK's quick start](/observability/sdk#quick-start) does: modules shut down in reverse order, so it stops last, and sends what the others recorded (see [Shutdown](/observability/sdk#shutdown)). `createObserveModule()` returns it with `ObserveInstrument`, which `main.ts` passes to Nest.
- **The key pair is empty until you link the project.** Without one, the SDK sends nothing, and says so at startup. `npx @nestjs/observe link` writes `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` into `.env`, and adds `--env-file .env` to the `start` script, so they're in the environment before `AppModule` is imported, when the SDK reads them (see [Linking from the terminal](/observability/sdk#linking-from-the-terminal)).
- **`transform: true`** makes the arguments instances of their classes, which class-validator needs. The pipe and the filter are providers of `AppModule`, so the tests get them too.

`main.ts` creates the application on the Node adapter, with the options, `instrument` among them, as the third argument:

```typescript
@@filename(src/main)
import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { AppModule, ObserveInstrument } from './app.module.js';
import type { Env } from './config.js';

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
app.useSecurityHeaders({
  // GraphiQL, served outside production only, loads its scripts from unpkg.com.
  contentSecurityPolicy: production
    ? true
    : { directives: { scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'] } },
});
app.enableShutdownHooks();

const config = app.get<ConfigService<Env, true>>(ConfigService);
app.enableCors({ origin: config.get('CORS_ORIGINS', { infer: true }) });

await app.listen(config.get('PORT', { infer: true }));
```

The logs are JSON in production, with passwords and tokens masked (see [JSON logging](/application/logger#json-logging)). The security policy is relaxed outside production for GraphiQL, which loads its scripts from `unpkg.com` (see [Swagger UI and GraphQL IDEs](/security/helmet#swagger-ui-and-graphql-ides)). CORS allows only `CORS_ORIGINS` (see [Default allowed origins](/security/cors#default-allowed-origins)).

#### Seed the database

A script gives the blog two users, twelve published posts, a draft each, and comments:

```typescript
@@filename(src/database/seed)
import { PasswordHasher } from '@nestjs/authentication';
import { drizzle } from 'drizzle-orm/node-postgres';
import { envSchema } from '../config.js';
import { comments, posts, users } from './schema.js';

// Development data: empties the tables, then adds two users, their posts and comments.
const { NODE_ENV, DATABASE_URL } = envSchema.parse(process.env);
if (NODE_ENV === 'production') {
  throw new Error('Refusing to seed a production database');
}
const db = drizzle(DATABASE_URL);
const passwordHash = await new PasswordHasher().hash('correct horse battery');
await db.execute('TRUNCATE users, posts, comments, refresh_tokens');

const [ada, bob] = await db
  .insert(users)
  .values([
    { email: 'ada@example.com', name: 'Ada', passwordHash },
    { email: 'bob@example.com', name: 'Bob', passwordHash },
  ])
  .returning();
// Twelve published posts, an hour apart, by Ada and Bob in turn, and a draft each.
const published = await db
  .insert(posts)
  .values(
    Array.from({ length: 12 }, (_, i) => ({
      authorId: [ada, bob][i % 2].id,
      title: `Post ${i + 1}`,
      body: `The body of post ${i + 1}.`,
      publishedAt: new Date(Date.now() - (12 - i) * 3_600_000),
    })),
  )
  .returning();
await db.insert(posts).values([
  { authorId: ada.id, title: "Ada's draft", body: 'Not ready yet.' },
  { authorId: bob.id, title: "Bob's draft", body: 'Not ready either.' },
]);
// A comment on each post, by the other user.
await db
  .insert(comments)
  .values(published.map((post) => ({ postId: post.id, authorId: post.authorId === ada.id ? bob.id : ada.id, body: `About ${post.title}` })));

console.log(`Seeded 2 users, ${published.length} published posts and 2 drafts`);
await db.$client.end();
```

Add a script to `package.json`:

```json
"db:seed": "node --env-file-if-exists=.env dist/database/seed.js"
```

Build the application, and seed it:

```bash
$ npm run build
$ npm run db:seed
...
Seeded 2 users, 12 published posts and 2 drafts
```

#### Try it

Start the application:

```bash
$ npm run start
```

In development, GraphiQL is at `http://localhost:3000/graphql`, the API's own URL: add an `Authorization` header in its headers editor to run operations as a user. With curl, sign in as Ada and Bob, and keep their access tokens:

```bash
$ curl localhost:3000/graphql --json '{"query":"mutation ($input: SignInInput!) { signIn(input: $input) { accessToken refreshToken expiresIn } }","variables":{"input":{"email":"ada@example.com","password":"correct horse battery"}}}'
{"data":{"signIn":{"accessToken":"eyJhbGciOiJIUzI1NiIs...","refreshToken":"I-NorWBT--e6Jkit...","expiresIn":900}}}
$ ADA=eyJhbGciOiJIUzI1NiIs...
$ BOB=eyJhbGciOiJIUzI1NiIs... # the same, with bob@example.com
```

The first page of published posts, then the next one, which starts after `endCursor`:

```bash
$ curl localhost:3000/graphql --json '{"query":"{ posts(first: 2) { edges { node { title author { name email } comments(first: 1) { body } } } pageInfo { hasNextPage endCursor } } }"}'
{"data":{"posts":{"edges":[{"node":{"title":"Post 12","author":{"name":"Bob","email":null},"comments":[{"body":"About Post 12"}]}},...],"pageInfo":{"hasNextPage":true,"endCursor":"MTc5NTY3Njg0NzQzMTo3NTYwM2RiNC0xZjJlLTQ1MDYtOTVjNy0wNzM3MmY0NjdiMzc"}}}}
$ curl localhost:3000/graphql --json '{"query":"query ($after: String) { posts(first: 2, after: $after) { edges { node { title } } } }","variables":{"after":"MTc5NTY3Njg0NzQzMTo3NTYwM2RiNC0xZjJlLTQ1MDYtOTVjNy0wNzM3MmY0NjdiMzc"}}'
{"data":{"posts":{"edges":[{"node":{"title":"Post 10"}},{"node":{"title":"Post 9"}}]}}}
```

Ada's own list starts with her draft. Bob gets `null` for it, as for an id that doesn't exist:

```bash
$ curl localhost:3000/graphql -H "Authorization: Bearer $ADA" --json '{"query":"{ me { posts(first: 2) { id title publishedAt } } }"}'
{"data":{"me":{"posts":[{"id":"5761230b-00cd-4fbd-aedc-7a751770daa9","title":"Ada's draft","publishedAt":null},{"id":"75603db4-1f2e-4506-95c7-07372f467b37","title":"Post 11",...}]}}}
$ curl localhost:3000/graphql -H "Authorization: Bearer $BOB" --json '{"query":"query ($id: ID!) { post(id: $id) { title } }","variables":{"id":"5761230b-00cd-4fbd-aedc-7a751770daa9"}}'
{"data":{"post":null}}
```

Errors carry a code: Bob can't change Ada's post, and a title can't be `null`. In development, `extensions` also has a stack trace:

```bash
$ curl localhost:3000/graphql -H "Authorization: Bearer $BOB" --json '{"query":"mutation ($id: ID!) { updatePost(input: { id: $id, title: \"Mine now\" }) { title } }","variables":{"id":"75603db4-1f2e-4506-95c7-07372f467b37"}}'
{"errors":[{"message":"Only the author can change this post",...,"extensions":{"code":"FORBIDDEN",...}}],"data":null}
$ curl localhost:3000/graphql -H "Authorization: Bearer $ADA" --json '{"query":"mutation ($id: ID!) { updatePost(input: { id: $id, title: null }) { title } }","variables":{"id":"75603db4-1f2e-4506-95c7-07372f467b37"}}'
{"errors":[{"message":"title must be longer than or equal to 1 characters; title must be a string",...,"extensions":{"code":"BAD_USER_INPUT","fields":{"title":[...]},...}}],"data":null}
```

A short script watches the comments of a post, with the token you give it:

```typescript
@@filename(scripts/watch-comments)
// Prints the comments added to a post as they arrive: node scripts/watch-comments.ts <postId> <accessToken>
import { createClient } from 'graphql-ws';

const [postId, accessToken] = process.argv.slice(2);
const client = createClient({
  url: process.env.WS_URL ?? 'ws://localhost:3000/graphql',
  // Sent once, when the socket opens. Node.js 22 has a WebSocket client built in, as browsers do.
  connectionParams: { authorization: `Bearer ${accessToken}` },
  retryAttempts: 0,
});

try {
  const comments = client.iterate({
    query: 'subscription ($postId: ID!) { commentAdded(postId: $postId) { body author { name } } }',
    variables: { postId },
  });
  for await (const result of comments) {
    console.log(JSON.stringify(result));
  }
} catch (error) {
  // The server closed the socket: 4403 when it refused the token.
  const { code, reason } = error as CloseEvent;
  console.error(`Closed: ${code} ${reason}`);
}
```

Run it in a second terminal, with the id of Ada's `Post 11` and Bob's token, and add a comment as Ada in the first. The script prints it, and with a wrong token the server closes the socket before any subscription:

```bash
$ node scripts/watch-comments.ts 75603db4-1f2e-4506-95c7-07372f467b37 $BOB
{"data":{"commentAdded":{"body":"Thanks for reading!","author":{"name":"Ada"}}}}
$ node scripts/watch-comments.ts 75603db4-1f2e-4506-95c7-07372f467b37 not-a-token
Closed: 4403 Forbidden
```

The comment, added as Ada from the first terminal:

```bash
$ curl localhost:3000/graphql -H "Authorization: Bearer $ADA" --json '{"query":"mutation ($input: AddCommentInput!) { addComment(input: $input) { id } }","variables":{"input":{"postId":"75603db4-1f2e-4506-95c7-07372f467b37","body":"Thanks for reading!"}}}'
{"data":{"addComment":{"id":"c7ca2df6-811b-4292-9b9b-067281eab611"}}}
```

#### Test it

The tests boot the real `AppModule` on a PostgreSQL test database, with a connection that counts the SQL statements it sends, and a cheaper scrypt cost. Most send operations with `app.inject()`, which the Node adapter provides; the WebSocket tests listen on a port:

```typescript
@@filename(test/test-app)
import { fileURLToPath } from 'node:url';
import { PasswordHasher } from '@nestjs/authentication';
import { getDrizzleToken } from '@nestjs/drizzle';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

export interface TestApp {
  app: NestNodeApplication;
  /** How many SQL statements the application has sent so far. */
  sqlCount: () => number;
  close: () => Promise<void>;
}

/** The real AppModule on the database in TEST_DATABASE_URL, emptied first. */
export async function createTestApp(): Promise<TestApp> {
  // Imported here, so a test file can set NODE_ENV before the module reads it.
  const { AppModule } = await import('../src/app.module.js');
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  let count = 0;
  const db = drizzle({ client: pool, logger: { logQuery: () => void count++ } });
  await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
  await db.execute(sql`TRUNCATE users, posts, comments, refresh_tokens CASCADE`);

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(getDrizzleToken())
    .useValue(db)
    // scrypt at the default cost takes 128 MiB and a few hundred ms per hash.
    .overrideProvider(PasswordHasher)
    .useValue(new PasswordHasher({ logN: 10 }))
    .compile();
  const app = moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter());
  await app.init();
  return {
    app,
    sqlCount: () => count,
    close: async () => {
      await app.close();
      await pool.end();
    },
  };
}

export interface GqlResult {
  data?: any;
  errors?: { message: string; path?: string[]; extensions: { code: string; [key: string]: unknown } }[];
}

let clients = 0;

/** Sends an operation with app.inject(), from an address of its own. */
export async function gql(
  app: NestNodeApplication,
  query: string,
  { variables, token }: { variables?: Record<string, unknown>; token?: string } = {},
): Promise<GqlResult> {
  const res = await app.inject({
    method: 'POST',
    url: '/graphql',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    payload: { query, variables },
    // Sign-up is limited per IP address: each test client gets an address of its own.
    remoteAddress: `10.0.0.${++clients}`,
  });
  return res.json();
}

export async function signUp(app: NestNodeApplication, name: string): Promise<{ accessToken: string; refreshToken: string }> {
  const { data } = await gql(app, 'mutation ($input: SignUpInput!) { signUp(input: $input) { accessToken refreshToken } }', {
    variables: { input: { email: `${name.toLowerCase()}@example.com`, name, password: 'correct horse battery' } },
  });
  return data.signUp;
}

/** Creates a post, and publishes it unless it's to stay a draft. */
export async function createPost(app: NestNodeApplication, token: string, title: string, publish = true): Promise<string> {
  const create = 'mutation ($input: CreatePostInput!) { createPost(input: $input) { id } }';
  const { id } = (await gql(app, create, { token, variables: { input: { title, body: '' } } })).data.createPost;
  if (publish) {
    await gql(app, 'mutation ($id: ID!) { publishPost(id: $id) { id } }', { token, variables: { id } });
  }
  return id;
}
```

The test configuration gives the application its environment, and runs the files one after another, since they share the database:

```typescript
@@filename(vitest.config.e2e)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Node.js loads graphql's CommonJS build for @nestjs/graphql and Apollo Server; without this,
    // Vite would give the tested code its ES module build, a second copy that rejects the schema.
    alias: [{ find: /^graphql$/, replacement: 'graphql/index.js' }],
  },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // The files share one test database, which each one empties first.
    fileParallelism: false,
    env: {
      // Validated at startup; the tests replace the connection with their own.
      DATABASE_URL: 'postgres://unused-in-tests',
      JWT_SECRET: 'test-only-jwt-secret-of-at-least-32-bytes',
    },
  },
});
```

Vite resolves `graphql` to its ES module build, while Node.js gives `@nestjs/graphql` and Apollo Server the CommonJS build: two copies, and `graphql-ws` fails with "Cannot use GraphQLSchema ... from another module or realm". The alias gives the tests' code the CommonJS build too. Three tests in full: a draft hidden on every path, an SQL count that stays flat as the posts grow, and a WebSocket refused without a valid token:

```typescript
@@filename(test/blog.e2e-spec)
import type { AddressInfo } from 'node:net';
import { createClient } from 'graphql-ws';
import { createPost, createTestApp, gql, signUp, type GqlResult, type TestApp } from './test-app.js';

describe.skipIf(!process.env.TEST_DATABASE_URL)('Blog API (e2e)', () => {
  let t: TestApp;
  let wsUrl: string;
  let ada: string;
  let bob: string;

  beforeAll(async () => {
    t = await createTestApp();
    // Port 0: the OS picks a free one.
    await t.app.listen(Number(process.env.TEST_PORT ?? 0), '127.0.0.1');
    wsUrl = `ws://127.0.0.1:${(t.app.getHttpServer().address() as AddressInfo).port}/graphql`;
    ada = (await signUp(t.app, 'Ada')).accessToken;
    bob = (await signUp(t.app, 'Bob')).accessToken;
  });
  afterAll(() => t.close());

  const post = (token: string, title: string, publish?: boolean) => createPost(t.app, token, title, publish);
  const code = (result: GqlResult) => result.errors?.[0].extensions.code;
  const ids = (list: { id: string }[]) => list.map((item) => item.id);

  it('hides a draft from everyone but its author, through every path', async () => {
    const draft = await post(ada, 'Draft', false);
    const published = await post(ada, 'Published');
    const byId = 'query ($id: ID!) { post(id: $id) { id author { posts(first: 50) { id } } } }';
    expect((await gql(t.app, byId, { token: ada, variables: { id: draft } })).data.post.id).toBe(draft);

    for (const token of [bob, undefined]) {
      expect((await gql(t.app, byId, { token, variables: { id: draft } })).data.post).toBeNull();
      const list = await gql(t.app, '{ posts(first: 50) { edges { node { id } } } }', { token });
      expect(list.data.posts.edges.map((edge: any) => edge.node.id)).not.toContain(draft);
      const viaAuthor = await gql(t.app, byId, { token, variables: { id: published } });
      expect(ids(viaAuthor.data.post.author.posts)).toContain(published);
      expect(ids(viaAuthor.data.post.author.posts)).not.toContain(draft);
    }
    // Writes answer NOT_FOUND, as for an unknown id: nobody learns the draft exists.
    for (const mutation of [
      'mutation ($id: ID!) { updatePost(input: { id: $id, title: "Mine now" }) { id } }',
      'mutation ($id: ID!) { publishPost(id: $id) { id } }',
      'mutation ($id: ID!) { addComment(input: { postId: $id, body: "First!" }) { id } }',
    ]) {
      expect(code(await gql(t.app, mutation, { token: bob, variables: { id: draft } }))).toBe('NOT_FOUND');
    }
    expect(ids((await gql(t.app, '{ me { posts(first: 50) { id } } }', { token: ada })).data.me.posts)).toContain(draft);
  });

  it('batches nested fields: the number of SQL queries stays flat as the posts grow', async () => {
    const queriesFor = async () => {
      const before = t.sqlCount();
      const query = '{ posts(first: 50) { edges { node { author { name posts(first: 2) { id } } comments(first: 5) { author { name } } } } } }';
      const { data } = await gql(t.app, query);
      return { posts: data.posts.edges.length, queries: t.sqlCount() - before };
    };
    const addPosts = async (count: number) => {
      for (let i = 0; i < count; i++) {
        const postId = await post(i % 2 ? ada : bob, `Post ${i}`);
        await gql(t.app, 'mutation ($postId: ID!) { addComment(input: { postId: $postId, body: "Nice" }) { id } }', {
          token: i % 2 ? bob : ada,
          variables: { postId },
        });
      }
    };
    await addPosts(3);
    const few = await queriesFor();
    await addPosts(20);
    const many = await queriesFor();

    expect(many.posts).toBe(few.posts + 20);
    expect(many.queries).toBe(few.queries);
    // At most the posts, their authors, the authors' posts, the comments and their authors.
    expect(many.queries).toBeLessThanOrEqual(5);
  });

  it('refuses a WebSocket without a valid token, before any operation', async () => {
    const postId = await post(ada, 'Guarded');
    for (const token of [undefined, 'not-a-jwt', `${ada}x`]) {
      const client = createClient({ url: wsUrl, connectionParams: { authorization: `Bearer ${token}` }, retryAttempts: 0 });
      const comments = client.iterate({ query: 'subscription ($postId: ID!) { commentAdded(postId: $postId) { body } }', variables: { postId } });
      // The client rejects with the CloseEvent: 4403 Forbidden.
      await expect(comments.next()).rejects.toMatchObject({ code: 4403 });
    }
  });
});
```

Three more files, in the [example repository](https://github.com/nestjs/example-graphql-api) with the rest of the application, prove the other guarantees:

- `test/errors.e2e-spec.ts`: an anonymous mutation is `UNAUTHENTICATED` and a non-author's update `FORBIDDEN`, an email reaches its owner only, invalid arguments are `BAD_USER_INPUT` with readable messages, and a reused refresh token is refused, with its successor.
- `test/subscriptions.e2e-spec.ts`: a subscriber gets its post's comments and no other's, another user's draft is `NOT_FOUND`, and the socket refuses introspection and mutations.
- `test/production.e2e-spec.ts`: with `NODE_ENV` set to `production` before `AppModule` is imported, an unexpected error is masked, and one thrown on purpose keeps its message without a stack trace.

Add a script to `package.json`:

```json
"test:e2e": "vitest run --config ./vitest.config.e2e.ts"
```

Create the test database once, then run the files against it:

```bash
$ docker exec blog-db psql -U postgres -c "CREATE DATABASE blog_test"
$ TEST_DATABASE_URL=postgres://postgres:blog@localhost:5432/blog_test npm run test:e2e

 Test Files  4 passed (4)
      Tests  12 passed (12)
```

Each test fails without the code it protects. Without the DataLoader in any of the three loaders, the SQL count grows with the posts. Without `onConnect`, a socket without a token opens. Without `onSubscribe`, an introspection query and a mutation run over the socket.

#### Production checklist

- **Set `NODE_ENV` to `production`.** The authentication module then refuses to start without a store for its refresh tokens, and:
  - Introspection is refused, with `GRAPHQL_VALIDATION_FAILED`, over HTTP by Apollo Server, and over the socket, which serves subscriptions only.
  - `/graphql` serves no GraphiQL, and Apollo Server's CSRF prevention answers 400 to a request a page on another site could send without a preflight, such as a `text/plain` post.
  - Errors carry no stack trace, and `formatError` replaces an unexpected error's message with `Internal server error`.
- **Keep `JWT_SECRET` in your platform's secret store**, injected at runtime, and run `drizzle-kit migrate` as a release step, before the new version starts.
- **Replace the in-memory `PubSub` before you run a second instance**: a comment added on one instance never reaches a subscriber connected to another. Use one backed by Redis or another broker (see the [`PubSub` implementations](https://github.com/apollographql/graphql-subscriptions#pubsub-implementations)), give the throttler shared [storage](/security/rate-limiting#storages), and make sure the load balancer forwards WebSocket upgrades on `/graphql`.
- **Behind a load balancer, pass `trustProxy` to `NodeAdapter`** (see [Node adapter options](/http/performance#node-adapter-options)), so the throttler sees the client's address.
- **Set `CORS_ORIGINS` to your web app's origins**, or leave it empty if no browser calls the API.
- **Collect the JSON logs from stdout** with your platform's log driver.
- **Give production its own Observe key pair**, from the project's **API Keys** page, as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the platform's environment: `start:prod` doesn't load `.env`. [NestJS Observe](/observability/overview) then shows GraphQL requests broken down by operation (see [Telemetry views](/observability/dashboard#telemetry-views)), records each resolver, and captures the errors that propagate out of one (see [Error monitoring](/observability/error-monitoring)). It needs `@nestjs/graphql` 13.4.4 or later, and its `graphql` options tag, ignore or name the user of operations (see [Shaping what is recorded](/observability/sdk#shaping-what-is-recorded)).

#### What's next

- Decide what each user may do with permissions rather than ownership: [Authorization](/security/authorization).
- Split the schema across services: [Federation](/graphql/federation).
- Let the build add the `@Field()` metadata from the TypeScript types: [CLI plugin](/graphql/cli-plugin).
- Build the same kind of API over REST: [Build a REST API with JWT authentication](/tutorials/rest-api-jwt-authentication).
