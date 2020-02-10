### Tooling

In the GraphQL world, there is a lot of debate about handling issues like **authentication**, or **side-effects** of operations. Should we handle things inside the business logic? Should we use a higher-order function to enhance queries and mutations with authorization logic? Or should we use [schema directives](https://www.apollographql.com/docs/apollo-server/schema/directives/)? There is no single one-size-fits-all answer to these questions.

Nest helps address these issues with its cross-platform features like [guards](/guards) and [interceptors](/interceptors). The philosophy is to reduce redundancy and provide tooling that helps create well-structured, readable, and consistent applications.

#### Overview

You can use standard [guards](/guards), [interceptors](/interceptors), [filters](/exception-filters) and [pipes](/pipes) in the same fashion with GraphQL as with any RESTful application. Additionally, you can easily create your own decorators by leveraging the [custom decorators](/custom-decorators) feature. Let's take a look at a sample GraphQL query handler.

```typescript
@Query('author')
@UseGuards(AuthGuard)
async getAuthor(@Args('id', ParseIntPipe) id: number) {
  return this.authorsService.findOneById(id);
}
```

As you can see, GraphQL works with both guards and pipes in the same way as HTTP REST handlers. Because of this, you can move your authentication logic to a guard; you can even reuse the same guard class across both a REST and GraphQL API interface. Similarly, interceptors work across both types of applications in the same way:

```typescript
@Mutation()
@UseInterceptors(EventsInterceptor)
async upvotePost(@Args('postId') postId: number) {
  return this.postsService.upvoteById({ id: postId });
}
```

#### Execution context

Since GraphQL receives a different type of data in the incoming request, the [`ExecutionContext`](https://docs.nestjs.com/fundamentals/execution-context) received by both guards and interceptors is somewhat different with GraphQL vs. REST. GraphQL resolvers have a distinct set of arguments: `root`, `args`, `context`, and `info`. Thus guards and interceptors must transform the generic `ExecutionContext` to a `GqlExecutionContext`. This is straightforward:

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    return true;
  }
}
```

The GraphQL context object returned by `GqlExecutionContext.create()` exposes a **get** method for each GraphQL resolver argument (e.g., `getArgs()`, `getContext()`, etc). Once transformed, we can easily pick out any GraphQL argument for the current request.

#### Exception filters

Nest standard [exception filters](/exception-filters) are compatible with GraphQL applications as well. As with `ExecutionContext`, GraphQL apps should transform the `ArgumentsHost` object to a `GqlArgumentsHost` object.

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements GqlExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    return exception;
  }
}
```

> info **Hint** Both `GqlExceptionFilter` and `GqlArgumentsHost` are imported from the `@nestjs/graphql` package.

Note that unlike the REST case, you don't use the native `response` object to generate a response.

#### Custom decorators

As mentioned, the [custom decorators](/custom-decorators) feature works as expected with GraphQL resolvers. The only difference is that the factory function takes an array of GraphQL request arguments as its second argument, instead of a single `request` object (as with REST applications).

```typescript
export const User = createParamDecorator(
  (data, [root, args, ctx, info]) => ctx.user,
);
```

Use the `@User()` custom decorator as follows:

```typescript
@Mutation()
async upvotePost(
  @User() user: UserEntity,
  @Args('postId') postId: number,
) {}
```

> info **Hint** In the above example, we have assumed that the `user` object is assigned to the context of your GraphQL application.
