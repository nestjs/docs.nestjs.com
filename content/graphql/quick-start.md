## Harnessing the power of TypeScript & GraphQL

[GraphQL](https://graphql.org/) is a powerful query language for APIs and a runtime for fulfilling those queries with your existing data. It's an elegant approach that solves many problems typically found with REST APIs. For background, we suggest reading this [comparison](https://www.apollographql.com/blog/graphql-vs-rest) between GraphQL and REST. GraphQL combined with [TypeScript](https://www.typescriptlang.org/) helps you develop better type safety with your GraphQL queries, giving you end-to-end typing.

In this chapter, we assume a basic understanding of GraphQL, and focus on how to work with the built-in `@nestjs/graphql` module. The `GraphQLModule` can be configured to use [Apollo](https://www.apollographql.com/) server (with the `@nestjs/apollo` driver) and [Mercurius](https://github.com/mercurius-js/mercurius) (with the `@nestjs/mercurius`). We provide official integrations for these proven GraphQL packages to provide a simple way to use GraphQL with Nest (see more integrations [here](https://docs.nestjs.com/graphql/quick-start#third-party-integrations)).

You can also build your own dedicated driver (read more on that [here](/graphql/other-features#creating-a-custom-driver)).

#### Installation

Start by installing the required packages:

```bash
# For Express and Apollo (default)
$ npm i @nestjs/graphql @nestjs/apollo @apollo/server @as-integrations/express5 graphql

# For Fastify and Apollo
# npm i @nestjs/graphql @nestjs/apollo @apollo/server @as-integrations/fastify graphql

# For Fastify and Mercurius
# npm i @nestjs/graphql @nestjs/mercurius graphql mercurius
```

> warning **Warning** `@nestjs/graphql@>=9` and `@nestjs/apollo^10` packages are compatible with **Apollo v3** (check out Apollo Server 3 [migration guide](https://www.apollographql.com/docs/apollo-server/migration/) for more details), while `@nestjs/graphql@^8` only supports **Apollo v2** (e.g., `apollo-server-express@2.x.x` package).

#### Overview

Nest offers two ways of building GraphQL applications, the **code first** and the **schema first** methods. You should choose the one that works best for you. Most of the chapters in this GraphQL section are divided into two main parts: one you should follow if you adopt **code first**, and the other to be used if you adopt **schema first**.

In the **code first** approach, you use decorators and TypeScript classes to generate the corresponding GraphQL schema. This approach is useful if you prefer to work exclusively with TypeScript and avoid context switching between language syntaxes.

In the **schema first** approach, the source of truth is GraphQL SDL (Schema Definition Language) files. SDL is a language-agnostic way to share schema files between different platforms. Nest automatically generates your TypeScript definitions (using either classes or interfaces) based on the GraphQL schemas to reduce the need to write redundant boilerplate code.

<app-banner-courses-graphql-cf></app-banner-courses-graphql-cf>

#### Getting started with GraphQL & TypeScript

> info **Hint** In the following chapters, we'll be integrating the `@nestjs/apollo` package. If you want to use `mercurius` package instead, navigate to [this section](/graphql/quick-start#mercurius-integration).

Once the packages are installed, we can import the `GraphQLModule` and configure it with the `forRoot()` static method.

```typescript
@@filename()
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
    }),
  ],
})
export class AppModule {}
```

> info **Hint** For `mercurius` integration, you should be using the `MercuriusDriver` and `MercuriusDriverConfig` instead. Both are exported from the `@nestjs/mercurius` package.

The `forRoot()` method takes an options object as an argument. These options are passed through to the underlying driver instance (read more about available settings here: [Apollo](https://www.apollographql.com/docs/apollo-server/api/apollo-server) and [Mercurius](https://github.com/mercurius-js/mercurius/blob/master/docs/api/options.md#plugin-options)). For example, if you want to disable the GraphQL IDE, pass the following options:

```typescript
@@filename()
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      graphiql: false,
    }),
  ],
})
export class AppModule {}
```

> warning **Warning** The `graphql-playground` IDE has been removed in `@nestjs/graphql` v14. The `playground` option still exists as a **deprecated boolean alias for GraphiQL** - `playground: false` disables the landing page and `playground: true` enables GraphiQL - but new code should use `graphiql` instead.

In this case, these options will be forwarded to the `ApolloServer` constructor.

#### Accessing the request and response objects

One driver option worth calling out is `context`, a factory that builds the GraphQL execution context for each request. Use it to expose the underlying request and response objects to your resolvers:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  context: ({ req, res }) => ({ req, res }),
}),
```

With this in place, you can read them in a resolver through the `@Context()` decorator:

```typescript
@Query(() => String)
userAgent(@Context('req') req: Request): string {
  return req.headers['user-agent'] ?? '';
}
```

> info **Hint** Guards, interceptors, and other enhancers running in the GraphQL context can reach the same object via `GqlExecutionContext.create(context).getContext()` (see [Other features](/graphql/guards-interceptors)).

#### GraphQL IDE

[GraphiQL](https://github.com/graphql/graphiql) is the default graphical, interactive, in-browser GraphQL IDE served on the same URL as the GraphQL server itself. To access it, you need a basic GraphQL server configured and running. To see it now, you can install and build the [working example here](https://github.com/nestjs/nest/tree/master/sample/23-graphql-code-first). Alternatively, if you're following along with these code samples, once you've completed the steps in the [Resolvers chapter](/graphql/resolvers-map), you can access GraphiQL.

With that in place, and with your application running in the background, you can then open your web browser and navigate to `http://localhost:3000/graphql` (host and port may vary depending on your configuration). You will then see GraphiQL, as shown below.

<figure>
  <img src="/assets/playground.png" alt="" />
</figure>

> info **Note** `@nestjs/mercurius` integration uses [GraphiQL](https://github.com/graphql/graphiql) as well.

##### Enabling and disabling GraphiQL

As of `@nestjs/graphql` v14, GraphiQL is **the** GraphQL IDE - the older `graphql-playground` has been removed entirely. GraphiQL is enabled automatically whenever `NODE_ENV` is not `production`, so in development you get it without configuring anything, and in production the landing page is off by default.

To control it explicitly, use the `graphiql` option:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  graphiql: true, // force it on, including in production
}),
```

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  graphiql: false, // disable the landing page entirely
}),
```

> warning **Warning** The `playground` option still exists, but only as a **deprecated boolean alias** for `graphiql`. If both are set, `graphiql` wins. Migrate `playground: false` to `graphiql: false` and `playground: true` to `graphiql: true`.

##### Configuring GraphiQL

Pass an object instead of a boolean to enable GraphiQL and configure it at the same time:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  graphiql: {
    url: '/graphql',
    headers: {
      authorization: 'Bearer <token>',
    },
    shouldPersistHeaders: true,
    isHeadersEditorEnabled: true,
    inputValueDeprecation: false,
  },
}),
```

The available options are:

<table>
  <tr>
    <td><code>url</code></td>
    <td>Endpoint the IDE sends operations to. Defaults to the driver's <code>path</code> option, so you only need to set this when the IDE should target a different URL than the one it is served from.</td>
  </tr>
  <tr>
    <td><code>headers</code></td>
    <td>Headers applied to every request. Useful for preconfiguring an <code>authorization</code> header during development. If the headers editor is enabled and the user sets the same header, their value takes precedence.</td>
  </tr>
  <tr>
    <td><code>shouldPersistHeaders</code></td>
    <td>Whether the contents of the headers editor are persisted in browser storage. Default: <code>true</code>.</td>
  </tr>
  <tr>
    <td><code>isHeadersEditorEnabled</code></td>
    <td>Whether the headers editor is shown inside the editor tools. Set to <code>false</code> to prevent users from editing headers. Default: <code>true</code>.</td>
  </tr>
  <tr>
    <td><code>inputValueDeprecation</code></td>
    <td>If <code>true</code>, schema documentation includes deprecated input fields and argument values, and introspection returns them. Default: <code>false</code>.</td>
  </tr>
</table>

> info **Hint** Since GraphiQL is on by default outside production, a common setup is to leave it alone in development and set `graphiql: false` only if you need to hide the schema in a non-production environment that is publicly reachable.

##### Subscriptions in the IDE

If your application uses [subscriptions](/graphql/subscriptions), use `graphql-ws`. Support for `subscriptions-transport-ws` has been **removed** - it is no longer accepted as a `subscriptions` key and the package is no longer a dependency:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'graphql-ws': true,
  },
}),
```

With that in place, GraphiQL can execute subscription operations against your server directly.

#### Code first

In the **code first** approach, you use decorators and TypeScript classes to generate the corresponding GraphQL schema.

To use the code first approach, start by adding the `autoSchemaFile` property to the options object:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
}),
```

The `autoSchemaFile` property value is the path where your automatically generated schema will be created. Alternatively, the schema can be generated on-the-fly in memory. To enable this, set the `autoSchemaFile` property to `true`:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
}),
```

By default, the types in the generated schema will be in the order they are defined in the included modules. To sort the schema lexicographically, set the `sortSchema` property to `true`:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
}),
```

#### Example

A fully working code first sample is available [here](https://github.com/nestjs/nest/tree/master/sample/23-graphql-code-first).

#### Schema first

To use the schema first approach, start by adding a `typePaths` property to the options object. The `typePaths` property indicates where the `GraphQLModule` should look for GraphQL SDL schema definition files you'll be writing. These files will be combined in memory; this allows you to split your schemas into several files and locate them near their resolvers.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  typePaths: ['./**/*.graphql'],
}),
```

