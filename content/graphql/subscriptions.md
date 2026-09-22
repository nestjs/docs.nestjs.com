### Subscriptions

In addition to fetching data with queries and modifying data with mutations, the GraphQL spec supports a third operation type, called `subscription`. GraphQL subscriptions push data from the server to clients that choose to listen to real-time messages. Like queries, subscriptions specify a set of fields to be delivered to the client. Instead of immediately returning a single result, however, they open a channel, and the server sends a result to the client every time a particular event occurs.

A common use case for subscriptions is notifying the client about particular events, such as the creation of a new object or updated fields (see [Subscriptions](https://www.apollographql.com/docs/react/data/subscriptions) in the Apollo documentation).

#### Enable subscriptions with Apollo driver

Subscriptions are transported over WebSockets by the [graphql-ws](https://github.com/enisdenjo/graphql-ws) package. `@nestjs/graphql` already depends on it, but install it in your project as well if you import from it directly (e.g., the `Context` type used in [Authentication over WebSockets](/graphql/subscriptions#authentication-over-websockets)):

```bash
$ npm i --save graphql-ws
```

Then enable the transport:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'graphql-ws': true,
  },
}),
```

> warning **Warning** Support for `subscriptions-transport-ws` was **removed** in `@nestjs/graphql` v14. The package is no longer a dependency, and the `'subscriptions-transport-ws'` key is no longer accepted in the `subscriptions` options object. If you are upgrading, replace that key with `'graphql-ws'` and update your clients to the newer protocol. The two protocols are wire-incompatible, so clients still using `subscriptions-transport-ws` fail to connect. The `onConnect` callback signature differs as well: with `graphql-ws`, it receives the connection context, and extra context values belong in its `extra` field (see [Authentication over WebSockets](/graphql/subscriptions#authentication-over-websockets) below).

#### Code first

To create a subscription with the code first approach, use the `@Subscription()` decorator (exported from the `@nestjs/graphql` package) and the `PubSub` class from the `graphql-subscriptions` package, which provides a simple **publish/subscribe API**.

The following subscription handler **subscribes** to an event by calling `PubSub#asyncIterableIterator`. This method takes a single argument, the `triggerName`, which corresponds to an event topic name.

```typescript
const pubSub = new PubSub();

@Resolver(() => Author)
export class AuthorResolver {
  // ...
  @Subscription(() => Comment)
  commentAdded() {
    return pubSub.asyncIterableIterator('commentAdded');
  }
}
```

> info **Hint** All decorators are exported from the `@nestjs/graphql` package, while the `PubSub` class is exported from the `graphql-subscriptions` package (`npm i graphql-subscriptions`).

