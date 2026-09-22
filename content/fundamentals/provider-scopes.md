### Injection scopes

If you come from a different programming language background, you might be surprised to learn that in Nest, almost everything is shared across incoming requests: a connection pool to the database, singleton services with global state, and so on. Node.js doesn't follow the multi-threaded stateless request/response model, in which every request is processed by a separate thread. Using singleton instances is therefore fully **safe** in Nest applications.

However, there are edge cases where a request-based lifetime is the desired behavior, e.g., per-request caching in GraphQL applications, request tracking, and multi-tenancy. Injection scopes let you obtain the provider lifetime you need.

#### Provider scope

A provider can have any of the following scopes:

<table>
  <tr>
    <td><code>DEFAULT</code></td>
    <td>A single instance of the provider is shared across the entire application. The instance lifetime is tied directly to the application lifecycle. Once the application has bootstrapped, all singleton providers have been instantiated. Singleton scope is the default.</td>
  </tr>
  <tr>
    <td><code>REQUEST</code></td>
    <td>A new instance of the provider is created exclusively for each incoming <strong>request</strong>. The instance is garbage-collected after the request has been processed.</td>
  </tr>
  <tr>
    <td><code>TRANSIENT</code></td>
    <td>Transient providers are not shared across consumers. Each consumer that injects a transient provider receives a new, dedicated instance.</td>
  </tr>
</table>

> info **Hint** Singleton scope is **recommended** for most use cases. Sharing providers across consumers and across requests means that an instance can be cached, and its initialization occurs only once, during application startup.

#### Usage

Specify injection scope by passing the `scope` property to the `@Injectable()` decorator options object:

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {}
```

Similarly, for [custom providers](/fundamentals/custom-providers), set the `scope` property in the long-hand form of the provider registration:

```typescript
{
  provide: 'CACHE_MANAGER',
  useClass: CacheManager,
  scope: Scope.TRANSIENT,
}
```

> info **Hint** Import the `Scope` enum from `@nestjs/common`.

Singleton scope is the default and doesn't need to be declared. If you want to declare a provider as singleton-scoped explicitly, use the `Scope.DEFAULT` value for the `scope` property.

> warning **Notice** WebSocket gateways should not use request-scoped providers, because they must act as singletons. Each gateway encapsulates a real socket and cannot be instantiated multiple times. The same limitation applies to some other providers, like [_Passport strategies_](../security/authentication#request-scoped-strategies) or _Cron controllers_.

#### Controller scope

Controllers can also have a scope, which applies to all route handlers declared in that controller. Like provider scope, the scope of a controller declares its lifetime. For a request-scoped controller, a new instance is created for each inbound request and garbage-collected once the request has been processed.

Declare controller scope with the `scope` property of the `ControllerOptions` object:

```typescript
@Controller({
  path: 'cats',
  scope: Scope.REQUEST,
})
export class CatsController {}
```

#### Scope hierarchy

The `REQUEST` scope bubbles up the injection chain. A controller that depends on a request-scoped provider is itself request-scoped.

Consider the following dependency graph: `CatsController <- CatsService <- CatsRepository`. If `CatsService` is request-scoped (and the others are default singletons), `CatsController` becomes request-scoped, because it depends on the injected service. `CatsRepository`, which doesn't depend on `CatsService`, remains singleton-scoped.

Transient-scoped dependencies don't follow that pattern. If a singleton-scoped `DogsService` injects a transient `LoggerService` provider, it receives a fresh instance of it. However, `DogsService` stays singleton-scoped, so injecting it anywhere does _not_ resolve to a new instance of `DogsService`. If you want that behavior, explicitly mark `DogsService` as `TRANSIENT` as well.

<app-banner-courses></app-banner-courses>

#### Request provider

In an HTTP server-based application (e.g., using `@nestjs/platform-express` or `@nestjs/platform-fastify`), you may want to access a reference to the original request object when using request-scoped providers. To do so, inject the `REQUEST` object.

The `REQUEST` provider is inherently request-scoped, so you don't need to specify the `REQUEST` scope explicitly when using it (if you do, it is disregarded). Any provider that relies on a request-scoped provider automatically adopts request scope, and this behavior cannot be changed.

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(REQUEST) private request: Request) {}
}
```

Because of underlying platform and protocol differences, you access the inbound request slightly differently in microservice or GraphQL applications. In [GraphQL](/graphql/quick-start) applications, inject `CONTEXT` instead of `REQUEST`:

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private context) {}
}
```

Then configure your `context` value (in the `GraphQLModule`) to contain `request` as a property.

#### Inquirer provider

To get the class in which a provider was constructed, e.g., in logging or metrics providers, inject the `INQUIRER` token:

```typescript
import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class HelloService {
  constructor(@Inject(INQUIRER) private parentClass: object) {}

  sayHello(message: string) {
    console.log(`${this.parentClass?.constructor?.name}: ${message}`);
  }
}
```

Then use it as follows:

```typescript
import { Injectable } from '@nestjs/common';
import { HelloService } from './hello.service.js';

@Injectable()
export class AppService {
  constructor(private helloService: HelloService) {}

  getRoot(): string {
    this.helloService.sayHello('My name is getRoot');

    return 'Hello world!';
  }
}
```

In the example above, when `AppService#getRoot` is called, `"AppService: My name is getRoot"` is logged to the console.

#### Performance

Request-scoped providers affect application performance. Although Nest caches as much metadata as possible, it still has to create an instance of your class on each request, which slows down your average response time and overall benchmark results. Unless a provider must be request-scoped, we strongly recommend using the default singleton scope.

