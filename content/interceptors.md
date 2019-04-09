### Interceptors

An interceptor is a class annotated with the `@Injectable()` decorator. Interceptors should implement the `NestInterceptor` interface.

<figure><img src="/assets/Interceptors_1.png" /></figure>

Interceptors have a set of useful capabilities which are inspired by the **Aspect-Oriented Programming** (AOP) technique. They make possible to:

- bind **extra logic** before / after method execution
- transform the result returned from a function
- **transform** the exception thrown from a function
- extend the basic function behaviour
- completely **override** a function depending on the chosen conditions (e.g. caching purposes)

#### Basics

Each interceptor has the `intercept()` method that takes 2 arguments. The first one is the `ExecutionContext` instance (exactly the same object as for [guards](/guards)). The `ExecutionContext` inherits from `ArgumentsHost`. The `ArgumentsHost` is a wrapper around arguments that have been passed to the **original** handler, and it contains different arguments array under the hood based on the type of the application. You can read more about it [here](https://docs.nestjs.com/exception-filters#arguments-host) (in the exception filters chapter).

#### Execution context

The `ExecutionContext` offers a little bit more. It extends `ArgumentsHost`, but also, provides more details about current execution process.

```typescript
export interface ExecutionContext extends ArgumentsHost {
  getClass<T = any>(): Type<T>;
  getHandler(): Function;
}
```

The `getHandler()` returns a reference to the currently processed handler, while `getClass()` returns a type of the `Controller` class which this particular handler belongs to. Using other words, if the user points to `create()` method that is defined and registered within `CatsController`, the `getHandler()` will return a reference to the `create()` method and `getClass()` in this case, will simply return a `CatsController` **type** (not instance).

#### Call handler

The second argument is a `CallHandler`. If you don't manually call `handle()` method, the main handler won't be evaluated at all. What does it mean? Basically, the `CallHandler` is an object which wraps the execution stream, and thus **defers the final handler execution**.

Let's say, someone made a POST `/cats` request. This request points to `create()` handler defined inside the `CatsController`. If an interceptor which does not call a `handle()` method is called along the way, the `create()` method won't be evaluated. Only when `handle()` is called (and its value has been returned), the final method will be triggered. Why? Because Nest **subscribes** to the returned stream and uses values that this stream produces to create either a single response or multiple responses for the end-user. Moreover, `handle()` returns an `Observable`, meaning, it supplies us with a set of very powerful operators that helps with, for example, response manipulation.

#### Aspect interception

The first use case is to use the interceptor to add extra logic either before or after the function execution. It's useful when we're gonna **log interaction** with the application, e.g. storing user calls, asynchronously dispatching events or calculating the timestamp. As an example, let's create a simple `LoggingInterceptor`.

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
import { Observable } from 'rxjs';
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

> info **Hint** The `NestInterceptor<T, R>` is a generic interface in which `T` indicates a type of the processed `Observable<T>` (behind the stream), while `R` the return type of the value wrapped into returned `Observable<R>`.

> warning **Notice** Interceptors act the same as controllers, providers, guards, and so on, meaning, they can **inject dependencies** through the `constructor`.

Since `handle()` returns an RxJS `Observable`, we have a lot of various operators which we can use to manipulate the stream. In the example above, We used the `tap()` operator that invokes the function upon graceful or exceptional termination of the observable sequence.

#### Binding interceptors

In order to set up the interceptor, we use the `@UseInterceptors()` decorator imported from the `@nestjs/common` package. Same as [guards](/guards), interceptors can be controller-scoped, method-scoped, and global-scoped as well.

```typescript
@@filename(cats.controller)
@UseInterceptors(LoggingInterceptor)
export class CatsController {}
```

> info **Hint** The `@UseInterceptors()` decorator is imported from the `@nestjs/common` package.

Thanks to that, each route handler defined in `CatsController` will use `LoggingInterceptor`. When someone calls the GET `/cats` endpoint, you'll see a following output in your console window:

```typescript
Before...
After... 1ms
```

Note that we passed the `LoggingInterceptor` type instead of an instance, leaving framework the instantiation responsibility and enabling dependency injection. Another available way is to pass the immediately created instance:

```typescript
@@filename(cats.controller)
@UseInterceptors(new LoggingInterceptor())
export class CatsController {}
```

As mentioned before, the construction above attaches the interceptor to every handler declared by this controller. If we decide to restrict only one of them, we just need to set up the interceptor at **method level**. In order to bind the global interceptor, we use the `useGlobalInterceptors()` method of the Nest application instance:

```typescript
const app = await NestFactory.create(ApplicationModule);
app.useGlobalInterceptors(new LoggingInterceptor());
```

The global interceptors are used across the whole application, for every controller and every route handler. In terms of dependency injection, global interceptors registered from the outside of any module (as in the previous example above) cannot inject dependencies since they don't belong to any module. In order to solve this issue, you can set up an interceptor **directly from any module** using following construction:

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
export class ApplicationModule {}
```

> info **Hint** The alternative option is to use an [application context](/application-context) feature. Also, `useClass` is not the only way of dealing with custom providers registration. Learn more [here](/fundamentals/dependency-injection).

#### Response mapping

We already know that `handle()` returns an `Observable`. The stream contains the value **returned** from the route handler, and thus we can easily mutate it using the `map()` operator.

> warning **Warning** The response mapping feature doesn't work with the library-specific response strategy (using the `@Res()` object directly is forbidden).

Let's create the `TransformInterceptor` that will take each response and modify it by assigning to the `data` property of the newly created object.

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

> info **Hint** Nest interceptors work like a charm with asynchronous `intercept()` methods, meaning, you can effortlessly switch your method to `async` if necessary.

Afterward, when someone calls the GET `/cats` endpoint, the request would look like below (assuming that route handler returns an empty array `[]`):

```json
{
  "data": []
}
```

The interceptors have a huge potential when it comes to creating reusable solutions used in whole applications. For example, let's imagine that we need to transform each occurred `null` value to empty string `''`. We can do it using one line of code and bind interceptor as a global one. Thanks to that, it'll be automatically reused by each registered handler.

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

Another interesting use-case is to take advantage of the `catchError()` operator to override thrown exceptions:

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
        catchError(err => throwError(new BadGatewayException())),
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
        catchError(err => throwError(new BadGatewayException())),
      );
  }
}
```

#### Stream overriding

There are several reasons why sometimes we might want to completely prevent calling the handler and return a different value instead (e.g. from cache due to performance issues). An excellent example is a **cache interceptor** that would store the cached responses with some TTL. Unfortunately, this feature needs a bit more code and due to simplification, we'll provide only a basic example that should briefly explain the main concept.

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

Here's a `CacheInterceptor` with a hardcoded `isCached` variable and the hardcoded response `[]` as well. We returned a new stream here, created through the `of` operator, therefore the route handler **won't be called** at all. When someone calls endpoint that makes use of `CacheInterceptor`, the response (a hardcoded, empty array) will be returned immediately. In order to create a generic solution, you can take advantage of `Reflector` and create a custom decorator. The `Reflector` is well described in the [guards](/guards) chapter.

#### More operators

The possibility of returning the stream gives us many possibilities. Let's think about another common use-case. Imagine you would like to handle **timeouts**. When your endpoint doesn't return anything after a period of time, we want to respond with an error response.

```typescript
@@filename(timeout.interceptor)
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(timeout(5000))
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor {
  intercept(context, next) {
    return next.handle().pipe(timeout(5000))
  }
}
```

After 5 seconds the request processing will be canceled.
