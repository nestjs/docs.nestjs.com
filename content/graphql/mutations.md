### Mutations

In GraphQL, in order to modify the server-side data, we use mutations (read more [here](http://graphql.org/learn/queries/#mutations)). The official [Apollo](https://www.apollographql.com/docs/graphql-tools/generate-schema.html) documentation shares an `upvotePost()` mutation example. This mutation allows to increase a post `votes` property value. In order to create an equivalent mutation in Nest, we'll make use of the `@Mutation()` decorator. Let's extend our `AuthorResolver` used in the previous section (see [resolvers](/graphql/resolvers-map)).

```typescript
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

  @Mutation()
  async upvotePost(@Args('postId') postId: number) {
    return await this.postsService.upvoteById({ id: postId });
  }

  @ResolveProperty('posts')
  async getPosts(@Parent() { id }) {
    return await this.postsService.findAll({ authorId: id });
  }
}
```

Notice that we've assumed that the business logic has been moved to the `PostsService` (respectively querying post and incrementing `votes` property).

#### Type definitions

The last step is to add our mutation to the existing types definition.

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

type Mutation {
  upvotePost(postId: Int!): Post
}
```

The `upvotePost(postId: Int!): Post` mutation should be available now.
