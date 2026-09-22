### Rate Limiting

A common technique to protect applications from brute-force attacks is **rate limiting**. To get started, install the `@nestjs/throttler` package.

```bash
$ npm i --save @nestjs/throttler
```

Once the installation is complete, configure the `ThrottlerModule` like any other Nest package, with the `forRoot()` or `forRootAsync()` method.

```typescript
@@filename(app.module)
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
  ],
})
export class AppModule {}
```

This sets the global options for the guarded routes of your application: `ttl`, the time to live in milliseconds, and `limit`, the maximum number of requests within the `ttl`.

Once the module has been imported, choose how to bind the `ThrottlerGuard`. Any kind of binding described in the [guards](/guards#binding-guards) chapter works. For example, to bind the guard globally, add this provider to any module:

```typescript
{
  provide: APP_GUARD,
  useClass: ThrottlerGuard
}
```

#### Multiple Throttler Definitions

Sometimes you want multiple throttling definitions, such as no more than 3 calls per second, 20 calls per 10 seconds, and 100 calls per minute. To do so, define them in the array with named options. You can reference these names later in the `@SkipThrottle()` and `@Throttle()` decorators to change the options per route or controller.

```typescript
@@filename(app.module)
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100
      }
    ]),
  ],
})
export class AppModule {}
```

#### Customization

You may want to bind the guard to a controller or globally, but disable rate limiting for one or more endpoints. For that, use the `@SkipThrottle()` decorator to disable the throttler for an entire class or a single route. The `@SkipThrottle()` decorator also accepts an object with string keys (throttler names) and boolean values. This is useful when you want to exclude _most_ of a controller, but not every route, and to configure skipping per throttler set if you have more than one. If you don't pass an object, the default is `{{ '{' }} default: true {{ '}' }}`.

```typescript
@SkipThrottle()
@Controller('users')
export class UsersController {}
```

The `@SkipThrottle()` decorator can skip a route or a class, or negate the skipping of a route within a skipped class.

```typescript
@SkipThrottle()
@Controller('users')
export class UsersController {
  // Rate limiting is applied to this route.
  @SkipThrottle({ default: false })
  dontSkip() {
    return 'List users work with Rate limiting.';
  }
  // This route will skip rate limiting.
  doSkip() {
    return 'List users work without Rate limiting.';
  }
}
```

The `@Throttle()` decorator overrides the `limit` and `ttl` set in the root module, to give tighter or looser security options. You can apply it to a class or a method. Since version 5, the decorator takes an object whose keys are throttler set names and whose values are objects with `limit` and `ttl` keys (and, optionally, `blockDuration`), similar to the options passed to the root module. If you didn't set a name in the root options, use the key `default`:

```typescript
// Override default configuration for Rate limiting and duration.
@Throttle({ default: { limit: 3, ttl: 60000 } })
@Get()
findAll() {
  return "List users works with custom rate limiting.";
}
```

#### Proxies

If your application runs behind a proxy server, configure the HTTP adapter to trust the proxy. See the `trust proxy` options of [Express](http://expressjs.com/en/guide/behind-proxies.html) and [Fastify](https://www.fastify.io/docs/latest/Reference/Server/#trustproxy).

The following example enables `trust proxy` for the Express adapter:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  await app.listen(3000);
}

await bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  await app.listen(3000);
}

