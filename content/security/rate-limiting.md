### Rate Limiting

A common technique to protect applications from brute-force attacks is **rate-limiting**. To get started, you'll need to install the `@nestjs/throttler` package.

```bash
$ npm i --save @nestjs/throttle
```

Once the installation is complete, the `ThrottlerModule` can be configured as any other Nest package with `forRoot` or `forRootAsync` methods.

```typescript
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ]
})
export class AppModule {}
```

The above will set the global options for the `ttl`, the time to live, and the `limit`, the maximum number of requests within the ttl, for the routes of your application that are guarded.

Once the module has been imported, you can then choose how you would like to bind the `ThrottlerGuard`. Any kind of binding as mentioned in the [guards](https://docs.nestjs.com/guards) section is fine. If you wanted to bind the guard globally, for example, you could do so but adding this provider to any module

```typescript
{
  provide: APP_GUARD,
  useClass: ThrottlerGuard
}
```

#### Customization

There may be a time where you want to bind the guard to a controller or globally, but want to avoid rate limiting one or more of your endpoints. For that, you can use the `@SkipThrottle()` decorator, to negate the throttler for an entire class or a single route. The `@SkipThrottle()` decorator can also take in a boolean for if there is a case where you want to exclude _most_ of a controller, but not every route.

There is also the `@Throttle()` decorator which can be used to override the `limit` and `ttl` set in the global module, to give tighter or looser security options. This decorator can be used on a class or a function as well. The order for this decorator does matter, as the arguments are in the order of `limit` `ttl`.

#### Websockets

This module does work with websockets as well, with some limited functionality. First of all, user agent headers are not taken into consideration due to the difference in the underlying transport layer of Socket.IO vs Websockets. The other thing to make note of is that globally bound guards do not activate on websocket gateways, so you **must** bind the guard to the gateway itself using `@UseGuards()`.

#### GraphQL

Currently, only GraphQL with Express is supported, but Fastify support is coming as well. This module makes use of setting headers through the `res` object and reading headers through the `req` object of Express. To make sure these are available, when configuring your GraphQLModule, make sure the option `context: ({{ '{' }} req, res {{ '}' }}) => ({{ '{' }} req, res {{ '}' }})` is set.

#### Configuration

The following options are valid for the `ThrottlerModule`

<table>
  <tr>
    <td><code>ttl</code></td>
    <td>the number of seconds that each request will last in storage</td>
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
    <td><code>storage</code></td>
    <td> the storage setting for how to keep track of the requests</td>
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
      useFactory: (config: ConfigService) => ({
        ttl: config.get('THROTTLE_TTL'),
        limit: config.get('THROTTLE_LIMIT'),
      }),
    }),
  ],
})
export class AppModule {}
```

You can also use the `useClass` syntax:

```typescript
@Module({
  imports: [
    ThrottlerModule.forRootASync({
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

> **Note** `ThrottlerStorage` can be imported from `@nestjs/throttler`.
