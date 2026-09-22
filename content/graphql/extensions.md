### Extensions

> warning **Warning** This chapter applies only to the code first approach.

Extensions are an **advanced, low-level feature** that lets you define arbitrary data in the types configuration. Attaching custom metadata to certain fields allows you to build more sophisticated, generic solutions. For example, with extensions, you can define the roles required to access particular fields. Your code can read these roles at runtime to determine whether the caller has sufficient permissions to retrieve a specific field.

#### Adding custom metadata

To attach custom metadata to a field, use the `@Extensions()` decorator exported from the `@nestjs/graphql` package:

```typescript
@Field()
@Extensions({ role: Role.ADMIN })
password: string;
```

In the example above, we assigned the value `Role.ADMIN` to the `role` metadata property. `Role` is a TypeScript enum that groups all the user roles available in our system.

In addition to fields, you can use the `@Extensions()` decorator at the class level and at the method level (e.g., on a query handler).

#### Using custom metadata

The logic that uses the custom metadata can be as complex as needed. For example, you can create an interceptor that stores or logs events per method invocation, or a [field middleware](/graphql/field-middleware) that matches the roles required to retrieve a field against the caller's permissions (a field-level permissions system).

For illustration purposes, let's define a `checkRoleMiddleware` that compares a user's role (hardcoded here) with the role required to access a target field:

```typescript
export const checkRoleMiddleware: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const info = ctx.info!;
  const { extensions } = info.parentType.getFields()[info.fieldName];

  /**
   * In a real-world application, the "userRole" variable
   * should represent the caller's (user) role (e.g., read from "ctx.context").
   */
  const userRole = Role.USER;
  if (userRole !== extensions.role) {
    // or "return null" to hide the value instead
    throw new ForbiddenException(
      `User does not have sufficient permissions to access "${info.fieldName}" field.`,
    );
  }
  return next();
};
```

With this in place, register the middleware for the `password` field:

```typescript
@Field({ middleware: [checkRoleMiddleware] })
@Extensions({ role: Role.ADMIN })
password: string;
```
