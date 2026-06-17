### Pre-request hooks

Pre-request hooks are functions that run before all enhancers (guards, interceptors, pipes) for every incoming pattern handler invocation. They are the microservices equivalent of HTTP middleware: a place to establish per-request context that must be visible to guards and the rest of the pipeline.

> info **Hint** The `PreRequestHook` interface is exported from the `@nestjs/common` package.

Hooks execute in the following order:

```
Incoming message
  └─ Pre-request hooks  (registration order)
       └─ Guards
            └─ Interceptors
                 └─ Pipes
                      └─ Handler
```

Exceptions thrown inside a hook are caught by the same `RpcProxy` wrapper that covers the entire pipeline, so existing [exception filters](/microservices/exception-filters) handle them without extra configuration.

#### Binding hooks

Register hooks on the application instance before calling `app.listen()` using `registerPreRequestHook`. Multiple calls accumulate hooks in registration order.

Each hook receives an `ExecutionContext` and a `next` function. Calling `next()` advances to the next hook or, when no hooks remain, to the guard → interceptor → pipe → handler pipeline. The hook must return the `Observable` produced by `next()`.

> warning **Warning** If a hook does not call `next()`, the handler is never executed — the same contract as HTTP middleware.

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

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
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
  });

  app.registerPreRequestHook((ctx, next) => {
    return next();
  });

  await app.listen();
}
bootstrap();
```

#### AsyncLocalStorage propagation

A common use case is initializing `AsyncLocalStorage` before guards run, making the store available throughout the entire pipeline.

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module';

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
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module';

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
bootstrap();
```

Because the hook runs before guards, `als.getStore()` returns the initialized store in any guard, interceptor, or handler:

```typescript
@@filename(correlation.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { als } from './main';

@Injectable()
export class CorrelationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { correlationId } = als.getStore()!;
    return true;
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { als } from './main';

@Injectable()
export class CorrelationGuard {
  canActivate(context) {
    const { correlationId } = als.getStore();
    return true;
  }
}
```

#### Logging and metrics

RxJS operators can be applied to the `Observable` returned by `next()` to observe the full handler lifecycle:

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
const { tap, catchError } = require('rxjs/operators');
const { throwError } = require('rxjs');

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

> info **Hint** `registerPreRequestHook` is global-only — per-pattern registration is not supported. When no hooks are registered, the pipeline takes the same fast path as before this feature was introduced. WebSocket gateway support is intentionally out of scope.
