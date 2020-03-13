### Directives

A directive can be attached to a field or fragment inclusion, and can affect execution of the query in any way the server desires (read more [here](https://graphql.org/learn/queries/#directives)). The GraphQL specification provides several default directives:

- `@include(if: Boolean)` - only include this field in the result if the argument is true
- `@skip(if: Boolean)` - skip this field if the argument is true
- `@deprecated(reason: String)` - marks field as deprecated with message

A directive is an identifier preceded by a `@` character, optionally followed by a list of named arguments, which can appear after almost any element in the GraphQL query and schema languages.

#### Custom directives

To create a custom schema directive, declare a class which extends the `SchemaDirectiveVisitor` class exported from the `apollo-server` package.

```typescript
import { SchemaDirectiveVisitor } from 'apollo-server';
import { defaultFieldResolver, GraphQLField } from 'graphql';

export class UpperCaseDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field;
    field.resolve = async function(...args) {
      const result = await resolve.apply(this, args);
      if (typeof result === 'string') {
        return result.toUpperCase();
      }
      return result;
    };
  }
}
```

> info **Hint** Note that directives cannot be decorated with the `@Injectable()` decorator. Thus, they are not able to inject dependencies.

Now, register the `UpperCaseDirective` in the `GraphQLModule.forRoot()` method:

```typescript
GraphQLModule.forRoot({
  // ...
  schemaDirectives: {
    upper: UpperCaseDirective,
  },
});
```

Once registered, the `@upper` directive can be used in our schema. However, the way you apply the directive will vary depending on the approach you use (code first or schema first).

#### Code first

In the code first approach, use the `@Directive()` decorator to apply the directive.

```typescript
@Directive('@upper')
@Field()
title: string;
```

> info **Hint** The `@Directive()` decorator is exported from the `@nestjs/graphql` package.

Directives can be applied on fields, field resolvers, input and object types, as well as queries, mutations, and subscriptions. Here's an example of the directive applied on the query handler level:

```typescript
@Directive('@deprecated(reason: "This query will be removed in the next version")')
@Query(returns => Author, { name: 'author' })
async getAuthor(@Args({ name: 'id', type: () => Int }) id: number) {
  return this.authorsService.findOneById(id);
}
```

Directives applied through the `@Directive()` decorator will not be reflected in the generated schema definition file.

#### Schema first

In the schema first approach, apply directives directly in SDL.

```graphql
directive @upper on FIELD_DEFINITION

type Post {
  id: Int!
  title: String! @upper
  votes: Int
}
```