> info **Hint** A properly designed application that uses request-scoped providers should not see latency increase by more than ~5%.

Many providers are request-scoped only to read a value that belongs to the current request: the authenticated user, the tenant, or a locale. For that, a per-request store based on `AsyncLocalStorage` keeps every provider a singleton and works the same way in HTTP handlers, microservice message handlers, and queue jobs. If your application uses [NestJS Observe](/observability/overview), it already keeps such a store for every request, message, and job it instruments: write to it with `TracerService.setAttribute()` and read from anywhere downstream with `getAttribute()`, with no scope changes and no store of your own to maintain. See [Async local storage](/recipes/async-local-storage#nestjs-observe) for details and the alternatives.

#### Durable providers

As mentioned in the previous section, request-scoped providers may increase latency, because having at least one request-scoped provider (injected into the controller instance, or deeper, into one of its providers) makes the controller request-scoped as well. The controller must then be recreated (instantiated) for each individual request and garbage-collected afterward. For, say, 30k requests in parallel, there are 30k ephemeral instances of the controller (and its request-scoped providers).

If a common provider that most providers depend on (think of a database connection or a logger service) is request-scoped, all of those providers automatically become request-scoped as well. This can pose a challenge in **multi-tenant applications**, especially those with a central request-scoped "data source" provider that reads headers or a token from the request object and, based on their values, retrieves the corresponding database connection or schema for that tenant.

For instance, suppose your application is used by 10 different customers. Each customer has its **own dedicated data source**, and you want to make sure customer A can never reach customer B's database. One way to achieve this is to declare a request-scoped "data source" provider that determines the "current customer" from the request object and retrieves the corresponding database. This approach turns your application into a multi-tenant application in a few minutes. Its major downside is that a large part of your application's components likely rely on the "data source" provider, so they implicitly become request-scoped, which degrades your application's performance.

With only 10 customers, you could instead have 10 individual [DI sub-trees](/fundamentals/module-ref#resolving-scoped-providers), one per customer, rather than recreating each tree per request. If your providers don't rely on any property that's truly unique to each request (e.g., a request UUID), but on specific attributes that let you aggregate (classify) requests, there's no reason to _recreate the DI sub-tree_ on every incoming request.

This is where **durable providers** come in.

Before flagging providers as durable, you must register a **strategy** that tells Nest what those "common request attributes" are, and provides the logic that groups requests, i.e., associates them with their corresponding DI sub-trees.

```typescript
import {
  HostComponentInfo,
  ContextId,
  ContextIdFactory,
  ContextIdStrategy,
} from '@nestjs/core';
import { Request } from 'express';

const tenants = new Map<string, ContextId>();

export class AggregateByTenantContextIdStrategy implements ContextIdStrategy {
  attach(contextId: ContextId, request: Request) {
    const tenantId = request.headers['x-tenant-id'] as string;
    let tenantSubTreeId: ContextId;

    if (tenants.has(tenantId)) {
      tenantSubTreeId = tenants.get(tenantId);
    } else {
      tenantSubTreeId = ContextIdFactory.create();
      tenants.set(tenantId, tenantSubTreeId);
    }

    // If tree is not durable, return the original "contextId" object
    return (info: HostComponentInfo) =>
      info.isTreeDurable ? tenantSubTreeId : contextId;
  }
}
```

> info **Hint** Like request scope, durability bubbles up the injection chain. If A depends on B, which is flagged as `durable`, A implicitly becomes durable too, provided that all of A's other request-scoped dependencies are durable as well (and unless A is explicitly declared with `Scope.REQUEST` and `durable: false`).

> warning **Warning** This strategy is not ideal for applications with a large number of tenants.

The value returned from the `attach` method tells Nest which context identifier to use for a given host. In this case, we specify that `tenantSubTreeId` should be used instead of the original, auto-generated `contextId` object when the host component (e.g., a request-scoped controller) is flagged as durable (you'll learn how to mark providers as durable below). Also, in the example above, **no payload** is registered (the payload being the `REQUEST`/`CONTEXT` provider that represents the "root", i.e., the parent of the sub-tree).

To register the payload for a durable tree, use the following construction instead:

```typescript
// The return of `AggregateByTenantContextIdStrategy#attach` method:
return {
  resolve: (info: HostComponentInfo) =>
    info.isTreeDurable ? tenantSubTreeId : contextId,
  payload: { tenantId },
};
```

Now, whenever you inject the `REQUEST` provider (or `CONTEXT` for GraphQL applications) with `@Inject(REQUEST)`/`@Inject(CONTEXT)`, the `payload` object is injected (consisting of a single property, `tenantId`, in this case).

With this strategy in place, register it anywhere in your code (it applies globally), e.g., in the `main.ts` file:

```typescript
ContextIdFactory.apply(new AggregateByTenantContextIdStrategy());
```

> info **Hint** The `ContextIdFactory` class is imported from the `@nestjs/core` package.

As long as the registration occurs before any request hits your application, everything works as intended.

Finally, to turn a regular provider into a durable provider, set the `durable` flag to `true` and change its scope to `Scope.REQUEST`. Nest reads the `durable` flag only on providers explicitly declared with `Scope.REQUEST`; a provider that is request-scoped only implicitly (through its dependencies) derives its durability from those dependencies, as described in the hint above.

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class CatsService {}
```

Similarly, for [custom providers](/fundamentals/custom-providers), set the `durable` property in the long-hand form of the provider registration:

```typescript
{
  provide: 'foobar',
  useFactory: () => { ... },
  scope: Scope.REQUEST,
  durable: true,
}
```
