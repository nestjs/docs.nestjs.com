### Mutations

Most discussions of GraphQL focus on data fetching, but any complete data platform needs a way to modify server-side data as well. In REST, any request could end up causing side-effects on the server, but best practice suggests we should not modify data in GET requests. GraphQL is similar - technically any query could be implemented to cause a data write. However, like REST, it's recommended to observe the convention that any operations that cause writes should be sent explicitly via a mutation (read more [here](https://graphql.org/learn/queries/#mutations)).

The official [Apollo](https://www.apollographql.com/docs/graphql-tools/generate-schema.html) documentation uses an `upvotePost()` mutation example. This mutation implements a method to increase a post's `votes` property value. To create an equivalent mutation in Nest, we'll make use of the `@Mutation()` decorator.

#### Code first

Let's add another method to the `AuthorResolver` used in the previous section (see [resolvers](/graphql/resolvers)).

```typescript
@Mutation(() => Post)
async upvotePost(@Args({ name: 'postId', type: () => Int }) postId: number) {
  return this.postsService.upvoteById({ id: postId });
}
```

> info **Hint** All decorators (e.g., `@Resolver`, `@ResolveField`, `@Args`, etc.) are exported from the `@nestjs/graphql` package.

This will result in generating the following part of the GraphQL schema in SDL:

```graphql
type Mutation {
  upvotePost(postId: Int!): Post
}
```

The `upvotePost()` method takes `postId` (`Int`) as an argument and returns an updated `Post` entity. For the reasons explained in the [resolvers](/graphql/resolvers) section, we have to explicitly set the expected type.

If the mutation needs to take an object as an argument, we can create an **input type**. The input type is a special kind of object type that can be passed in as an argument (read more [here](https://graphql.org/learn/schema/#input-types)). To declare an input type, use the `@InputType()` decorator.

```typescript
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpvotePostInput {
  @Field()
  postId: number;
}
```

> info **Hint** The `@InputType()` decorator takes an options object as an argument, so you can, for example, specify the input type's description. Note that, due to TypeScript's metadata reflection system limitations, you must either use the `@Field` decorator to manually indicate a type, or use a [CLI plugin](/graphql/cli-plugin).

> info **Hint** When a field is nullable you need to type it verbosely in order to prevent any runtime issue:
>
> ```ts
> @Field(() => String, {{ '{' }} nullable: true {{ '}' }}) title?: string | null;
> ```
>
> This is particularly important when dealing with partial updates in your API, especially if the corresponding database field is non-nullable (let's assume `author.title` is a mandatory field in database).
>
> Problem: assume you want to allow users to perform partial updates on `author`'s info. So you define the `title` field in your `Input` object type:
>
> ```ts
> @Field(() => String, {{ '{' }} nullable: true {{ '}' }}) title?: string;
> ```
>
> Indicating that user can skip `title` entirely in an update mutation. However if a user sends `null` explicitly for `title` and you pass the DTO directly to your database, something like this:
>
> ```ts
> prisma.author.update({{ '{' }}
>   where: {{ '{' }}
>     id: author.id
>   {{ '}' }},
>   data: dto
> {{ '}' }})
> ```
>
> Then your database will throw an error because `null` is not assignable to `title` which is non-nullable.
>
> Solution: To prevent this from happening you can be more specific when you're defining `title`'s type: `@Field(() => String, {{ '{' }} nullable: true {{ '}' }}) title?: string | null;`. Now when you're passing your DTO directly to the underlying ORM TS complain that `null` is not assignable to `string`.

We can then use this type in the resolver class:

```typescript
@Mutation(() => Post)
async upvotePost(
  @Args('upvotePostData') upvotePostData: UpvotePostInput,
) {}
```

#### Schema first

Let's extend our `AuthorResolver` used in the previous section (see [resolvers](/graphql/resolvers)).

```typescript
@Mutation()
async upvotePost(@Args('postId') postId: number) {
  return this.postsService.upvoteById({ id: postId });
}
```

Note that we assumed above that the business logic has been moved to the `PostsService` (querying the post and incrementing its `votes` property). The logic inside the `PostsService` class can be as simple or sophisticated as needed. The main point of this example is to show how resolvers can interact with other providers.

The last step is to add our mutation to the existing types definition.

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

The `upvotePost(postId: Int!): Post` mutation is now available to be called as part of our application's GraphQL API.
