### Pre-request hooks

Pre-request hooks are functions that run before all enhancers (guards, interceptors, and pipes) on every invocation of a pattern handler. They are the microservices equivalent of HTTP middleware: a place to establish per-request context that must be visible to guards and the rest of the pipeline.

> info **Hint** The `PreRequestHook` interface is exported from the `@nestjs/common` package.

Hooks run at the start of the following sequence:

```
Incoming message
  └─ Pre-request hooks  (registration order)
       └─ Guards
            └─ Interceptors
                 └─ Pipes
                      └─ Handler
```

Exceptions thrown inside a hook are caught by the same wrapper that covers the rest of the pipeline, so your existing [exception filters](/microservices/exception-filters) handle them without extra configuration.

#### Binding hooks

Register hooks on the microservice instance with the `registerPreRequestHook()` method, before the microservice is initialized (i.e., before calling `app.listen()` or `app.init()`). Hooks registered after initialization are ignored, and Nest logs a warning. Multiple calls accumulate hooks in registration order.

Each hook receives an `ExecutionContext` and a `next` function. Calling `next()` advances to the next hook or, when no hooks remain, to the guard → interceptor → pipe → handler pipeline. The hook must return an `Observable`: either the one produced by `next()`, or one that wraps it.

> warning **Warning** If a hook doesn't call `next()`, the handler never runs. This is the same contract as HTTP middleware.

> info **Note** In a [hybrid application](/faq/hybrid-application), `connectMicroservice()` initializes the connected microservice immediately (unless you pass `deferInitialization: true` in its second argument), so hooks registered on the returned instance afterward are not applied.

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    { transport: Transport.TCP },
  );

  app.registerPreRequestHook((ctx, next) => {
    return next();
  });

  await app.listen();
}
await bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
  });

  app.registerPreRequestHook((ctx, next) => {
    return next();
  });

  await app.listen();
}
await bootstrap();
```

#### AsyncLocalStorage propagation

A common use case is initializing `AsyncLocalStorage` before guards run, which makes the store available throughout the entire pipeline:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module.js';

export const als = new AsyncLocalStorage<{ correlationId: string }>();

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    { transport: Transport.TCP },
  );

  app.registerPreRequestHook((ctx, next) => {
    return new Observable(subscriber => {
      als.run({ correlationId: randomUUID() }, () => {
        next().subscribe(subscriber);
      });
    });
  });

  await app.listen();
}
await bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module.js';

export const als = new AsyncLocalStorage();

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
  });

  app.registerPreRequestHook((ctx, next) => {
    return new Observable(subscriber => {
      als.run({ correlationId: randomUUID() }, () => {
        next().subscribe(subscriber);
      });
    });
  });

  await app.listen();
}
await bootstrap();
```

Because the hook runs before the guards, `als.getStore()` returns the initialized store in any guard, interceptor, or handler:

```typescript
@@filename(correlation.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { als } from './main.js';

@Injectable()
export class CorrelationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { correlationId } = als.getStore()!;
    return true;
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { als } from './main.js';

@Injectable()
export class CorrelationGuard {
  canActivate(context) {
    const { correlationId } = als.getStore();
    return true;
  }
}
```

#### Logging and metrics

You can apply RxJS operators to the `Observable` returned by `next()` to observe the full handler lifecycle:

```typescript
@@filename(main)
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

app.registerPreRequestHook((ctx, next) => {
  const handler = ctx.getHandler().name;
  const start = Date.now();

  return next().pipe(
    tap(() => console.log(`[${handler}] completed in ${Date.now() - start}ms`)),
    catchError(err => {
      console.error(`[${handler}] failed:`, err.message);
      return throwError(() => err);
    }),
  );
});
@@switch
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

app.registerPreRequestHook((ctx, next) => {
  const handler = ctx.getHandler().name;
  const start = Date.now();

  return next().pipe(
    tap(() => console.log(`[${handler}] completed in ${Date.now() - start}ms`)),
    catchError(err => {
      console.error(`[${handler}] failed:`, err.message);
      return throwError(() => err);
    }),
  );
});
```

> info **Hint** Pre-request hooks are global: you can't register them for individual patterns. When no hooks are registered, Nest skips the hook chain entirely, so the feature adds no overhead. Pre-request hooks don't apply to WebSocket gateways.
