### Field middleware

> warning **Warning** This chapter applies only to the code first approach.

Field middleware lets you run arbitrary code **before or after** a field is resolved. You can use field middleware to convert the result of a field, validate the arguments of a field, or check field-level roles (for example, the roles required to access the field the middleware function runs for).

You can connect multiple middleware functions to a field. In this case, they are called sequentially along a chain, where each middleware decides whether to call the next one. The order of the functions in the `middleware` array matters. The first one is the outermost layer, so it runs first and finishes last (similar to the `graphql-middleware` package). The second one is the next layer in, so it runs second and finishes second to last.

#### Getting started

Let's start by creating a simple middleware that logs a field value before it's sent back to the client:

```typescript
import { FieldMiddleware, MiddlewareContext, NextFn } from '@nestjs/graphql';

const loggerMiddleware: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const value = await next();
  console.log(value);
  return value;
};
```

> info **Hint** `MiddlewareContext` is an object that consists of the same arguments that the GraphQL resolver function normally receives (`{{ '{' }} source, args, context, info {{ '}' }}`), while `NextFn` is a function that executes the next middleware in the stack (bound to this field) or the actual field resolver.

> warning **Warning** Field middleware functions can't inject dependencies or access Nest's DI container. They are designed to be lightweight and shouldn't perform potentially time-consuming operations (like retrieving data from the database). If you need to call external services or query a data source, do it in a guard or interceptor bound to a root query or mutation handler, and assign the result to the `context` object. You can then access it from within the field middleware (through the `MiddlewareContext` object).

Field middleware must match the `FieldMiddleware` interface. In the example above, we first call the `next()` function (which executes the actual field resolver and returns the field value), and then log this value to the terminal. The value returned from the middleware function replaces the field value (if the middleware returns `undefined`, the value from `next()` is used). Since we don't want to change anything, we return the original value.

With this in place, register the middleware directly in the `@Field()` decorator:

```typescript
@ObjectType()
export class Recipe {
  @Field({ middleware: [loggerMiddleware] })
  title: string;
}
```

Now, whenever you request the `title` field of the `Recipe` object type, the field's original value is logged to the console.

> info **Hint** To learn how to implement a field-level permissions system with the [extensions](/graphql/extensions) feature, see [using custom metadata](/graphql/extensions#using-custom-metadata).

> warning **Warning** Field middleware can be applied only to `ObjectType` classes. For more details, see [this GitHub issue](https://github.com/nestjs/graphql/issues/2446).

As mentioned above, you can control the field's value from within the middleware function. For demonstration purposes, let's uppercase a recipe's title (if present):

```typescript
const value = await next();
return value?.toUpperCase();
```

In this case, every title is automatically uppercased when requested.

Likewise, you can bind field middleware to a custom field resolver (a method annotated with the `@ResolveField()` decorator):

```typescript
@ResolveField(() => String, { middleware: [loggerMiddleware] })
title() {
  return 'Placeholder';
}
```

> warning **Warning** If enhancers are enabled at the field resolver level (see [executing enhancers at the field resolver level](/graphql/other-features#execute-enhancers-at-the-field-resolver-level)), field middleware functions run before any interceptors, guards, etc., **bound to the method** (but after the root-level enhancers registered for query or mutation handlers).

#### Global field middleware

In addition to binding middleware directly to a specific field, you can register one or more middleware functions globally. Global middleware is automatically connected to all fields of your object types.

```typescript
GraphQLModule.forRoot({
  autoSchemaFile: 'schema.gql',
  buildSchemaOptions: {
    fieldMiddleware: [loggerMiddleware],
  },
}),
```

> info **Hint** Globally registered field middleware functions run **before** locally registered ones (those bound directly to specific fields).
