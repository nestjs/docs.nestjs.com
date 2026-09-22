### Execution context

Nest provides several utility classes that help you write applications that function across multiple application contexts (e.g., HTTP server-based, microservices, and WebSockets application contexts). These utilities provide information about the current execution context, which you can use to build generic [guards](/guards), [filters](/exception-filters), and [interceptors](/interceptors) that work across a broad set of controllers, methods, and execution contexts.

This chapter covers two such classes: `ArgumentsHost` and `ExecutionContext`.

#### ArgumentsHost class

The `ArgumentsHost` class provides methods for retrieving the arguments being passed to a handler. It lets you choose the appropriate context (e.g., HTTP, RPC (microservice), or WebSockets) to retrieve the arguments from. The framework provides an instance of `ArgumentsHost`, typically referenced as a `host` parameter, in places where you may want to access it. For example, the `catch()` method of an [exception filter](/exception-filters#arguments-host) is called with an `ArgumentsHost` instance.

`ArgumentsHost` acts as an abstraction over a handler's arguments. For example, in HTTP server applications (when `@nestjs/platform-express` is used), the `host` object encapsulates Express's `[request, response, next]` array, where `request` is the request object, `response` is the response object, and `next` is a function that controls the application's request-response cycle. For [GraphQL](/graphql/quick-start) applications, on the other hand, the `host` object contains the `[root, args, context, info]` array.

#### Current application context

When you build generic [guards](/guards), [filters](/exception-filters), and [interceptors](/interceptors) that are meant to run across multiple application contexts, you need a way to determine the type of application your method is currently running in. Use the `getType()` method of `ArgumentsHost` for this. It returns `'http'`, `'rpc'`, or `'ws'` out of the box, and packages such as `@nestjs/graphql` add their own types:

```typescript
if (host.getType() === 'http') {
  // do something that is only important in the context of regular HTTP requests (REST)
} else if (host.getType() === 'rpc') {
  // do something that is only important in the context of microservice requests
} else if (host.getType<GqlContextType>() === 'graphql') {
  // do something that is only important in the context of GraphQL requests
}
```

> info **Hint** The `GqlContextType` type is imported from the `@nestjs/graphql` package.

With the application type available, you can write more generic components, as shown below.

#### Host handler arguments

One way to retrieve the array of arguments being passed to the handler is the host object's `getArgs()` method:

```typescript
const [req, res, next] = host.getArgs();
```

You can pluck a particular argument by index using the `getArgByIndex()` method:

```typescript
const request = host.getArgByIndex(0);
const response = host.getArgByIndex(1);
```

These examples retrieve the request and response objects by index, which is not typically recommended, because it couples the application to a particular execution context. Instead, you can make your code more robust and reusable by using one of the `host` object's utility methods to switch to the appropriate application context. The context switch utility methods are shown below.

```typescript
/**
 * Switch context to RPC.
 */
switchToRpc(): RpcArgumentsHost;
/**
 * Switch context to HTTP.
 */
switchToHttp(): HttpArgumentsHost;
/**
 * Switch context to WebSockets.
 */
switchToWs(): WsArgumentsHost;
```

Let's rewrite the previous example using the `switchToHttp()` method. The `host.switchToHttp()` helper call returns an `HttpArgumentsHost` object that is appropriate for the HTTP application context. The `HttpArgumentsHost` object has two useful methods for extracting the desired objects. The example also passes Express types as type arguments, so the methods return natively typed Express objects:

```typescript
const ctx = host.switchToHttp();
const request = ctx.getRequest<Request>();
const response = ctx.getResponse<Response>();
```

Similarly, `WsArgumentsHost` and `RpcArgumentsHost` have methods that return the appropriate objects in the WebSockets and microservices contexts. Here are the methods of `WsArgumentsHost`:

```typescript
export interface WsArgumentsHost {
  /**
   * Returns the data object.
   */
  getData<T>(): T;
  /**
   * Returns the client object.
   */
  getClient<T>(): T;
}
```

And here are the methods of `RpcArgumentsHost`:

```typescript
export interface RpcArgumentsHost {
  /**
   * Returns the data object.
   */
  getData<T>(): T;

  /**
   * Returns the context object.
   */
  getContext<T>(): T;
}
```

#### ExecutionContext class

`ExecutionContext` extends `ArgumentsHost`, providing additional details about the current execution process. Like `ArgumentsHost`, Nest provides an instance of `ExecutionContext` in places where you may need it, such as the `canActivate()` method of a [guard](/guards#execution-context) and the `intercept()` method of an [interceptor](/interceptors#execution-context). It provides the following methods:

```typescript
export interface ExecutionContext extends ArgumentsHost {
  /**
   * Returns the type of the controller class which the current handler belongs to.
   */
  getClass<T>(): Type<T>;
  /**
   * Returns a reference to the handler (method) that will be invoked next in the
   * request pipeline.
   */
  getHandler(): Function;
}
```

The `getHandler()` method returns a reference to the handler about to be invoked. The `getClass()` method returns the type of the controller class that this handler belongs to. For example, in an HTTP context, if the currently processed request is a `POST` request bound to the `create()` method on `CatsController`, `getHandler()` returns a reference to the `create()` method, and `getClass()` returns the `CatsController` **class** (not an instance).

```typescript
const methodKey = ctx.getHandler().name; // "create"
const className = ctx.getClass().name; // "CatsController"
```

Access to both the current class and the handler method provides great flexibility. Most importantly, it lets you read, from within guards or interceptors, the metadata set by decorators created with `Reflector#createDecorator` or by the built-in `@SetMetadata()` decorator. The following sections cover this use case.

<app-banner-enterprise></app-banner-enterprise>

#### Reflection and metadata

Nest lets you attach **custom metadata** to route handlers through decorators created with the `Reflector#createDecorator` method, or with the built-in `@SetMetadata()` decorator. This section compares the two approaches and shows how to access the metadata from within a guard or interceptor.

To create strongly typed decorators with `Reflector#createDecorator`, specify the type argument. For example, let's create a `Roles` decorator that takes an array of strings as an argument.

```ts
@@filename(roles.decorator)
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<string[]>();
```

The `Roles` decorator here is a function that takes a single argument of type `string[]`.

To use this decorator, annotate the handler with it:

```typescript
@@filename(cats.controller)
@Post()
@Roles(['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Roles(['admin'])
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

This attaches the `Roles` decorator metadata to the `create()` method, indicating that only users with the `admin` role should be allowed to access this route.

To access the route's role(s) (custom metadata), use the `Reflector` helper class again. `Reflector` can be injected into a class in the normal way:

```typescript
@@filename(roles.guard)
@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}
}
@@switch
@Injectable()
@Dependencies(Reflector)
export class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }
}
```

> info **Hint** The `Reflector` class is imported from the `@nestjs/core` package.

Now, to read the handler metadata, use the `get()` method:

```typescript
const roles = this.reflector.get(Roles, context.getHandler());
```

The `Reflector#get` method takes two arguments: a decorator reference and a **context** (decorator target) to retrieve the metadata from. In this example, the specified **decorator** is `Roles` (see the `roles.decorator.ts` file above). The context is provided by the call to `context.getHandler()`, which extracts the metadata for the currently processed route handler. Remember, `getHandler()` gives you a **reference** to the route handler function.

