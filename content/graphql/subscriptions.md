### Subscriptions

Subscription is just another GraphQL operation type like Query and Mutation. It allows creating real-time subscriptions over a bidirectional transport layer, mainly over websockets. Read more about the subscriptions [here](https://www.apollographql.com/docs/graphql-subscriptions). Below is a `commentAdded` subscription example, copied and pasted directly from the official [Apollo](https://www.apollographql.com/docs/graphql-subscriptions/subscriptions-to-schema.html) documentation:

```typescript
Subscription: {
  commentAdded: {
    subscribe: () => pubSub.asyncIterator('commentAdded');
  }
}
```

> warning **Notice** The `pubsub` is an instance of `PubSub` class. Read more about it [here](https://www.apollographql.com/docs/graphql-subscriptions/setup.html).

In order to create an equivalent subscription in Nest, we'll make use of the `@Subscription()` decorator. Let's extend our `AuthorResolver` used in the resolvers section.

```typescript
const pubSub = new PubSub();

@Resolver('Author')
export class AuthorResolver {
  constructor(
    private readonly authorsService: AuthorsService,
    private readonly postsService: PostsService,
  ) {}

  @Query('author')
  async getAuthor(@Args('id') id: number) {
    return await this.authorsService.findOneById(id);
  }

  @ResolveProperty('posts')
  async getPosts(@Parent() author) {
    const { id } = author;
    return await this.postsService.findAll({ authorId: id });
  }

  @Subscription()
  commentAdded() {
    return {
      subscribe: () => pubSub.asyncIterator('commentAdded'),
    };
  }
}
```

We have used a local `PubSub` instance here. Instead, we should define `PubSub` as a **provider**, inject it through the constructor (using `@Inject()` decorator), and reuse it across the whole application. You can read more about Nest custom providers [here](/fundamentals/custom-providers).

#### Module

In order to enable subscriptions, we have to set `installSubscriptionHandlers` property to `true`.

```typescript
GraphQLModule.forRoot({
  typePaths: ['./**/*.graphql'],
  installSubscriptionHandlers: true,
}),
```

To customize the subscriptions server (e.g. change port), you can use `subscriptions` property (read [more](https://www.apollographql.com/docs/apollo-server/v2/api/apollo-server.html#constructor-options-lt-ApolloServer-gt)).

#### Type definitions

The last step is to update type definitions file.

```java
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
  commentAdded(repoFullName: String!): Comment
}
```

Well done. We created a single `commentAdded(repoFullName: String!): Comment` subscription. You can find a full sample implementation [here](https://github.com/nestjs/nest/blob/master/sample/12-graphql-apollo).
