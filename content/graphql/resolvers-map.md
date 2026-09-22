### Resolvers

Resolvers provide the instructions for turning a [GraphQL](https://graphql.org/) operation (a query, mutation, or subscription) into data. They return data in the shape specified in the schema, either synchronously or as a promise that resolves to a result of that shape. Typically, you create a **resolver map** manually. The `@nestjs/graphql` package, on the other hand, generates the resolver map automatically from the metadata provided by the decorators you use to annotate classes. To demonstrate how to create a GraphQL API with the package, we'll build a simple authors API.

#### Code first

In the code first approach, you don't write the GraphQL schema in SDL by hand. Instead, you use TypeScript decorators to generate the SDL from TypeScript class definitions. The `@nestjs/graphql` package reads the metadata defined through the decorators and generates the schema for you.

#### Object types

Most of the definitions in a GraphQL schema are **object types**. Each object type you define should represent a domain object that an application client might need to interact with. For example, our sample API needs to fetch a list of authors and their posts, so we define an `Author` type and a `Post` type.

With the schema first approach, you would define the `Author` type in SDL like this:

```graphql
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post!]!
}
```

With the code first approach, you define the schema with TypeScript classes and annotate their fields with TypeScript decorators. The equivalent of the above SDL in the code first approach is:

```typescript
@@filename(authors/models/author.model)
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Post } from '../../posts/models/post.model.js';

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

> info **Hint** TypeScript's metadata reflection system has several limitations. For instance, it can't determine which properties a class consists of, or whether a given property is optional or required. Because of these limitations, you must either use the `@Field()` decorator in your schema definition classes to provide metadata about each field's GraphQL type and optionality, or use the [CLI plugin](/graphql/cli-plugin) to generate this metadata for you.

The `Author` object type, like any class, is made of a collection of fields, each declaring a type. A field's type corresponds to a [GraphQL type](https://graphql.org/learn/schema/), which can be either another object type or a scalar type. A GraphQL scalar type is a primitive (like `ID`, `String`, `Boolean`, or `Int`) that resolves to a single value.

> info **Hint** In addition to GraphQL's built-in scalar types, you can define [custom scalar types](/graphql/scalars).

The `Author` object type definition above causes Nest to **generate** the SDL shown earlier:

```graphql
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post!]!
}
```

The `@Field()` decorator accepts an optional type function (e.g., `type => Int`), and optionally an options object.

The type function is required when the mapping between the TypeScript type system and the GraphQL type system is ambiguous. Specifically, it is **not** required for `string` and `boolean` types, but it **is** required for `number`, which can map to either a GraphQL `Int` or `Float` (without a type function, `number` maps to `Float` by default). The type function returns the desired GraphQL type, as shown in the examples throughout these chapters.

The options object can have any of the following key/value pairs:

- `nullable`: whether the field is nullable (in `@nestjs/graphql`, each field is non-nullable by default); `boolean`
- `description`: the field description; `string`
- `deprecationReason`: marks the field as deprecated; `string`

For example:

```typescript
@Field({ description: `Book title`, deprecationReason: 'Not useful in v2 schema' })
title: string;
```

> info **Hint** You can also add a description to, or deprecate, the whole object type: `@ObjectType({{ '{' }} description: 'Author model' {{ '}' }})`. Likewise, if your application serves [multiple GraphQL endpoints](/graphql/quick-start#multiple-endpoints), you can scope a type to a specific module: `@ObjectType({{ '{' }} registerIn: () => AuthorsModule {{ '}' }})`.

When the field is an array, you must indicate the array type in the `@Field()` decorator's type function, as shown below:

```typescript
@Field(type => [Post])
posts: Post[];
```

> info **Hint** Array bracket notation (`[ ]`) indicates the depth of the array. For example, `[[Int]]` represents an integer matrix.

To declare that an array's items (not the array itself) are nullable, set the `nullable` property to `'items'` as shown below:

```typescript
@Field(type => [Post], { nullable: 'items' })
posts: Post[];
```

> info **Hint** If both the array and its items are nullable, set `nullable` to `'itemsAndList'` instead.

With the `Author` object type in place, let's define the `Post` object type.

```typescript
@@filename(posts/models/post.model)
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

