### Interceptors

An interceptor is a class annotated with the `@Injectable()` decorator that implements the `NestInterceptor` interface.

<figure><img class="illustrative-image" src="/assets/Interceptors_1.png" /></figure>

Interceptors offer a set of capabilities inspired by the [Aspect Oriented Programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming) (AOP) technique. They make it possible to:

- bind extra logic before or after method execution
- transform the result returned from a function
- transform the exception thrown from a function
- extend the basic function behavior
- completely override a function depending on specific conditions (e.g., for caching purposes)

#### Basics

Each interceptor implements the `intercept()` method, which takes two arguments. The first is the `ExecutionContext` instance (exactly the same object as for [guards](/guards)). `ExecutionContext` extends `ArgumentsHost`, which we covered in the exception filters chapter. There, we saw that it's a wrapper around the arguments passed to the original handler, and that it contains different argument arrays depending on the type of application. See the [exception filters](/exception-filters#arguments-host) chapter for more on this topic.

#### Execution context

By extending `ArgumentsHost`, `ExecutionContext` adds several helper methods that provide additional details about the current execution process. These details help you build more generic interceptors that work across a broad set of controllers, methods, and execution contexts. See the [execution context](/fundamentals/execution-context) chapter to learn more about `ExecutionContext`.

#### Call handler

The second argument is a `CallHandler`. The `CallHandler` interface exposes a `handle()` method, which you use to invoke the route handler method at some point in your interceptor. If you don't call `handle()` in your implementation of the `intercept()` method, the route handler method won't be executed at all.

