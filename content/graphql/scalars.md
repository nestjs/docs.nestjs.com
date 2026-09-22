### Scalars

A GraphQL object type has a name and fields, but at some point those fields have to resolve to some concrete data. Scalar types provide that data: they represent the leaves of the query (see [scalar types](https://graphql.org/learn/schema/#scalar-types) in the GraphQL documentation). GraphQL includes the following built-in scalar types: `Int`, `Float`, `String`, `Boolean`, and `ID`. In addition to these, you may need to support custom atomic data types (e.g., `Date`).

#### Code first

The code first approach ships with five scalars, three of which are aliases for the existing GraphQL types:

- `ID` (alias for `GraphQLID`): a unique identifier, often used to refetch an object or as the key for a cache
- `Int` (alias for `GraphQLInt`): a signed 32-bit integer
- `Float` (alias for `GraphQLFloat`): a signed double-precision floating-point value
- `GraphQLISODateTime`: a date-time string in UTC (used by default to represent the `Date` type)
- `GraphQLTimestamp`: a signed integer that represents a date and time as the number of milliseconds since the start of the Unix epoch

By default, `GraphQLISODateTime` (e.g., `2019-12-03T09:54:33Z`) represents the `Date` type. To use `GraphQLTimestamp` instead, set the `dateScalarMode` property of the `buildSchemaOptions` object to `'timestamp'`:

```typescript
GraphQLModule.forRoot({
  buildSchemaOptions: {
    dateScalarMode: 'timestamp',
  }
}),
```

Likewise, `GraphQLFloat` represents the `number` type by default. To use `GraphQLInt` instead, set the `numberScalarMode` property of the `buildSchemaOptions` object to `'integer'`:

```typescript
GraphQLModule.forRoot({
  buildSchemaOptions: {
    numberScalarMode: 'integer',
  }
}),
```

You can also create custom scalars.

#### Override a default scalar

To create a custom implementation of the `Date` scalar, create a new class:

```typescript
import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Date', () => Date)
export class DateScalar implements CustomScalar<number, Date> {
  description = 'Date custom scalar type';

  parseValue(value: unknown): Date {
    return new Date(value as number); // value from the client
  }

  serialize(value: unknown): number {
    return (value as Date).getTime(); // value sent to the client
  }

  parseLiteral(ast: ValueNode): Date | null {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    return null;
  }
}
```

With this in place, register `DateScalar` as a provider:

```typescript
@Module({
  providers: [DateScalar],
})
export class CommonModule {}
```

Now you can use the `Date` type in your classes:

```typescript
@Field()
creationDate: Date;
```

#### Import a custom scalar

To use a custom scalar, import it and register it as a resolver. For demonstration purposes, we'll use the `graphql-type-json` package, which defines a `JSON` GraphQL scalar type.

Start by installing the package:

```bash
$ npm i --save graphql-type-json
```

Once the package is installed, pass a custom resolver to the `forRoot()` method:

```typescript
import GraphQLJSON from 'graphql-type-json';

@Module({
  imports: [
    GraphQLModule.forRoot({
      resolvers: { JSON: GraphQLJSON },
    }),
  ],
})
export class AppModule {}
```

Now you can use the `JSON` type in your classes:

```typescript
@Field(() => GraphQLJSON)
info: JSON;
```

For a suite of ready-made scalars, see the [graphql-scalars](https://www.npmjs.com/package/graphql-scalars) package.

#### Create a custom scalar

To define a custom scalar, create a new `GraphQLScalarType` instance. The following example creates a custom `UUID` scalar:

```typescript
import { GraphQLScalarType, Kind } from 'graphql';

const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validate(uuid: unknown): string | never {
  if (typeof uuid !== 'string' || !regex.test(uuid)) {
    throw new Error('invalid uuid');
  }
  return uuid;
}

export const CustomUuidScalar = new GraphQLScalarType({
  name: 'UUID',
  description: 'A simple UUID parser',
  serialize: (value) => validate(value),
  parseValue: (value) => validate(value),
  parseLiteral: (ast) =>
    validate(ast.kind === Kind.STRING ? ast.value : undefined),
});
```

Then pass a custom resolver to the `forRoot()` method:

```typescript
@Module({
  imports: [
    GraphQLModule.forRoot({
      resolvers: { UUID: CustomUuidScalar },
    }),
  ],
})
export class AppModule {}
```

Now you can use the `UUID` type in your classes:

```typescript
@Field(() => CustomUuidScalar)
uuid: string;
```

#### Schema first

To define a custom scalar (see [custom scalars](https://www.apollographql.com/docs/graphql-tools/scalars.html) in the GraphQL Tools documentation), create a type definition and a dedicated resolver. As in the official documentation, we'll use the `graphql-type-json` package, which defines a `JSON` GraphQL scalar type.

Start by installing the package:

```bash
$ npm i --save graphql-type-json
```

Once the package is installed, pass a custom resolver to the `forRoot()` method:

```typescript
import GraphQLJSON from 'graphql-type-json';

@Module({
  imports: [
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
      resolvers: { JSON: GraphQLJSON },
    }),
  ],
})
export class AppModule {}
```

Now we can use the `JSON` scalar in our type definitions:

```graphql
scalar JSON

type Foo {
  field: JSON
}
```

Another way to define a scalar type is to create a class. Suppose you want to add a `Date` type to your schema:

```typescript
import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Date')
export class DateScalar implements CustomScalar<number, Date> {
  description = 'Date custom scalar type';

  parseValue(value: unknown): Date {
    return new Date(value as number); // value from the client
  }

  serialize(value: unknown): number {
    return (value as Date).getTime(); // value sent to the client
  }

  parseLiteral(ast: ValueNode): Date | null {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    return null;
  }
}
```

With this in place, register `DateScalar` as a provider:

```typescript
@Module({
  providers: [DateScalar],
})
export class CommonModule {}
```

Now you can use the `Date` scalar in your type definitions:

```graphql
scalar Date
```

By default, the generated TypeScript definition for every custom scalar is `any`, which isn't type-safe. You can configure how Nest generates typings for your custom scalars when you specify how to generate types:

```typescript
import { GraphQLDefinitionsFactory } from '@nestjs/graphql';
import { join } from 'node:path';

const definitionsFactory = new GraphQLDefinitionsFactory();

definitionsFactory.generate({
  typePaths: ['./src/**/*.graphql'],
  path: join(process.cwd(), 'src/graphql.ts'),
  outputAs: 'class',
  defaultScalarType: 'unknown',
  customScalarTypeMapping: {
    DateTime: 'Date',
    BigNumber: '_BigNumber',
  },
  additionalHeader: "import _BigNumber from 'bignumber.js'",
});
```

> info **Hint** Alternatively, you can use a type reference, for example, `DateTime: Date`. In this case, `GraphQLDefinitionsFactory` uses the `name` property of the specified type (`Date.name`) to generate the TypeScript definitions. For custom (non-built-in) types, you must also add an import statement.

Now, given the following GraphQL custom scalar types:

```graphql
scalar DateTime
scalar BigNumber
scalar Payload
```

Nest generates the following TypeScript definitions in `src/graphql.ts`:

```typescript
import _BigNumber from 'bignumber.js';

export type DateTime = Date;
export type BigNumber = _BigNumber;
export type Payload = unknown;
```

Here, the `customScalarTypeMapping` property maps each custom scalar to the TypeScript type to declare for it. The `additionalHeader` property adds any imports these type definitions require. Lastly, setting `defaultScalarType` to `'unknown'` aliases any custom scalar not listed in `customScalarTypeMapping` to `unknown` instead of `any`, which [TypeScript recommends](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html#new-unknown-top-type) since version 3.0 for added type safety.

> info **Hint** The example imports `_BigNumber` from `bignumber.js` under an alias to avoid [circular type references](https://github.com/Microsoft/TypeScript/issues/12525#issuecomment-263166239).
