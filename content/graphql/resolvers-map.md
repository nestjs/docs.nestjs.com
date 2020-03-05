### Resolvers

Resolvers provide the instructions for turning a [GraphQL](https://graphql.org/) operation (a query, mutation, or subscription) into data. They either return the same type of data we specify in our schema or a promise for that data. Typically, you create a resolvers map manually. The `@nestjs/graphql` package, on the other hand, generates a resolvers map automatically using the metadata provided by the decorators. To demonstrate the library basics, we'll create a simple authors API.

#### Code first

In the code first approach, we don't write GraphQL SDL by hand. Instead we use TypeScript decorators. The `@nestjs/graphql` package will then read the metadata defined through these decorators and automatically generate the schema for you.

Most of the definitions in a GraphQL schema are **object types**. Each object type you define should represent an object that an application client might need to interact with. For example, our example app needs to be able to fetch a list of authors and their posts, so we should define the `Author` type and `Post` type to support this functionality.

```typescript
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Post } from './post';

@ObjectType()
export class Author {
  @Field(type => Int)
  id: number;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field(type => [Post])
  posts: Post[];
}
```

> info **Hint** TypeScript's metadata reflection system has several limitations which make it impossible to, for instance, determine what properties a class consists of or recognize whether a given property is optional or required. Hence, it's required to use the `@Field` decorator or use a [CLI plugin](/graphql/resolvers-map#plugin).

The `Author` object type has a collection of fields. Each field has a type. A field's type can be either an object type or a scalar type. A scalar type is a primitive (like `ID`, `String`, `Boolean`, or `Int`) that resolves to a single value. In addition to GraphQL's built-in scalar types, you can define custom scalar types.

The `Author` object type will result in generating the following part of the GraphQL schema in SDL:

```graphql
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post]
}
```

The `@Field()` decorator allows you specificying if a field is nullable (each field is non-nullable by default), providing a type function, and setting description or marking field as deprecated:

```typescript
@Field({ description: `Book title`, deprecationReason: 'Not useful in v2 schema' })
title: string;
```

> info **Hint** You can also add the description or deprecate the whole object type: `@ObjectType({{ '{' }} description: 'Author model' {{ '}' }})`.

When the field is an array, we must manually indicate the array type as shown below:

```typescript
@Field(type => [Post])
posts: Post[];
```

> info **Hint** With `[ ]`, we can determine the depth of the array. For example, using `[[Int]]` would represent an integer matrix.

To declare that the array isn't nullable unlike its items, set the `nullable` property to `'items'` as shown below:

```typescript
@Field(type => [Post], { nullable: 'items' })
posts: Post[];
```

> info **Hint** If both the array and its items are nullable, use the `'itemsAndList'` instead.

Now when the `Author` model is created, let's define the `Post` object type.

```typescript
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Post {
  @Field(type => Int)
  id: number;

  @Field()
  title: string;

  @Field(type => Int, { nullable: true })
  votes?: number;
}
```

The `Post` object type will result in generating the following part of the GraphQL schema in SDL:

```graphql
type Post {
  id: Int!
  title: String!
  votes: Int
}
```

We've defined the objects that exist in our data graph, but clients don't yet have a way to interact with those objects. To resolve that, we need to define a resolver class

```typescript
@Resolver(of => Author)
export class AuthorResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query(returns => Author)
  async author(@Args({ name: 'id', type: () => Int }) id: number) {
    return this.authorsService.findOneById(id);
  }

  @ResolveField()
  async posts(@Parent() author: Author) {
    const { id } = author;
    return this.postsService.findAll({ authorId: id });
  }
}
```

> info **Hint** All decorators (e.g., `@Resolver`, `@ResolveField`, `@Args`, etc.) are exported from the `@nestjs/graphql` package.

> warning **Warning** The logic inside the `AuthorsService` and `PostsService` classes can be as simple or sophisticated as needed. The main point of this example is to show how resolvers can interact with other providers.

In the example above, we created the `AuthorResolver` which defines one query and one field resolver. Note that to create a resolver, we must annotate the class with the `@Resolver()` decorator. The argument passed in to the `@Resolver()` decorator is optional, but since we have also defined a field resolver (for the `posts` property of the `Author` object type), it's required to indicate which class is a parent for this particular field resolver (`Author.posts` relation). In addition, we defined a first query to get the author object based on the `id` sent over the network. Queries enable clients to fetch data, but not to **modify** data. To specify that the method is a query handler, use the `@Query()` decorator.

Conventionally, we would use something like `getAuthor()` or `getPosts()` as method names. We can easily do this by passing the real names as arguments of the decorator.

```typescript
@Resolver(of => Author)
export class AuthorResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query(returns => Author, { name: 'author' })
  async getAuthor(@Args({ name: 'id', type: () => Int }) id: number) {
    return this.authorsService.findOneById(id);
  }

  @ResolveField('posts', returns => [Post])
  async getPosts(@Parent() author: Author) {
    const { id } = author;
    return this.postsService.findAll({ authorId: id });
  }
}
```

The `AuthorResolver` resolver will result in generating the following part of the GraphQL schema in SDL:

```graphql
type Query {
  author(id: Int!): Author
}
```

Also, usually, you won't have to pass such an object into the `@Args()` decorator. For example, if your identifier's type is string, the following construction would be sufficient:

```typescript
@Args('id') id: string
```

However, the `number` type doesn't give us enough information about the expected GraphQL representation (`Int` vs. `Float`). Thus we have to **explicitly** pass the type reference.

In addition, all queries can take multiple arguments. Let's imagine that we want to fetch an author based on its `firstName` and `lastName`. In this case, we can call `@Args` twice:

```typescript
getAuthor(
  @Args('firstName', { nullable: true }) firstName?: string,
  @Args('lastName', { defaultValue: '' }) lastName?: string,
) {}
```

> info **Hint** Note that we can pass a second argument which is the options object. The options object allows us to specify a default value, description, deprecation reason, or if a field is nullable.

With inline `@Args()` calls, the code becomes bloated. Instead, you can create a dedicated `GetAuthorArgs` class:

```typescript
@Args() args: GetAuthorArgs
```

With the following body:

```typescript
import { MinLength } from 'class-validator';
import { Field, ArgsType } from '@nestjs/graphql';

@ArgsType()
class GetByIdArgs {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ defaultValue: '' })
  @MinLength(3)
  lastName: string;
}
```

> info **Hint** Again, due to TypeScript's metadata reflection system limitations, it's required to use the `@Field` decorator to manually indicate a type, or use a [CLI plugin](/graphql/resolvers-map#plugin).

This will result in generating the following part of the GraphQL schema in SDL:

```graphql
type Query {
  author(firstName: String, lastName: String = ''): Author
}
```

You may also notice that such classes play very well with the `ValidationPipe` (read [more](/techniques/validation)).

#### Schema first

As mentioned in the [previous](/graphql/quick-start) chapter, in the schema first approach we manually define our types in SDL (read [more](http://graphql.org/learn/schema/#type-language)).

```graphql
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post]
}

type Post {
  id: Int!
  title: String!
  votes: Int
}

type Query {
  author(id: Int!): Author
}
```

Our GraphQL schema contains a single exposed query - `author(id: Int!): Author`. Now, let's create an `AuthorResolver` class.

```typescript
@Resolver('Author')
export class AuthorResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query()
  async author(@Args('id') id: number) {
    return this.authorsService.findOneById(id);
  }

  @ResolveField()
  async posts(@Parent() author) {
    const { id } = author;
    return this.postsService.findAll({ authorId: id });
  }
}
```

> info **Hint** All decorators (e.g., `@Resolver`, `@ResolveField`, `@Args`, etc.) are exported from the `@nestjs/graphql` package.

> warning **Warning** The logic inside the `AuthorsService` and `PostsService` classes can be as simple or sophisticated as needed. The main point of this example is to show how resolvers can interact with other providers.

The `@Resolver()` decorator does not affect queries and mutations (neither `@Query()` nor `@Mutation()` decorators). It only informs Nest that each `@ResolveField()` inside this particular class has a parent, which is an `Author` type in this case (`Author.posts` relation). Basically, instead of setting `@Resolver()` at the top of the class, this can be done close to the method:

```typescript
@Resolver('Author')
@ResolveField()
async posts(@Parent() author) {
  const { id } = author;
  return this.postsService.findAll({ authorId: id });
}
```

> warning **Warning** Using the `@Resolver` decorator at the method-level is not supported with the **code first** approach.

However, if you have multiple `@ResolveField()` decorators inside one class, you must add `@Resolver()` to all of them, which is not necessarily a good practice (as it creates extra overhead).

Conventionally, we would use something like `getAuthor()` or `getPosts()` as method names. We can easily do this by passing the real names as arguments of the decorator.

```typescript
@Resolver('Author')
export class AuthorResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query('author')
  async getAuthor(@Args('id') id: number) {
    return this.authorsService.findOneById(id);
  }

  @ResolveField('posts')
  async getPosts(@Parent() author) {
    const { id } = author;
    return this.postsService.findAll({ authorId: id });
  }
}
```

#### Generating types

Assuming that we use the schema first approach and we have enabled the typings generation feature (with `outputAs: 'class'` as shown in the [previous](/graphql/quick-start) chapter), once you run the application it should generate the following file:

```typescript
export class Author {
  id: number;
  firstName?: string;
  lastName?: string;
  posts?: Post[];
}

export class Post {
  id: number;
  title: string;
  votes?: number;
}

export abstract class IQuery {
  abstract author(id: number): Author | Promise<Author>;
}
```

Generating classes (instead of interfaces) allows you to use **decorators** in combination with the schema first approach, which makes them extremely useful for validation purposes (read [more](/techniques/validation)). For example:

```typescript
import { MinLength, MaxLength } from 'class-validator';

export class CreatePostInput {
  @MinLength(3)
  @MaxLength(50)
  title: string;
}
```

> warning **Notice** To enable auto-validation of your inputs (and parameters), use `ValidationPipe`. Read more about validation [here](/techniques/validation) or more specifically about pipes [here](/pipes).

However, if you add decorators directly to the automatically generated file, they will be **overwritten** each time the file is generated. Instead, create a separate file and simply extend the generated class.

```typescript
import { MinLength, MaxLength } from 'class-validator';
import { Post } from '../../graphql.ts';

export class CreatePostInput extends Post {
  @MinLength(3)
  @MaxLength(50)
  title: string;
}
```

#### Decorators

You may note that we refer to the following arguments using dedicated decorators. Below is a comparison of the provided decorators and the plain Apollo parameters they represent.

<table>
  <tbody>
    <tr>
      <td><code>@Root()</code> and <code>@Parent()</code></td>
      <td><code>root</code>/<code>parent</code></td>
    </tr>
    <tr>
      <td><code>@Context(param?: string)</code></td>
      <td><code>context</code> / <code>context[param]</code></td>
    </tr>
    <tr>
      <td><code>@Info(param?: string)</code></td>
      <td><code>info</code> / <code>info[param]</code></td>
    </tr>
    <tr>
      <td><code>@Args(param?: string)</code></td>
      <td><code>args</code> / <code>args[param]</code></td>
    </tr>
  </tbody>
</table>

These arguments have the following meanings:

- `context`: an object shared by all resolvers in a particular query, and is typically used to contain per-request state.
- `info`: an object that contains information about the execution state of the query.
- `args`: an object with the arguments passed into the field in the query.
- `root`: an object that contains the result returned from the resolver on the parent field, or, in the case of a top-level `Query` field, the `rootValue` passed from the server configuration.

<app-banner-shop></app-banner-shop>

#### Module

Once we're done here, we have to provide the `AuthorResolver` somewhere. For example, we can do this in the newly created `AuthorsModule`.

```typescript
@Module({
  imports: [PostsModule],
  providers: [AuthorsService, AuthorResolver],
})
export class AuthorsModule {}
```

The `GraphQLModule` will take care of reflecting the metadata and transforming classes into the correct resolvers map automatically. The only thing you need to be aware of is that you need to import this module somewhere, so Nest will be able to utilize `AuthorsModule`.

> info **Hint** Learn more about GraphQL queries [here](http://graphql.org/learn/queries/).
