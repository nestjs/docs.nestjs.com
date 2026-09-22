### Lazy loading modules

By default, modules are eagerly loaded: as soon as the application loads, so do all the modules, whether or not they are immediately needed. This is fine for most applications, but it can become a bottleneck for apps and workers running in a **serverless environment**, where startup latency ("cold start") is crucial.

Lazy loading can decrease bootstrap time by loading only the modules required by a specific serverless function invocation. You can also load other modules asynchronously once the serverless function is "warm", to further speed up bootstrap time for subsequent calls (deferred module registration).

> info **Hint** If you're familiar with the **[Angular](https://angular.dev/)** framework, you might have seen the term "[lazy-loading modules](https://angular.dev/guide/ngmodules/lazy-loading#lazy-loading-basics)" before. This technique is **functionally different** in Nest, so think of it as an entirely different feature that happens to share a similar name.

> warning **Warning** [Lifecycle hook methods](/fundamentals/lifecycle-events) are not invoked in lazy loaded modules and services.

#### Getting started

To load modules on demand, Nest provides the `LazyModuleLoader` class, which you inject into a class like any other dependency:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(private lazyModuleLoader: LazyModuleLoader) {}
}
@@switch
@Injectable()
@Dependencies(LazyModuleLoader)
export class CatsService {
  constructor(lazyModuleLoader) {
    this.lazyModuleLoader = lazyModuleLoader;
  }
}
```

> info **Hint** The `LazyModuleLoader` class is imported from the `@nestjs/core` package.

Alternatively, you can obtain a reference to the `LazyModuleLoader` provider from within your application bootstrap file (`main.ts`):

```typescript
// "app" represents a Nest application instance
const lazyModuleLoader = app.get(LazyModuleLoader);
```

With this in place, you can load any module using the following construction:

```typescript
const { LazyModule } = await import('./lazy.module.js');
const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);
```

> info **Hint** Lazy loaded modules are **cached** on the first `LazyModuleLoader#load` method invocation. Each subsequent attempt to load `LazyModule` is therefore **very fast** and returns a cached instance instead of loading the module again.
>
> ```bash
> Load "LazyModule" attempt: 1
> time: 2.379ms
> Load "LazyModule" attempt: 2
> time: 0.294ms
> Load "LazyModule" attempt: 3
> time: 0.303ms
> ```
>
> Also, lazy loaded modules share the same module graph as the modules eagerly loaded on application bootstrap, as well as any other lazy modules registered later in your app.

Here, `lazy.module.ts` is a TypeScript file that exports a **regular Nest module** (no extra changes are required).

The `LazyModuleLoader#load` method returns the [module reference](/fundamentals/module-ref) (of `LazyModule`), which lets you navigate the internal list of providers and obtain a reference to any provider, using its injection token as a lookup key.

> info **Hint** The `load()` method accepts an optional second argument, an options object. Set its `logger` property to `false` to suppress the logs Nest generates while loading the module.

For example, suppose we have a `LazyModule` with the following definition:

```typescript
@Module({
  providers: [LazyService],
  exports: [LazyService],
})
export class LazyModule {}
```

> info **Hint** Lazy loaded modules cannot be registered as **global modules**, because they are registered lazily, on demand, after all the statically registered modules have been instantiated. Likewise, registered **global enhancers** (guards, interceptors, etc.) **will not work** properly either.

With this, we can obtain a reference to the `LazyService` provider:

```typescript
const { LazyModule } = await import('./lazy.module.js');
const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);

const { LazyService } = await import('./lazy.service.js');
const lazyService = moduleRef.get(LazyService);
```

> warning **Warning** If you use **webpack**, update your `tsconfig.json` file: set `compilerOptions.module` to `"esnext"` and add the `compilerOptions.moduleResolution` property with `"node"` as its value:
>
> ```json
> {
>   "compilerOptions": {
>     "module": "esnext",
>     "moduleResolution": "node",
>     ...
>   }
> }
> ```
>
> With these options set, you can use webpack's [code splitting](https://webpack.js.org/guides/code-splitting/) feature.

#### Lazy loading controllers, gateways, and resolvers

Because controllers (or resolvers, in GraphQL applications) in Nest represent sets of routes, paths, or topics (or queries and mutations), you **cannot lazy load them** using the `LazyModuleLoader` class.

> error **Warning** Controllers, [resolvers](/graphql/resolvers), and [gateways](/websockets/gateways) registered inside lazy loaded modules will not behave as expected. Similarly, you cannot register middleware (by implementing the `NestModule` interface's `configure()` method with the `MiddlewareConsumer`) on demand.

For example, suppose you're building a REST API (HTTP application) with Fastify under the hood (using the `@nestjs/platform-fastify` package). Fastify doesn't let you register routes after the application is ready and listening. So even if Nest analyzed the route mappings registered in the module's controllers, the lazy loaded routes would not be accessible, because there is no way to register them at runtime.

Likewise, some transport strategies provided by the `@nestjs/microservices` package (including Kafka, gRPC, and RabbitMQ) must subscribe to specific topics or channels before the connection is established. Once your application starts listening to messages, the framework can't subscribe to new topics.

Finally, the `@nestjs/graphql` package, with the code first approach enabled, generates the GraphQL schema on the fly based on metadata. This requires all classes to be loaded beforehand; otherwise, it can't create a valid schema.

#### Common use-cases

Lazy loaded modules are most common when a worker, cron job, lambda or other serverless function, or webhook must trigger different services (different logic) based on its input arguments (route path, date, query parameters, etc.). Lazy loading modules makes less sense for monolithic applications, where startup time is largely irrelevant.
