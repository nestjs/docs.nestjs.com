### Caching

Caching is a straightforward and effective **technique** for improving your application's performance. A cache acts as a temporary storage layer that provides quick access to frequently used data, so you don't have to fetch or compute the same information repeatedly. The result is faster response times and better overall efficiency.

#### Installation

To get started with caching in Nest, install the `@nestjs/cache-manager` package along with the `cache-manager` package:

```bash
$ npm install @nestjs/cache-manager cache-manager
```

By default, everything is stored in memory. Because `cache-manager` uses [Keyv](https://keyv.org/docs/) under the hood, you can switch to a different storage solution, such as Redis, by installing the appropriate package. See [Using alternative Cache stores](/data/caching#using-alternative-cache-stores) below.

#### In-memory cache

To enable caching in your application, import the `CacheModule` and configure it using the `register()` method:

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller.js';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
})
export class AppModule {}
```

This setup initializes in-memory caching with the default settings, so you can start caching data immediately.

#### Interacting with the Cache store

To interact with the cache manager instance, inject it into your class using the `CACHE_MANAGER` token, as follows:

```typescript
constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
```

> info **Hint** The `Cache` class and the `CACHE_MANAGER` token are both imported from the `@nestjs/cache-manager` package.

Use the `get()` method of the `Cache` instance (from the `cache-manager` package) to retrieve items from the cache. If the item doesn't exist in the cache, `get()` returns `undefined` (`cache-manager` v6 returned `null` instead). Treat both as a cache miss when migrating.

```typescript
const value = await this.cacheManager.get('key');
```

To add an item to the cache, use the `set()` method:

```typescript
await this.cacheManager.set('key', 'value');
```

> warning **Note** The default in-memory store is a Keyv instance, which serializes values to JSON before storing them (Buffers are also supported). Store only JSON-serializable values: class instances come back as plain objects, `Date` objects come back as strings, and symbols can't be stored.

You can specify a TTL (expiration time in milliseconds) for a specific key, as follows:

```typescript
await this.cacheManager.set('key', 'value', 1000);
```

Here, the cache item expires after one second.

To store an item that never expires, pass a TTL of `0`:

```typescript
await this.cacheManager.set('key', 'value', 0);
```

To remove an item from the cache, use the `del()` method:

```typescript
await this.cacheManager.del('key');
```

To clear the entire cache, use the `clear()` method:

```typescript
await this.cacheManager.clear();
```

#### Auto-caching responses

> warning **Warning** In [GraphQL](/graphql/quick-start) applications, interceptors are executed separately for each field resolver. As a result, `CacheModule` (which uses interceptors to cache responses) doesn't work properly there.

To cache responses automatically, bind the `CacheInterceptor` where you want to cache data:

```typescript
@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  @Get()
  findAll(): string[] {
    return [];
  }
}
```

> warning **Warning** By default, only `GET` endpoints are cached (an explicit `@CacheKey()` on a route handler bypasses this check). Also, HTTP routes that inject the native response object (`@Res()`) can't use the `CacheInterceptor`. See [response mapping](/interceptors#response-mapping) for more details.

To reduce boilerplate, you can bind `CacheInterceptor` to all endpoints globally:

```typescript
import { Module } from '@nestjs/common';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { AppController } from './app.controller.js';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
```

#### Time-to-live (TTL)

By default, `ttl` isn't set, so cache entries never expire (the same as setting it to `0`). To specify a custom [TTL](https://en.wikipedia.org/wiki/Time_to_live), pass the `ttl` option to the `register()` method:

```typescript
CacheModule.register({
  ttl: 5000, // milliseconds
});
```

#### Use module globally

To use `CacheModule` in other modules, you need to import it (as with any Nest module). Alternatively, declare it as a [global module](/modules#global-modules) by setting the `isGlobal` property of the options object to `true`, as shown below. In that case, once `CacheModule` is loaded in the root module (e.g., `AppModule`), you don't need to import it in other modules.

```typescript
CacheModule.register({
  isGlobal: true,
});
```

#### Global cache overrides

When the `CacheInterceptor` is bound globally, cache entries are stored under a key that is generated automatically from the request URL. You can override certain cache settings (`@CacheKey()` and `@CacheTTL()`) on a per-method basis to customize the caching strategy for individual controller methods. This is most relevant when using [different cache stores](/data/caching#using-alternative-cache-stores).

You can also apply the `@CacheTTL()` decorator to a controller to set the TTL for all of its routes. When both controller-level and method-level TTL settings are defined, the method-level setting takes priority.

```typescript
@Controller()
@CacheTTL(5000)
export class AppController {
  @CacheKey('custom_key')
  @CacheTTL(2000)
  findAll(): string[] {
    return [];
  }
}
```

> info **Hint** The `@CacheKey()` and `@CacheTTL()` decorators are imported from the `@nestjs/cache-manager` package.

You can use the `@CacheKey()` decorator with or without a corresponding `@CacheTTL()` decorator, and vice versa, to override only the key or only the TTL. Settings that aren't overridden with a decorator use the defaults registered with the module (see [Time-to-live (TTL)](/data/caching#time-to-live-ttl)).

#### WebSockets and Microservices

You can also apply the `CacheInterceptor` to WebSocket subscribers and microservice patterns (regardless of the transport used).

```typescript
@@filename()
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client: Client, data: string[]): string[] {
  return [];
}
@@switch
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client, data) {
  return [];
}
```

In these contexts, the `@CacheKey()` decorator is required: it specifies the key used to store and retrieve the cached data. Without it, responses aren't cached. Also, keep in mind that you **shouldn't cache everything**. Never cache actions that perform business operations rather than only querying data.

You can also specify a cache expiration time (TTL) with the `@CacheTTL()` decorator, which overrides the default TTL:

```typescript
@@filename()
@CacheKey('events')
@CacheTTL(1000)
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client: Client, data: string[]): string[] {
  return [];
}
@@switch
@CacheKey('events')
@CacheTTL(1000)
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client, data) {
  return [];
}
```

> info **Hint** In HTTP applications, the `@CacheTTL()` decorator works with or without a corresponding `@CacheKey()` decorator. In WebSocket and microservice contexts, it has no effect without `@CacheKey()`, because nothing is cached without a key.

#### Adjust tracking

By default, Nest uses the request URL (in HTTP apps) or the cache key set through the `@CacheKey()` decorator (in WebSocket and microservice apps) to associate cache records with your endpoints. Sometimes you might want to track records based on other factors, for example, HTTP headers (e.g., `Authorization` to correctly identify `profile` endpoints).

To do that, create a subclass of `CacheInterceptor` and override the `trackBy()` method:

```typescript
@Injectable()
class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    return 'key';
  }
}
```

#### Using alternative Cache stores

To switch to a different cache store, first install the appropriate package. For example, to use Redis, install the `@keyv/redis` package. The example below also uses the in-memory store from the `cacheable` package:

```bash
$ npm install @keyv/redis cacheable
```

With this in place, you can register the `CacheModule` with multiple stores, as shown below:

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller.js';
import { createKeyv } from '@keyv/redis';
import { Keyv } from 'keyv';
import { KeyvCacheableMemory } from 'cacheable';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        return {
          stores: [
            new Keyv({
              store: new KeyvCacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            createKeyv('redis://localhost:6379'),
          ],
        };
      },
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

This example registers two stores: `CacheableMemory` and a Redis store. `CacheableMemory` is an in-memory store created with the `KeyvCacheableMemory` storage adapter, while the Redis store is created with the `createKeyv()` helper from `@keyv/redis`. The `stores` array specifies the stores you want to use. The first store in the array is the default store, and the rest are fallback stores.

See the [Keyv documentation](https://keyv.org/docs/) for more information on the available stores.

#### Async configuration

You may want to pass module options asynchronously instead of statically at compile time. In this case, use the `registerAsync()` method, which provides several ways to handle async configuration.

One approach is to use a factory function:

```typescript
CacheModule.registerAsync({
  useFactory: () => ({
    ttl: 5000,
  }),
});
```

The factory behaves like all other asynchronous module factories: it can be `async` and can inject dependencies through `inject`.

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    ttl: configService.get('CACHE_TTL'),
  }),
  inject: [ConfigService],
});
```

Alternatively, you can use the `useClass` syntax:

```typescript
CacheModule.registerAsync({
  useClass: CacheConfigService,
});
```

This construction instantiates `CacheConfigService` inside `CacheModule` and uses it to get the options object. `CacheConfigService` has to implement the `CacheOptionsFactory` interface to provide the configuration options:

```typescript
@Injectable()
class CacheConfigService implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleOptions {
    return {
      ttl: 5000,
    };
  }
}
```

To use an existing configuration provider imported from a different module, use the `useExisting` syntax:

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

This works the same as `useClass`, with one critical difference: `CacheModule` looks up imported modules to reuse an already-created `ConfigService` instead of instantiating its own.

> info **Hint** `CacheModule#register`, `CacheModule#registerAsync`, and `CacheOptionsFactory` accept an optional generic (type argument) that narrows down store-specific configuration options, making them type-safe.

You can also pass `extraProviders` to the `registerAsync()` method. These providers are merged with the module's providers:

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useClass: ConfigService,
  extraProviders: [MyAdditionalProvider],
});
```

This is useful when you want to provide additional dependencies to the factory function or the class constructor.

#### Example

A working example is available in the [cache sample](https://github.com/nestjs/nest/tree/master/sample/20-cache).