> warning **Note** `PubSub` is a class that exposes a simple `publish` and `subscribe` API. Learn more in the [graphql-subscriptions setup guide](https://www.apollographql.com/docs/graphql-subscriptions/setup.html). The Apollo docs warn that the [default implementation](https://github.com/apollographql/graphql-subscriptions#getting-started-with-your-first-subscription) is not suitable for production. Production apps should use a `PubSub` implementation backed by an external store (see the list of [PubSub implementations](https://github.com/apollographql/graphql-subscriptions#pubsub-implementations)).

This generates the following part of the GraphQL schema in SDL:

```graphql
type Subscription {
  commentAdded: Comment!
}
```

Subscriptions, by definition, return an object with a single top-level property whose key is the name of the subscription. This name is either inherited from the name of the subscription handler method (i.e., `commentAdded` above), or provided explicitly through the `name` option in the second argument to the `@Subscription()` decorator, as shown below.

```typescript
@Subscription(() => Comment, {
  name: 'commentAdded',
})
subscribeToCommentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

This construct produces the same SDL as the previous code sample, but decouples the method name from the subscription name.

#### Publishing

To publish the event, use the `PubSub#publish` method. It is often called within a mutation to trigger a client-side update when a part of the object graph has changed. For example:

```typescript
@@filename(posts/posts.resolver)
@Mutation(() => Comment)
async addComment(
  @Args('postId', { type: () => Int }) postId: number,
  @Args('comment', { type: () => CommentInput }) comment: CommentInput,
) {
  const newComment = this.commentsService.addComment({ id: postId, comment });
  pubSub.publish('commentAdded', { commentAdded: newComment });
  return newComment;
}
```

The `PubSub#publish` method takes a `triggerName` (again, think of it as an event topic name) as the first parameter, and an event payload as the second. As mentioned, a subscription, by definition, returns a value, and that value has a shape. Look again at the generated SDL for the `commentAdded` subscription:

```graphql
type Subscription {
  commentAdded: Comment!
}
```

This tells us that the subscription must return an object with a top-level property named `commentAdded` whose value is a `Comment` object. The shape of the event payload emitted by the `PubSub#publish` method must match the shape of the value the subscription is expected to return. In the example above, the `pubSub.publish('commentAdded', {{ '{' }} commentAdded: newComment {{ '}' }})` statement publishes a `commentAdded` event with the appropriately shaped payload. If the shapes don't match, the subscription fails when the event is resolved.

#### Filtering subscriptions

To filter out specific events, set the `filter` property to a filter function. This function works like the callback passed to an array's `filter()` method. It takes two arguments: `payload`, containing the event payload (as sent by the event publisher), and `variables`, containing any arguments passed in with the subscription request. It returns a boolean that determines whether the event should be published to client listeners.

```typescript
@Subscription(() => Comment, {
  filter: (payload, variables) =>
    payload.commentAdded.title === variables.title,
})
commentAdded(@Args('title') title: string) {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

#### Mutating subscription payloads

To transform the published event payload, set the `resolve` property to a function. The function receives the event payload (as sent by the event publisher) and returns the appropriate value.

```typescript
@Subscription(() => Comment, {
  resolve: value => value,
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

> warning **Note** If you use the `resolve` option, return the unwrapped payload (in our example, return the `newComment` object directly, not a `{{ '{' }} commentAdded: newComment {{ '}' }}` object).

To access injected providers (e.g., to validate the data with an external service), use the following construction.

```typescript
@Subscription(() => Comment, {
  resolve(this: AuthorResolver, value) {
    // "this" refers to an instance of "AuthorResolver"
    return value;
  }
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

The same construction works with filters:

```typescript
@Subscription(() => Comment, {
  filter(this: AuthorResolver, payload, variables) {
    // "this" refers to an instance of "AuthorResolver"
    return payload.commentAdded.title === variables.title;
  }
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

#### Schema first

To create an equivalent subscription in Nest, use the `@Subscription()` decorator.

```typescript
const pubSub = new PubSub();

@Resolver('Author')
export class AuthorResolver {
  // ...
  @Subscription()
  commentAdded() {
    return pubSub.asyncIterableIterator('commentAdded');
  }
}
```

To filter out specific events based on context and arguments, set the `filter` property.

```typescript
@Subscription('commentAdded', {
  filter: (payload, variables) =>
    payload.commentAdded.title === variables.title,
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

To transform the published payload, use a `resolve` function.

```typescript
@Subscription('commentAdded', {
  resolve: value => value,
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

To access injected providers (e.g., to validate the data with an external service), use the following construction:

```typescript
@Subscription('commentAdded', {
  resolve(this: AuthorResolver, value) {
    // "this" refers to an instance of "AuthorResolver"
    return value;
  }
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

The same construction works with filters:

```typescript
@Subscription('commentAdded', {
  filter(this: AuthorResolver, payload, variables) {
    // "this" refers to an instance of "AuthorResolver"
    return payload.commentAdded.title === variables.title;
  }
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

The last step is to update the type definitions file.

```graphql
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post]
}

type Post {
  id: Int!
  title: String
  votes: Int
}

type Query {
  author(id: Int!): Author
}

type Comment {
  id: String
  content: String
}

type Subscription {
  commentAdded(title: String!): Comment
}
```

With this, we've created a single `commentAdded(title: String!): Comment` subscription. A full [schema first sample](https://github.com/nestjs/nest/blob/master/sample/12-graphql-schema-first) is available in the NestJS repository.

#### PubSub

The examples above instantiate a local `PubSub` instance. The preferred approach is to define `PubSub` as a [provider](/fundamentals/custom-providers) and inject it through the constructor (using the `@Inject()` decorator), so that the same instance is reused across the whole application. For example, define a provider as follows, then inject `'PUB_SUB'` where needed.

```typescript
{
  provide: 'PUB_SUB',
  useValue: new PubSub(),
}
```

#### Customize subscriptions server

To customize the subscriptions server (e.g., to change its path, which defaults to the GraphQL endpoint path), pass an options object for `graphql-ws` in the `subscriptions` property:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'graphql-ws': {
      path: '/graphql',
    },
  },
});
```

#### Authentication over WebSockets

To check whether the user is authenticated, use the `onConnect` callback function, which you can specify in the `subscriptions` options.

With `graphql-ws`, the `onConnect` callback receives the connection context, including `connectionParams`.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'graphql-ws': {
      onConnect: (context: Context<any>) => {
        const { connectionParams, extra } = context;
        const authToken = connectionParams.authToken;
        if (!isValid(authToken)) {
          throw new Error('Token is not valid');
        }
        // when using graphql-ws, additional context values should be stored in the extra field
        extra.user = { user: {} };
      },
    },
  },
  context: ({ extra }) => {
    // you can now access your additional context value through the extra field
  },
});
```

#### Enable subscriptions with Mercurius driver

To enable subscriptions, set the `subscription` property to `true`.

```typescript
GraphQLModule.forRoot<MercuriusDriverConfig>({
  driver: MercuriusDriver,
  subscription: true,
}),
```

> info **Hint** You can also pass an options object to set up a custom emitter, validate incoming connections, etc. See the `subscription` option in the [Mercurius plugin options](https://github.com/mercurius-js/mercurius/blob/master/docs/api/options.md#plugin-options).

#### Code first

To create a subscription with the code first approach, use the `@Subscription()` decorator (exported from the `@nestjs/graphql` package) and the `PubSub` class from the `mercurius` package, which provides a simple **publish/subscribe API**.

The following subscription handler **subscribes** to an event by calling `PubSub#subscribe`. This method takes the topic name as its argument.

```typescript
@Resolver(() => Author)
export class AuthorResolver {
  // ...
  @Subscription(() => Comment)
  commentAdded(@Context('pubsub') pubSub: PubSub) {
    return pubSub.subscribe('commentAdded');
  }
}
```

> info **Hint** All decorators used in the example above are exported from the `@nestjs/graphql` package, while the `PubSub` class is exported from the `mercurius` package.

> warning **Note** `PubSub` is a class that exposes a simple `publish` and `subscribe` API. To register a custom `PubSub` class, see [Subscriptions with custom PubSub](https://github.com/mercurius-js/mercurius/blob/master/docs/subscriptions.md#subscriptions-with-custom-pubsub) in the Mercurius documentation.

This generates the following part of the GraphQL schema in SDL:

```graphql
type Subscription {
  commentAdded: Comment!
}
```

Subscriptions, by definition, return an object with a single top-level property whose key is the name of the subscription. This name is either inherited from the name of the subscription handler method (i.e., `commentAdded` above), or provided explicitly through the `name` option in the second argument to the `@Subscription()` decorator, as shown below.

```typescript
@Subscription(() => Comment, {
  name: 'commentAdded',
})
subscribeToCommentAdded(@Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
```

This construct produces the same SDL as the previous code sample, but decouples the method name from the subscription name.

#### Publishing

To publish the event, use the `PubSub#publish` method. It is often called within a mutation to trigger a client-side update when a part of the object graph has changed. For example:

```typescript
@@filename(posts/posts.resolver)
@Mutation(() => Comment)
async addComment(
  @Args('postId', { type: () => Int }) postId: number,
  @Args('comment', { type: () => CommentInput }) comment: CommentInput,
  @Context('pubsub') pubSub: PubSub,
) {
  const newComment = this.commentsService.addComment({ id: postId, comment });
  await pubSub.publish({
    topic: 'commentAdded',
    payload: {
      commentAdded: newComment
    }
  });
  return newComment;
}
```

As mentioned, a subscription, by definition, returns a value, and that value has a shape. Look again at the generated SDL for the `commentAdded` subscription:

```graphql
type Subscription {
  commentAdded: Comment!
}
```

This tells us that the subscription must return an object with a top-level property named `commentAdded` whose value is a `Comment` object. The shape of the event payload emitted by the `PubSub#publish` method must match the shape of the value the subscription is expected to return. In the example above, the `pubSub.publish({{ '{' }} topic: 'commentAdded', payload: {{ '{' }} commentAdded: newComment {{ '}' }} {{ '}' }})` statement publishes a `commentAdded` event with the appropriately shaped payload. If the shapes don't match, the subscription fails when the event is resolved.

#### Filtering subscriptions

To filter out specific events, set the `filter` property to a filter function. This function works like the callback passed to an array's `filter()` method. It takes two arguments: `payload`, containing the event payload (as sent by the event publisher), and `variables`, containing any arguments passed in with the subscription request. It returns a boolean that determines whether the event should be published to client listeners.

```typescript
@Subscription(() => Comment, {
  filter: (payload, variables) =>
    payload.commentAdded.title === variables.title,
})
commentAdded(@Args('title') title: string, @Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
```

To access injected providers (e.g., to validate the data with an external service), use the following construction.

```typescript
@Subscription(() => Comment, {
  filter(this: AuthorResolver, payload, variables) {
    // "this" refers to an instance of "AuthorResolver"
    return payload.commentAdded.title === variables.title;
  }
})
commentAdded(@Args('title') title: string, @Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
```

#### Schema first

To create an equivalent subscription in Nest, use the `@Subscription()` decorator.

```typescript
@Resolver('Author')
export class AuthorResolver {
  // ...
  @Subscription()
  commentAdded(@Context('pubsub') pubSub: PubSub) {
    return pubSub.subscribe('commentAdded');
  }
}
```

To filter out specific events based on context and arguments, set the `filter` property.

```typescript
@Subscription('commentAdded', {
  filter: (payload, variables) =>
    payload.commentAdded.title === variables.title,
})
commentAdded(@Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
```

To access injected providers (e.g., to validate the data with an external service), use the following construction:

```typescript
@Subscription('commentAdded', {
  filter(this: AuthorResolver, payload, variables) {
    // "this" refers to an instance of "AuthorResolver"
    return payload.commentAdded.title === variables.title;
  }
})
commentAdded(@Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
```

The last step is to update the type definitions file.

```graphql
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post]
}

type Post {
  id: Int!
  title: String
  votes: Int
}

type Query {
  author(id: Int!): Author
}

type Comment {
  id: String
  content: String
}

type Subscription {
  commentAdded(title: String!): Comment
}
```

With this, we've created a single `commentAdded(title: String!): Comment` subscription.

#### PubSub

The examples above use the default `PubSub` emitter ([mqemitter](https://github.com/mcollina/mqemitter)). For production, the preferred approach is to use `mqemitter-redis`. Alternatively, you can provide a custom `PubSub` implementation (see [Subscriptions](https://github.com/mercurius-js/mercurius/blob/master/docs/subscriptions.md) in the Mercurius documentation).

```typescript
import mqemitterRedis from 'mqemitter-redis';

GraphQLModule.forRoot<MercuriusDriverConfig>({
  driver: MercuriusDriver,
  subscription: {
    emitter: mqemitterRedis({
      port: 6579,
      host: '127.0.0.1',
    }),
  },
});
```

#### Authentication over WebSockets

To check whether the user is authenticated, use the `verifyClient` callback function, which you can specify in the `subscription` options.

The `verifyClient` callback receives the `info` object as its first argument, which you can use to read the request's headers.

```typescript
GraphQLModule.forRoot<MercuriusDriverConfig>({
  driver: MercuriusDriver,
  subscription: {
    verifyClient: (info, next) => {
      const authorization = info.req.headers?.authorization as string;
      if (!authorization?.startsWith('Bearer ')) {
        return next(false);
      }
      next(true);
    },
  }
}),
```
