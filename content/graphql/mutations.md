### Mutations

Most discussions of GraphQL focus on data fetching, but any complete data platform needs a way to modify server-side data as well. In REST, any request could cause side effects on the server, but best practice is not to modify data in `GET` requests. GraphQL is similar: technically, any query could be implemented to write data. However, as with REST, the convention is to send any operation that causes writes explicitly as a mutation (see [Mutations](https://graphql.org/learn/queries/#mutations) in the GraphQL documentation).

The official [Apollo documentation](https://www.apollographql.com/docs/graphql-tools/generate-schema.html) uses an `upvotePost()` mutation example, which increments a post's `votes` property. To create an equivalent mutation in Nest, use the `@Mutation()` decorator.

#### Code first

Add another method to the `AuthorsResolver` from the [Resolvers](/graphql/resolvers) chapter.

```typescript
@Mutation(() => Post)
async upvotePost(@Args({ name: 'postId', type: () => Int }) postId: number) {
  return this.postsService.upvoteById({ id: postId });
}
```

> info **Hint** All decorators (e.g., `@Resolver`, `@ResolveField`, `@Args`, etc.) are exported from the `@nestjs/graphql` package.

This generates the following part of the GraphQL schema in SDL:

```graphql
type Mutation {
  upvotePost(postId: Int!): Post!
}
```

The `upvotePost()` method takes `postId` (`Int`) as an argument and returns the updated `Post` entity. For the reasons explained in the [Resolvers](/graphql/resolvers) chapter, you have to set the expected type explicitly.

If the mutation needs to take an object as an argument, create an **input type**. An input type is a special kind of object type that can be passed in as an argument (see [Input types](https://graphql.org/learn/schema/#input-types) in the GraphQL documentation). To declare an input type, use the `@InputType()` decorator.

```typescript
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpvotePostInput {
  @Field()
  postId: number;
}
```

> info **Hint** The `@InputType()` decorator takes an options object as an argument, so you can, for example, specify the input type's description. Due to the limitations of TypeScript's metadata reflection system, you must either use the `@Field()` decorator to indicate a type, or use the [CLI plugin](/graphql/cli-plugin).

You can then use this type in the resolver class:

```typescript
@Mutation(() => Post)
async upvotePost(
  @Args('upvotePostData') upvotePostData: UpvotePostInput,
) {}
```

#### Schema first

Extend the `AuthorsResolver` from the [Resolvers](/graphql/resolvers) chapter.

```typescript
@Mutation()
async upvotePost(@Args('postId') postId: number) {
  return this.postsService.upvoteById({ id: postId });
}
```

This example assumes that the business logic (querying the post and incrementing its `votes` property) lives in the `PostsService`. That logic can be as simple or sophisticated as needed. The point of this example is to show how resolvers interact with other providers.

The last step is to add the mutation to the existing type definitions.

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

type Mutation {
  upvotePost(postId: Int!): Post
}
```

The `upvotePost(postId: Int!): Post` mutation is now part of the application's GraphQL API.
