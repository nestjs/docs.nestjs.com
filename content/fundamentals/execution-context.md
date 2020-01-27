### Execution context

The `ExecutionContext` is a powerful utility object that functions in all contexts (e.g., the HTTP server context, but also Microservices and WebSockets). It provides several helper methods that allow us to access additional details about the current execution process. These details can be helpful in building more generic [guards](/guards), [filters](/exception-filters), and [interceptors](/interceptors) that can work across a broad set of controllers, methods, and execution contexts. The `ExecutionContext` inherits from `ArgumentsHost`.

#### Arguments host

The `ArgumentsHost` provides methods for retrieving the arguments being passed to a handler. It allows choosing the appropriate context (e.g., Http, RPC, or WebSockets) to retrieve the arguments from.

In fact, `ArgumentsHost` simply acts as an abstraction over handler's arguments. For HTTP applications (when `@nestjs/platform-express` is being used), the host instance will encapsulate `[request, response, next]` array, where `request` is the request object, `response` is the response object, and `next` is a function that controls the application's request-response cycle. On the other hand, for [GraphQL](/graphql/quick-start) applications, the host instance will isolate `[root, args, context, info]` array.

#### Host methods

To retrieve the array of arguments being passed to the handler, use the `getArgs()` method.

```typescript
const [req, res, next] = host.getArgs();
```

In order to get a particular argument by index, use the `getArgByIndex()` method:

```typescript
const request = host.getArgByIndex(0);
const response = host.getArgByIndex(1);
```

In the example above we retrieved the request and response objects by indices which is typically considered as a bad practice. Instead, switch to an appropriate context depending on the type of your application.

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

Let's rewrite the previous example and use the `switchToHttp()` method now. The `host.switchToHttp()` helper call returns us an `HttpArgumentsHost` object. The `HttpArgumentsHost` object, in turn, has two useful methods. We use these methods to extract the desired objects, also using the Express type assertions in this case to return native Express typed objects:

```typescript
const ctx = host.switchToHttp();
const request = ctx.getRequest<Request>();
const response = ctx.getResponse<Response>();
```

#### Current context

When building more generic [guards](/guards), [filters](/exception-filters), and [interceptors](/interceptors), we need a way to determine what's the type of application that our method is currently running for. This can be accomplished with the `getType()` method:

```typescript
const type = host.getType();
if (type === 'http') {
  // HTTP application
} else if (type === 'rpc') {
  // Microservice
}
```

#### More on execution context

By extending `ArgumentsHost`, `ExecutionContext` provides additional details about the current execution process. Here's what it looks like:

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

The `getHandler()` method returns a reference to the route handler about to be invoked. The `getClass()` method returns the type of the `Controller` class which this particular handler belongs to. For example, if the currently processed request is a `POST` request, destined for the `create()` method on the `CatsController`, `getHandler()` will return a reference to the `create()` method and `getClass()` will return a `CatsController` **type** (not instance).

```typescript
const methodKey = ctx.getHandler().name; // "create"
const className = ctx.getClass().name; // "CatsController"
```

Having an ability to access references to both class and method opens many doors for us. Most importantly, it gives us an opportunity to read the metadata set through the `@SetMetadata()` decorator from within guards or interceptors.

#### Reflection and metadata

Nest provides the ability to attach custom **metadata** to route handlers through the `@SetMetadata()` decorator. We can then access this metadata from within our class to make certain decisions.

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

With the construction above, we attached the `roles` metadata (`roles` is a key, while `['admin']` is a particular value) to the `create()` method. While this works, it's not good practice to use `@SetMetadata()` directly in your routes. Instead, create your own decorators, as shown below:

```typescript
@@filename(roles.decorator)
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
@@switch
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles) => SetMetadata('roles', roles);
```

This approach is much cleaner and more readable, and is strongly typed. Now that we have a custom `@Roles()` decorator, we can use it to decorate the `create()` method.

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

In order to access the route's role(s) (custom metadata), we'll use the `Reflector` helper class, which is provided out of the box by the framework and exposed from the `@nestjs/core` package. `Reflector` can be injected into a class in the normal way:

```typescript
@@filename(roles.guard)
@Injectable()
export class RolesGuard {
  constructor(private readonly reflector: Reflector) {}
}
@@switch
@Injectable()
@Dependencies(Reflector)
export class CatsService {
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

The `Reflector` class allows us to easily access the metadata by the specified **key** (in this case, the key is `'roles'`; refer back to the `roles.decorator.ts` file and the `SetMetadata()` call made there). In the example above, we passed `context.getHandler()` in order to extract the metadata for the currently processed request method. Remember, `getHandler()` gives us a **reference** to the route handler function.

We can make this guard more generic by extracting the **controller metadata** and using that to determine the current user role.

```typescript
@@filename(cats.controller)
@Roles('admin')
@Controller('cats')
export class CatsController {}
@@switch
@Roles('admin')
@Controller('cats')
export class CatsController {}
```

Now, to extract controller metadata, we pass `context.getClass()` instead of `context.getHandler()`:

```typescript
@@filename()
const roles = this.reflector.get<string[]>('roles', context.getClass());
@@switch
const roles = this.reflector.get('roles', context.getClass());
```

In addition, `Reflector` provides two other utility methods used to extract controller and method metadata at once.

To get metadata for both and merge it (applicable for arrays and objects), use the `getAndMergeAll()` method:

```typescript
const roles = this.reflector.getAllAndMerge<string[]>('roles', [
  context.getHandler(),
  context.getClass(),
]);
```

To get metadata for both and return a first **not undefined** value, use the `getAllAndOverride()` method:

```typescript
const roles = this.reflector.getAllAndOverride<string[]>('roles', [
  context.getHandler(),
  context.getClass(),
]);
```
