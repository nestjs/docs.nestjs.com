### Scalars

In order to define a custom scalar (read more about scalars [here](https://www.apollographql.com/docs/graphql-tools/scalars.html)), we have to create a type definition and a dedicated resolver as well. Here (as in the official documentation), we’ll take the `graphql-type-json` package for demonstration purposes. This npm package defines a `JSON` GraphQL scalar type. Firstly, let's install the package:

```bash
$ npm i --save graphql-type-json
```

Once the package is installed, we have to pass a custom resolver to the `forRoot()` method:

```typescript
import * as GraphQLJSON from 'graphql-type-json';

@Module({
  imports: [
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
      resolvers: { JSON: GraphQLJSON },
    }),
  ],
})
export class ApplicationModule {}
```

Now we can use `JSON` scalar in our type definitions:

```java
scalar JSON

type Foo {
  field: JSON
}
```

#### Classes

Another form of defining the scalar type is to create a simple class. Let's say that we would like to enhance our schema with the `Date` type.

```typescript
import { Scalar } from '@nestjs/graphql';
import { Kind } from 'graphql';

@Scalar('Date')
export class DateScalar {
  description = 'Date custom scalar type';

  parseValue(value) {
    return new Date(value); // value from the client
  }

  serialize(value) {
    return value.getTime(); // value sent to the client
  }

  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return parseInt(ast.value, 10); // ast value is always in string format
    }
    return null;
  }
}
```

Afterward, we need to register `DateScalar` as a provider.

```typescript
@Module({
  providers: [DateScalar],
})
export class CommonModule {}
```

And now we are able to use `Date` scalar in our type definitions.
