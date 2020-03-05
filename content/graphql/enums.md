### Enums

Enumeration types are a special kind of scalar that is restricted to a particular set of allowed values (read more [here](https://graphql.org/learn/schema/#enumeration-types)). This allows you to:

- validate that any arguments of this type are one of the allowed values
- communicate through the type system that a field will always be one of a finite set of values

#### Code first

To define a GraphQL enum type, simply create a TypeScript enum.

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

Now, we can reference the `AllowedColor` in our types:

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

#### Schema first

To define an enumerator in the schema first approach, simply create a GraphQL enum with SDL.

```graphql
enum AllowedColor {
  RED
  GREEN
  BLUE
}
```

Then, you can use the typings generation feature (as shown in the [quick start](/graphql/quick-start) chapter) to generate corresponding TypeScript definitions:

```typescript
export enum AllowedColor {
  RED
  GREEN
  BLUE
}
```

Sometimes a backend forces a different value for an enum internally than in the public API. In this example the API contains `RED`, however in resolvers we may use `#f00` instead (read more [here](https://www.apollographql.com/docs/apollo-server/schema/scalars-enums/#internal-values)). To accomplish this, declare a resolver class for the `AllowedColor` enum:

```typescript
@Resolver('AllowedColor')
export class AllowedColorResolver {
  @ResolveField('RED')
  getRedColor() {
    return '#f00';
  }
}
```

> info **Hint** All decorators are exported from the `@nestjs/graphql` package.
