### Resolvers

Typically, you have to create a resolvers map manually. The `@nestjs/graphql` package, on the other hand, generate resolvers map automatically using the metadata provided by the decorators. In order to learn the library basics, we'll create a simple authors API. Firstly, let's define our types in SDL (read [more](http://graphql.org/learn/schema/#type-language)):

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
```

Our GraphQL schema contains single query exposed, the `author(id: Int!): Author`. Now, let's create an `AuthorResolver`.

```typescript
@Resolver('Author')
export class AuthorResolver {
  constructor(
    private readonly authorsService: AuthorsService,
    private readonly postsService: PostsService,
  ) {}

  @Query()
  async author(@Args('id') id: number) {
    return await this.authorsService.findOneById(id);
  }

  @ResolveProperty()
  async posts(@Parent() author) {
    const { id } = author;
    return await this.postsService.findAll({ authorId: id });
  }
}
```

> info **Hint** If you use the `@Resolver()` decorator, you don't have to mark a class as an `@Injectable()`, otherwise, it's necessary.

The `@Resolver()` decorator does not affect queries and mutations (neither `@Query()` nor `@Mutation()` decorators). It only informs Nest that each `@ResolveProperty()` inside this particular class has a parent, which is an `Author` type in this case (`Author.posts` relation).

Conventionally, we would use something like `getAuthor()` or `getPosts()` as method names. We can do that easily as well by moving the real names between decorator's parentheses.

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

  @ResolveProperty('posts')
  async getPosts(@Parent() author) {
    const { id } = author;
    return await this.postsService.findAll({ authorId: id });
  }
}
```

> info **Hint** The `@Resolver()` decorator can be used at the method-level as well.

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

#### Module

Once we're done here, we have to register the `AuthorResolver` somewhere, for example inside the newly created `AuthorsModule`.

```typescript
@Module({
  imports: [PostsModule],
  providers: [AuthorsService, AuthorResolver],
})
export class AuthorsModule {}
```

The `GraphQLModule` will take care of reflecting the metadata and transforming class into the correct resolvers map automatically. The only thing that you should be aware of is that you need to import this module somewhere, therefore Nest will know that `AuthorsModule` truly exists.

> info **Hint** Learn more about GraphQL queries [here](http://graphql.org/learn/queries/).

#### Typings

Separate creation of both GraphQL types and corresponding TypeScript definitions creates unnecessary redundancy. Eventually, we end up without a single source of truth and each change made within SDL forces us to adjust interfaces as well. Thus, the `@nestjs/graphql` package serves another interesting functionality, which is the automatic generation of TS definitions using abstract syntax tree (AST). In order to enable it, simply customize `definitions` property.

```typescript
GraphQLModule.forRoot({
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
  },
}),
```

The `src/graphql.ts` indicates where to save TypeScript output. By default, all types are transformed to the interfaces. However, you can switch to classes instead by changing `outputAs` property to `class`.

```typescript
GraphQLModule.forRoot({
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
    outputAs: 'class',
  },
}),
```

Consequently, it will generate the following file:

```typescript
export class Author {
  id: number;
  firstName?: string;
  lastName?: string;
  posts?: Post[];
}

export class Post {
  id: number;
  title?: string;
  votes?: number;
}

export abstract class IQuery {
  abstract author(id: number): Author | Promise<Author>;
}
```

Classes allow you using **decorators** which makes them extremely useful in terms of the validation purposes (read [more](/techniques/validation)). For example:

```typescript
import { MinLength, MaxLength } from 'class-validator';

export class CreatePostInput {
  @MinLength(3)
  @MaxLength(50)
  title: string;
}
```

> warning **Notice** To enable auto-validation of your inputs (and parameters), you have to use `ValidationPipe`. Read more about validation [here](/techniques/validation) or more specifically about pipes [here](/pipes).