The `Post` object type generates the following part of the GraphQL schema in SDL:

```graphql
type Post {
  id: Int!
  title: String!
  votes: Int
}
```

#### Code first resolver

At this point, we've defined the objects (type definitions) that can exist in our data graph, but clients don't yet have a way to interact with them. To address that, we need a resolver class. In the code first approach, a resolver class both defines resolver functions **and** generates the **Query type**. The example below shows how:

```typescript
@@filename(authors/authors.resolver)
@Resolver(() => Author)
export class AuthorsResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query(() => Author)
  async author(@Args('id', { type: () => Int }) id: number) {
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

You can define multiple resolver classes, and Nest combines them at run time. See the [Module](/graphql/resolvers#module) section below for more on code organization.

> warning **Note** The logic inside the `AuthorsService` and `PostsService` classes can be as simple or sophisticated as needed. The point of this example is to show how to construct resolvers and how they interact with other providers.

The `AuthorsResolver` above defines one query resolver function and one field resolver function. To create a resolver, create a class with resolver functions as methods, and annotate the class with the `@Resolver()` decorator.

The `author()` method is a query handler that returns the author object for the `id` sent in the request. To mark a method as a query handler, use the `@Query()` decorator.

The argument passed to the `@Resolver()` decorator is optional, but it comes into play once your graph becomes non-trivial: it supplies the parent object used by field resolver functions as they traverse down an object graph.

Because this class includes a **field resolver** function (for the `posts` property of the `Author` object type), you **must** pass the `@Resolver()` decorator a value that indicates the parent type (i.e., the corresponding `ObjectType` class) for all field resolvers defined within the class. A field resolver needs access to the parent object (the object that the field being resolved belongs to). Here, the field resolver populates an author's `posts` array by calling a service with the author's `id`, which is why the parent object must be identified in the `@Resolver()` decorator. The `@Parent()` method parameter decorator then extracts a reference to that parent object in the field resolver.

You can define multiple `@Query()` resolver functions (both within this class and in other resolver classes). They are aggregated into a single **Query type** definition in the generated SDL, along with the corresponding entries in the resolver map. This lets you define queries close to the models and services they use, and keep them well organized in modules.

> info **Hint** The Nest CLI provides a generator (schematic) that generates **all the boilerplate code** for you. See the [CRUD generator](/recipes/crud-generator) recipe for details.

#### Query type names

In the examples above, the `@Query()` decorator derives the GraphQL query name from the method name. For example, consider the following construction from the example above:

```typescript
@Query(() => Author)
async author(@Args('id', { type: () => Int }) id: number) {
  return this.authorsService.findOneById(id);
}
```

This generates the following entry for the author query in the schema (the query uses the same name as the method):

```graphql
type Query {
  author(id: Int!): Author!
}
```

> info **Hint** Learn more about [GraphQL queries](https://graphql.org/learn/queries/).

Conventionally, these names are decoupled. For example, you might name the query handler method `getAuthor()` but still expose the query as `author`. The same applies to field resolvers. To do this, pass the mapping names as arguments to the `@Query()` and `@ResolveField()` decorators, as shown below:

```typescript
@@filename(authors/authors.resolver)
@Resolver(() => Author)
export class AuthorsResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query(() => Author, { name: 'author' })
  async getAuthor(@Args('id', { type: () => Int }) id: number) {
    return this.authorsService.findOneById(id);
  }

  @ResolveField('posts', () => [Post])
  async getPosts(@Parent() author: Author) {
    const { id } = author;
    return this.postsService.findAll({ authorId: id });
  }
}
```

The `getAuthor()` handler method above generates the following part of the GraphQL schema in SDL:

```graphql
type Query {
  author(id: Int!): Author!
}
```

#### Query decorator options

The `@Query()` decorator's options object (where we pass `{{ '{' }}name: 'author'{{ '}' }}` above) accepts a number of key/value pairs:

- `name`: name of the query; a `string`
- `description`: a description used to generate GraphQL schema documentation (e.g., in GraphiQL); a `string`
- `deprecationReason`: marks the query as deprecated in the schema metadata (e.g., shown in GraphiQL); a `string`
- `nullable`: whether the query can return a null data response; `boolean`, `'items'`, or `'itemsAndList'` (see above for details of `'items'` and `'itemsAndList'`)

#### Args decorator options

Use the `@Args()` decorator to extract arguments from a request for use in the handler method. This works much like [REST route parameter extraction](/controllers#route-parameters).

Usually, the `@Args()` decorator doesn't need an options object. For example, if an identifier is a string, the following construction is sufficient: it plucks the named field from the inbound GraphQL request for use as a method argument.

```typescript
@Args('id') id: string
```

The `getAuthor()` method uses the `number` type, which presents a challenge: the TypeScript `number` type doesn't carry enough information about the expected GraphQL representation (e.g., `Int` vs. `Float`). You therefore have to pass the type reference **explicitly**, in an options object passed as the second argument to the `@Args()` decorator:

```typescript
@Query(() => Author, { name: 'author' })
async getAuthor(@Args('id', { type: () => Int }) id: number) {
  return this.authorsService.findOneById(id);
}
```

The options object accepts the following optional key/value pairs:

- `type`: a function returning the GraphQL type
- `defaultValue`: a default value; `any`
- `description`: description metadata; `string`
- `deprecationReason`: to deprecate a field and provide metadata describing why; `string`
- `nullable`: whether the field is nullable

Query handler methods can take multiple arguments. For example, to fetch an author by `firstName` and `lastName`, call `@Args()` twice:

```typescript
getAuthor(
  @Args('firstName', { nullable: true }) firstName?: string,
  @Args('lastName', { defaultValue: '' }) lastName?: string,
) {}
```

> info **Hint** For a GraphQL nullable field like `firstName`, you don't need to add `null` or `undefined` to the field's TypeScript type. Be aware, however, that a nullable field lets these values through to your resolver, so you need to guard against them there.

#### Dedicated arguments class

With inline `@Args()` calls, code like the example above quickly becomes bloated. Instead, you can create a dedicated `GetAuthorArgs` arguments class and access it in the handler method as follows:

```typescript
@Args() args: GetAuthorArgs
```

Create the `GetAuthorArgs` class using `@ArgsType()` as shown below:

```typescript
@@filename(authors/dto/get-author.args)
import { MinLength } from 'class-validator';
import { Field, ArgsType } from '@nestjs/graphql';