You will typically also need to have TypeScript definitions (classes and interfaces) that correspond to the GraphQL SDL types. Creating the corresponding TypeScript definitions by hand is redundant and tedious. It leaves us without a single source of truth -- each change made within SDL forces us to adjust TypeScript definitions as well. To address this, the `@nestjs/graphql` package can **automatically generate** TypeScript definitions from the abstract syntax tree ([AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree)). To enable this feature, add the `definitions` options property when configuring the `GraphQLModule`.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
  },
}),
```

The path property of the `definitions` object indicates where to save generated TypeScript output. By default, all generated TypeScript types are created as interfaces. To generate classes instead, specify the `outputAs` property with a value of `'class'`.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
    outputAs: 'class',
  },
}),
```

The above approach dynamically generates TypeScript definitions each time the application starts. Alternatively, it may be preferable to build a simple script to generate these on demand. For example, assume we create the following script as `generate-typings.ts`:

```typescript
import { GraphQLDefinitionsFactory } from '@nestjs/graphql';
import { join } from 'node:path';

const definitionsFactory = new GraphQLDefinitionsFactory();
definitionsFactory.generate({
  typePaths: ['./src/**/*.graphql'],
  path: join(process.cwd(), 'src/graphql.ts'),
  outputAs: 'class',
});
```

