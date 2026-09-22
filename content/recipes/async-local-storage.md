### Async Local Storage

`AsyncLocalStorage` is a [Node.js API](https://nodejs.org/api/async_context.html#class-asynclocalstorage) (based on the `async_hooks` API) that provides an alternative way of propagating local state through the application without explicitly passing it as a function parameter. It's similar to thread-local storage in other languages.

The main idea of Async Local Storage is that you can _wrap_ a function call with the `AsyncLocalStorage#run` call. All code invoked within the wrapped call gets access to the same `store`, which is unique to each call chain.

In the context of NestJS, this means that if you find a place within the request's lifecycle to wrap the rest of the request's code, you can access and modify state visible only to that request. This can serve as an alternative to REQUEST-scoped providers, avoiding some of their limitations.

Alternatively, you can use ALS to propagate context for only a part of the system (e.g., the _transaction_ object) without passing it around explicitly across services, which can increase isolation and encapsulation.

If your application is instrumented with [NestJS Observe](/observability/overview), you already have a request-scoped store and don't need to build one. See the [NestJS Observe](/recipes/async-local-storage#nestjs-observe) section below.

#### Custom implementation

The NestJS core framework doesn't provide a built-in abstraction for `AsyncLocalStorage`, so let's walk through how to implement it yourself for the simplest HTTP case, to get a better understanding of the whole concept:

> info **Hint** For ready-made solutions, see the [`@nestjs/observe`](/recipes/async-local-storage#nestjs-observe) and [`nestjs-cls`](/recipes/async-local-storage#nestjs-cls) sections below.

1. First, create a new instance of `AsyncLocalStorage` in a shared source file. Since we're using NestJS, let's also turn it into a module with a custom provider.

```ts
@@filename(als.module)
@Module({
  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage(),
    },
  ],
  exports: [AsyncLocalStorage],
})
export class AlsModule {}
```
> info **Hint** `AsyncLocalStorage` is imported from `node:async_hooks`.

2. We're only concerned with HTTP, so let's use a middleware to wrap the `next` function with `AsyncLocalStorage#run`. Since middleware is the first thing a request hits, this makes the `store` available in all enhancers and the rest of the system.

```ts
@@filename(app.module)
@Module({
  imports: [AlsModule],
  providers: [CatsService],
  controllers: [CatsController],
})
export class AppModule implements NestModule {
  constructor(
    // inject the AsyncLocalStorage in the module constructor,
    private readonly als: AsyncLocalStorage
  ) {}

  configure(consumer: MiddlewareConsumer) {
    // bind the middleware,
    consumer
      .apply((req, res, next) => {
        // populate the store with some default values
        // based on the request,
        const store = {
          userId: req.headers['x-user-id'],
        };
        // and pass the "next" function as callback
        // to the "als.run" method together with the store.
        this.als.run(store, () => next());
      })
      .forRoutes('*path');
  }
}
@@switch
@Module({
  imports: [AlsModule],
  providers: [CatsService],
  controllers: [CatsController],
})
@Dependencies(AsyncLocalStorage)
export class AppModule {
  constructor(als) {
    // inject the AsyncLocalStorage in the module constructor,
    this.als = als;
  }

  configure(consumer) {
    // bind the middleware,
    consumer
      .apply((req, res, next) => {
        // populate the store with some default values
        // based on the request,
        const store = {
          userId: req.headers['x-user-id'],
        };
        // and pass the "next" function as callback
        // to the "als.run" method together with the store.
        this.als.run(store, () => next());
      })
      .forRoutes('*path');
  }
}
```

3. Now you can access the local store instance anywhere within the lifecycle of a request.

```ts
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    // We can inject the provided ALS instance.
    private readonly als: AsyncLocalStorage,
    private readonly catsRepository: CatsRepository,
  ) {}

  getCatForUser() {
    // The "getStore" method will always return the
    // store instance associated with the given request.
    const userId = this.als.getStore()["userId"] as number;
    return this.catsRepository.getForUser(userId);
  }
}
@@switch
@Injectable()
@Dependencies(AsyncLocalStorage, CatsRepository)
export class CatsService {
  constructor(als, catsRepository) {
    // We can inject the provided ALS instance.
    this.als = als;
    this.catsRepository = catsRepository;
  }

  getCatForUser() {
    // The "getStore" method will always return the
    // store instance associated with the given request.
    const userId = this.als.getStore()["userId"];
    return this.catsRepository.getForUser(userId);
  }
}
```

4. You now have a way to share request-related state without injecting the whole `REQUEST` object.

> warning **Warning** While this technique is useful for many use cases, it inherently obscures the code flow (by creating implicit context), so use it responsibly, and especially avoid creating contextual "[God objects](https://en.wikipedia.org/wiki/God_object)".

### NestJS Observe

If you run [NestJS Observe](/observability/overview), the `@nestjs/observe` SDK already maintains an `AsyncLocalStorage` store for every request, job, and message it instruments. This store carries the trace context through your call stack. `TracerService` exposes it, so request-scoped state is something you read and write rather than something you set up: there's no module to write, no middleware to mount, and nothing to re-wire per transport.

> info **Hint** This is the same `TracerService` documented in [Manual instrumentation](/observability/manual-instrumentation). This section covers only its async local storage side; spans, handled errors, and custom metrics are described there.

#### Setup

No setup is needed beyond the standard SDK integration described in [Observability → SDK](/observability/sdk): install the package, import `ObserveModule.forRoot()`, and pass `ObserveInstrument` to `NestFactory.create()`.

```bash
$ npm i @nestjs/observe
```

`ObserveModule` exports `TracerService`, so you can inject it anywhere in your application:

```ts
@@filename(cats.service)
import { Injectable } from '@nestjs/common';
import { TracerService } from '@nestjs/observe';

@Injectable()
export class CatsService {
  constructor(private readonly tracerService: TracerService) {}
}
```

#### Reading and writing the store

`setAttribute(key, value)` writes to the current context store, and `getAttribute(key)` reads the value back from anywhere downstream on the same request (a different service, a guard, or an interceptor) without threading it through every function signature:

```ts
@@filename(cats.controller)
@Get()
findAll(@Req() req: Request) {
  this.tracerService.setAttribute('userId', req.headers['x-user-id']);
  return this.catsService.getCatForUser();
}
```

```ts
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    private readonly tracerService: TracerService,
    private readonly catsRepository: CatsRepository,
  ) {}

  getCatForUser() {
    const userId = this.tracerService.getAttribute('userId');
    return this.catsRepository.getForUser(userId);
  }
}
```

`getAttribute()` returns `undefined` for a key that was never set. Both methods throw when called outside a traced context, since there's no store to read from or write to. If a value may legitimately be read before any request exists, guard the call accordingly.

#### Typing the store

Pass the shape of your store as the first type argument of `TracerService` to have keys and values type-checked, including nested paths:

```ts
interface RequestStore {
  userId: number;
  flags: { betaCheckout: boolean };
}

@Injectable()
export class CatsService {
  constructor(private readonly tracerService: TracerService<RequestStore>) {}

  enableBeta() {
    this.tracerService.setAttribute('flags.betaCheckout', true);
  }
}
```

#### Beyond HTTP

Because the store is created by the instrumentation rather than by a middleware, it exists wherever the SDK traces an operation: HTTP and GraphQL requests, gRPC and `@nestjs/microservices` messages, and background work such as BullMQ consumers and cron runs. The pattern above is identical in all of them. This is the practical difference from a hand-rolled, middleware-based implementation, which only covers HTTP.

The store also holds the current trace ID, so it doubles as the correlation key for logs and downstream services. `currentTraceId()` returns it. Unlike `getAttribute()`, it returns `null` outside a traced context instead of throwing:

```ts
const traceId = this.tracerService.currentTraceId();
```

> info **Hint** `ObserveModule` also exports the underlying `AsyncLocalStorage` instance. `setAttribute()` and `getAttribute()` are the supported way to access the store; inject the instance directly only if you need something they don't expose.

### NestJS CLS

The [nestjs-cls](https://github.com/Papooch/nestjs-cls) package provides several developer experience improvements over plain `AsyncLocalStorage` (`CLS` is an abbreviation of _continuation-local storage_). It abstracts the implementation into a `ClsModule` that offers various ways of initializing the `store` for different transports (not only HTTP), as well as strong typing support.

You can then access the store with an injectable `ClsService`, or abstract it away from the business logic entirely by using [Proxy Providers](https://www.npmjs.com/package/nestjs-cls#proxy-providers).

> info **Note** `nestjs-cls` is a third-party package and is not managed by the NestJS core team. Please report any issues with the library in the [nestjs-cls repository](https://github.com/Papooch/nestjs-cls/issues).

#### Installation

Apart from peer dependencies on the `@nestjs` packages, it uses only built-in Node.js APIs. Install it like any other package:

```bash
$ npm i nestjs-cls
```

#### Usage

You can implement functionality similar to the [custom implementation](/recipes/async-local-storage#custom-implementation) above using `nestjs-cls`, as follows:

1. Import the `ClsModule` in the root module.

```ts
@@filename(app.module)
@Module({
  imports: [
    // Register the ClsModule,
    ClsModule.forRoot({
      middleware: {
        // automatically mount the
        // ClsMiddleware for all routes
        mount: true,
        // and use the setup method to
        // provide default store values.
        setup: (cls, req) => {
          cls.set('userId', req.headers['x-user-id']);
        },
      },
    }),
  ],
  providers: [CatsService],
  controllers: [CatsController],
})
export class AppModule {}
```

2. Then use the `ClsService` to access the store values.

```ts
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    // We can inject the provided ClsService instance,
    private readonly cls: ClsService,
    private readonly catsRepository: CatsRepository,
  ) {}

  getCatForUser() {
    // and use the "get" method to retrieve any stored value.
    const userId = this.cls.get('userId');
    return this.catsRepository.getForUser(userId);
  }
}
@@switch
@Injectable()
@Dependencies(ClsService, CatsRepository)
export class CatsService {
  constructor(cls, catsRepository) {
    // We can inject the provided ClsService instance,
    this.cls = cls;
    this.catsRepository = catsRepository;
  }

  getCatForUser() {
    // and use the "get" method to retrieve any stored value.
    const userId = this.cls.get('userId');
    return this.catsRepository.getForUser(userId);
  }
}
```

3. To get strong typing of the store values managed by the `ClsService` (and auto-suggestions for the string keys), use the optional type parameter `ClsService<MyClsStore>` when injecting it.

```ts
export interface MyClsStore extends ClsStore {
  userId: number;
}
```

> info **Hint** You can also let the package automatically generate a request ID and access it later with `cls.getId()`, or get the whole request object using `cls.get(CLS_REQ)`.

#### Testing

Since the `ClsService` is just another injectable provider, you can mock it out entirely in unit tests.

However, in certain integration tests, you might still want to use the real `ClsService` implementation. In that case, wrap the context-aware piece of code with a call to `ClsService#run` or `ClsService#runWith`:

```ts
describe('CatsService', () => {
  let service: CatsService
  let cls: ClsService
  const mockCatsRepository = createMock<CatsRepository>()

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      // Set up most of the testing module as we normally would.
      providers: [
        CatsService,
        {
          provide: CatsRepository,
          useValue: mockCatsRepository,
        }
      ],
      imports: [
        // Import the static version of ClsModule which only provides
        // the ClsService, but does not set up the store in any way.
        ClsModule
      ],
    }).compile()

    service = module.get(CatsService)

    // Also retrieve the ClsService for later use.
    cls = module.get(ClsService)
  })

  describe('getCatForUser', () => {
    it('retrieves cat based on user id', async () => {
      const expectedUserId = 42
      mockCatsRepository.getForUser.mockImplementationOnce(
        (id) => ({ userId: id })
      )

      // Wrap the test call in the `runWith` method
      // in which we can pass hand-crafted store values.
      const cat = await cls.runWith(
        { userId: expectedUserId },
        () => service.getCatForUser()
      )

      expect(cat.userId).toEqual(expectedUserId)
    })
  })
})
```

#### More information

Visit the [nestjs-cls GitHub page](https://github.com/Papooch/nestjs-cls) for the full API documentation and more code examples.