@ArgsType()
export class GetAuthorArgs {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ defaultValue: '' })
  @MinLength(3)
  lastName: string;
}
```

> info **Hint** Again, due to the limitations of TypeScript's metadata reflection system, you must either use the `@Field()` decorator to indicate type and optionality, or use the [CLI plugin](/graphql/cli-plugin). As before, you don't need to add `null` or `undefined` to the type of the nullable `firstName` field, but you do need to guard against these values in your resolvers.

This generates the following part of the GraphQL schema in SDL:

```graphql
type Query {
  author(firstName: String, lastName: String! = ""): Author!
}
```

> info **Hint** Argument classes like `GetAuthorArgs` work well with the `ValidationPipe` (see [Validation](/application/validation)).

#### Class inheritance

You can use standard TypeScript class inheritance to create extensible base classes with generic utility features (fields and field properties, validations, etc.). For example, you may have a set of pagination-related arguments that always include the standard `offset` and `limit` fields, plus other type-specific index fields. You can set up a class hierarchy as shown below.

Base `@ArgsType()` class:

```typescript
@ArgsType()
class PaginationArgs {
  @Field(() => Int)
  offset: number = 0;

  @Field(() => Int)
  limit: number = 10;
}
```

Type-specific subclass of the base `@ArgsType()` class:

```typescript
@ArgsType()
class GetAuthorArgs extends PaginationArgs {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ defaultValue: '' })
  @MinLength(3)
  lastName: string;
}
```

The same approach can be taken with `@ObjectType()` objects. Define generic properties on the base class:

```typescript
@ObjectType()
class Character {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;
}
```

Add type-specific properties on subclasses:

```typescript
@ObjectType()
class Warrior extends Character {
  @Field()
  level: number;
}
```

You can use inheritance with resolvers as well, and combine it with TypeScript generics to keep type safety. For example, to create a base class with a generic `findAll` query, use a construction like this:

```typescript
function BaseResolver<T extends Type<unknown>>(classRef: T): any {
  @Resolver({ isAbstract: true })
  abstract class BaseResolverHost {
    @Query(() => [classRef], { name: `findAll${classRef.name}` })
    async findAll(): Promise<T[]> {
      return [];
    }
  }
  return BaseResolverHost;
}
```

Note the following:

- An explicit return type (`any` above) is required; otherwise, TypeScript complains about the usage of a private class definition. We recommend defining an interface instead of using `any`.
- `Type` is imported from the `@nestjs/common` package.
- The `isAbstract: true` property indicates that SDL (Schema Definition Language statements) shouldn't be generated for this class. You can set this property on other types as well to suppress SDL generation.

Here's how you could create a concrete subclass of `BaseResolver`:

```typescript
@Resolver(() => Recipe)
export class RecipesResolver extends BaseResolver(Recipe) {
  constructor(private recipesService: RecipesService) {
    super();
  }
}
```

This construct would generate the following SDL:

```graphql
type Query {
  findAllRecipe: [Recipe!]!
}
```

#### Generics

We saw one use of generics above. Generics let you build reusable abstractions. For example, here's a cursor-based pagination implementation based on the [GraphQL pagination guide](https://graphql.org/learn/pagination/#pagination-and-edges):

```typescript
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