await bootstrap();
```

Enabling `trust proxy` lets you retrieve the original IP address from the `X-Forwarded-For` header. You can also override the `getTracker()` method to extract the IP address from this header instead of relying on `req.ip`. The following example works for both Express and Fastify:

```typescript
@@filename(throttler-behind-proxy.guard)
import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ips.length ? req.ips[0] : req.ip; // individualize IP extraction to meet your own needs
  }
}
```

> info **Hint** See the request object API for [Express](https://expressjs.com/en/api.html#req.ips) and [Fastify](https://www.fastify.io/docs/latest/Reference/Request/).

#### WebSockets

This module works with WebSockets, but it requires extending the `ThrottlerGuard` class and overriding its `handleRequest()` method, as follows:

```typescript
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration, generateKey } =
      requestProps;

    const client = context.switchToWs().getClient();
    const tracker = client._socket.remoteAddress;
    const key = generateKey(context, tracker, throttler.name);
    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttler.name,
      );

    // Throw an error when the user reached their limit.
    if (isBlocked) {
      await this.throwThrottlingException(context, {
        limit,
        ttl,
        key,
        tracker,
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      });
    }

    return true;
  }
}
```

> info **Hint** The example above reads the client address from `client._socket`, which works with the `@nestjs/platform-ws` package. If you use `@nestjs/platform-socket.io`, replace `client._socket` with `client.conn`.

Keep the following in mind when working with WebSockets:

- Don't register this guard with `APP_GUARD` or `app.useGlobalGuards()`. Global guards also run for HTTP routes, and this guard handles only WebSocket contexts.
- When a limit is reached, Nest emits an `exception` event, so make sure a listener is ready for it.

> info **Hint** When you configure [multiple throttler definitions](/security/rate-limiting#multiple-throttler-definitions), `handleRequest()` runs once for each throttler set. Pass `throttler.name` from the `ThrottlerRequest` when generating the storage key and when calling `storageService.increment()`, as shown above, so that each named throttler tracks its own limit.

#### GraphQL

The `ThrottlerGuard` also works with GraphQL requests. Again, extend the guard, but this time override the `getRequestResponse()` method:

```typescript
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }
}
```

#### Configuration

The following options are valid for each object in the array passed to the `ThrottlerModule`:

<table>
  <tr>
    <td><code>name</code></td>
    <td>the name used internally to track which throttler set is in use. Defaults to <code>default</code> if not passed. For named throttlers, the name is also appended to the rate limit response headers (e.g., <code>X-RateLimit-Remaining-long</code>)</td>
  </tr>
  <tr>
    <td><code>ttl</code></td>
    <td>the number of milliseconds that each request is kept in storage</td>
  </tr>
  <tr>
    <td><code>limit</code></td>
    <td>the maximum number of requests within the TTL</td>
  </tr>
  <tr>
    <td><code>blockDuration</code></td>
    <td>the number of milliseconds for which requests are blocked once the limit is reached. Defaults to the <code>ttl</code> value</td>
  </tr>
  <tr>
    <td><code>ignoreUserAgents</code></td>
    <td>an array of regular expressions matching user agents to ignore when throttling requests</td>
  </tr>
  <tr>
    <td><code>skipIf</code></td>
    <td>a function that takes the <code>ExecutionContext</code> and returns a <code>boolean</code> to short-circuit the throttler logic. Like <code>@SkipThrottle()</code>, but based on the request</td>
  </tr>
  <tr>
    <td><code>getTracker</code></td>
    <td>a function that overrides the default tracker logic for this throttler set (see the table below)</td>
  </tr>
  <tr>
    <td><code>generateKey</code></td>
    <td>a function that overrides the default key generation logic for this throttler set (see the table below)</td>
  </tr>
  <tr>
    <td><code>setHeaders</code></td>
    <td>whether to add the rate limit headers to the response. Defaults to <code>true</code></td>
  </tr>
</table>

To set up a custom storage, or to apply some of the above options globally to every throttler set, pass an options object instead of an array. Define the throttler sets in its `throttlers` property, and use the options in the following table:

<table>
  <tr>
    <td><code>storage</code></td>
    <td>a custom storage service that keeps track of the throttling. See <a href="/security/rate-limiting#storages">Storages</a></td>
  </tr>
  <tr>
    <td><code>ignoreUserAgents</code></td>
    <td>an array of regular expressions matching user agents to ignore when throttling requests</td>
  </tr>
  <tr>
    <td><code>skipIf</code></td>
    <td>a function that takes the <code>ExecutionContext</code> and returns a <code>boolean</code> to short-circuit the throttler logic. Like <code>@SkipThrottle()</code>, but based on the request</td>
  </tr>
  <tr>
    <td><code>throttlers</code></td>
    <td>an array of throttler sets, defined using the table above</td>
  </tr>
  <tr>
    <td><code>errorMessage</code></td>
    <td>a <code>string</code>, or a function that takes the <code>ExecutionContext</code> and the <code>ThrottlerLimitDetail</code> and returns a <code>string</code>, which overrides the default throttler error message</td>
  </tr>
  <tr>
    <td><code>getTracker</code></td>
    <td>a function that takes the request and the <code>ExecutionContext</code> and returns a <code>string</code> (or a <code>Promise</code> of one), overriding the default logic of the <code>getTracker()</code> method</td>
  </tr>
  <tr>
    <td><code>generateKey</code></td>
    <td>a function that takes the <code>ExecutionContext</code>, the tracker <code>string</code>, and the throttler name as a <code>string</code>, and returns the <code>string</code> used as the storage key for the rate limit value. This overrides the default logic of the <code>generateKey()</code> method</td>
  </tr>
  <tr>
    <td><code>setHeaders</code></td>
    <td>whether to add the rate limit headers to the response. Defaults to <code>true</code></td>
  </tr>
  <tr>
    <td><code>ipv6SubnetPrefix</code></td>
    <td>the prefix length used to group IPv6 addresses into a single tracker, so that a client cannot evade the limit by rotating through the addresses of its subnet. Applies only to the built-in tracker (not to a custom <code>getTracker</code>). Defaults to <code>64</code></td>
  </tr>
</table>

#### Async Configuration

You may want to load your rate limiting configuration asynchronously. Use the `forRootAsync()` method, which supports dependency injection and `async` methods.

One approach is to use a factory function:

```typescript
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL'),
          limit: config.get('THROTTLE_LIMIT'),
        },
      ],
    }),
  ],
})
export class AppModule {}
```

You can also use the `useClass` syntax:

```typescript
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useClass: ThrottlerConfigService,
    }),
  ],
})
export class AppModule {}
```

This works as long as `ThrottlerConfigService` implements the `ThrottlerOptionsFactory` interface.

#### Storages

The built-in storage is an in-memory cache that keeps track of requests until their TTL has passed. You can pass your own storage to the `storage` option of the `ThrottlerModule`, as long as the class implements the `ThrottlerStorage` interface.

For distributed servers, you can use the community storage provider for [Redis](https://github.com/jmcdo29/nest-lab/tree/main/packages/throttler-storage-redis) to have a single source of truth.

> info **Note** `ThrottlerStorage` can be imported from `@nestjs/throttler`.

#### Time Helpers

`@nestjs/throttler` exports five helper functions that make timings more readable than raw millisecond values: `seconds`, `minutes`, `hours`, `days`, and `weeks`. Each returns the equivalent number of milliseconds. For example, `seconds(5)` returns `5000`.

#### Migration Guide

When migrating to version 5 or later, wrapping your options in an array is enough for most applications.

If you use a custom storage, wrap your `ttl` and `limit` in an array and assign it to the `throttlers` property of the options object.

The `@SkipThrottle()` decorator now takes an optional object with string keys (the throttler names) and boolean values, which defaults to `{{ '{' }} default: true {{ '}' }}`.

The `@Throttle()` decorator now takes an object with string keys, the names of the throttler sets (again, `'default'` if no name is set), and values that are objects with `limit` and `ttl` keys.

> warning **Warning** The `ttl` is now in **milliseconds**. To keep your `ttl` in seconds for readability, use the `seconds` helper from this package, which multiplies the value by 1000.

For more information, see the [5.0 changelog entry](https://github.com/nestjs/throttler/blob/master/CHANGELOG.md#501).
