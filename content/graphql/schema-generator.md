### Generating SDL

> warning **Warning** This chapter applies only to the code first approach.

To generate a GraphQL SDL schema manually (i.e., without running an application, connecting to the database, hooking up resolvers, etc.), use the `GraphQLSchemaBuilderModule`:

```typescript
async function generateSchema() {
  const app = await NestFactory.create(GraphQLSchemaBuilderModule);
  await app.init();

  const gqlSchemaFactory = app.get(GraphQLSchemaFactory);
  const schema = await gqlSchemaFactory.create([RecipesResolver]);
  console.log(printSchema(schema));
}
```

> info **Hint** The `GraphQLSchemaBuilderModule` and `GraphQLSchemaFactory` are imported from the `@nestjs/graphql` package. The `printSchema` function is imported from the `graphql` package.

#### Usage

The `gqlSchemaFactory.create()` method takes an array of resolver class references. For example:

```typescript
const schema = await gqlSchemaFactory.create([
  RecipesResolver,
  AuthorsResolver,
  PostsResolver,
]);
```

It also takes an optional second argument with an array of scalar classes:

```typescript
const schema = await gqlSchemaFactory.create(
  [RecipesResolver, AuthorsResolver, PostsResolver],
  [DurationScalar, DateScalar],
);
```

Lastly, you can pass an options object (the same `BuildSchemaOptions` accepted by the `buildSchemaOptions` property of the `GraphQLModule` configuration):

```typescript
const schema = await gqlSchemaFactory.create([RecipesResolver], {
  skipCheck: true,
  orphanedTypes: [],
});
```

- `skipCheck`: skip schema validation; boolean, defaults to `false`
- `orphanedTypes`: an array of classes to generate even though they aren't explicitly referenced (i.e., aren't part of the object graph). Normally, a class that is declared but not referenced anywhere in the graph is omitted.
