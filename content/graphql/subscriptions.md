### Subscriptions

In addition to fetching data using queries and modifying data using mutations, the GraphQL spec supports a third operation type, called `subscription`. GraphQL subscriptions are a way to push data from the server to the clients that choose to listen to real time messages from the server. Subscriptions are similar to queries in that they specify a set of fields to be delivered to the client, but instead of immediately returning a single answer, a channel is opened and a result is sent to the client every time a particular event happens on the server.

A common use case for subscriptions is notifying the client side about particular events, for example the creation of a new object, updated fields and so on (read more [here](https://www.apollographql.com/docs/react/data/subscriptions)).

#### Enable subscriptions

To enable subscriptions, set the `installSubscriptionHandlers` property to `true`.

```typescript
GraphQLModule.forRoot({
  installSubscriptionHandlers: true,
}),
```

#### Code first

To create a subscription using the code first approach, we'll make use of the `@Subscription()` decorator and the `PubSub` class from the `graphql-subscriptions` package, which provides a simple **publish/subscribe API**.

The subscription handler takes care of **subscribing** to an event by calling `PubSub#asyncIterator`. This method takes a single argument, the `triggerName` which corresponds to an event topic name.

```typescript
const pubSub = new PubSub();

@Resolver(of => Author)
export class AuthorResolver {
  // ...
  @Subscription(returns => Comment)
  commentAdded() {
    return pubSub.asyncIterator('commentAdded');
  }
}
```

The current implementation also requires that the method handler name match the `triggerName`. That is, in the code sample above, the method name `commentAdded()` must match the `triggerName` passed in to `pubSub.asyncIterator('commentAdded')`.

> info **Hint** All decorators are exported from the `@nestjs/graphql` package, while the `PubSub` class is exported from the `graphql-subscriptions` package.

> warning **Note** `PubSub` is a class that exposes a simple `publish` and `subscribe API`. Read more about it [here](https://www.apollographql.com/docs/graphql-subscriptions/setup.html). Note that the Apollo docs warn that the default implementation is not suitable for production (read more [here](https://github.com/apollographql/graphql-subscriptions#getting-started-with-your-first-subscription)). Production apps should use a `PubSub` implementation backed by an external store (read more [here](https://github.com/apollographql/graphql-subscriptions#pubsub-implementations)).

This will result in generating the following part of the GraphQL schema in SDL:

```graphql
type Subscription {
  commentAdded(): Comment!
}
```

To publish the event, use the `PubSub#publish` method. This is often used within a mutation to trigger a client-side update when a part of the object graph has changed. For example:

```typescript
@@filename(posts/posts.resolver)
@Mutation(returns => Post)
async addComment(
  @Args('postId', { type: () => Int }) postId: number,
  @Args('comment', { type: () => Comment }) comment: CommentInput,
) {
  const newComment = this.commentsService.addComment({ id: postId, comment });
  pubSub.publish('commentAdded', newComment);
  return newComment;
}
```

To filter out specific events, set the `filter` property to a filter function. This function acts similar to the function passed to an array `filter`. It takes two arguments: `payload` containing the event payload (as sent by the event publisher), and `variables` taking any arguments passed in during the subscription request. It returns a boolean determining whether this event should be published to client listeners.

```typescript
@Subscription(returns => Comment, {
  filter: (payload, variables) =>
    payload.commentAdded.title === variables.title,
})
commentAdded(@Args('title') title: string) {
  return pubSub.asyncIterator('commentAdded');
}
```

To mutate the published event payload, set the `resolve` property to a function. The function receives the event payload (as sent by the event publisher) and returns the appropriate value.

```typescript
@Subscription(returns => Comment, {
  resolve: value => value,
})
commentAdded() {
  return pubSub.asyncIterator('commentAdded');
}
```

If you need to access injected providers (e.g., use an external service to validate the data), use the following construction.

```typescript
@Subscription(returns => Comment, {
  resolve(this: AuthorResolver, value) {
    // "this" refers to an instance of "AuthorResolver"
    return value;
  }
})
commentAdded() {
  return pubSub.asyncIterator('commentAdded');
}
```

The same construction works with filters:

```typescript
@Subscription(returns => Comment, {
  filter(this: AuthorResolver, payload, variables) {
    // "this" refers to an instance of "AuthorResolver"
    return payload.commentAdded.title === variables.title;
  }
})
commentAdded() {
  return pubSub.asyncIterator('commentAdded');
}
```

#### Schema first

To create an equivalent subscription in Nest, we'll make use of the `@Subscription()` decorator.

```typescript
const pubSub = new PubSub();

@Resolver('Author')
export class AuthorResolver {
  // ...
  @Subscription()
  commentAdded() {
    return pubSub.asyncIterator('commentAdded');
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
  return pubSub.asyncIterator('commentAdded');
}
```

To mutate the published payload, we can use a `resolve` function.

```typescript
@Subscription('commentAdded', {
  resolve: value => value,
})
commentAdded() {
  return pubSub.asyncIterator('commentAdded');
}
```

If you need to access injected providers (e.g., use an external service to validate the data), use the following construction:

```typescript
@Subscription('commentAdded', {
  resolve(this: AuthorResolver, value) {
    // "this" refers to an instance of "AuthorResolver"
    return value;
  }
})
commentAdded() {
  return pubSub.asyncIterator('commentAdded');
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
  return pubSub.asyncIterator('commentAdded');
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

With this, we've created a single `commentAdded(title: String!): Comment` subscription. You can find a full sample implementation [here](https://github.com/nestjs/nest/blob/master/sample/12-graphql-schema-first).

#### PubSub

We instantiated a local `PubSub` instance above. The preferred approach is to define `PubSub` as a [provider](/fundamentals/custom-providers) and inject it through the constructor (using the `@Inject()` decorator). This allows us to re-use the instance across the whole application. For example, define a provider as follows, then inject `'PUB_SUB'` where needed.

```typescript
{
  provide: 'PUB_SUB',
  useValue: new PubSub(),
}
```

#### Customize subscriptions server

To customize the subscriptions server (e.g., change the listener port), use the `subscriptions` options property (read [more](https://www.apollographql.com/docs/apollo-server/v2/api/apollo-server.html#constructor-options-lt-ApolloServer-gt)).

```typescript
GraphQLModule.forRoot({
  installSubscriptionHandlers: true,
  subscriptions: {
    keepAlive: 5000,
  }
}),
```
