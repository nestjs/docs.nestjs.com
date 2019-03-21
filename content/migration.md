### Migration guide

This article provides a set of **guidelines** for migrating from 5 to the latest 6 version. Even though we tried to reduce a number of breaking changes, the API had to be modified in a few places in order to simplify its usage.

#### Middleware

Based on [this](https://github.com/nestjs/nest/issues/1378) topic, the middleware API has been changed in order to make it more straightforward for people who come from different Node libraries and also to reduce the number of confusions that arose from the previous API.

```typescript
@@filename()
// Before
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
 resolve(...args: any[]): MiddlewareFunction {
   return (req: Request, res: Response, next: Function) => {
     console.log('Request...');
     next();
   };
 }
}

// After
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function) {
    console.log('Request...');
    next();
  }
}
@@switch
@Injectable()
export class LoggerMiddleware {
 resolve(...args) {
   return (req, res, next) => {
     console.log('Request...');
     next();
   };
 }
}

// After
@Injectable()
export class LoggerMiddleware {
  use(req, res, next) {
    console.log('Request...');
    next();
  }
}
```

Consequently, the `with()` method of the `MiddlewareConsumer` won't work anymore (is fully useless). If you want to pass options to the middleware class, use a [custom provider](/fundamentals/custom-providers) or check more examples [here](https://github.com/nestjs/nest/issues/1378).

#### Interceptors

The interceptors API has also been simplified. In addition, the change was required due to this [issue](https://github.com/nestjs/nest/issues/1016) which was reported by the community.

```typescript
@@filename()
// Before
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    call$: Observable<T>,
  ): Observable<Response<T>> {
    return call$.pipe(map(data => ({ data })));
  }
}

// After
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next
      .handle()
      .pipe(map(data => ({ data })));
  }
}
@@switch
// Before
@Injectable()
export class TransformInterceptor {
  intercept(context, next) {
    return call$.pipe(map(data => ({ data })));
  }
}

// After
@Injectable()
export class TransformInterceptor {
  intercept(context, next) {
    return next
      .handle()
      .pipe(map(data => ({ data })));
  }
}
```

> info **Hint** The `CallHandler` interface is exported from the `@nestjs/common` package.

Please note that your interceptors will now run in the correct order - they will follow a simple request processing pipeline, being executed from global to concrete once the request wants to hit an end-handler, and then (in response pipeline), they will be executed from specific to global ones (if you attach some asynchronous/mapping logic inside them).

#### Platforms

So far, even if you were not using an HTTP server, you had to install the `express` library internally (as a dependency of the `@nestjs/core` package). Since a new major release, Nest will no longer ship these packages upfront. Each platform has been extracted into an individual package, respectively `@nestjs/platform-express`, `@nestjs/platform-fastify`, `@nestjs/platform-ws`, and `@nestjs/platform-socket.io`. Assuming that your application was using both `express` and `socket.io`, you only have to install the corresponding platforms:

```bash
$ npm i @nestjs/platform-express @nestjs/platform-socket.io
```

Every existing adapter (for example, `FastifyAdapter`) is now being served from the dedicated platform package.

- `FastifyAdapter` - `@nestjs/platform-fastify`
- `ExpressAdapter` - `@nestjs/platform-express`
- `WsAdapter` - `@nestjs/platform-ws`
- `IoAdapter` - `@nestjs/platform-socket.io`

Also, `FileInterceptor` (and other `multer` related interceptors) are now exported from `@nestjs/platform-express` (because `multer` library is not compatible with `fastify`). 

#### Metadata reflection

The `@ReflectMetadata()` decorator has been deprecated and will be removed in the next major release (for now it will only display a warning). Use the `@SetMetadata()` decorator instead.

#### GraphQL

The subscriptions mechanism has been changed. Check [this](/graphql/subscriptions) chapter for more details. Additionally, `@nestjs/graphql` package was heavily relying on `@ReflectMetadata()` (which has been deprecated) so it's required to update the package itself as well.

#### Express instance

We no longer support passing `express` instance as a second argument of the `NestFactory.create()` method. In order to pluck underlying HTTP adapter, use techniques described [here](/faq/http-adapter). Also, you can pass `ExpressAdapter` instead (simply pass your `express` instance as a constructor parameter `new ExpressAdapter(express)`).

```typescript
// Before (no longer supported)
const server = express();
const app = await NestFactory.create(ApplicationModule, server);

// After (potential solution)
const server = express();
const app = await NestFactory.create(
  ApplicationModule,
  new ExpressAdapter(server),
);
```

#### Deprecations

All deprecations (from 4 to 5 version) have been finally removed.

#### TypeScript

Nest 6 supports the latest major release of [TypeScript](https://www.typescriptlang.org/) (3.0.0).
