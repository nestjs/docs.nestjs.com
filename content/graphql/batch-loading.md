### Batch loading

Field resolvers let you compose a graph out of small, focused functions. They also make it easy to accidentally hammer your data source: GraphQL calls a field resolver **once for every parent object**, so a query that returns 100 authors calls the `posts` field resolver 100 times.

This is known as the **n+1 problem**. The `@BatchResolveField()` decorator solves it by handing your method **every parent at once**, so you can load the whole layer with a single round-trip.

#### The n+1 problem

Take the resolver from the [resolvers](/graphql/resolvers) chapter, adjusted to return a list of authors:

```typescript
@@filename(authors/authors.resolver)
@Resolver(() => Author)
export class AuthorsResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query(() => [Author])
  authors() {
    return this.authorsService.findAll();
  }

  @ResolveField(() => [Post])
  posts(@Parent() author: Author) {
    return this.postsService.findByAuthorId(author.id);
  }
}
```

Now run this query:

```graphql
{
  authors {
    firstName
    posts {
      title
    }
  }
}
```

With 100 authors in the database, that single request runs **101 queries**: one to load the authors, then one more per author to load their posts. The resolver looks perfectly innocent — the cost only shows up under real data. Add a `comments` field underneath `posts` and the numbers multiply again.

The fix is not to load less, but to load **together**: instead of asking "give me the posts of author 1", then "give me the posts of author 2", ask once for "give me the posts of authors 1..100".

#### DataLoader

