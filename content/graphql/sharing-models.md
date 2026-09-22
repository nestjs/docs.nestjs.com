### Sharing models

> warning **Warning** This chapter applies only to the code first approach.

One of the biggest advantages of using TypeScript for the backend of your project is the ability to reuse the same models in a TypeScript-based frontend application through a common TypeScript package.

However, models created with the code first approach are heavily annotated with GraphQL-related decorators. Those decorators are irrelevant in the frontend and hurt its performance.

#### Using the model shim

To solve this issue, Nest provides a "shim" that replaces the original decorators with inert code. The `@nestjs/graphql` package exposes the shim through the `browser` export condition, so bundlers that resolve that condition for browser builds (e.g., webpack with a `web` target) pick it up automatically.

If your bundler doesn't resolve the `browser` condition, configure an alias between the `@nestjs/graphql` package and the shim. For example, with webpack:

```typescript
resolve: { // see: https://webpack.js.org/configuration/resolve/
  alias: {
      "@nestjs/graphql": path.resolve(__dirname, "../node_modules/@nestjs/graphql/dist/extra/graphql-model-shim")
  }
}
```

> info **Hint** The [TypeORM](/data/typeorm) package provides a similar [model shim](https://github.com/typeorm/typeorm/blob/master/extra/typeorm-model-shim.js).
