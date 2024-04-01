### Rate Limiting

A common technique to protect applications from brute-force attacks is **rate-limiting**. To get started, you'll need to install the `@nestjs/throttler` package.

```bash
$ npm i --save @nestjs/throttler
```

Once the installation is complete, the `ThrottlerModule` can be configured as any other Nest package with `forRoot` or `forRootAsync` methods.

```typescript
@@filename(app.module)
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
  ],
})
export class AppModule {}
```

The above will set the global options for the `ttl`, the time to live in milliseconds, and the `limit`, the maximum number of requests within the ttl, for the routes of your application that are guarded.

Once the module has been imported, you can then choose how you would like to bind the `ThrottlerGuard`. Any kind of binding as mentioned in the [guards](https://docs.nestjs.com/guards) section is fine. If you wanted to bind the guard globally, for example, you could do so by adding this provider to any module:

```typescript
{
  provide: APP_GUARD,
  useClass: ThrottlerGuard
}
```

#### Multiple Throttler Definitions

There may come upon times where you want to set up multiple throttling definitions, like no more than 3 calls in a second, 20 calls in 10 seconds, and 100 calls in a minute. To do so, you can set up your definitions in the array with named options, that can later be referenced in the `@SkipThrottle()` and `@Throttle()` decorators to change the options again.

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

There may be a time where you want to bind the guard to a controller or globally, but want to disable rate limiting for one or more of your endpoints. For that, you can use the `@SkipThrottle()` decorator, to negate the throttler for an entire class or a single route. The `@SkipThrottle()` decorator can also take in an object of string keys with boolean values for if there is a case where you want to exclude _most_ of a controller, but not every route, and configure it per throttler set if you have more than one. If you do not pass an object, the default is to use `{{ '{' }} default: true {{ '}' }}`

```typescript
@SkipThrottle()
@Controller('users')
export class UsersController {}
```

This `@SkipThrottle()` decorator can be used to skip a route or a class or to negate the skipping of a route in a class that is skipped.

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

There is also the `@Throttle()` decorator which can be used to override the `limit` and `ttl` set in the global module, to give tighter or looser security options. This decorator can be used on a class or a function as well. With version 5 and onwards, the decorator takes in an object with the string relating to the name of the throttler set, and an object with the limit and ttl keys and integer values, similar to the options passed to the root module. If you do not have a name set in your original options, use the string `default` You have to configure it like this:

```typescript
// Override default configuration for Rate limiting and duration.
@Throttle({ default: { limit: 3, ttl: 60000 } })
@Get()
findAll() {
  return "List users works with custom rate limiting.";
}
```

#### Proxies

If your application runs behind a proxy server, check the specific HTTP adapter options ([express](http://expressjs.com/en/guide/behind-proxies.html) and [fastify](https://www.fastify.io/docs/latest/Reference/Server/#trustproxy)) for the `trust proxy` option and enable it. Doing so will allow you to get the original IP address from the `X-Forwarded-For` header, and you can override the `getTracker()` method to pull the value from the header rather than from `req.ip`. The following example works with both express and fastify:

```typescript
// throttler-behind-proxy.guard.ts
import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ips.length ? req.ips[0] : req.ip; // individualize IP extraction to meet your own needs
  }
}

// app.controller.ts
import { ThrottlerBehindProxyGuard } from './throttler-behind-proxy.guard';

@UseGuards(ThrottlerBehindProxyGuard)
```

> info **Hint** You can find the API of the `req` Request object for express [here](https://expressjs.com/en/api.html#req.ips) and for fastify [here](https://www.fastify.io/docs/latest/Reference/Request/).

#### Websockets

This module can work with websockets, but it requires some class extension. You can extend the `ThrottlerGuard` and override the `handleRequest` method like so:

```typescript
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(context: ExecutionContext, limit: number, ttl: number, throttler: ThrottlerOptions): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const ip = client._socket.remoteAddress;
    const key = this.generateKey(context, ip, throttler.name);
    const { totalHits } = await this.storageService.increment(key, ttl);

    if (totalHits > limit) {
      throw new ThrottlerException();
    }

    return true;
  }
}
```

> info **Hint** If you are using ws, it is necessary to replace the `_socket` with `conn`

There's a few things to keep in mind when working with WebSockets:

- Guard cannot be registered with the `APP_GUARD` or `app.useGlobalGuards()`
- When a limit is reached, Nest will emit an `exception` event, so make sure there is a listener ready for this

> info **Hint** If you are using the `@nestjs/platform-ws` package you can use `client._socket.remoteAddress` instead.

#### GraphQL

The `ThrottlerGuard` can also be used to work with GraphQL requests. Again, the guard can be extended, but this time the `getRequestResponse` method will be overridden

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

The following options are valid for the object passed to the array of the `ThrottlerModule`'s options:

<table>
  <tr>
    <td><code>name</code></td>
    <td>the name for internal tracking of which throttler set is being used. Defaults to `default` if not passed</td>
  </tr>
  <tr>
    <td><code>ttl</code></td>
    <td>the number of milliseconds that each request will last in storage</td>
  </tr>
  <tr>
    <td><code>limit</code></td>
    <td>the maximum number of requests within the TTL limit</td>
  </tr>
  <tr>
    <td><code>ignoreUserAgents</code></td>
    <td>an array of regular expressions of user-agents to ignore when it comes to throttling requests</td>
  </tr>
  <tr>
    <td><code>skipIf</code></td>
    <td>a function that takes in the <code>ExecutionContext</code> and returns a <code>boolean</code> to short circuit the throttler logic. Like <code>@SkipThrottler()</code>, but based on the request</td>
  </tr>
</table>

If you need to set up storage instead, or want to use some of the above options in a more global sense, applying to each throttler set, you can pass the options above via the `throttlers` option key and use the below table

<table>
  <tr>
    <td><code>storage</code></td>
    <td>a custom storage service for where the throttling should be kept track. <a href="/security/rate-limiting#storages">See here.</a></td>
  </tr>
  <tr>
    <td><code>ignoreUserAgents</code></td>
    <td>an array of regular expressions of user-agents to ignore when it comes to throttling requests</td>
  </tr>
  <tr>
    <td><code>skipIf</code></td>
    <td>a function that takes in the <code>ExecutionContext</code> and returns a <code>boolean</code> to short circuit the throttler logic. Like <code>@SkipThrottler()</code>, but based on the request</td>
  </tr>
  <tr>
    <td><code>throttlers</code></td>
    <td>an array of throttler sets, defined using the table above</td>
  </tr>
</table>

#### Async Configuration

You may want to get your rate-limiting configuration asynchronously instead of synchronously. You can use the `forRootAsync()` method, which allows for dependency injection and `async` methods.

One approach would be to use a factory function:

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

This is doable, as long as `ThrottlerConfigService` implements the interface `ThrottlerOptionsFactory`.

#### Storages

The built in storage is an in memory cache that keeps track of the requests made until they have passed the TTL set by the global options. You can drop in your own storage option to the `storage` option of the `ThrottlerModule` so long as the class implements the `ThrottlerStorage` interface.

For distributed servers you could use the community storage provider for [Redis](https://github.com/kkoomen/nestjs-throttler-storage-redis) to have a single source of truth.

> info **Note** `ThrottlerStorage` can be imported from `@nestjs/throttler`.

#### Time Helpers

There are a couple of helper methods to make the timings more readable if you prefer to use them over the direct definition. `@nestjs/throttler` exports five different helpers, `seconds`, `minutes`, `hours`, `days`, and `weeks`. To use them, simply call `seconds(5)` or any of the other helpers, and the correct number of milliseconds will be returned.

#### Migration Guide

For most people, wrapping your options in an array will be enough.

If you are using a custom storage, you should wrap your `ttl` and `limit` in an
array and assign it to the `throttlers` property of the options object.

Any `@ThrottleSkip()` should now take in an object with `string: boolean` props.
The strings are the names of the throttlers. If you do not have a name, pass the
string `'default'`, as this is what will be used under the hood otherwise.

Any `@Throttle()` decorators should also now take in an object with string keys,
relating to the names of the throttler contexts (again, `'default'` if no name)
and values of objects that have `limit` and `ttl` keys.

> Warning **Important** The `ttl` is now in **milliseconds**. If you want to keep your ttl
> in seconds for readability, use the `seconds` helper from this package. It just
> multiplies the ttl by 1000 to make it in milliseconds.

For more info, see the [Changelog](https://github.com/nestjs/throttler/blob/master/CHANGELOG.md#500)
