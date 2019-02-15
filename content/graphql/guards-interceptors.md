### Tooling

In the GraphQL world, a lot of articles complain how to handle stuff like an **authentication**, or **side-effects** of operations. Should we put it inside the business logic? Shall we use a higher-order function to enhance queries and mutations as well, for example, with an authorization logic? Or maybe use [schema directives](https://www.apollographql.com/docs/apollo-server/v2/features/directives.html). There is no single answer anyway.

Nest ecosystem is trying to help with this issue using existing features like [guards](/guards) and [interceptors](/interceptors). The idea behind them is to reduce redundancy and also, supply you with tooling that helps creating well-structured, readable, and consistent applications.

#### Overview

You can use either [guards](/guards), [interceptors](/interceptors), and [pipes](/pipes) in the same fashion as in the simple REST application. Additionally, you are able to easily create your own decorators, by leveraging [custom decorators](/custom-decorators) feature. They all act equivalently. Let's have a look at the following code:

```typescript
@Query('author')
@UseGuards(AuthGuard)
async getAuthor(@Args('id', ParseIntPipe) id: number) {
  return await this.authorsService.findOneById(id);
}
```

As you can see, GraphQL works pretty well with both guards and pipes. Thanks to that you can, for instance, move your authentication logic to the guard, or even reuse the same guard class as in the REST application. The interceptors works in the exact same way:

```typescript
@Query('author')
@UseGuards(AuthGuard)
async getAuthor(@Args('id', ParseIntPipe) id: number) {
  return await this.authorsService.findOneById(id);
}
```

#### Execution context

However, the `ExecutionContext` received by both guards and interceptors is somewhat different. GraphQL resolvers have a separate set of arguments, respectively, `root`, `args`, `context`, and `info`. Hence, we need to transform given `ExecutionContext` to `GqlExecutionContext`, which is basically very simple.

```typescript
@Mutation()
@UseInterceptors(EventsInterceptor)
async upvotePost(@Args('postId') postId: number) {
  return await this.postsService.upvoteById({ id: postId });
}
```

`GqlExecutionContext` exposes corresponding methods for each argument, like `getArgs()`, `getContext()`, and so on. Now we can effortlessly pick up every argument specific for currently processed request.

#### Custom decorators

As mentioned before, the [custom decorators](/custom-decorators) feature works like a charm with GraphQL resolvers as well. Though, the factory function takes an array of arguments, instead of a `request` object.

```typescript
export const User = createParamDecorator(
  (data, [root, args, ctx, info]) => ctx.user,
);
```

And then:

```typescript
@Mutation()
async upvotePost(
  @User() user: UserEntity,
  @Args('postId') postId: number,
) {}
```
