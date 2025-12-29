### Migration guide

This article offers a comprehensive guide for migrating from NestJS version 10 to version 11. To explore the new features introduced in v11, take a look at [this article](https://trilon.io/blog/announcing-nestjs-11-whats-new). While the update includes a few minor breaking changes, they are unlikely to impact most users. You can review the complete list of changes [here](https://github.com/nestjs/nest/releases/tag/v11.0.0).

#### Upgrading packages

Although you can manually upgrade your packages, we recommend using [npm-check-updates (ncu)](https://npmjs.com/package/npm-check-updates) for a more streamlined process.

#### Express v5

After years of development, Express v5 was officially released in 2024 and became a stable version in 2025. With NestJS 11, Express v5 is now the default version integrated into the framework. While this update is seamless for most users, it’s important to be aware that Express v5 introduces some breaking changes. For detailed guidance, refer to the [Express v5 migration guide](https://expressjs.com/en/guide/migrating-5.html).

One of the most notable updates in Express v5 is the revised path route matching algorithm. The following changes have been introduced to how path strings are matched with incoming requests:

- The wildcard `*` must have a name, matching the behavior of parameters: use `/*splat` or `/{{ '{' }}*splat&#125;` instead of `/*`. `splat` is simply the name of the wildcard parameter and has no special meaning. You can name it anything you like, for example, `*wildcard`
- The optional character `?` is no longer supported, use braces instead: `/:file{{ '{' }}.:ext&#125;`.
- Regexp characters are not supported.
- Some characters have been reserved to avoid confusion during upgrade `(()[]?+!)`, use `\` to escape them.
- Parameter names now support valid JavaScript identifiers, or quoted like `:"this"`.

That said, routes that previously worked in Express v4 may not work in Express v5. For example:

```typescript
@Get('users/*')
findAll() {
  // In NestJS 11, this will be automatically converted to a valid Express v5 route.
  // While it may still work, it's no longer advisable to use this wildcard syntax in Express v5.
  return 'This route should not work in Express v5';
}
```

To fix this issue, you can update the route to use a named wildcard:

```typescript
@Get('users/*splat')
findAll() {
  return 'This route will work in Express v5';
}
```

> warning **Warning** Note that `*splat` is a named wildcard that matches any path without the root path. If you need to match the root path as well (`/users`), you can use `/users/{{ '{' }}*splat&#125;`, wrapping the wildcard in braces (optional group). Note that `splat` is simply the name of the wildcard parameter and has no special meaning. You can name it anything you like, for example, `*wildcard`.

Similarly, if you have a middleware that runs on all routes, you may need to update the path to use a named wildcard:

```typescript
// In NestJS 11, this will be automatically converted to a valid Express v5 route.
// While it may still work, it's no longer advisable to use this wildcard syntax in Express v5.
forRoutes('*'); // <-- This should not work in Express v5
```

Instead, you can update the path to use a named wildcard:

```typescript
forRoutes('{*splat}'); // <-- This will work in Express v5
```

Note that `{{ '{' }}*splat&#125;` is a named wildcard that matches any path including the root path. Outer braces make path optional.

#### Query parameters parsing

> info **Note** This change only applies to Express v5.

In Express v5, query parameters are no longer parsed using the `qs` library by default. Instead, the `simple` parser is used, which does not support nested objects or arrays.

As a result, query strings like these:

```plaintext
?filter[where][name]=John&filter[where][age]=30
?item[]=1&item[]=2
```

will no longer be parsed as expected. To revert to the previous behavior, you can configure Express to use the `extended` parser (the default in Express v4) by setting the `query parser` option to `extended`:

```typescript
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // <-- Make sure to use <NestExpressApplication>
  app.set('query parser', 'extended'); // <-- Add this line
  await app.listen(3000);
}
bootstrap();
```

#### Fastify v5

`@nestjs/platform-fastify` v11 now finally supports Fastify v5. This update should be seamless for most users; however, Fastify v5 introduces a few breaking changes, though these are unlikely to affect the majority of NestJS users. For more detailed information, refer to the [Fastify v5 migration guide](https://fastify.dev/docs/v5.1.x/Guides/Migration-Guide-V5/).

> info **Hint** There have been no changes to path matching in Fastify v5 (except for middleware, see the section below), so you can continue using the wildcard syntax as you did before. The behavior remains the same, and routes defined with wildcards (like `*`) will still work as expected.

#### Fastify CORS

By default, only [CORS-safelisted methods](https://fetch.spec.whatwg.org/#methods) are allowed. If you need to enable additional methods (such as `PUT`, `PATCH`, or `DELETE`), you must explicitly define them in the `methods` option.

```typescript
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']; // OR comma-delimited string 'GET,POST,PUT,PATH,DELETE'

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
  { cors: { methods } },
);

// OR alternatively, you can use the `enableCors` method
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
app.enableCors({ methods });
```

#### Fastify middleware registration

NestJS 11 now uses the latest version of the [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) package to match **middleware paths** in `@nestjs/platform-fastify`. As a result, the `(.*)` syntax for matching all paths is no longer supported. Instead, you should use named wildcards.

For example, if you have a middleware that applies to all routes:

```typescript
// In NestJS 11, this will automatically be converted to a valid route, even if you don't update it.
.forRoutes('(.*)');
```

You'll need to update it to use a named wildcard instead:

```typescript
.forRoutes('*splat');
```

Where `splat` is just an arbitrary name for the wildcard parameter. You can name it anything you like.

#### Module resolution algorithm

Starting with NestJS 11, the module resolution algorithm has been improved to enhance performance and reduce memory usage for most applications. This change does not require any manual intervention, but there are some edge cases where the behavior may differ from previous versions.

In NestJS v10 and earlier, dynamic modules were assigned a unique opaque key generated from the module's dynamic metadata. This key was used to identify the module in the module registry. For example, if you included `TypeOrmModule.forFeature([User])` in multiple modules, NestJS would deduplicate the modules and treat them as a single module node in the registry. This process is known as node deduplication.

With the release of NestJS v11, we no longer generate predictable hashes for dynamic modules. Instead, object references are now used to determine if one module is equivalent to another. To share the same dynamic module across multiple modules, simply assign it to a variable and import it wherever needed. This new approach provides more flexibility and ensures that dynamic modules are handled more efficiently.

This new algorithm might impact your integration tests if you use a lot of dynamic modules, because without the manually deduplication mentioned above, your TestingModule could have multiple instances of a dependency. This makes it a bit trickier to stub a method, because you'll need to target the correct instance. Your options are to either:

- Deduplicate the dynamic module you'd like to stub
- Use `module.select(ParentModule).get(Target)` to find the correct instance
- Stub all instances using `module.get(Target, {{ '{' }} each: true &#125;)`
- Or switch your test back to the old algorithm using `Test.createTestingModule({{ '{' }}&#125;, {{ '{' }} moduleIdGeneratorAlgorithm: 'deep-hash' &#125;)`

#### Reflector type inference

NestJS 11 introduces several improvements to the `Reflector` class, enhancing its functionality and type inference for metadata values. These updates provide a more intuitive and robust experience when working with metadata.

1. `getAllAndMerge` now returns an object rather than an array containing a single element when there is only one metadata entry, and the `value` is of type `object`. This change improves consistency when dealing with object-based metadata.
2. The `getAllAndOverride` return type has been updated to `T | undefined` instead of `T`. This update better reflects the possibility of no metadata being found and ensures proper handling of undefined cases.
3. The `ReflectableDecorator`'s transformed type argument is now properly inferred across all methods.

These enhancements improve the overall developer experience by providing better type safety and handling of metadata in NestJS 11.

#### Lifecycle hooks execution order

Termination lifecycle hooks are now executed in the reverse order to their initialization counterparts. That said, hooks like `OnModuleDestroy`, `BeforeApplicationShutdown`, and `OnApplicationShutdown` are now executed in the reverse order.

Imagine the following scenario:

```plaintext
// Where A, B, and C are modules and "->" represents the module dependency.
A -> B -> C
```

In this case, the `OnModuleInit` hooks are executed in the following order:

```plaintext
C -> B -> A
```

While the `OnModuleDestroy` hooks are executed in the reverse order:

```plaintext
A -> B -> C
```

> info **Hint** Global modules are treated as a dependency of all other modules. This means that global modules are initialized first and destroyed last.

#### Middleware registration order

In NestJS v11, the behavior of middleware registration has been updated. Previously, the order of middleware registration was determined by the topological sort of the module dependency graph, where the distance from the root module defined the order of middleware registration, regardless of whether the middleware was registered in a global module or a regular module. Global modules were treated like regular modules in this respect, which led to inconsistent behavior, especially when compared to other framework features.

From v11 onwards, middleware registered in global modules is now **executed first**, regardless of its position in the module dependency graph. This change ensures that global middleware always runs before any middleware from imported modules, maintaining a consistent and predictable order.

#### Cache module

The `CacheModule` (from the `@nestjs/cache-manager` package) has been updated to support the latest version of the `cache-manager` package. This update brings a few breaking changes, including a migration to [Keyv](https://keyv.org/), which offers a unified interface for key-value storage across multiple backend stores through storage adapters.

The key difference between the previous version and the new version lies in the configuration of external stores. In the previous version, to register a Redis store, you would have likely configured it like this:

```ts
// Old version - no longer supported
CacheModule.registerAsync({
  useFactory: async () => {
    const store = await redisStore({
      socket: {
        host: 'localhost',
        port: 6379,
      },
    });

    return {
      store,
    };
  },
}),
```

In the new version, you should use the `Keyv` adapter to configure the store:

```ts
// New version - supported
CacheModule.registerAsync({
  useFactory: async () => {
    return {
      stores: [
        new KeyvRedis('redis://localhost:6379'),
      ],
    };
  },
}),
```

Where `KeyvRedis` is imported from the `@keyv/redis` package. See the [Caching documentation](/techniques/caching) to learn more.

> warning **Warning** In this update, cached data handled by the Keyv library is now structured as an object containing `value` and `expires` fields, for example: `{{ '{' }}"value": "yourData", "expires": 1678901234567{{ '}' }}`. While Keyv automatically retrieves the `value` field when accessing data through its API, it’s important to note this change if you interact with the cache data directly (e.g., outside of the cache-manager API) or need to support data written using the previous version of `@nestjs/cache-manager`.

#### Config module

If you're using the `ConfigModule` from the `@nestjs/config` package, be aware of several breaking changes introduced in `@nestjs/config@4.0.0`. Most notably, the order in which configuration variables are read by the `ConfigService#get` method has been updated. The new order is:

- Internal configuration (config namespaces and custom config files)
- Validated environment variables (if validation is enabled and a schema is provided)
- The `process.env` object

Previously, validated environment variables and the `process.env` object were read first, preventing them from being overridden by internal configuration. With this update, internal configuration will now always take precedence over environment variables.

Additionally, the `ignoreEnvVars` configuration option, which previously allowed disabling validation of the `process.env` object, has been deprecated. Instead, use the `validatePredefined` option (set to `false` to disable validation of predefined environment variables). Predefined environment variables refer to `process.env` variables that were set before the module was imported. For example, if you start your application with `PORT=3000 node main.js`, the `PORT` variable is considered predefined. However, variables loaded by the `ConfigModule` from a `.env` file are not classified as predefined.

A new `skipProcessEnv` option has also been introduced. This option allows you to prevent the `ConfigService#get` method from accessing the `process.env` object entirely, which can be helpful when you want to restrict the service from reading environment variables directly.

#### Terminus module

If you are using the `TerminusModule` and have built your own custom health indicator, a new API has been introduced in version 11. The new `HealthIndicatorService` is designed to enhance the readability and testability of custom health indicators.

Before version 11, a health indicator might have looked like this:

```typescript
@Injectable()
export class DogHealthIndicator extends HealthIndicator {
  constructor(private readonly httpService: HttpService) {
    super();
  }

  async isHealthy(key: string) {
    try {
      const badboys = await this.getBadboys();
      const isHealthy = badboys.length === 0;

      const result = this.getStatus(key, isHealthy, {
        badboys: badboys.length,
      });

      if (!isHealthy) {
        throw new HealthCheckError('Dog check failed', result);
      }

      return result;
    } catch (error) {
      const result = this.getStatus(key, isHealthy);
      throw new HealthCheckError('Dog check failed', result);
    }
  }

  private getBadboys() {
    return firstValueFrom(
      this.httpService.get<Dog[]>('https://example.com/dog').pipe(
        map((response) => response.data),
        map((dogs) => dogs.filter((dog) => dog.state === DogState.BAD_BOY)),
      ),
    );
  }
}
```

Starting with version 11, it is recommended to use the new `HealthIndicatorService` API, which streamlines the implementation process. Here's how the same health indicator can now be implemented:

```typescript
@Injectable()
export class DogHealthIndicator {
  constructor(
    private readonly httpService: HttpService,
    //  Inject the `HealthIndicatorService` provided by the `TerminusModule`
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    // Start the health indicator check for the given key
    const indicator = this.healthIndicatorService.check(key);

    try {
      const badboys = await this.getBadboys();
      const isHealthy = badboys.length === 0;

      if (!isHealthy) {
        // Mark the indicator as "down" and add additional info to the response
        return indicator.down({ badboys: badboys.length });
      }

      // Mark the health indicator as up
      return indicator.up();
    } catch (error) {
      return indicator.down('Unable to retrieve dogs');
    }
  }

  private getBadboys() {
    // ...
  }
}
```

Key changes:

- The `HealthIndicatorService` replaces the legacy `HealthIndicator` and `HealthCheckError` classes, providing a cleaner API for health checks.
- The `check` method allows for easy state tracking (`up` or `down`) while supporting the inclusion of additional metadata in health check responses.

> info **Info** Please note that the `HealthIndicator` and `HealthCheckError` classes have been marked as deprecated and are scheduled for removal in the next major release.

#### Node.js v16 and v18 no longer supported

Starting with NestJS 11, Node.js v16 is no longer supported, as it reached its end-of-life (EOL) on September 11, 2023. Likewise, the security support is scheduled to end on April 30, 2025 for Node.js v18, so we went ahead and dropped support for it as well.

NestJS 11 now requires **Node.js v20 or higher**.

To ensure the best experience, we strongly recommend using the latest LTS version of Node.js.

#### Mau official deployment platform

In case you missed the announcement, we launched our official deployment platform, [Mau](https://www.mau.nestjs.com/), in 2024.
Mau is a fully managed platform that simplifies the deployment process for NestJS applications. With Mau, you can deploy your applications to the cloud (**AWS**; Amazon Web Services) with a single command, manage your environment variables, and monitor your application's performance in real-time.

Mau makes provisioning and maintaining your infrastructure as simple as clicking just a few buttons. Mau is designed to be simple and intuitive, so you can focus on building your applications and not worry about the underlying infrastructure. Under the hood, we use Amazon Web Services to provide you with a powerful and reliable platform, while abstracting away all the complexity of AWS. We take care of all the heavy lifting for you, so you can focus on building your applications and growing your business.

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

You can learn more about Mau [in this chapter](/deployment#easy-deployment-with-mau).