Alternatively, you can apply metadata at the controller level, so that it applies to all routes in the controller class.

```typescript
@@filename(cats.controller)
@Roles(['admin'])
@Controller('cats')
export class CatsController {}
@@switch
@Roles(['admin'])
@Controller('cats')
export class CatsController {}
```

In this case, to extract controller metadata, pass `context.getClass()` as the second argument (to provide the controller class as the context for metadata extraction) instead of `context.getHandler()`:

```typescript
@@filename(roles.guard)
const roles = this.reflector.get(Roles, context.getClass());
```

Because metadata can be provided at multiple levels, you may need to extract and merge metadata from several contexts. The `Reflector` class provides two utility methods for this. They extract **both** controller and method metadata at once, and combine them in different ways.

Consider the following scenario, where you've supplied `Roles` metadata at both levels.

```typescript
@@filename(cats.controller)
@Roles(['user'])
@Controller('cats')
export class CatsController {
  @Post()
  @Roles(['admin'])
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }
}
@@switch
@Roles(['user'])
@Controller('cats')
export class CatsController {
  @Post()
  @Roles(['admin'])
  @Bind(Body())
  async create(createCatDto) {
    this.catsService.create(createCatDto);
  }
}
```

If your intent is to specify `'user'` as the default role and override it selectively for certain methods, use the `getAllAndOverride()` method. It returns the first defined value, checking the targets in the order you pass them:

```typescript
const roles = this.reflector.getAllAndOverride(Roles, [context.getHandler(), context.getClass()]);
```

A guard with this code, running in the context of the `create()` method with the metadata above, results in `roles` containing `['admin']`.

To get the metadata from both levels and merge it (this method merges both arrays and objects), use the `getAllAndMerge()` method:

```typescript
const roles = this.reflector.getAllAndMerge(Roles, [context.getHandler(), context.getClass()]);
```

This results in `roles` containing `['admin', 'user']` (values are concatenated in the order of the targets).

For both of these methods, you pass the decorator reference (or metadata key) as the first argument, and an array of metadata target contexts (i.e., calls to the `getHandler()` and/or `getClass()` methods) as the second argument.

#### Low-level approach

As mentioned earlier, instead of using `Reflector#createDecorator`, you can use the built-in `@SetMetadata()` decorator to attach metadata to a handler.

```typescript
@@filename(cats.controller)
@Post()
@SetMetadata('roles', ['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@SetMetadata('roles', ['admin'])
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **Hint** The `@SetMetadata()` decorator is imported from the `@nestjs/common` package.

The construction above attaches the `roles` metadata (`roles` is the metadata key and `['admin']` is the associated value) to the `create()` method. While this works, it's not good practice to use `@SetMetadata()` directly in your routes. Instead, create your own decorators, as shown below:

```typescript
@@filename(roles.decorator)
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
@@switch
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles) => SetMetadata('roles', roles);
```

This approach is cleaner and more readable, and resembles the `Reflector#createDecorator` approach. The difference is that with `@SetMetadata()` you have more control over the metadata key and value, and you can create decorators that take more than one argument.

With the custom `@Roles()` decorator in place, you can use it to decorate the `create()` method.

```typescript
@@filename(cats.controller)
@Post()
@Roles('admin')
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Roles('admin')
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

To access the route's role(s) (custom metadata), use the `Reflector` helper class again:

```typescript
@@filename(roles.guard)
@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}
}
@@switch
@Injectable()
@Dependencies(Reflector)
export class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }
}
```

> info **Hint** The `Reflector` class is imported from the `@nestjs/core` package.

Now, to read the handler metadata, use the `get()` method.

```typescript
const roles = this.reflector.get<string[]>('roles', context.getHandler());
```

Here, instead of a decorator reference, you pass the metadata **key** (in this case, `'roles'`) as the first argument. Everything else remains the same as in the `Reflector#createDecorator` example.