interface IEdgeType<T> {
  cursor: string;
  node: T;
}

export interface IPaginatedType<T> {
  edges: IEdgeType<T>[];
  nodes: T[];
  totalCount: number;
  hasNextPage: boolean;
}

export function Paginated<T>(classRef: Type<T>): Type<IPaginatedType<T>> {
  @ObjectType(`${classRef.name}Edge`)
  abstract class EdgeType {
    @Field(() => String)
    cursor: string;

    @Field(() => classRef)
    node: T;
  }

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements IPaginatedType<T> {
    @Field(() => [EdgeType], { nullable: true })
    edges: EdgeType[];

    @Field(() => [classRef], { nullable: true })
    nodes: T[];

    @Field(() => Int)
    totalCount: number;

    @Field()
    hasNextPage: boolean;
  }
  return PaginatedType as Type<IPaginatedType<T>>;
}
```

With this base class defined, you can create specialized types that inherit its behavior. For example:

```typescript
@ObjectType()
class PaginatedAuthor extends Paginated(Author) {}
```

#### Schema first

As mentioned in the [Quick start](/graphql/quick-start) chapter, in the schema first approach you start by manually defining schema types in SDL (see the [GraphQL type language](https://graphql.org/learn/schema/#type-language)). Consider the following SDL type definitions.

> info **Hint** For convenience, this chapter keeps all of the SDL in one location (e.g., one `.graphql` file, as shown below). In practice, you may prefer a modular organization. For example, you can create individual SDL files with the type definitions for each domain entity, and keep them with the related services, resolver code, and Nest module class in a dedicated directory for that entity. Nest aggregates all the individual schema type definitions at run time.

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

#### Schema first resolver

The schema above exposes a single query: `author(id: Int!): Author`.

> info **Hint** Learn more about [GraphQL queries](https://graphql.org/learn/queries/).

Now create an `AuthorsResolver` class that resolves author queries:

```typescript
@@filename(authors/authors.resolver)
@Resolver('Author')
export class AuthorsResolver {
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

> warning **Note** The logic inside the `AuthorsService` and `PostsService` classes can be as simple or sophisticated as needed. The point of this example is to show how to construct resolvers and how they interact with other providers.

The `@Resolver()` decorator is required. It takes an optional string argument with the name of a type. This name is required whenever the class includes `@ResolveField()` decorators, to tell Nest which parent type the decorated methods are associated with (the `Author` type in this example). Alternatively, instead of applying `@Resolver()` to the class, you can apply it to each method:

```typescript
@Resolver('Author')
@ResolveField()
async posts(@Parent() author) {
  const { id } = author;
  return this.postsService.findAll({ authorId: id });
}
```

In this case (`@Resolver()` at the method level), if a class has multiple `@ResolveField()` methods, you must add `@Resolver()` to each of them. This is not considered best practice, as it adds overhead.

> info **Hint** Any class name argument passed to `@Resolver()` **does not** affect queries (`@Query()` decorator) or mutations (`@Mutation()` decorator).

> warning **Warning** Using the `@Resolver` decorator at the method level is not supported with the **code first** approach.

In the examples above, the `@Query()` and `@ResolveField()` decorators are associated with GraphQL schema fields based on the method name. For example, consider the following construction from the example above:

```typescript
@Query()
async author(@Args('id') id: number) {
  return this.authorsService.findOneById(id);
}
```

This generates the following entry for the author query in the schema (the query uses the same name as the method):

```graphql
type Query {
  author(id: Int!): Author
}
```

Conventionally, these names are decoupled, using names like `getAuthor()` or `getPosts()` for the resolver methods. To do this, pass the mapping name as an argument to the decorator, as shown below:

```typescript
@@filename(authors/authors.resolver)
@Resolver('Author')
export class AuthorsResolver {
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

> info **Hint** The Nest CLI provides a generator (schematic) that generates **all the boilerplate code** for you. See the [CRUD generator](/recipes/crud-generator) recipe for details.

#### Generating types

If you use the schema first approach and have enabled typings generation (with `outputAs: 'class'`, as shown in the [Quick start](/graphql/quick-start) chapter), running the application generates the following file in the location you specified in the `GraphQLModule.forRoot()` method, e.g., `src/graphql.ts`:

```typescript
@@filename(graphql)
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

Generating classes (instead of the default interfaces) lets you combine declarative validation **decorators** with the schema first approach (see [Validation](/application/validation)). For example, you could add `class-validator` decorators to a generated `CreatePostInput` class, as shown below, to enforce minimum and maximum string lengths on the `title` field:

```typescript
import { MinLength, MaxLength } from 'class-validator';

export class CreatePostInput {
  @MinLength(3)
  @MaxLength(50)
  title: string;
}
```

> warning **Notice** To enable automatic validation of your inputs (and parameters), use `ValidationPipe`. Learn more in the [Validation](/application/validation) and [Pipes](/pipes) chapters.

However, decorators added directly to the generated file are **overwritten** each time the file is regenerated. Instead, create a separate file and extend the generated class.

```typescript
import { MinLength, MaxLength } from 'class-validator';
import { Post } from '../../graphql.js';

export class CreatePostInput extends Post {
  @MinLength(3)
  @MaxLength(50)
  title: string;
}
```

#### GraphQL argument decorators

You can access the standard GraphQL resolver arguments with dedicated decorators. The table below maps the Nest decorators to the plain Apollo parameters they represent.

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

- `root`: an object that contains the result returned from the resolver on the parent field, or, in the case of a top-level `Query` field, the `rootValue` passed from the server configuration.
- `context`: an object shared by all resolvers in a particular query; typically used to contain per-request state.
- `info`: an object that contains information about the execution state of the query.
- `args`: an object with the arguments passed into the field in the query.

<app-banner-devtools></app-banner-devtools>

#### Module

With the steps above, we have declaratively specified all the information the `GraphQLModule` needs to generate a resolver map. The `GraphQLModule` uses reflection to introspect the metadata provided via the decorators, and transforms the classes into the correct resolver map automatically.

The only other thing you need to do is **provide** the resolver class (`AuthorsResolver`), i.e., list it as a provider in a module, and import that module (`AuthorsModule`) somewhere so Nest can use it.

For example, you can do this in an `AuthorsModule`, which can also provide other services needed in this context. Be sure to import `AuthorsModule` somewhere (e.g., in the root module, or in another module imported by the root module).

```typescript
@@filename(authors/authors.module)
@Module({
  imports: [PostsModule],
  providers: [AuthorsService, AuthorsResolver],
})
export class AuthorsModule {}
```

> info **Hint** It helps to organize your code by **domain model** (similar to the way you would organize entry points in a REST API). In this approach, keep your models (`ObjectType` classes), resolvers, and services together within a Nest module representing the domain model, in a single folder per module. When you do this and use the [Nest CLI](/cli/overview) to generate each element, the CLI wires these parts together for you (placing files in the appropriate folders, adding entries to the `providers` and `imports` arrays, etc.).