This means that the `intercept()` method effectively **wraps** the request/response stream. As a result, you can implement custom logic **both before and after** the execution of the final route handler. Running code **before** the handler is straightforward: place it before the `handle()` call. To act on what happens afterward, use the `Observable` that `handle()` returns: you can apply [RxJS](https://github.com/ReactiveX/rxjs) operators to it to further manipulate the response. In Aspect Oriented Programming terminology, the invocation of the route handler (i.e., calling `handle()`) is called a [Pointcut](https://en.wikipedia.org/wiki/Pointcut), indicating that it's the point at which our additional logic is inserted.

Consider, for example, an incoming `POST /cats` request. This request is destined for the `create()` handler defined inside `CatsController`. If an interceptor that doesn't call `handle()` is invoked anywhere along the way, the `create()` method won't be executed. Once `handle()` is called and the `Observable` it returns is subscribed to (Nest subscribes to the stream your `intercept()` method returns), the `create()` handler is triggered. As the handler's result flows through the stream, you can apply additional operations to it before the final result is returned to the caller.

<app-banner-devtools></app-banner-devtools>

#### Aspect interception

The first use case we'll look at is using an interceptor to log user interaction (e.g., storing user calls, asynchronously dispatching events, or calculating a timestamp). The following example shows a simple `LoggingInterceptor`:

```typescript
@@filename(logging.interceptor)
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before...');

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => console.log(`After... ${Date.now() - now}ms`)),
      );
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor {
  intercept(context, next) {
    console.log('Before...');

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => console.log(`After... ${Date.now() - now}ms`)),
      );
  }
}
```

> info **Hint** `NestInterceptor<T, R>` is a generic interface in which `T` is the type of the values emitted by the `Observable<T>` that `next.handle()` returns (the response stream), and `R` is the type of the values emitted by the `Observable<R>` that `intercept()` returns.

> warning **Notice** Interceptors, like controllers, providers, guards, and so on, can **inject dependencies** through their `constructor`.

Since `handle()` returns an RxJS `Observable`, you can choose from a wide range of operators to manipulate the stream. The example above uses the `tap()` operator, which calls our logging function when the stream emits the route handler's result, without otherwise interfering with the response cycle. Note that this function is not called if the route handler throws; to run logic in that case as well, pass an observer object with an `error` callback to `tap()`, or use the `finalize()` operator.

> info **Hint** Timing a handler by hand, as above, is a minimal version of what an APM does. [NestJS Observe](https://www.observe.nestjs.com/ 'NestJS Observe') records the same measurement for every controller, provider, and queue consumer, with no interceptor to write or bind. It also records the time each one spent on its own, with everything it awaited subtracted out. See the [Observability](/observability/overview) chapter.

#### Binding interceptors

To set up the interceptor, use the `@UseInterceptors()` decorator. Like [pipes](/pipes) and [guards](/guards), interceptors can be controller-scoped, method-scoped, or global-scoped.

```typescript
@@filename(cats.controller)
@UseInterceptors(LoggingInterceptor)
export class CatsController {}
```

> info **Hint** The `@UseInterceptors()` decorator is imported from the `@nestjs/common` package.

With the construction above, each route handler defined in `CatsController` uses `LoggingInterceptor`. When a client calls the `GET /cats` endpoint, you'll see the following in standard output:

```typescript
Before...
After... 1ms
```

Note that we passed the `LoggingInterceptor` class (instead of an instance), leaving responsibility for instantiation to the framework and enabling dependency injection. As with pipes, guards, and exception filters, you can also pass an in-place instance:

```typescript
@@filename(cats.controller)
@UseInterceptors(new LoggingInterceptor())
export class CatsController {}
```

The construction above attaches the interceptor to every handler declared by this controller. To restrict the interceptor to a single method, apply the decorator at the **method level**.

To set up a global interceptor, use the `useGlobalInterceptors()` method of the Nest application instance:

```typescript
const app = await NestFactory.create(AppModule);
app.useGlobalInterceptors(new LoggingInterceptor());
```

Global interceptors apply to every controller and every route handler in the application. However, a global interceptor registered outside of any module (with `useGlobalInterceptors()`, as in the example above) cannot inject dependencies, because the registration happens outside the context of any module. To solve this, register the interceptor **directly from any module** using the following construction:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

> info **Hint** When you use this approach to perform dependency injection for the interceptor, the interceptor is global regardless of the module in which you register it. We recommend registering it in the module where the interceptor (`LoggingInterceptor` in the example above) is defined. Also, `useClass` is not the only way to register a custom provider. See [Custom providers](/fundamentals/custom-providers) to learn more.

#### Response mapping

The stream returned by `handle()` contains the value **returned** from the route handler, so you can transform it with RxJS's `map()` operator.

> warning **Warning** Response mapping doesn't work with the library-specific response strategy, i.e., when a route handler injects the response object with `@Res()` and sends the response itself. To combine the two, enable the `passthrough` option (see [Library-specific approach](/controllers#library-specific-approach)).

Let's create a `TransformInterceptor` that modifies each response in a trivial way to demonstrate the process. It uses RxJS's `map()` operator to assign the response object to the `data` property of a newly created object, and returns the new object to the client.

```typescript
@@filename(transform.interceptor)
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(map(data => ({ data })));
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor {
  intercept(context, next) {
    return next.handle().pipe(map(data => ({ data })));
  }
}
```

> info **Hint** The `intercept()` method can be synchronous or asynchronous. Declare it `async` if you need to await something before returning the stream.

With this interceptor bound, a `GET /cats` request whose route handler returns an empty array `[]` produces the following response:

```json
{
  "data": []
}
```

Interceptors are well suited to building reusable solutions for requirements that span the entire application. For example, imagine you need to replace every `null` response value with an empty string `''`. You can do this with one line of code, and bind the interceptor globally so that every registered handler uses it automatically.

```typescript
@@filename()
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeNullInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(map(value => value === null ? '' : value ));
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeNullInterceptor {
  intercept(context, next) {
    return next
      .handle()
      .pipe(map(value => value === null ? '' : value ));
  }
}
```

#### Exception mapping

Another use case is overriding thrown exceptions with RxJS's `catchError()` operator:

```typescript
@@filename(errors.interceptor)
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  BadGatewayException,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(
        catchError(err => throwError(() => new BadGatewayException())),
      );
  }
}
@@switch
import { Injectable, BadGatewayException } from '@nestjs/common';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor {
  intercept(context, next) {
    return next
      .handle()
      .pipe(
        catchError(err => throwError(() => new BadGatewayException())),
      );
  }
}
```

#### Stream overriding

Sometimes you may want to skip calling the handler entirely and return a different value instead. A typical example is a cache that improves response time. Let's look at a simple **cache interceptor** that returns its response from a cache. A realistic implementation would also need to consider factors such as TTL, cache invalidation, and cache size, which are beyond the scope of this discussion. The following basic example demonstrates the main concept.

```typescript
@@filename(cache.interceptor)
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isCached = true;
    if (isCached) {
      return of([]);
    }
    return next.handle();
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { of } from 'rxjs';

@Injectable()
export class CacheInterceptor {
  intercept(context, next) {
    const isCached = true;
    if (isCached) {
      return of([]);
    }
    return next.handle();
  }
}
```

Our `CacheInterceptor` has a hardcoded `isCached` variable and a hardcoded response `[]`. The key point is that it returns a new stream, created by RxJS's `of()` function, so the route handler **won't be called** at all. When someone calls an endpoint that uses `CacheInterceptor`, the response (a hardcoded, empty array) is returned immediately. To build a generic solution, use `Reflector` together with a custom decorator, as described in the [guards](/guards) chapter.

#### More operators

Manipulating the stream with RxJS operators opens up many possibilities. Consider another common use case: handling **timeouts** on route requests. If an endpoint doesn't return anything within a given period, you want to terminate the request with an error response. The following construction enables this:

```typescript
@@filename(timeout.interceptor)
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(5000),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  }
}
@@switch
import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor {
  intercept(context, next) {
    return next.handle().pipe(
      timeout(5000),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  }
}
```

If the route handler doesn't emit a result within 5 seconds, `timeout()` fails the stream with a `TimeoutError`, which the interceptor maps to a `RequestTimeoutException`. Unsubscribing from the handler's stream doesn't abort work the handler has already started (such as a pending database query), so add custom logic before throwing `RequestTimeoutException` if you need to release resources.
