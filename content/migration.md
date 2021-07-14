### Migration guide

This article provides a set of guidelines for migrating from Nest version 7 to version 8.
To learn more about the new features we've added in the v8, check out this [link](https://github.com/nestjs/nest/pull/6349).

#### HTTP module

The `HttpModule` exported from the `@nestjs/common` package has been deprecated and will be removed in the next major release.
Instead, please use the `@nestjs/axios` package (otherwise, there are no API differences).

#### gRPC strategy

The original Node gRPC library (`grpc`) has been deprecated and will no longer receive feature updates.
With Nest v8, you should use the `@grpc/grpc-js` library instead.

#### NATS strategy

NATS has released a new major version (2.0) which has many changes and it is not API compatible with `nats@1.x.x`.
If you interact with a Nest microservice (that uses NATS as a transfer layer), from a service written in a different framework, please, see their [migration document](https://github.com/nats-io/nats.js/blob/master/migration.md) to learn what's changed in v2. Otherwise, you should not see any major differences when communicating between Nest microservices.

To upgrade, make sure to install the latest version of the `nats` package (`npm i nats@latest`). Also, update your [NATS configuration](https://github.com/nats-io/nats.js/blob/master/migration.md#changed-configuration-properties). Example:

```typescript
// Before
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.NATS,
  options: {
    url: 'nats://localhost:4222',
  },
});

// Now
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
  },
});
```

#### `@All()` decorator

Routes annotated with the `@All()` decorator will now map to the `router.all()` method instead of the `router.use()`.

#### Async listen/start methods

`listenAsync()` and `startAllMicroservicesAsync()` methods have been deprecated.
Instead, simply use the `listen()` and `startAllMicroservices()` methods (they are `async` either way).

#### Socket.io

The `@nestjs/platform-socket.io` package was upgraded to use the `socket.io@4.x.x` version (Nest v7 was based on the `socket.io` v2).
To learn more, check out these articles: [Socket.io 3 Release](https://socket.io/blog/socket-io-3-release/) and [Socket.io 4 Release](https://socket.io/blog/socket-io-4-release/).


#### Logger breaking changes

For better extensibility, we separated out the `Logger` and `ConsoleLogger` classes ([PR](https://github.com/nestjs/nest/pull/6221), learn more in the [Logging](/techniques/logger) chapter). If your application uses a custom logger class that extends the built-in `Logger`, you should update it to extend the `ConsoleLogger` now.

Before:

```typescript
export class MyLogger extends Logger {}
```

Now:

```typescript
export class MyLogger extends ConsoleLogger {}
```


#### `@nestjs/config` package

There was a minor breaking change in the `registerAs` function (typings), you can see what has changed in [this PR](https://github.com/nestjs/config/pull/173).

#### `@nestjs/graphql` package

There might be some small differences in how your auto-generated schema file looks like (changed types order). Also, if you use the schema-first approach, the automatically generated type definitions will change as there was a new `Nullable<T>` type introduced in the latest release.

Also, all `HttpException` errors thrown from your resolvers will be now automatically mapped to the corresponding `ApolloError` instances, unless you set the `autoTransformHttpErrors` configuration property (in the options object you pass into the `GraphQLModule#forRoot()` method) to `false`.

#### RxJS

Make sure to upgrade to the latest version of the `rxjs` package (v7).
