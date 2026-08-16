### Sharing models

> warning **Warning** This chapter applies only to the code first approach.

One of the biggest advantages of using TypeScript for the backend of your project is the ability to reuse the same models in a TypeScript-based frontend application, by using a common TypeScript package.

But there's a problem: the models created using the code first approach are heavily decorated with GraphQL related decorators. Those decorators are irrelevant in the frontend, negatively impacting performance.

#### Using the model shim

To solve this issue, NestJS provides a shim that replaces the original decorators with inert code in browser and React Native builds. Modern bundlers that honor package export conditions can resolve the shim automatically through the `browser` or `react-native` condition in `@nestjs/graphql`.

If your bundler or custom setup does not use these conditions, configure an alias between the `@nestjs/graphql` package and the shim. For example, with webpack:

```typescript
resolve: {
  alias: {
    '@nestjs/graphql': path.resolve(
      __dirname,
      '../node_modules/@nestjs/graphql/dist/extra/graphql-model-shim',
    ),
  },
},
```

Use the shim only for client-side bundles. Server-side code must keep resolving `@nestjs/graphql` to the normal package so Nest can generate the GraphQL schema at runtime.

> info **Hint** The [TypeORM](/techniques/database) package has a similar shim that can be found [here](https://github.com/typeorm/typeorm/blob/master/extra/typeorm-model-shim.js).
