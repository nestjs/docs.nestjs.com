### Migration guide

This article provides a set of **guidelines** to migrate from 4 to latest 5 version. During the development, we spent a lot of time trying to avoid any breaking changes. Nevertheless, the API had to change in a bunch of places in order to simplify its usage. Also, the previous version has been limited due to decisions that have been made at the very early stage. Now, we are less opinionated and even more powerful than before.

#### Modules

In order to decrease the number of differences between Nest and [Angular](https://angular.io/), few changes have been made regarding `@Module()` decorator.

- `modules` property is now deprecated. Use `imports` instead
- `components` property is now deprecated. Use `providers` instead

#### Decorators

The `@Component()`, `@Middleware()`, `@Interceptor()`, `@Pipe()`, and `@Guard()` are deprecated now. Use `@Injectable()` instead.

#### Middleware interfaces

The `MiddlewaresConsumer` class has been changed to `MiddlewareConsumer`. Also, the `ExpressMiddleware` no longer exists, use `MiddlewareFunction` interface instead.

#### Filters

The exception filters aren't locked in as single-paradigm anymore. Previously, an exception filter had an access to the `response` object. Together with an incoming release, `catch()` method takes `ArgumentsHost` instance instead. This object is well described [here](/exception-filters). Thanks to that, you have an access to each argument, including `response` object.

```typescript
@@filename()
// Before
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, response) {}
}

// After
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    // ...
  }
}
@@switch
// Before
@Catch(HttpException)
export class HttpExceptionFilter {
  catch(exception, response) {}
}

// After
@Catch(HttpException)
export class HttpExceptionFilter {
  catch(exception, host) {
    const response = host.switchToHttp().getResponse();
    // ...
  }
}
```

#### Guards

The same as filters, guards are far more **flexible** now. An access to the enhanced `ExecutionContext` ([read more](/guards)) gives guards more superpowers and all of that has been built on top of simplified API.

```typescript
@@filename()
// Before
@Guard()
export class RolesGuard implements CanActivate {
  canActivate(
    dataOrRequest,
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}

// After
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // const request = context.switchToHttp().getRequest();
    // const data = context.switchToWs().getData();
    return true;
  }
}
@@switch
// Before
@Guard()
export class RolesGuard {
  canActivate(dataOrRequest, context) {
    return true;
  }
}

// After
@Injectable()
export class RolesGuard {
  canActivate(context) {
    // const request = context.switchToHttp().getRequest();
    // const data = context.switchToWs().getData();
    return true;
  }
}
```

#### Interceptors

The interceptors API evolved in the exact same way as **equivalent** guards API.

```typescript
@@filename()
// Before
@Interceptor()
export class TransformInterceptor implements NestInterceptor {
  intercept(
    dataOrRequest,
    context: ExecutionContext,
    stream$: Observable<any>,
  ): Observable<any> {
    return stream$.map((data) => ({ data }));
  }
}

// After
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    call$: Observable<T>,
  ): Observable<Response<T>> {
    // const request = context.switchToHttp().getRequest();
    // const data = context.switchToWs().getData();
    return call$.pipe(map(data => ({ data })));
  }
}
@@switch
// Before
@Interceptor()
export class TransformInterceptor {
  intercept(dataOrRequest, context, stream$) {
    return stream$.map((data) => ({ data }));
  }
}

// After
@Injectable()
export class TransformInterceptor {
  intercept(context, call$) {
    // const request = context.switchToHttp().getRequest();
    // const data = context.switchToWs().getData();
    return call$.pipe(map(data => ({ data })));
  }
}
```

#### Custom decorators

The `createRouteParamDecorator()` function is deprecated. Use `createParamDecorator()` now.

#### Node.js

We follow the Node.js release schedule which recently moved to `8.x` as an active **LTS** version. Therefore, Nest 5 supports >= `8.9.0` as the lowest version now. This shift gave us sustainable performance boosts thanks to the `es2017` target of the TypeScript compilation.

#### External libraries

Nest 5 doesn't support [rxjs](https://github.com/ReactiveX/rxjs) < 6.0.0. Keep in mind to upgrade this package as well.
