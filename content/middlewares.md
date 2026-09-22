### Middleware

Middleware is a function that is called **before** the route handler. Middleware functions have access to the [request](https://expressjs.com/en/4x/api.html#req) and [response](https://expressjs.com/en/4x/api.html#res) objects, and to the `next()` middleware function in the application's request-response cycle. The **next** middleware function is commonly denoted by a variable named `next`.

<figure><img class="illustrative-image" src="/assets/Middlewares_1.png" /></figure>

By default, Nest middleware is equivalent to [Express](https://expressjs.com/en/guide/using-middleware.html) middleware. The official Express documentation describes the capabilities of middleware as follows:

<blockquote class="external">
  Middleware functions can perform the following tasks:
  <ul>
    <li>execute any code.</li>
    <li>make changes to the request and the response objects.</li>
    <li>end the request-response cycle.</li>
    <li>call the next middleware function in the stack.</li>
    <li>if the current middleware function does not end the request-response cycle, it must call <code>next()</code> to
      pass control to the next middleware function. Otherwise, the request will be left hanging.</li>
  </ul>
</blockquote>

You implement custom Nest middleware either as a function or as a class with the `@Injectable()` decorator. A class should implement the `NestMiddleware` interface, while a function has no special requirements. Let's start by implementing a simple middleware class.

> warning **Warning** Express and Fastify handle middleware differently and provide different method signatures. See the [Performance (Fastify)](/http/performance#middleware) chapter for details.

```typescript
@@filename(logger.middleware)
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Request...');
    next();
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware {
  use(req, res, next) {
    console.log('Request...');
    next();
  }
}
```

#### Dependency injection

Nest middleware fully supports dependency injection. Like providers and controllers, middleware classes can **inject dependencies** that are available within the same module. As usual, dependencies are injected through the `constructor`.

#### Applying middleware

Middleware is not registered in the `@Module()` decorator. Instead, you set it up in the `configure()` method of the module class. Modules that include middleware must implement the `NestModule` interface. Let's set up the `LoggerMiddleware` at the `AppModule` level.

```typescript
@@filename(app.module)
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { CatsModule } from './cats/cats.module.js';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats');
  }
}
@@switch
import { Module } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { CatsModule } from './cats/cats.module.js';

@Module({
  imports: [CatsModule],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats');
  }
}
```

In the example above, the `LoggerMiddleware` is applied to the `/cats` route handlers defined in the `CatsController`. To restrict middleware to a particular request method, pass an object containing the route `path` and the request `method` to the `forRoutes()` method. The example below imports the `RequestMethod` enum to reference the desired request method.

```typescript
@@filename(app.module)
import { Module, NestModule, RequestMethod, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { CatsModule } from './cats/cats.module.js';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET });
  }
}
@@switch
import { Module, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { CatsModule } from './cats/cats.module.js';

@Module({
  imports: [CatsModule],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET });
  }
}
```

> info **Hint** The `configure()` method can be asynchronous. Declare it with `async` to `await` the completion of an asynchronous operation inside the method body.

> warning **Warning** With the Express adapter, Nest registers the `json` and `urlencoded` body parsers (`express.json()` and `express.urlencoded()`) by default. To customize these parsers through the `MiddlewareConsumer`, disable the defaults by setting the `bodyParser` option to `false` when creating the application with `NestFactory.create()`.

#### Route wildcards

Middleware also supports pattern-based routes. For example, the named wildcard (`*splat`) matches any combination of characters in a route. In the following example, the middleware runs for any route that starts with `abcd/`, regardless of how many characters follow.

```typescript
forRoutes({
  path: 'abcd/*splat',
  method: RequestMethod.ALL,
});
```

> info **Hint** `splat` is only the name of the wildcard parameter and has no special meaning. You can use any name, e.g., `*wildcard`.

The `'abcd/*splat'` route path matches `abcd/1`, `abcd/123`, `abcd/abc`, and so on. String-based paths interpret the hyphen (`-`) and the dot (`.`) literally. However, `abcd/` with no additional characters does not match. To match it as well, wrap the wildcard in braces to make it optional:

```typescript
forRoutes({
  path: 'abcd/{*splat}',
  method: RequestMethod.ALL,
});
```

#### Middleware consumer

The `MiddlewareConsumer` is a helper class that provides several built-in methods to manage middleware. All of them can be **chained** in the [fluent style](https://en.wikipedia.org/wiki/Fluent_interface). The `forRoutes()` method accepts a single string, multiple strings, a `RouteInfo` object, a controller class, or multiple controller classes. In most cases, you'll pass a comma-separated list of **controllers**. Below is an example with a single controller:

```typescript
@@filename(app.module)
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { CatsModule } from './cats/cats.module.js';
import { CatsController } from './cats/cats.controller.js';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(CatsController);
  }
}
@@switch
import { Module } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { CatsModule } from './cats/cats.module.js';
import { CatsController } from './cats/cats.controller.js';

@Module({
  imports: [CatsModule],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(CatsController);
  }
}
```

> info **Hint** The `apply()` method accepts either a single middleware or multiple arguments to specify <a href="/middleware#multiple-middleware">multiple middleware</a>.

#### Excluding routes

To **exclude** certain routes from having middleware applied, use the `exclude()` method. It accepts a single string, multiple strings, or a `RouteInfo` object that identifies the routes to exclude:

```typescript
consumer
  .apply(LoggerMiddleware)
  .exclude(
    { path: 'cats', method: RequestMethod.GET },
    { path: 'cats', method: RequestMethod.POST },
    'cats/{*splat}',
  )
  .forRoutes(CatsController);
```

With the example above, `LoggerMiddleware` is bound to all routes defined inside `CatsController` **except** those matching the three entries passed to the `exclude()` method.

> info **Hint** The `exclude()` method supports wildcard parameters using the [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters) package.

#### Functional middleware

The `LoggerMiddleware` class we've been using is minimal: it has no members, no additional methods, and no dependencies. Middleware like this can be defined as a plain function instead of a class. This type of middleware is called **functional middleware**. Let's convert the logger middleware from a class into a function to illustrate the difference:

```typescript
@@filename(logger.middleware)
import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  console.log('Request...');
  next();
}
@@switch
export function logger(req, res, next) {
  console.log('Request...');
  next();
}
```

Then use it within the `AppModule`:

```typescript
@@filename(app.module)
consumer
  .apply(logger)
  .forRoutes(CatsController);
```

> info **Hint** Consider using **functional middleware** whenever your middleware doesn't need any dependencies.

#### Multiple middleware

To bind multiple middleware that execute sequentially, pass a comma-separated list to the `apply()` method:

```typescript
consumer.apply(cors(), helmet(), logger).forRoutes(CatsController);
```

#### Global middleware

To bind middleware to every registered route at once, use the `use()` method of the `INestApplication` instance:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.use(logger);
await app.listen(process.env.PORT ?? 3000);
```

> info **Hint** Global middleware registered with `app.use()` cannot access the DI container, so use [functional middleware](middleware#functional-middleware) there. Alternatively, use a class middleware and bind it with `.forRoutes('*')` within the `AppModule` (or any other module).

#### Error handling

When middleware throws an exception, Nest's [exceptions layer](/exception-filters) catches it and sends an appropriate response, just as it does for exceptions thrown from a route handler. The recommended approach is to throw an `HttpException` (or a built-in subclass such as `UnauthorizedException`):

```typescript
@@filename(auth.middleware)
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      throw new UnauthorizedException();
    }
    next();
  }
}
@@switch
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthMiddleware {
  use(req, res, next) {
    if (!req.headers.authorization) {
      throw new UnauthorizedException();
    }
    next();
  }
}
```

If the middleware is asynchronous, declare `use()` as `async` (or return a `Promise`) so that a rejected promise is forwarded to the exceptions layer:

```typescript
@@filename(auth.middleware)
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = await this.authService.verify(req.headers.authorization);
    if (!user) {
      throw new UnauthorizedException();
    }
    req['user'] = user;
    next();
  }
}
```

You can also pass the error to `next()`. This is useful when wrapping existing Express-style middleware that reports failures through the callback:

```typescript
use(req: Request, res: Response, next: NextFunction) {
  if (!req.headers.authorization) {
    return next(new UnauthorizedException());
  }
  next();
}
```

> warning **Warning** Because middleware runs before a route handler is selected, only **global** exception filters (registered with `app.useGlobalFilters()` or the `APP_FILTER` token) catch exceptions thrown from middleware. Method-scoped and controller-scoped filters are not invoked, and binding filters to a middleware class with `@UseFilters()` is not supported.

> info **Hint** Middleware registered with `app.use()` is handled by the underlying HTTP platform (Express or Fastify), not by Nest's `MiddlewareModule`. Prefer throwing errors (or calling `next(err)`) from middleware bound with the `MiddlewareConsumer`, so that the exceptions layer can process them.
