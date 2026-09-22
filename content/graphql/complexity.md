### Complexity

> warning **Warning** This chapter applies only to the code first approach.

Query complexity lets you define how complex certain fields are, and restrict queries with a **maximum complexity**. The idea is to express the complexity of each field as a number. A common default is to give each field a complexity of `1`. You can also customize how the complexity of a GraphQL query is calculated with complexity estimators. A complexity estimator is a function that calculates the complexity of a field. You can add any number of estimators to the rule, and they run one after another. The first estimator that returns a numeric value determines the complexity of that field.

The `@nestjs/graphql` package integrates with tools like [graphql-query-complexity](https://github.com/slicknode/graphql-query-complexity), which provides a solution based on cost analysis. With this library, you can reject queries that are too costly to execute.

#### Installation

To begin, install the required dependency:

```bash
$ npm install --save graphql-query-complexity
```

#### Getting started

Once the installation is complete, define the `ComplexityPlugin` class:

```typescript
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestListener,
} from '@apollo/server';
import { GraphQLError } from 'graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  constructor(private gqlSchemaHost: GraphQLSchemaHost) {}

  async requestDidStart(): Promise<GraphQLRequestListener<BaseContext>> {
    const maxComplexity = 20;
    const { schema } = this.gqlSchemaHost;

    return {
      async didResolveOperation({ request, document }) {
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [
            fieldExtensionsEstimator(),
            simpleEstimator({ defaultComplexity: 1 }),
          ],
        });
        if (complexity > maxComplexity) {
          throw new GraphQLError(
            `Query is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`,
          );
        }
        console.log('Query Complexity:', complexity);
      },
    };
  }
}
```

For demonstration purposes, the maximum allowed complexity is set to `20`. The example above uses two estimators, `fieldExtensionsEstimator` and `simpleEstimator`:

- `fieldExtensionsEstimator`: extracts the complexity value defined for each field of your schema (through the field's `extensions`)
- `simpleEstimator`: returns a fixed complexity for each field (used as the fallback for fields without a defined complexity)

> info **Hint** Remember to add this class to the `providers` array of a module.

#### Field-level complexity

With this plugin in place, you can define the complexity of any field by specifying the `complexity` property in the options object passed to the `@Field()` decorator:

```typescript
@Field({ complexity: 3 })
title: string;
```

Alternatively, you can define an estimator function:

```typescript
@Field({ complexity: (options: ComplexityEstimatorArgs) => ... })
title: string;
```

#### Query/Mutation-level complexity

The `@Query()` and `@Mutation()` decorators also accept a `complexity` property in their options object:

```typescript
@Query(() => [Item], {
  complexity: (options: ComplexityEstimatorArgs) =>
    options.args.count * options.childComplexity,
})
items(@Args('count') count: number) {
  return this.itemsService.getItems({ count });
}
```