Now you can run this script on demand:

```bash
$ ts-node generate-typings
```

> info **Hint** You can compile the script beforehand (e.g., with `tsc`) and use `node` to execute it.

To enable watch mode for the script (to automatically generate typings whenever any `.graphql` file changes), pass the `watch` option to the `generate()` method.

```typescript
definitionsFactory.generate({
  typePaths: ['./src/**/*.graphql'],
  path: join(process.cwd(), 'src/graphql.ts'),
  outputAs: 'class',
  watch: true,
});
```

To automatically generate the additional `__typename` field for every object type, enable the `emitTypenameField` option:

```typescript
definitionsFactory.generate({
  // ...
  emitTypenameField: true,
});
```

To generate resolvers (queries, mutations, subscriptions) as plain fields without arguments, enable the `skipResolverArgs` option:

```typescript
definitionsFactory.generate({
  // ...
  skipResolverArgs: true,
});
```

To generate enums as TypeScript union types instead of regular TypeScript enums, set the `enumsAsTypes` option to `true`:

```typescript
definitionsFactory.generate({
  // ...
  enumsAsTypes: true,
});
```

#### Apollo Sandbox

To use [Apollo Sandbox](https://www.apollographql.com/blog/announcement/platform/apollo-sandbox-an-open-graphql-ide-for-local-development/) instead of GraphiQL as a GraphQL IDE for local development, use the following configuration:

```typescript
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      graphiql: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
  ],
})
export class AppModule {}
```

#### Example

A fully working schema first sample is available [here](https://github.com/nestjs/nest/tree/master/sample/12-graphql-schema-first).

#### Accessing generated schema

In some circumstances (for example end-to-end tests), you may want to get a reference to the generated schema object. In end-to-end tests, you can then run queries using the `graphql` object without using any HTTP listeners.

You can access the generated schema (in either the code first or schema first approach), using the `GraphQLSchemaHost` class:

```typescript
const { schema } = app.get(GraphQLSchemaHost);
```

> info **Hint** You must call the `GraphQLSchemaHost#schema` getter after the application has been initialized (after the `onModuleInit` hook has been triggered by either the `app.listen()` or `app.init()` method).

#### Async configuration

When you need to pass module options asynchronously instead of statically, use the `forRootAsync()` method. As with most dynamic modules, Nest provides several techniques to deal with async configuration.

One technique is to use a factory function:

```typescript
 GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  useFactory: () => ({
    typePaths: ['./**/*.graphql'],
  }),
}),
```

Like other factory providers, our factory function can be <a href="https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory">async</a> and can inject dependencies through `inject`.

```typescript
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    typePaths: configService.get<string>('GRAPHQL_TYPE_PATHS'),
  }),
  inject: [ConfigService],
}),
```

Alternatively, you can configure the `GraphQLModule` using a class instead of a factory, as shown below:

```typescript
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  useClass: GqlConfigService,
}),
```

The construction above instantiates `GqlConfigService` inside `GraphQLModule`, using it to create options object. Note that in this example, the `GqlConfigService` has to implement the `GqlOptionsFactory` interface, as shown below. The `GraphQLModule` will call the `createGqlOptions()` method on the instantiated object of the supplied class.

```typescript
@Injectable()
class GqlConfigService implements GqlOptionsFactory {
  createGqlOptions(): ApolloDriverConfig {
    return {
      typePaths: ['./**/*.graphql'],
    };
  }
}
```

If you want to reuse an existing options provider instead of creating a private copy inside the `GraphQLModule`, use the `useExisting` syntax.

```typescript
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  imports: [ConfigModule],
  useExisting: ConfigService,
}),
```

#### Mercurius integration

Instead of using Apollo, Fastify users (read more [here](/techniques/performance)) can alternatively use the `@nestjs/mercurius` driver.

```typescript
@@filename()
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      graphiql: true,
    }),
  ],
})
export class AppModule {}
```

> info **Hint** Once the application is running, open your browser and navigate to `http://localhost:3000/graphiql`. You should see the [GraphQL IDE](https://github.com/graphql/graphiql).

The `forRoot()` method takes an options object as an argument. These options are passed through to the underlying driver instance. Read more about available settings [here](https://github.com/mercurius-js/mercurius/blob/master/docs/api/options.md#plugin-options).

#### Multiple endpoints

Another useful feature of the `@nestjs/graphql` module is the ability to serve multiple endpoints at once. This lets you decide which modules should be included in which endpoint. By default, `GraphQL` searches for resolvers throughout the whole app. To limit this scan to only a subset of modules, use the `include` property.

```typescript
GraphQLModule.forRoot({
  include: [CatsModule],
}),
```

In the **code first** approach, the `include` option only determines which modules are scanned for resolvers. Types decorated with `@ObjectType()`, `@InputType()`, `@InterfaceType()`, `@ArgsType()`, or registered through `registerEnumType()` / `createUnionType()` still end up in every generated schema. To scope a type to a specific module, use the `registerIn` option:

```typescript
@ObjectType({ registerIn: () => CatsModule })
export class Cat {
  @Field()
  name: string;
}
```

Now, when a schema is built with `include: [CatsModule]`, only types assigned to `CatsModule` become part of it, while types assigned to other modules are left out. Types without `registerIn` keep the default behavior and are available in every schema that references them.

The `registerIn` option is available on `@InputType()`, `@InterfaceType()`, and `@ArgsType()`, as well as `registerEnumType()` and `createUnionType()`:

```typescript
@InputType({ registerIn: () => CatsModule })
export class CreateCatInput {
  @Field()
  name: string;
}

registerEnumType(CatBreed, {
  name: 'CatBreed',
  registerIn: () => CatsModule,
});

export const CatsUnion = createUnionType({
  name: 'CatsUnion',
  types: () => [Lion, Tiger] as const,
  registerIn: () => CatsModule,
});
```

> info **Hint** You can pass either the module class itself or a factory function returning it. Prefer the factory form (`() => CatsModule`) whenever the type and the module reference each other, as it defers the module resolution and so avoids errors caused by circular imports.

> warning **Warning** If you use the `@apollo/server` with `@as-integrations/fastify` package with multiple GraphQL endpoints in a single application, make sure to enable the `disableHealthCheck` setting in the `GraphQLModule` configuration.

#### Third-party integrations

- [GraphQL Yoga](https://github.com/dotansimha/graphql-yoga)

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/33-graphql-mercurius).