[DataLoader](https://github.com/graphql/dataloader) is the utility the GraphQL community settled on for exactly this. It works in two steps:

- **Batching** — calling `loader.load(key)` returns a promise and queues the key. At the end of the current tick of the event loop, every key queued so far is handed to a single batch function in one call. Since GraphQL resolves all the siblings of a list in the same tick, all 100 authors land in the same batch.
- **Memoization** — a loader remembers the value it resolved for a key, so asking for the same key twice within a request only loads it once.

A loader must be created **per request**, never shared across them — otherwise one user would see another user's cached data.

`@nestjs/graphql` wires all of this for you. You write the batch function as an ordinary resolver method, and the loader is created, scoped to the current request, and thrown away with it.

#### Installation

`dataloader` is an optional peer dependency, so install it first:

```bash
$ npm i --save dataloader
```

> warning **Warning** If a resolver uses `@BatchResolveField()` while `dataloader` is not installed, an error is logged at startup and every request to that field fails.

#### Getting started

Turn the field resolver above into a batch one by swapping `@ResolveField()` for `@BatchResolveField()`:

```typescript
@@filename(authors/authors.resolver)
@Resolver(() => Author)
export class AuthorsResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query(() => [Author])
  authors() {
    return this.authorsService.findAll();
  }

  @BatchResolveField(() => [Post])
  async posts(@Parent() authors: Author[]): Promise<Map<Author, Post[]>> {
    const posts = await this.postsService.findByAuthorIds(
      authors.map((author) => author.id),
    );

    return new Map(
      authors.map((author) => [
        author,
        posts.filter((post) => post.authorId === author.id),
      ]),
    );
  }
}
```

The same query now runs **2 queries** instead of 101, no matter how many authors come back.

Three things changed compared to a regular field resolver:

- `@Parent()` gives you an **array** of parents instead of a single one.
- The return type function is **required**. The method returns a `Map` (or a `Promise` of one), and neither says anything about the type of the schema field, so it cannot be inferred.
- The method returns a value **for every parent it was given**, described in the next section.

> info **Hint** `@BatchResolveField()` is exported from the `@nestjs/graphql` package and works with both the Apollo and Mercurius drivers.

#### Mapping the results back to the parents

Your method receives an array of parents and must say which value belongs to which. It can return either a `Map` or an array.

**A `Map` keyed by the parents** is the default, as in the example above. Note that JavaScript compares object keys by **reference**, so the keys must be the very same objects that were passed into the method — a structurally identical copy will not match.

**A `Map` keyed by something derived from the parent** is usually more convenient, because your data source most likely already groups rows by the foreign key. Use the `keyBy` option to tell Nest how to look a parent up:

```typescript
@BatchResolveField(() => [Post], { keyBy: (author: Author) => author.id })
posts(@Parent() authors: Author[]): Promise<Map<number, Post[]>> {
  return this.postsService.groupByAuthorId(authors.map((author) => author.id));
}
```

**An array** is accepted as well, and must hold exactly one entry per parent, **in the very same order**:

```typescript
@BatchResolveField(() => Author)
authors(@Parent() posts: Post[]): Promise<Author[]> {
  return this.authorsService.findByIdsInOrder(
    posts.map((post) => post.authorId),
  );
}
```

> warning **Warning** Returning an array of the wrong length throws at runtime, since there is no way to tell which parent was skipped. Prefer a `Map` unless your data source already guarantees the ordering.

#### Parents with no value

A parent that has no entry in the returned `Map` resolves to `null`. For a nullable field that is exactly right, but for a non-nullable list it produces an error — so seed the map with an empty array rather than leaving the parent out:

```typescript
@BatchResolveField(() => [Post], { keyBy: (author: Author) => author.id })
async posts(@Parent() authors: Author[]): Promise<Map<number, Post[]>> {
  const posts = await this.postsService.findByAuthorIds(
    authors.map((author) => author.id),
  );

  // every author starts with an empty list, so an author without posts
  // resolves to [] instead of null
  const postsByAuthor = new Map<number, Post[]>(
    authors.map((author) => [author.id, []]),
  );
  for (const post of posts) {
    postsByAuthor.get(post.authorId).push(post);
  }
  return postsByAuthor;
}
```

#### Field arguments

Unlike a regular field resolver, a batch method is called once for a whole group of parents — so it receives **one** arguments object, not one per parent. Nest keeps a separate loader per distinct set of arguments within a request, which makes this safe:

```typescript
@BatchResolveField(() => [Post])
posts(
  @Parent() authors: Author[],
  @Args('status') status: PostStatus,
): Promise<Map<Author, Post[]>> {
  return this.postsService.groupByAuthorIds(
    authors.map((author) => author.id),
    status,
  );
}
```

Given the query below, the method is called twice — once with `PUBLISHED` and once with `DRAFT` — and each call still receives all the authors at once:

```graphql
{
  authors {
    published: posts(status: PUBLISHED) {
      title
    }
    drafts: posts(status: DRAFT) {
      title
    }
  }
}
```

> info **Hint** Arguments are serialized to tell batches apart. In the rare case that they cannot be serialized (for example a custom scalar producing a circular value), the call falls back to a loader of its own: still correct, just not batched with its siblings.

#### Configuring the loader

Pass options straight through to the underlying `DataLoader` with the `dataLoader` key:

```typescript
@BatchResolveField(() => [Post], {
  dataLoader: {
    maxBatchSize: 100,
    cacheKeyFn: (author: Author) => author.id,
  },
})
```

<table>
  <tbody>
    <tr>
      <td><code>cache</code></td>
      <td>Set to <code>false</code> to stop memoizing the value resolved for a parent within a request. Defaults to <code>true</code>.</td>
    </tr>
    <tr>
      <td><code>maxBatchSize</code></td>
      <td>Caps how many parents are handed over in a single call. Larger groups are split into several calls.</td>
    </tr>
    <tr>
      <td><code>cacheKeyFn</code></td>
      <td>Decides when two parents count as the same for memoization. Defaults to the parent object itself.</td>
    </tr>
    <tr>
      <td><code>batchScheduleFn</code></td>
      <td>Controls when an accumulated batch is dispatched. Defaults to the end of the current event loop tick.</td>
    </tr>
    <tr>
      <td><code>cacheMap</code></td>
      <td>A custom cache instance. Set to <code>null</code> to opt out of the default one.</td>
    </tr>
  </tbody>
</table>

> info **Hint** `keyBy` and `dataLoader.cacheKeyFn` look similar but answer different questions. `keyBy` says **how a parent is looked up** in the map you return; `cacheKeyFn` says **when two parents are the same value**. Setting `cacheKeyFn: (author) => author.id` means two distinct `Author` objects carrying the same id are loaded only once.

#### Error handling

If the batch method throws, every parent in that batch fails with the error — which is what you want when the underlying query itself failed.

To fail a **single** parent while the rest succeed, return an `Error` as its value:

```typescript
return new Map(
  authors.map((author) => [
    author,
    author.isSuspended
      ? new Error('Author is suspended')
      : postsByAuthorId[author.id],
  ]),
);
```

#### Enhancers and field middleware

[Field middleware](/graphql/field-middleware) wraps the batch resolver, so it keeps running **once per field**, receiving the individual parent as `ctx.source` and the value resolved for it:

```typescript
@BatchResolveField(() => [Post], { middleware: [loggerMiddleware] })
posts(@Parent() authors: Author[]): Promise<Map<Author, Post[]>> {
  // called once for the whole batch, while loggerMiddleware runs once per author
}
```

Enhancers, on the other hand, sit inside the batch. When guards, interceptors or filters are enabled at the field resolver level ([read more](/graphql/other-features#execute-enhancers-at-the-field-resolver-level)), they run **once per batch**, and the root of the execution context is the array of parents rather than a single parent. Keep that in mind when writing a guard that inspects the parent object.

#### Schema first

The return type function is only used by the code first schema builder, so in the schema first approach it can be dropped entirely — the field types come from your SDL:

```typescript
@Resolver('Author')
export class AuthorsResolver {
  @BatchResolveField()
  posts(@Parent() authors: Author[]) {
    // ...
  }

  @BatchResolveField('books', { keyBy: (author: Author) => author.id })
  authorBooks(@Parent() authors: Author[]) {
    // ...
  }
}
```

As with `@ResolveField()`, the first argument names the schema field when it differs from the method name.

#### Things to keep in mind

- **Batches follow the event loop.** Only the parents GraphQL resolves in the same tick end up together — which, in practice, is every element of a list. Parents that arrive later form a new batch.
- **`@Info()` describes the batch, not one parent.** The `GraphQLResolveInfo` object belongs to the field invocation that opened the batch. Its selection set is shared by the whole batch, but per-parent details such as `path` are not.
- **`@Context()` is exact.** The context object is the same for every parent of a request.
- **Not every field is worth batching.** A field computed from data already present on the parent does not touch a data source at all, and a plain `@ResolveField()` stays the simpler choice.
