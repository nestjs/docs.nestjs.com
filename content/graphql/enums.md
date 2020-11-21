### Enums

Enumeration types are a special kind of scalar that is restricted to a particular set of allowed values (read more [here](https://graphql.org/learn/schema/#enumeration-types)). This allows you to:

- validate that any arguments of this type are one of the allowed values
- communicate through the type system that a field will always be one of a finite set of values

#### Code first

When using the code first approach, you define a GraphQL enum type by simply creating a TypeScript enum.

```typescript
export enum AllowedColor {
  RED,
  GREEN,
  BLUE,
}
```

With this in place, register the `AllowedColor` enum using the `registerEnumType` function exported from the `@nestjs/graphql` package:

```typescript
registerEnumType(AllowedColor, {
  name: 'AllowedColor',
});
```

Now you can reference the `AllowedColor` in our types:

```typescript
@Field(type => AllowedColor)
favoriteColor: AllowedColor;
```

This will result in generating the following part of the GraphQL schema in SDL:

```graphql
enum AllowedColor {
  RED
  GREEN
  BLUE
}
```

To provide a description for the enum, pass the `description` property into the `registerEnumType()` function.

```typescript
registerEnumType(AllowedColor, {
  name: 'AllowedColor',
  description: 'The supported colors.',
});
```

To provide a description for the enum values, or to mark a value as deprecated, pass the `valuesMap` property, as follows:

```typescript
registerEnumType(AllowedColor, {
  name: 'AllowedColor',
  description: 'The supported colors.',
  valuesMap: {
    RED: {
      description: 'The default color.',
    },
    BLUE: {
      deprecationReason: 'Too blue.',
    }
  }
});
```

This will generate the following GraphQL schema in SDL:

```graphql
"""The supported colors."""
enum AllowedColor {
  """The default color."""
  RED
  GREEN
  BLUE @deprecated(reason: "Too blue.")
}
```

#### Schema first

To define an enumerator in the schema first approach, simply create a GraphQL enum with SDL.

```graphql
enum AllowedColor {
  RED
  GREEN
  BLUE
}
```

Then you can use the typings generation feature (as shown in the [quick start](/graphql/quick-start) chapter) to generate corresponding TypeScript definitions:

```typescript
export enum AllowedColor {
  RED
  GREEN
  BLUE
}
```

Sometimes a backend forces a different value for an enum internally than in the public API. In this example the API contains `RED`, however in resolvers we may use `#f00` instead (read more [here](https://www.apollographql.com/docs/apollo-server/schema/scalars-enums/#internal-values)). To accomplish this, declare a resolver object for the `AllowedColor` enum:

```typescript
export const allowedColorResolver: Record<keyof typeof AllowedColor, any> = {
  RED: '#f00',
}
```

> info **Hint** All decorators are exported from the `@nestjs/graphql` package.

Then use this resolver object together with the `resolvers` property of the `GraphQLModule#forRoot()` method, as follows:

```typescript
GraphQLModule.forRoot({
  resolvers: {
    AllowedColor: allowedColorResolver,
  },
})
```
