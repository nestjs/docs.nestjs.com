### Migration guide

This article provides a set of guidelines for migrating from Nest version 8 to version 9.
To learn more about the new features we've added in v9, check out this [link](https://github.com/nestjs/nest/pull/9588).

#### Redis strategy (microservices)

[Redis](/microservices/redis) strategy uses the [ioredis](https://github.com/luin/ioredis) driver instead of `redis` now.

```typescript
// Before
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.REDIS,
    options: {
      url: 'redis://localhost:6379',
    },
  },
);

// Now
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.REDIS,
    options: {
      host: 'localhost',
      port: 6379,
    },
  },
);
```

Also, make sure to install the `ioredis` package:

```bash
$ npm i ioredis
```

#### gRPC client interceptors

In the previous version, the `interceptors` configuration property was exposed in the wrong location. In v9, make sure to pass `interceptors` as part of the `channelOptions` object, see example [here](https://github.com/nestjs/nest/issues/9079#issuecomment-1078744758).

#### Fastify

Fastify has been upgraded to v4. Also, all of the core Fastify plugins that were prefixed with `fastify-` are now renamed and published under the `@fastify` scope (for example, `fastify-cookie` becomes `@fastify/cookie`, `fastify-helmet` becomes `@fastify/helmet`, etc.). Read more [here](https://github.com/fastify/fastify/issues/3856).

#### `@nestjs/swagger` package

There are a few minor breaking changes in the `@nestjs/swagger` package (`swagger-ui-express` and `fastify-swagger` packages are no longer required). See this [PR](https://github.com/nestjs/swagger/pull/1886) for more details.

#### Deprecations

All deprecated methods & modules have been removed (e.g., the deprecated `listenAsync()` method).

#### Node.js

This release drops support for Node v10. We strongly recommend using the latest LTS version.
