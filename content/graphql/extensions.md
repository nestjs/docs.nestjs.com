### Extensions

> warning **Warning** This chapter applies only to the code first approach.

Extensions is an **advanced, low-level feature** that lets you define arbitrary data in the types configuration. Attaching custom metadata to certain fields allows you to create more sophisticated, generic solutions. For example, with extensions, you can define field-level roles required to access particular fields. Such roles can be reflected at runtime to determine whether the caller has sufficient permissions to retrieve a specific field.

#### Adding custom metadata

To attach custom metadata for a field, use the `@Extensions()` decorator exported from the `@nestjs/graphql` package.

```typescript
@Field()
@Extensions({ role: Role.ADMIN })
password: string;
```

In the example above, we assigned the `role` metadata property the value of `Role.ADMIN`.  `Role` is a simple TypeScript enum that groups all the user roles available in our system.

Note, in addition to setting metadata on fields, you can use the `@Extensions()` decorator at the class level and method level (e.g., on the query handler).

#### Using custom metadata

The logic that leverages the custom metatada can be as complex as needed. For example, you can create a simple interceptor that stores/logs events per method invocation, or create a sophisticated guard that **analyzes requested fields**, iterates through the `GraphQLObjectType` definition, and matches the roles required to retrieve specific fields with the caller permissions (field-level permissions system).

Let's define a `FieldRolesGuard` that implements a basic version of such a field-level permissions system.

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLNonNull, GraphQLObjectType, GraphQLResolveInfo } from 'graphql';
import * as graphqlFields from 'graphql-fields';

@Injectable()
export class FieldRolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const info = GqlExecutionContext.create(context).getInfo<
      GraphQLResolveInfo
    >();
    const returnType = (info.returnType instanceof GraphQLNonNull
      ? info.returnType.ofType
      : info.returnType) as GraphQLObjectType;

    const fields = returnType.getFields();
    const requestedFields = graphqlFields(info);

    Object.entries(fields)
      .filter(([key]) => key in requestedFields)
      .map(([_, field]) => field)
      .filter((field) => field.extensions && field.extensions.role)
      .forEach((field) => {
        // match user and field roles here
        console.log(field.extensions.role);
      });

    return true;
  }
}
```

> warning **Warning** For the **illustration purposes**, we assumed that **every** resolver returns either the `GraphQLObjectType` or `GraphQLNonNull` that wraps the object type. In the real-world application, you should cover other cases (scalars, etc.). Note that using this particular implementation can lead to unexpected errors (e.g., missing `getFields()` method).

In the example above, we've used the [graphql-fields](https://github.com/robrichard/graphql-fields) package that turns the `GraphQLResolveInfo` object into an object that consist of the requested fields. We used this specific library to make the presented example somewhat simpler.

Now, if the return type of any resolver contain a field annotated with the `@Extensions({{ '{' }} role: Role.ADMIN {{ '}' }}})` decorator, this `role` (`Role.ADMIN`) will be logged in the console **if requested** in the GraphQL query.
